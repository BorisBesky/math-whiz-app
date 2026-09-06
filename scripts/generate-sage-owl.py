#!/usr/bin/env python3
"""Rebuild Sage from the store's Wise Owl reference using Blender 5.

  blender --background --factory-startup --python scripts/generate-sage-owl.py

Outputs a self-contained GLB, an editable .blend with the packed reference,
and front/rear/animation renders under test-results/sage-owl. Idle is a
24-second seamless performance with intermittent flaps, blinks and one full
head turn. WingFlap, HeadSpin and Blink are also exported as separate clips.
"""

import importlib.util
from math import cos, pi, radians, sin
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
GLB_PATH = ROOT / "public/models/sage_owl.glb"
BLEND_PATH = ROOT / "assets/blender/sage-owl.blend"
REFERENCE_PATH = ROOT / "assets/references/wise-owl.jpeg"
PREVIEW_DIR = ROOT / "test-results/sage-owl"
FPS = 24

# Share the existing Blender primitive/material helpers with Koko's generator.
spec = importlib.util.spec_from_file_location("koko_builder", Path(__file__).with_name("generate-koko-monkey.py"))
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
sphere = helpers.uv_sphere
tube = helpers.curved_tube


def material(name, hex_color, roughness=0.62, metallic=0):
    srgb = tuple(int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    linear = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)
    return helpers.make_material(name, linear, roughness, metallic)


