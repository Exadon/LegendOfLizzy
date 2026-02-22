export const MATERIALS = {
  slime_goo: { id: 'slime_goo', name: 'Slime Goo', color: '#66cc44' },
  crystal_shard: { id: 'crystal_shard', name: 'Crystal Shard', color: '#88aaff' },
  bone_dust: { id: 'bone_dust', name: 'Bone Dust', color: '#ddddbb' },
  yeti_fur: { id: 'yeti_fur', name: 'Yeti Fur', color: '#ccddee' },
  sea_essence: { id: 'sea_essence', name: 'Sea Essence', color: '#4488ff' },
};

// Material drop sources for _tryDropMaterial in GameScene
export const MATERIAL_DROPS = {
  slime: 'slime_goo',
  bat: 'crystal_shard',
  skeleton: 'bone_dust',
  yeti: 'yeti_fur',
  sea_wraith: 'sea_essence',
  goblin: 'slime_goo',
  pirate_ghost: 'sea_essence',
  ice_skeleton: 'bone_dust',
  zombie: 'bone_dust',
};

export const CRAFTING_RECIPES = [
  {
    id: 'craft_health_potion',
    name: 'Health Potion',
    ingredients: [{ material: 'slime_goo', count: 3 }],
    result: { type: 'item', id: 'health_potion', count: 1 },
    description: '3 Slime Goo → Health Potion',
  },
  {
    id: 'craft_mana_crystal',
    name: 'Mana Crystal',
    ingredients: [
      { material: 'bone_dust', count: 2 },
      { material: 'crystal_shard', count: 1 },
    ],
    result: { type: 'mana', amount: 5 },
    description: '2 Bone Dust + 1 Crystal Shard → +5 Mana',
  },
  {
    id: 'craft_warm_cloak',
    name: 'Warm Cloak',
    ingredients: [{ material: 'yeti_fur', count: 3 }],
    result: { type: 'equip', id: 'warm_cloak' },
    description: '3 Yeti Fur → Warm Cloak (+2 Max HP)',
  },
  {
    id: 'craft_sea_charm',
    name: 'Sea Charm',
    ingredients: [
      { material: 'sea_essence', count: 2 },
      { material: 'crystal_shard', count: 1 },
    ],
    result: { type: 'maxMana', amount: 3 },
    description: '2 Sea Essence + 1 Crystal Shard → +3 Max Mana',
  },
  {
    id: 'craft_speed_potion',
    name: 'Speed Potion',
    ingredients: [
      { material: 'slime_goo', count: 1 },
      { material: 'sea_essence', count: 1 },
    ],
    result: { type: 'item', id: 'speed_potion', count: 1 },
    description: '1 Slime Goo + 1 Sea Essence → Speed Potion',
  },
];
