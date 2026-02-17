export const EQUIPMENT = {
  // Swords - increase attack damage
  wooden_sword: { id: 'wooden_sword', name: 'Wooden Sword', slot: 'weapon', attack: 0, price: 0, color: '#aa8844', description: 'A basic wooden sword' },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', attack: 1, price: 80, color: '#cccccc', description: '+1 Attack' },
  fire_sword: { id: 'fire_sword', name: 'Fire Sword', slot: 'weapon', attack: 2, price: 200, color: '#ff6644', description: '+2 Attack' },

  // Armor - increase max HP
  cloth_armor: { id: 'cloth_armor', name: 'Cloth Tunic', slot: 'armor', hp: 0, price: 0, color: '#88aa66', description: 'Basic cloth tunic' },
  leather_armor: { id: 'leather_armor', name: 'Leather Armor', slot: 'armor', hp: 2, price: 60, color: '#996633', description: '+2 Max HP' },
  iron_armor: { id: 'iron_armor', name: 'Iron Armor', slot: 'armor', hp: 5, price: 180, color: '#aaaacc', description: '+5 Max HP' },
};

export class EquipmentManager {
  constructor() {
    this.weapon = 'wooden_sword';
    this.armor = 'cloth_armor';
  }

  getWeapon() {
    return EQUIPMENT[this.weapon];
  }

  getArmor() {
    return EQUIPMENT[this.armor];
  }

  getAttackBonus() {
    return EQUIPMENT[this.weapon]?.attack || 0;
  }

  getHPBonus() {
    return EQUIPMENT[this.armor]?.hp || 0;
  }

  equip(itemId) {
    const item = EQUIPMENT[itemId];
    if (!item) return false;
    if (item.slot === 'weapon') {
      this.weapon = itemId;
    } else if (item.slot === 'armor') {
      this.armor = itemId;
    }
    return true;
  }

  saveState() {
    return { weapon: this.weapon, armor: this.armor };
  }

  restoreState(state) {
    if (!state) return;
    if (state.weapon) this.weapon = state.weapon;
    if (state.armor) this.armor = state.armor;
  }
}