def feather(name, start, end, width, mat, normal=(0, -1, 0), thickness=0.016, bend=(0, 0, 0)):
    """A curved, tapered feather with a closed, softly ridged cross section."""
    start, end, normal = Vector(start), Vector(end), Vector(normal).normalized()
    side = (end - start).cross(normal).normalized()
    verts, faces = [], []
    rings, sides = 9, 8
    for j in range(rings + 1):
        t = j / rings
        taper = max(0.009, sin(pi * t) ** 0.72 * (1 - 0.34 * t))
        center = start.lerp(end, t) + (normal * thickness * 1.3 + Vector(bend)) * sin(pi * t)
        for k in range(sides):
            a = 2 * pi * k / sides
            verts.append(center + side * (cos(a) * width * taper) + normal * (sin(a) * thickness * taper))
    for j in range(rings):
        for k in range(sides):
            a = j * sides + k
            b = j * sides + (k + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.extend((tuple(reversed(range(sides))), tuple(rings * sides + k for k in range(sides))))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    helpers.shade_smooth(obj)
    return obj


def rounded_box(name, location, size, mat, bevel=0.015, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    mod = obj.modifiers.new("Soft book corners", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj


def ring(name, location, radius, thickness, mat, vertical_scale=1):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=thickness,
                                   major_segments=48, minor_segments=10,
                                   location=location, rotation=(pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.scale.y = vertical_scale
    obj.data.materials.append(mat)
    helpers.shade_smooth(obj)
    return obj


def create_rig():
    armature = bpy.data.armatures.new("Sage_Armature")
    rig = bpy.data.objects.new("Sage_Rig", armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    rig.show_in_front = True
    bpy.ops.object.mode_set(mode="EDIT")
    # Vertical bones: local Y is world Z. This makes a yaw a local Y rotation.
    for name, head, parent in (
        ("root", (0, 0, 0), None),
        ("body", (0, 0, 0.5), "root"),
        ("head", (0, 0, 1.44), "body"),
        ("wing.L", (0.49, 0.015, 1.42), "body"),
        ("wing.R", (-0.49, 0.015, 1.42), "body"),
        ("eye.L", (0.29, -0.53, 1.99), "head"),
        ("eye.R", (-0.29, -0.53, 1.99), "head"),
    ):
        bone = armature.edit_bones.new(name)
        bone.head = head
        bone.tail = Vector(head) + Vector((0, 0, 0.18))
        if parent:
            bone.parent = armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
    return rig


def build_sage(rig):
    palette = {
        "feathers": material("sage_feathers", "#79513a"),
        "dark": material("sage_feather_shadow", "#493127"),
        "warm": material("sage_feather_highlight", "#a87852"),
        "cream": material("sage_face", "#f3dec0"),
        "belly": material("sage_belly", "#d7b48a"),
        "lid": material("sage_eyelids", "#c7a27e"),
        "white": material("sage_eye_white", "#fff1d8", 0.35),
        "iris": material("sage_iris", "#985726", 0.29),
        "pupil": material("sage_pupil", "#110e10", 0.16),
        "glint": material("sage_eye_glint", "#ffffff", 0.14),
        "glasses": material("sage_glasses", "#292229", 0.28, 0.20),
        "gold": material("sage_brass", "#ba884d", 0.33, 0.50),
        "beak": material("sage_beak", "#f5b323", 0.4),
        "claw": material("sage_claws", "#332721", 0.4),
        "book": material("sage_book", "#913b2c", 0.68),
        "pages": material("sage_pages", "#f7e6c3", 0.86),
        "page_edge": material("sage_page_edges", "#cfb18c", 0.88),
        "teal": material("sage_teal_book", "#25757c", 0.72),
    }
    parts = []

    def add(obj, bone="body"):
        bpy.context.view_layer.update()
        helpers.parent_to_bone(obj, rig, bone)
        parts.append(obj)
        return obj

    add(sphere("Sage_Body", (0, 0.03, 1.0), (0.54, 0.39, 0.66), palette["feathers"]), "body")
    add(sphere("Sage_Belly", (0, -0.30, 0.99), (0.425, 0.12, 0.55), palette["belly"]), "body")
    add(sphere("Sage_Head", (0, 0, 1.93), (0.68, 0.47, 0.57), palette["feathers"], 40, 28), "head")

    # A complete feathered back remains convincing during the 360-degree turn.
    for row in range(6):
        z = 0.60 + row * 0.15
        radius = 0.54 * max(0.15, 1 - ((z - 1.0) / 0.69) ** 2) ** 0.5
        for col in range(11):
            a = 0.08 + col * pi / 10
            x, y = cos(a) * radius, 0.03 + sin(a) * radius * 0.75
            normal = (cos(a), sin(a), 0)
            add(feather(f"Back_Feather_{row}_{col}", (x * 0.9, y * 0.93, z + 0.15),
                        (x, y, z - 0.13), 0.105,
                        palette["warm" if (row + col) % 4 == 0 else "feathers"], normal))

    for row in range(5):
        z = 0.60 + row * 0.16
        for col in range(5):
            x = (col - 2) * 0.15 + (0.025 if row % 2 else -0.025)
            y = -0.32 - 0.10 * max(0, 1 - (x / 0.45) ** 2)
            add(feather(f"Chest_Feather_{row}_{col}", (x, y, z + 0.17),
                        (x + (0.025 if x > 0 else -0.025), y - 0.012, z - 0.07),
                        0.10, palette["cream" if (row + col) % 3 else "belly"]))

    for row in range(4):
        z = 1.65 + row * 0.20
        radius = 0.68 * max(0.10, 1 - ((z - 1.93) / 0.59) ** 2) ** 0.5
        for col in range(13):
            a = -0.06 + col * (pi + 0.12) / 12
            x, y = cos(a) * radius, sin(a) * radius * 0.70
            add(feather(f"Head_Feather_{row}_{col}", (x * 0.89, y * 0.89, z + 0.12),
                        (x, y, z - 0.12), 0.10,
                        palette["warm" if col % 3 == 0 else "feathers"], (cos(a), sin(a), 0)), "head")

    for row in range(3):
        for col in range(7):
            x = (col - 3) * 0.12
            z = 2.45 - row * 0.058 - 0.23 * abs(x)
            y = -0.13 - row * 0.105
            add(feather(f"Crown_Feather_{row}_{col}", (x, y + 0.08, z),
                        (x * 1.06, y - 0.13, z - 0.11), 0.088,
                        palette["warm" if (row + col) % 3 == 0 else "feathers"], (0, -0.65, 0.75)), "head")

    # Paired facial discs, glossy eyes, and circular spectacles from the image.
    for side, sign in (("L", 1), ("R", -1)):
        x = sign * 0.29
        add(sphere(f"Face_Disc_{side}", (x, -0.395, 1.95), (0.345, 0.145, 0.405), palette["cream"], 36, 24), "head")
        add(sphere(f"Lid_Socket_{side}", (x, -0.513, 1.99), (0.244, 0.040, 0.274), palette["lid"], 32, 20), "head")
        add(sphere(f"Eye_White_{side}", (x, -0.535, 1.99), (0.232, 0.075, 0.254), palette["white"], 32, 22), f"eye.{side}")
        add(sphere(f"Eye_Iris_{side}", (x - sign * 0.012, -0.605, 1.99), (0.162, 0.039, 0.186), palette["iris"], 28, 18), f"eye.{side}")
        add(sphere(f"Eye_Pupil_{side}", (x - sign * 0.012, -0.638, 1.99), (0.134, 0.030, 0.157), palette["pupil"], 28, 18), f"eye.{side}")
        add(sphere(f"Eye_Sparkle_{side}", (x - 0.045, -0.666, 2.060), (0.035, 0.012, 0.046), palette["glint"], 16, 10), f"eye.{side}")
        add(sphere(f"Eye_Sparkle_Small_{side}", (x + 0.050, -0.664, 1.94), (0.015, 0.008, 0.019), palette["glint"], 12, 8), f"eye.{side}")
        add(ring(f"Glasses_Frame_{side}", (x, -0.570, 1.99), 0.268, 0.028, palette["glasses"], 1.09), "head")
        add(ring(f"Glasses_Inlay_{side}", (x, -0.594, 1.99), 0.267, 0.006, palette["gold"], 1.09), "head")
        add(tube(f"Glasses_Arm_{side}", [(sign * 0.55, -0.55, 2.02), (sign * 0.63, -0.32, 2.03),
                                       (sign * 0.60, 0.04, 1.99)], 0.017, palette["glasses"]), "head")
        # Flowing eyebrows finish in swept ear plumes, with layered ivory edges.
        for i in range(4):
            start = (sign * (0.030 + i * 0.077), -0.47 + i * 0.019, 2.23 + i * 0.014)
            end = (sign * (0.69 + i * 0.042), -0.09 + i * 0.027, 2.56 + i * 0.022)
            add(feather(f"Brow_Plume_{side}_{i}", start, end, 0.100 - i * 0.014,
                        palette["cream" if i % 2 == 0 else "warm"], thickness=0.022,
                        bend=(sign * 0.055, -0.030, -0.12)), "head")

    add(tube("Glasses_Bridge", [(-0.035, -0.583, 2.025), (0, -0.613, 2.051), (0.035, -0.583, 2.025)],
             0.021, palette["glasses"]), "head")
    add(feather("Golden_Beak", (0, -0.572, 1.981), (0, -0.689, 1.645),
                0.102, palette["beak"], thickness=0.082), "head")

    for side, sign in (("L", 1), ("R", -1)):
        add(sphere(f"Wing_{side}", (sign * 0.52, 0.035, 1.12), (0.15, 0.24, 0.36), palette["dark"], 28, 20), f"wing.{side}")
        for i in range(7):
            start = (sign * (0.59 + 0.003 * i), -0.16 + i * 0.055, 1.43 - i * 0.034)
            end = (sign * (0.66 + 0.008 * i), -0.19 + i * 0.053, 0.61 + i * 0.022)
            add(feather(f"Flight_Feather_{side}_{i}", start, end, 0.105,
                        palette["warm" if i % 3 == 0 else "feathers"], (sign * 0.8, -0.6, 0), 0.034), f"wing.{side}")
        for i in range(4):
            add(feather(f"Shoulder_Feather_{side}_{i}", (sign * 0.50, -0.16 + i * 0.09, 1.45),
                        (sign * 0.68, -0.18 + i * 0.09, 1.12), 0.085,
                        palette["cream" if i % 2 == 0 else "warm"], (sign * 0.7, -0.7, 0)), f"wing.{side}")
        add(sphere(f"Foot_{side}", (sign * 0.25, -0.035, 0.31), (0.12, 0.145, 0.18), palette["beak"], 24, 16), "root")
        for toe in range(3):
            x = sign * 0.25 + (toe - 1) * 0.081
            add(tube(f"Toe_{side}_{toe}", [(x, -0.04, 0.28), (x, -0.16, 0.27), (x, -0.265, 0.225)],
                     0.040, palette["beak"]), "root")
            add(feather(f"Claw_{side}_{toe}", (x, -0.245, 0.237), (x, -0.304, 0.195),
                        0.026, palette["claw"], (0, -1, 1), 0.023), "root")

    for i in range(5):
        add(feather(f"Tail_Feather_{i}", ((i - 2) * 0.07, 0.23, 0.77),
                    ((i - 2) * 0.12, 0.47, 0.34), 0.095, palette["dark"], (0, 1, 0)))

    # A closed teal book anchors the feet. A discreet reading stand supports
    # the open red book against Sage's chest, leaving both wings free to flap.
    for z, height, mat, width, depth in (
        (0.018, 0.035, palette["teal"], 1.20, 0.94),
        (0.098, 0.125, palette["pages"], 1.15, 0.88),
        (0.175, 0.035, palette["teal"], 1.20, 0.94),
    ):
        add(rounded_box(f"Perch_Book_{z}", (0, 0.02, z), (width, depth, height), mat), "root")
    for z in (0.060, 0.086, 0.112, 0.138):
        add(rounded_box(f"Perch_Page_Line_{z}", (0, -0.422, z), (1.12, 0.004, 0.004), palette["page_edge"], 0.001), "root")

    for side, sign in (("L", 1), ("R", -1)):
        turn = radians(sign * 15)
        add(rounded_box(f"Red_Book_Cover_{side}", (sign * 0.238, -0.548, 0.945),
                        (0.49, 0.042, 0.56), palette["book"], 0.018, (radians(-20), 0, turn)), "root")
        add(rounded_box(f"Red_Book_Pages_{side}", (sign * 0.234, -0.505, 0.955),
                        (0.46, 0.070, 0.516), palette["pages"], 0.011, (radians(-20), 0, turn)), "root")
        # Small brass corners provide a readable book silhouette at store size.
        for z in (0.735, 1.14):
            add(rounded_box(f"Book_Corner_{side}_{z}", (sign * 0.434, -0.507 + (z - 0.95) * 0.34, z),
                            (0.070, 0.020, 0.043), palette["gold"], 0.005), "root")
    add(sphere("Red_Book_Spine", (0, -0.613, 0.945), (0.039, 0.041, 0.275), palette["book"], 24, 16), "root")
    add(feather("Book_Ribbon", (0.023, -0.64, 1.18), (0.041, -0.662, 0.84), 0.024, palette["gold"], thickness=0.003), "root")
    add(rounded_box("Reading_Stand", (0, -0.39, 0.435), (0.044, 0.045, 0.51), palette["gold"], 0.01), "root")
    add(rounded_box("Reading_Stand_Foot", (0, -0.36, 0.22), (0.31, 0.24, 0.04), palette["gold"], 0.013), "root")
    return parts


def pulse(time, start, duration):
    if not start <= time <= start + duration:
        return 0
    return sin(pi * (time - start) / duration) ** 2


def flap(time, start):
    t = time - start
    if not 0 <= t <= 2.25:
        return 0
    return sin(pi * t / 2.25) ** 2 * (0.65 + 0.35 * cos(2 * pi * t / 0.56))


def spin(time, start):
    t = max(0, min(1, (time - start) / 3.0))
    return 2 * pi * (t * t * (3 - 2 * t))


def merge_feather_parts(parts):
    """Keep independent animation pivots while reducing mobile draw calls."""
    groups = {}
    for obj in parts:
        groups.setdefault((obj.parent_bone, obj.data.materials[0].name), []).append(obj)
    merged = []
    for (bone_name, mat_name), objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = f"{bone_name}_{mat_name}"
        merged.append(obj)
    return merged


def create_animations(rig):
    actions = {}
    for name, duration in (("Idle", 24), ("WingFlap", 3), ("HeadSpin", 4), ("Blink", 1)):
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        rig.animation_data_create()
        rig.animation_data.action = action
        for frame in range(int(duration * FPS) + 1):
            time = frame / FPS
            for bone in rig.pose.bones:
                bone.location = (0, 0, 0)
                bone.rotation_euler = (0, 0, 0)
                bone.scale = (1, 1, 1)
            head, body = rig.pose.bones["head"], rig.pose.bones["body"]
            if name == "Idle":
                body.scale = (1, 1 + 0.005 * sin(2 * pi * time / 4), 1)
                head.rotation_euler[2] = radians(2) * sin(2 * pi * time / 8)
                head.rotation_euler[0] = radians(1.2) * sin(2 * pi * time / 6)
                head.rotation_euler[1] = spin(time, 10)
                wing_amount = flap(time, 3.0) + flap(time, 18.0)
                blink_amount = max(pulse(time, start, 0.30) for start in (1.8, 6.5, 6.95, 9.4, 14.7, 17.0, 21.5))
            else:
                wing_amount = flap(time, 0.3) if name == "WingFlap" else 0
                blink_amount = pulse(time, 0.30, 0.32) if name == "Blink" else 0
                head.rotation_euler[1] = spin(time, 0.5) if name == "HeadSpin" else 0
            for side, sign in (("L", 1), ("R", -1)):
                wing = rig.pose.bones[f"wing.{side}"]
                wing.rotation_euler[2] = sign * radians(76) * wing_amount
                wing.rotation_euler[0] = radians(-8) * wing_amount
                rig.pose.bones[f"eye.{side}"].scale.y = max(0.045, 1 - 0.955 * blink_amount)
            for bone in rig.pose.bones:
                bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone.name)
                bone.keyframe_insert(data_path="scale", frame=frame, group=bone.name)
        # Per-frame Euler keys bake a genuine 360 turn into glTF quaternions;
        # start/end keys alone would take the shortest path and never turn.
        action.frame_start = 0
        action.frame_end = duration * FPS
        actions[name] = action
    rig.animation_data.action = actions["Idle"]
    bpy.context.scene.frame_set(0)
    return actions


def export_model(rig, parts):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=str(GLB_PATH), export_format="GLB", use_selection=True,
                             export_animations=True, export_animation_mode="ACTIONS",
                             export_merge_animation="ACTION", export_force_sampling=True,
                             export_optimize_animation_size=True, export_yup=True,
                             export_cameras=False, export_lights=False)


def save_blender_and_previews(rig, actions):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    scene = helpers.add_preview_scene()
    scene.render.resolution_x = 850
    scene.render.resolution_y = 850
    scene.camera.data.type = "ORTHO"
    scene.camera.data.ortho_scale = 3.55
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.07, 0.095, 0.12, 1)
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    reference = bpy.data.images.load(str(REFERENCE_PATH), check_existing=True)
    reference.pack()
    # Pack the original image in the source file for later manual sculpting.
    reference.use_fake_user = True
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_distance = 4.7
            area.spaces.active.region_3d.view_location = (0, 0, 1.30)
            area.spaces.active.region_3d.view_rotation = Vector((0, 1, 0)).to_track_quat("-Z", "Y")
            area.spaces.active.shading.type = "MATERIAL"
    scene.frame_start = 0
    scene.frame_end = 24 * FPS
    for name, frame in (("Blink", 48), ("Wing flaps", 100), ("Full head turn", 265), ("Wing flaps again", 465)):
        scene.timeline_markers.new(name, frame=frame)
    for label, action_name, frame, location in (
        ("front", "Idle", 0, (0, -6, 2.55)),
        ("three-quarter", "Idle", 0, (3.5, -6, 2.70)),
        ("rear", "Idle", 0, (3.5, 6, 2.70)),
        ("wing-flap", "WingFlap", 35, (0, -6, 2.55)),
        ("blink", "Blink", 11, (0, -6, 2.55)),
        ("head-spin", "HeadSpin", 48, (0, -6, 2.55)),
    ):
        rig.animation_data.action = actions[action_name]
        scene.frame_set(frame)
        scene.camera.location = location
        helpers.look_at(scene.camera, (0, -0.015, 1.33))
        scene.render.filepath = str(PREVIEW_DIR / f"{label}.png")
        bpy.ops.render.render(write_still=True)
    rig.animation_data.action = actions["Idle"]
    scene.frame_set(0)
    portrait_path = ROOT / "public/images/characters/sage-owl.png"
    portrait_path.parent.mkdir(parents=True, exist_ok=True)
    scene.camera.location = (0, -6, 2.1)
    helpers.look_at(scene.camera, (0, 0, 2.04))
    scene.camera.data.ortho_scale = 1.76
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.film_transparent = True
    scene.render.filepath = str(portrait_path)
    bpy.ops.render.render(write_still=True)
    scene.render.film_transparent = False
    scene.render.resolution_x = 850
    scene.render.resolution_y = 850
    scene.camera.data.ortho_scale = 3.55
    scene.camera.location = (3.5, -6, 2.70)
    helpers.look_at(scene.camera, (0, -0.015, 1.33))
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)


def main():
    helpers.reset_scene()
    bpy.context.scene.render.fps = FPS
    rig = create_rig()
    parts = merge_feather_parts(build_sage(rig))
    actions = create_animations(rig)
    export_model(rig, parts)
    save_blender_and_previews(rig, actions)
    print(f"Exported {GLB_PATH} ({GLB_PATH.stat().st_size / 1024:.0f} KiB)")
    print(f"Editable Blender source: {BLEND_PATH}")
    print(f"Animation clips: {', '.join(actions)}")


if __name__ == "__main__":
    main()
