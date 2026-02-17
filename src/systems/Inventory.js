export const ITEMS = {
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 2 HP',
    color: 0xe74c3c,
    maxStack: 5,
  },
  speed_potion: {
    id: 'speed_potion',
    name: 'Speed Potion',
    description: '+50% speed for 8s',
    color: 0x3498db,
    maxStack: 5,
  },
  shield_potion: {
    id: 'shield_potion',
    name: 'Shield Potion',
    description: '5s invincibility',
    color: 0xf1c40f,
    maxStack: 5,
  },
};

export class Inventory {
  constructor() {
    // 3 hotbar slots, each can hold { itemId, count } or null
    this.slots = [null, null, null];
  }

  addItem(itemId, count = 1) {
    const item = ITEMS[itemId];
    if (!item) return 0;

    let remaining = count;

    // First try to stack into existing slots
    for (let i = 0; i < this.slots.length; i++) {
      if (remaining <= 0) break;
      if (this.slots[i] && this.slots[i].itemId === itemId) {
        const space = item.maxStack - this.slots[i].count;
        const toAdd = Math.min(remaining, space);
        this.slots[i].count += toAdd;
        remaining -= toAdd;
      }
    }

    // Then try empty slots
    for (let i = 0; i < this.slots.length; i++) {
      if (remaining <= 0) break;
      if (!this.slots[i]) {
        const toAdd = Math.min(remaining, item.maxStack);
        this.slots[i] = { itemId, count: toAdd };
        remaining -= toAdd;
      }
    }

    return count - remaining; // number actually added
  }

  useItem(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0) return null;

    slot.count--;
    const itemId = slot.itemId;
    if (slot.count <= 0) {
      this.slots[slotIndex] = null;
    }
    return itemId;
  }

  getSlot(index) {
    return this.slots[index];
  }

  saveState() {
    return this.slots.map((s) => (s ? { itemId: s.itemId, count: s.count } : null));
  }

  restoreState(state) {
    if (!state || !Array.isArray(state)) return;
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i] = state[i] ? { itemId: state[i].itemId, count: state[i].count } : null;
    }
  }
}
