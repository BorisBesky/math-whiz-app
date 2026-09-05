// Positions are latitude / longitude in degrees. Every purchase has a permanent
// home, so a student's planet grows without requiring precise drag-and-drop.
export const PLANET_CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'nature', label: 'Nature' },
  { id: 'homes', label: 'Cozy places' },
  { id: 'wonders', label: 'Wonders' },
];

export const PLANET_ITEMS = [
  { id: 'pine-forest', name: 'Whispering woods', category: 'nature', price: 15, kind: 'forest', color: '#5c8661', position: [22, -27], description: 'A whole grove of evergreens, with little rocks tucked between the trees.' },
  { id: 'wildflowers', name: 'Wildflower meadow', category: 'nature', price: 15, kind: 'flowers', color: '#b792bc', position: [-12, -10], description: 'Pink, golden, and lavender flowers for a little burst of happiness.' },
  { id: 'campfire', name: 'Campfire hideaway', category: 'homes', price: 20, kind: 'camp', color: '#c48959', position: [0, 17], description: 'A canvas tent, log seats, and a flickering fire under the stars.' },
  { id: 'pond', name: 'Lily-pad pond', category: 'nature', price: 25, kind: 'pond', color: '#79b6b4', position: [15, 3], description: 'A quiet blue pond with lily pads, reeds, and a friendly duck.' },
  { id: 'cottage', name: 'Fernwood cottage', category: 'homes', price: 35, kind: 'cottage', color: '#b87b5c', position: [-20, -36], description: 'A cozy cottage with a tiled roof, warm windows, and a garden fence.' },
  { id: 'orchard', name: 'Apple orchard', category: 'nature', price: 25, kind: 'orchard', color: '#8d9e58', position: [12, -65], description: 'Round apple trees and a basketful of bright red fruit.' },
  { id: 'windmill', name: 'Sunbeam windmill', category: 'homes', price: 45, kind: 'windmill', color: '#c5ab70', position: [35, -68], description: 'Slowly turning sails and golden rows of wheat on a sunny hillside.' },
  { id: 'mountains', name: 'Snowcap peaks', category: 'nature', price: 35, kind: 'mountains', color: '#a3bec0', position: [53, 9], description: 'A tiny mountain range with frosty peaks and boulders.' },
  { id: 'crystals', name: 'Crystal garden', category: 'wonders', price: 45, kind: 'crystals', color: '#8ac7d1', position: [52, 66], description: 'A cluster of tall, shimmering blue crystals in the snowy north.' },
  { id: 'lighthouse', name: 'Seaside lighthouse', category: 'homes', price: 50, kind: 'lighthouse', color: '#c67f6b', position: [-29, 43], description: 'A red-and-cream lighthouse to guide a tiny boat home.' },
  { id: 'palms', name: 'Palm oasis', category: 'nature', price: 25, kind: 'palms', color: '#c3a563', position: [9, 64], description: 'Swaying palm fronds, warm sand, and cool water in the desert.' },
  { id: 'ruins', name: 'Sunstone ruins', category: 'wonders', price: 50, kind: 'ruins', color: '#ceac77', position: [30, 100], description: 'Ancient columns and a stone arch waiting for a new story.' },
  { id: 'mushrooms', name: 'Mushroom grove', category: 'nature', price: 30, kind: 'mushrooms', color: '#bd7881', position: [-21, -95], description: 'Spotted toadstools and tiny ferns in a magical woodland.' },
  { id: 'waterfall', name: 'Wishing waterfall', category: 'wonders', price: 60, kind: 'waterfall', color: '#78b3ba', position: [-6, 119], description: 'A sparkling waterfall tumbling down mossy rocks into a pool.' },
  { id: 'sailboat', name: 'Little voyager', category: 'homes', price: 35, kind: 'sailboat', color: '#7ca8b8', position: [-52, -4], description: 'A wooden sailboat with a golden sail, bobbing on the sea.' },
  { id: 'observatory', name: 'Stargazer dome', category: 'wonders', price: 75, kind: 'observatory', color: '#8896be', position: [25, 165], description: 'A hilltop observatory and telescope for dreaming beyond your planet.' },
  { id: 'village', name: 'Little hillside village', category: 'homes', price: 65, kind: 'village', color: '#b48c9f', position: [-15, -155], description: 'Three colorful cottages, lanterns, and a winding village path.' },
  { id: 'balloon', name: 'Sky explorer', category: 'wonders', price: 80, kind: 'balloon', color: '#c6937a', position: [-37, -65], description: 'A striped hot-air balloon floating above your growing world.' },
];

export const getPlanetItem = (id) => PLANET_ITEMS.find((item) => item.id === id);

export function getPlanetCollection(profile = {}) {
  const owned = [...new Set(Array.isArray(profile.ownedPlanetItems) ? profile.ownedPlanetItems : [])]
    .filter((id) => getPlanetItem(id));
  // Missing active items means all owned items are visible; [] means hidden.
  const active = Array.isArray(profile.activePlanetItems)
    ? owned.filter((id) => profile.activePlanetItems.includes(id))
    : owned;
  return { owned, active };
}
