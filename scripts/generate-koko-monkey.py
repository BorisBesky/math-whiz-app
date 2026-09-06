#!/usr/bin/env python3
"""Build Koko, a lightweight animated monkey, and export it as a GLB.

Run with Blender (not the system Python):

    blender --background --factory-startup --python scripts/generate-koko-monkey.py

The generated GLB contains four named clips: Idle, Wave, Jump, and Floss.
Preview renders are written under test-results/koko-monkey for visual QA.
"""

from math import radians
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "models" / "monkey_parts.glb"
PREVIEW_DIR = ROOT / "test-results" / "koko-monkey"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def make_material(name, color, roughness=0.64, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return material


def shade_smooth(obj):
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True


def uv_sphere(name, location, scale, material, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    shade_smooth(obj)
    return obj


def cone(name, location, radius, depth, material, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=24,
        radius1=radius,
        radius2=0.0,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    shade_smooth(obj)
    return obj


def curved_tube(name, points, radius, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    shade_smooth(obj)
    return obj


def parent_to_bone(obj, rig, bone_name):
    world_matrix = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world_matrix


def create_rig():
    armature = bpy.data.armatures.new("Koko_Armature")
    rig = bpy.data.objects.new("Koko_Rig", armature)
    bpy.context.collection.objects.link(rig)
    rig.show_in_front = True
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def add_bone(name, head, tail, parent=None):
        bone = armature.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        if parent:
            bone.parent = armature.edit_bones[parent]
        return bone

    add_bone("root", (0, 0, 0.02), (0, 0, 0.30))
    add_bone("torso", (0, 0, 0.62), (0, 0, 1.38), "root")
    add_bone("head", (0, 0, 1.38), (0, 0, 1.83), "torso")
    add_bone("arm.L", (0.43, 0, 1.28), (0.43, 0, 0.75), "torso")
    add_bone("arm.R", (-0.43, 0, 1.28), (-0.43, 0, 0.75), "torso")
    add_bone("leg.L", (0.23, 0, 0.69), (0.23, 0, 0.16), "root")
    add_bone("leg.R", (-0.23, 0, 0.69), (-0.23, 0, 0.16), "root")
    add_bone("tail", (0, 0.16, 0.84), (0.25, 0.22, 0.70), "torso")

    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def build_koko(rig):
    fur = make_material("koko_fur", (0.36, 0.16, 0.055))
    face = make_material("koko_face", (0.93, 0.57, 0.31))
    ears = make_material("koko_ears", (0.95, 0.45, 0.42))
    tail = make_material("koko_tail", (0.30, 0.11, 0.035))
    belly = make_material("koko_belly", (0.98, 0.69, 0.42))
    eye_white = make_material("koko_eye_white", (0.99, 0.985, 0.94), roughness=0.4)
    pupil = make_material("koko_pupil", (0.035, 0.025, 0.02), roughness=0.3)
    eye_glint = make_material("koko_eye_glint", (1.0, 1.0, 1.0), roughness=0.2)
    nose = make_material("koko_nose", (0.12, 0.045, 0.025), roughness=0.45)
    mouth = make_material("koko_mouth", (0.38, 0.035, 0.045), roughness=0.5)

    parts = []

    def add(obj, bone):
        parent_to_bone(obj, rig, bone)
        parts.append(obj)
        return obj

    # A round, toy-like silhouette keeps Koko friendly at thumbnail size.
    add(uv_sphere("body_fur", (0, 0.02, 0.98), (0.47, 0.34, 0.58), fur), "torso")
    add(uv_sphere("belly_patch", (0, -0.285, 0.96), (0.31, 0.075, 0.38), belly), "torso")
    add(uv_sphere("head_fur", (0, 0, 1.68), (0.50, 0.39, 0.46), fur), "head")
    add(uv_sphere("face_mask", (0, -0.335, 1.65), (0.37, 0.075, 0.31), face), "head")

    for side, x in (("L", 0.42), ("R", -0.42)):
        add(uv_sphere(f"ear_{side}_fur", (x, 0, 1.72), (0.19, 0.10, 0.22), fur, 28, 18), "head")
        add(uv_sphere(f"ear_{side}_inner", (x, -0.095, 1.72), (0.105, 0.035, 0.13), ears, 24, 16), "head")

    # Large expressive eyes and high brows match the playful reference style.
    for side, x in (("L", 0.14), ("R", -0.14)):
        add(uv_sphere(f"eye_{side}_white", (x, -0.405, 1.77), (0.115, 0.045, 0.14), eye_white, 28, 18), "head")
        add(uv_sphere(f"eye_{side}_pupil", (x, -0.453, 1.765), (0.050, 0.021, 0.066), pupil, 20, 14), "head")
        add(uv_sphere(f"eye_{side}_glint", (x - 0.014, -0.472, 1.795), (0.015, 0.008, 0.020), eye_glint, 16, 10), "head")

    add(uv_sphere("muzzle", (0, -0.440, 1.56), (0.25, 0.105, 0.16), face, 30, 18), "head")
    add(uv_sphere("nose", (0, -0.548, 1.615), (0.082, 0.040, 0.055), nose, 24, 14), "head")
    add(
        curved_tube(
            "smile",
            [(-0.105, -0.552, 1.555), (0, -0.572, 1.515), (0.105, -0.552, 1.555)],
            0.018,
            mouth,
        ),
        "head",
    )
    add(uv_sphere("cheek_L", (0.245, -0.416, 1.60), (0.052, 0.017, 0.035), ears, 20, 12), "head")
    add(uv_sphere("cheek_R", (-0.245, -0.416, 1.60), (0.052, 0.017, 0.035), ears, 20, 12), "head")

    # A three-lobed tuft makes the silhouette recognizable even in the picker.
    add(cone("tuft_center", (0, 0, 2.12), 0.10, 0.24, fur, (0, radians(-8), 0)), "head")
    add(cone("tuft_L", (0.105, 0, 2.08), 0.075, 0.20, fur, (0, radians(23), 0)), "head")
    add(cone("tuft_R", (-0.105, 0, 2.08), 0.075, 0.20, fur, (0, radians(-23), 0)), "head")

    for side, x, angle in (("L", 0.53, radians(-8)), ("R", -0.53, radians(8))):
        arm = uv_sphere(f"arm_{side}_fur", (x, 0, 0.98), (0.14, 0.14, 0.40), fur, 28, 18)
        arm.rotation_euler[1] = angle
        add(arm, f"arm.{side}")
        add(uv_sphere(f"hand_{side}_face", (x + (0.035 if side == "L" else -0.035), -0.018, 0.59), (0.15, 0.13, 0.15), face, 26, 16), f"arm.{side}")

    for side, x in (("L", 0.23), ("R", -0.23)):
        add(uv_sphere(f"leg_{side}_fur", (x, 0.02, 0.39), (0.16, 0.15, 0.29), fur, 28, 18), f"leg.{side}")
        add(uv_sphere(f"foot_{side}_face", (x, -0.105, 0.105), (0.22, 0.27, 0.12), face, 28, 18), f"leg.{side}")

    add(
        curved_tube(
            "tail_curve",
            [
                (0.08, 0.20, 0.84),
                (0.48, 0.27, 0.72),
                (0.76, 0.25, 0.94),
                (0.72, 0.20, 1.25),
                (0.52, 0.12, 1.30),
            ],
            0.085,
            tail,
        ),
        "tail",
    )
    add(uv_sphere("tail_tip", (0.50, 0.115, 1.30), (0.105, 0.095, 0.12), tail, 24, 16), "tail")
    return parts


ANIMATED_BONES = ("root", "torso", "head", "arm.L", "arm.R", "leg.L", "leg.R", "tail")


def key_pose(rig, frame, bones=None, rig_location=(0, 0, 0), rig_rotation=(0, 0, 0)):
    bones = bones or {}
    rig.location = rig_location
    rig.rotation_mode = "XYZ"
    rig.rotation_euler = rig_rotation
    rig.keyframe_insert(data_path="location", frame=frame, group="root")
    rig.keyframe_insert(data_path="rotation_euler", frame=frame, group="root")
    for name in ANIMATED_BONES:
        pose_bone = rig.pose.bones[name]
        transform = bones.get(name, {})
        pose_bone.location = transform.get("location", (0, 0, 0))
        pose_bone.rotation_euler = transform.get("rotation", (0, 0, 0))
        pose_bone.scale = transform.get("scale", (1, 1, 1))
        pose_bone.keyframe_insert(data_path="location", frame=frame, group=name)
        pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=name)
        pose_bone.keyframe_insert(data_path="scale", frame=frame, group=name)


def make_action(rig, name, poses, end_frame):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame, bones, location, rotation in poses:
        key_pose(rig, frame, bones, location, rotation)
    # Keyframe insertion uses Blender's smooth Bezier interpolation by default.
    # Blender 5 stores channels in layered actions and no longer exposes the
    # legacy Action.fcurves collection directly.
    action.frame_start = 1
    action.frame_end = end_frame
    rig.animation_data.action = None
    return action


def create_animations(rig):
    idle = make_action(
        rig,
        "Idle",
        [
            (1, {"head": {"rotation": (0, radians(-3), radians(-2))}, "tail": {"rotation": (radians(-6), 0, radians(-7))}}, (0, 0, 0), (0, 0, 0)),
            (13, {"torso": {"rotation": (radians(1), 0, radians(1.5))}, "head": {"rotation": (0, radians(3), radians(2))}, "tail": {"rotation": (radians(7), 0, radians(8))}}, (0, 0, 0.022), (0, 0, 0)),
            (25, {"head": {"rotation": (0, radians(-2), radians(-1))}, "tail": {"rotation": (radians(-5), 0, radians(-6))}}, (0, 0, 0), (0, 0, 0)),
            (37, {"torso": {"rotation": (radians(-1), 0, radians(-1.5))}, "head": {"rotation": (0, radians(3), radians(2))}, "tail": {"rotation": (radians(7), 0, radians(8))}}, (0, 0, 0.022), (0, 0, 0)),
            (49, {"head": {"rotation": (0, radians(-3), radians(-2))}, "tail": {"rotation": (radians(-6), 0, radians(-7))}}, (0, 0, 0), (0, 0, 0)),
        ],
        49,
    )
    wave = make_action(
        rig,
        "Wave",
        [
            (1, {}, (0, 0, 0), (0, 0, 0)),
            (9, {"arm.R": {"rotation": (radians(-10), 0, radians(132))}, "head": {"rotation": (0, radians(-4), radians(6))}, "tail": {"rotation": (radians(8), 0, radians(8))}}, (0, 0, 0.02), (0, 0, radians(2))),
            (16, {"arm.R": {"rotation": (radians(-28), 0, radians(142))}, "head": {"rotation": (0, radians(-4), radians(7))}, "arm.L": {"rotation": (radians(5), 0, radians(5))}}, (0, 0, 0.035), (0, 0, radians(2))),
            (23, {"arm.R": {"rotation": (radians(12), 0, radians(132))}, "head": {"rotation": (0, radians(-4), radians(5))}, "tail": {"rotation": (radians(-8), 0, radians(-8))}}, (0, 0, 0.02), (0, 0, radians(1))),
            (30, {"arm.R": {"rotation": (radians(-28), 0, radians(142))}, "head": {"rotation": (0, radians(-4), radians(7))}}, (0, 0, 0.035), (0, 0, radians(2))),
            (38, {"arm.R": {"rotation": (radians(12), 0, radians(132))}, "head": {"rotation": (0, radians(-4), radians(5))}}, (0, 0, 0.02), (0, 0, radians(1))),
            (49, {}, (0, 0, 0), (0, 0, 0)),
        ],
        49,
    )
    jump = make_action(
        rig,
        "Jump",
        [
            (1, {}, (0, 0, 0), (0, 0, 0)),
            (8, {"torso": {"rotation": (radians(4), 0, 0)}, "arm.L": {"rotation": (0, 0, radians(-20))}, "arm.R": {"rotation": (0, 0, radians(20))}, "leg.L": {"rotation": (0, 0, radians(-12))}, "leg.R": {"rotation": (0, 0, radians(12))}}, (0, 0, -0.06), (0, 0, 0)),
            (19, {"arm.L": {"rotation": (radians(-8), 0, radians(-145))}, "arm.R": {"rotation": (radians(-8), 0, radians(145))}, "leg.L": {"rotation": (radians(-12), 0, radians(-22))}, "leg.R": {"rotation": (radians(-12), 0, radians(22))}, "tail": {"rotation": (radians(15), 0, radians(12))}}, (0, 0, 0.68), (0, 0, 0)),
            (29, {"arm.L": {"rotation": (radians(-5), 0, radians(-115))}, "arm.R": {"rotation": (radians(-5), 0, radians(115))}, "leg.L": {"rotation": (radians(-8), 0, radians(-12))}, "leg.R": {"rotation": (radians(-8), 0, radians(12))}}, (0, 0, 0.30), (0, 0, 0)),
            (37, {"torso": {"rotation": (radians(3), 0, 0)}, "arm.L": {"rotation": (0, 0, radians(-12))}, "arm.R": {"rotation": (0, 0, radians(12))}}, (0, 0, -0.035), (0, 0, 0)),
            (45, {}, (0, 0, 0), (0, 0, 0)),
        ],
        45,
    )
    floss = make_action(
        rig,
        "Floss",
        [
            (1, {}, (0, 0, 0), (0, 0, 0)),
            (9, {"torso": {"rotation": (0, radians(10), radians(-8))}, "head": {"rotation": (0, radians(-6), radians(6))}, "arm.L": {"rotation": (radians(-62), 0, radians(-25))}, "arm.R": {"rotation": (radians(-62), 0, radians(-25))}, "leg.L": {"rotation": (0, 0, radians(6))}, "leg.R": {"rotation": (0, 0, radians(6))}, "tail": {"rotation": (radians(-10), 0, radians(-12))}}, (-0.10, 0, 0.03), (0, 0, radians(-7))),
            (17, {"torso": {"rotation": (0, radians(-8), radians(7))}, "head": {"rotation": (0, radians(5), radians(-5))}, "arm.L": {"rotation": (radians(62), 0, radians(25))}, "arm.R": {"rotation": (radians(62), 0, radians(25))}, "leg.L": {"rotation": (0, 0, radians(-6))}, "leg.R": {"rotation": (0, 0, radians(-6))}, "tail": {"rotation": (radians(10), 0, radians(12))}}, (0.10, 0, 0.03), (0, 0, radians(7))),
            (25, {"torso": {"rotation": (0, radians(10), radians(-8))}, "head": {"rotation": (0, radians(-6), radians(6))}, "arm.L": {"rotation": (radians(-62), 0, radians(-25))}, "arm.R": {"rotation": (radians(-62), 0, radians(-25))}, "leg.L": {"rotation": (0, 0, radians(6))}, "leg.R": {"rotation": (0, 0, radians(6))}}, (-0.10, 0, 0.03), (0, 0, radians(-7))),
            (33, {"torso": {"rotation": (0, radians(-8), radians(7))}, "head": {"rotation": (0, radians(5), radians(-5))}, "arm.L": {"rotation": (radians(62), 0, radians(25))}, "arm.R": {"rotation": (radians(62), 0, radians(25))}, "leg.L": {"rotation": (0, 0, radians(-6))}, "leg.R": {"rotation": (0, 0, radians(-6))}}, (0.10, 0, 0.03), (0, 0, radians(7))),
            (41, {}, (0, 0, 0), (0, 0, 0)),
        ],
        41,
    )
    return {action.name: action for action in (idle, wave, jump, floss)}


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def export_model(rig, parts, actions):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = rig
    rig.animation_data.action = actions["Idle"]
    bpy.context.scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_PATH),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_merge_animation="ACTION",
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )


def add_preview_scene():
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.15, depth=0.08, location=(0, 0, -0.06))
    floor = bpy.context.object
    floor.name = "Preview_Plinth"
    floor.data.materials.append(make_material("preview_plinth", (0.76, 0.90, 0.98), roughness=0.82))

    world = bpy.context.scene.world
    world.color = (0.035, 0.055, 0.09)
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.055, 0.09, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35

    bpy.ops.object.light_add(type="AREA", location=(3.5, -4.0, 5.0))
    key = bpy.context.object
    key.data.energy = 850
    key.data.shape = "DISK"
    key.data.size = 4.0
    look_at(key, (0, 0, 1.05))
    bpy.ops.object.light_add(type="AREA", location=(-3.0, -2.0, 2.5))
    fill = bpy.context.object
    fill.data.energy = 500
    fill.data.color = (0.65, 0.82, 1.0)
    fill.data.size = 3.0
    look_at(fill, (0, 0, 1.1))
    bpy.ops.object.light_add(type="AREA", location=(0.5, 3.0, 3.7))
    rim = bpy.context.object
    rim.data.energy = 700
    rim.data.color = (1.0, 0.55, 0.25)
    rim.data.size = 2.5
    look_at(rim, (0, 0, 1.15))

    bpy.ops.object.camera_add(location=(3.0, -6.4, 2.65))
    camera = bpy.context.object
    camera.data.lens = 62
    look_at(camera, (0, 0, 1.1))
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 700
    scene.render.resolution_y = 700
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    return scene


def render_previews(rig, actions):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    scene = add_preview_scene()
    previews = (("Idle", 13), ("Wave", 23), ("Jump", 19), ("Floss", 17))
    for action_name, frame in previews:
        rig.animation_data.action = actions[action_name]
        scene.frame_set(frame)
        scene.render.filepath = str(PREVIEW_DIR / f"{action_name.lower()}.png")
        bpy.ops.render.render(write_still=True)


def main():
    reset_scene()
    rig = create_rig()
    parts = build_koko(rig)
    actions = create_animations(rig)
    export_model(rig, parts, actions)
    render_previews(rig, actions)
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"Exported {OUTPUT_PATH} ({size_kb:.1f} KB)")
    print("Animation clips: " + ", ".join(actions))
    print(f"Preview renders: {PREVIEW_DIR}")


if __name__ == "__main__":
    main()
