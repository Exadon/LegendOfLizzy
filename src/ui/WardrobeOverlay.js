// Phase 15 — Lizzy's Wardrobe
// Carousel UI: Hat / Dress / Accessory slots with live preview and keyboard navigation.

export const WARDROBE_ITEMS = {
  hat: [
    { id: null,             name: 'No Hat',        desc: 'Default'        },
    { id: 'hat-crown',      name: 'Gold Crown',    desc: 'Shop — 150g'    },
    { id: 'hat-bunnyears',  name: 'Bunny Ears',    desc: 'Forest chest'   },
    { id: 'hat-flowerband', name: 'Flower Band',   desc: "Buba's gift"    },
    { id: 'hat-wizardhat',  name: 'Wizard Hat',    desc: 'Ruins chest'    },
    { id: 'hat-piratehat',       name: 'Pirate Hat',      desc: 'Harbor reward'     },
    { id: 'hat-butterfly-crown', name: 'Butterfly Crown', desc: 'Catch all 4 types'  },
    { id: 'hat-explorer-scarf',  name: 'Explorer Scarf',  desc: 'Treasure hunter'    },
    { id: 'hat-flower-garland',  name: 'Flower Garland',  desc: 'Grand Festival'      },
  ],
  dress: [
    { id: null,             name: 'Adventurer',    desc: 'Default'        },
    { id: 'outfit-princess',name: 'Princess Dress',desc: 'Shop — 200g'    },
    { id: 'outfit-wizard',  name: 'Wizard Robe',   desc: '5 quests done'  },
    { id: 'outfit-pirate',  name: 'Pirate Coat',   desc: 'Harbor reward'  },
    { id: 'outfit-bunny',   name: 'Bunny Suit',    desc: 'Forest chest'   },
    { id: 'outfit-fairy',    name: 'Fairy Dress',    desc: 'All 7 bosses'    },
    { id: 'outfit-festival', name: 'Festival Dress', desc: 'Grand Festival'  },
  ],
  acc: [
    { id: null,                  name: 'None',            desc: 'Default'          },
    { id: 'acc-wand',            name: 'Magic Wand',      desc: 'Merchant item'    },
    { id: 'acc-cape',            name: 'Flowing Cape',    desc: 'Ruins chest'      },
    { id: 'acc-ribbonbow',       name: 'Ribbon Bow',      desc: "Buba's gift"      },
    { id: 'acc-firefly-lantern', name: 'Firefly Lantern', desc: 'Catch 5 fireflies'},
    { id: 'acc-apron',           name: "Chef's Apron",    desc: "Edna's feast"     },
    { id: 'acc-rainbow-sash',   name: 'Rainbow Sash',    desc: 'All Seasons achievement' },
  ],
};

const SLOT_ORDER  = ['hat', 'dress', 'acc'];
const SLOT_LABELS = { hat: 'HAT', dress: 'DRESS', acc: 'ACCESSORY' };
const SLOT_COLORS = { hat: '#ffeeaa', dress: '#ffaadd', acc: '#aaddff' };

const DRESS_TINTS = {
  'outfit-princess': 0xffaabb,
  'outfit-wizard':   0x9955ee,
  'outfit-pirate':   0xaa8866,
  'outfit-bunny':    0xffeeff,
  'outfit-fairy':    0xaaffcc,
  'outfit-festival': 0xddaaff,
};

export class WardrobeOverlay {
  constructor(scene) {
    this.scene = scene;
    this._onKey = this._onKey.bind(this);

    // Main container — fixed on screen, above everything
    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(16000)
      .setVisible(false);

    this._buildUI();
  }

  // ─── Build static UI skeleton ────────────────────────────────────────────

  _buildUI() {
    const W = 300, H = 180;
    const cx = 160, cy = 130; // Centre of the 320×240 canvas (below 38-px HUD)

    // Panel background + border
    const bg     = this.scene.add.rectangle(cx, cy, W, H, 0x1a0a2e, 0.95);
    const border = this.scene.add.rectangle(cx, cy, W, H).setStrokeStyle(2, 0xcc88ff);
    this.container.add([bg, border]);

    // Title
    const title = this.scene.add.text(cx, cy - H / 2 + 6, '\u2728 LIZZY\u2019S WARDROBE \u2728', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: '#ffddff', stroke: '#440066', strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // ── Preview panel (left) ─────────────────────────────────────────────
    const px = cx - 90, py = cy + 4;
    const previewBg = this.scene.add.rectangle(px, py, 72, 72, 0x080018, 0.9);
    this.container.add(previewBg);

    this._previewBase = this.scene.add.sprite(px, py, 'lizzy', 0);
    this._previewHatG = this.scene.add.graphics();
    this._previewAccG = this.scene.add.graphics();
    this.container.add([this._previewBase, this._previewHatG, this._previewAccG]);

    // Preview label
    const previewLabel = this.scene.add.text(px, py + 40, 'Preview', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#bbaacc',
    }).setOrigin(0.5, 0);
    this.container.add(previewLabel);

    // ── Slot rows (right) ────────────────────────────────────────────────
    this._slotTexts = {};
    // Three rows, evenly spaced inside the panel
    const rowY0 = cy - 36;
    const rowH  = 42;

    SLOT_ORDER.forEach((slot, si) => {
      const ry = rowY0 + si * rowH;

      const labelText = this.scene.add.text(cx - 20, ry, SLOT_LABELS[slot] + ':', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: SLOT_COLORS[slot], stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      const valueText = this.scene.add.text(cx - 20, ry + 16, '', {
        fontSize: '11px', fontFamily: 'Arial, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      this.container.add([labelText, valueText]);
      this._slotTexts[slot] = valueText;
    });

    // Selection highlight rect (behind value text)
    this._cursorBg = this.scene.add.rectangle(cx + 55, rowY0 + 16, 140, 14, 0x6633aa, 0.55);
    this.container.add(this._cursorBg);

    // Controls hint
    const hint = this.scene.add.text(cx, cy + H / 2 - 6,
      '\u2195 slot   \u2194 change   SPACE=save   ESC=cancel', {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: '#bbaacc', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1);
    this.container.add(hint);
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  open(equippedOutfit, unlockedWardrobe, onSave) {
    if (this.container.visible) return; // already open — ignore
    this._draft    = { hat: equippedOutfit.hat, dress: equippedOutfit.dress, acc: equippedOutfit.acc };
    this._original = { hat: equippedOutfit.hat, dress: equippedOutfit.dress, acc: equippedOutfit.acc };
    this._unlocked = unlockedWardrobe || {};
    this._onSave   = onSave;
    this._slotIndex = 0;

    // Derive per-slot selection indices from the currently equipped items
    this._selIndex = {
      hat:   this._findIndex('hat',   equippedOutfit.hat),
      dress: this._findIndex('dress', equippedOutfit.dress),
      acc:   this._findIndex('acc',   equippedOutfit.acc),
    };

    this.container.setVisible(true);
    this.scene.overlayOpen = true;
    this.scene.input.keyboard.on('keydown', this._onKey);

    this._render();
  }

  close(cancel = false) {
    this.container.setVisible(false);
    this.scene.overlayOpen = false;
    this.scene.input.keyboard.off('keydown', this._onKey);

    if (this._onSave) {
      const result = cancel ? this._original : this._draft;
      this._onSave(result);
    }
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  _findIndex(slot, itemId) {
    const idx = WARDROBE_ITEMS[slot].findIndex(it => it.id === itemId);
    return idx < 0 ? 0 : idx;
  }

  _currentSlotKey() {
    return SLOT_ORDER[this._slotIndex];
  }

  _isItemAvailable(slot, item) {
    if (item.id === null) return true;          // "None / No Hat" always available
    return !!this._unlocked[item.id];
  }

  _cycleSlot(dir) {
    const slot  = this._currentSlotKey();
    const items = WARDROBE_ITEMS[slot];
    let idx   = this._selIndex[slot];
    let tries = 0;

    do {
      idx = (idx + dir + items.length) % items.length;
      tries++;
      if (tries > items.length) { idx = 0; break; } // fallback to "none"
    } while (!this._isItemAvailable(slot, items[idx]));

    this._selIndex[slot]  = idx;
    this._draft[slot]     = items[idx].id;

    // Live preview on player while wardrobe is open
    if (this.scene.player && this.scene.player.setOutfit) {
      this.scene.player.setOutfit(this._draft);
    }

    this._render();
  }

  _onKey(event) {
    const kc = event.keyCode;

    if      (kc === 38 || kc === 87) { // UP / W
      this._slotIndex = (this._slotIndex - 1 + SLOT_ORDER.length) % SLOT_ORDER.length;
      this._render();
    } else if (kc === 40 || kc === 83) { // DOWN / S
      this._slotIndex = (this._slotIndex + 1) % SLOT_ORDER.length;
      this._render();
    } else if (kc === 37 || kc === 65) { // LEFT / A
      this._cycleSlot(-1);
    } else if (kc === 39 || kc === 68) { // RIGHT / D
      this._cycleSlot(1);
    } else if (kc === 32 || kc === 13) { // SPACE / ENTER
      this.close(false);
    } else if (kc === 27) {              // ESC
      this.close(true);
    }
  }

  _render() {
    const rowY0 = 130 - 36; // matches _buildUI rowY0
    const rowH  = 42;

    SLOT_ORDER.forEach((slot, si) => {
      const items     = WARDROBE_ITEMS[slot];
      const selIdx    = this._selIndex[slot];
      const item      = items[selIdx];
      const isActive  = si === this._slotIndex;
      const available = this._isItemAvailable(slot, item);

      const arrow      = isActive ? '\u25b8 ' : '  ';
      const displayName = available ? item.name : '\uD83D\uDD12 ???';

      this._slotTexts[slot].setText(arrow + displayName);
      this._slotTexts[slot].setColor(isActive ? '#ee99ff' : '#dddddd');
    });

    // Move selection highlight to active row
    const activeY = rowY0 + this._slotIndex * rowH + 16;
    this._cursorBg.setY(activeY);

    this._updatePreview();
  }

  _updatePreview() {
    // Preview sprite is at (px=70, py=134) in screen coords (container at 0,0)
    const px = 70, py = 134;

    // Dress — tint the base Lizzy sprite
    this._previewBase.clearTint();
    const tint = this._draft.dress ? (DRESS_TINTS[this._draft.dress] || null) : null;
    if (tint) this._previewBase.setTint(tint);

    // Hat
    this._previewHatG.clear();
    if (this._draft.hat) this._drawPreviewHat(this._draft.hat, px, py);

    // Accessory
    this._previewAccG.clear();
    if (this._draft.acc) this._drawPreviewAcc(this._draft.acc, px, py);
  }

  /** Draw hat shapes into the preview Graphics at absolute screen position (bx, by). */
  _drawPreviewHat(hatId, bx, by) {
    const g = this._previewHatG;
    switch (hatId) {
      case 'hat-crown':
        g.fillStyle(0xffdd00, 1);
        g.fillRect(bx - 7, by - 30, 14, 4);
        g.fillTriangle(bx - 6, by - 30, bx - 3, by - 30, bx - 4.5, by - 38);
        g.fillTriangle(bx - 1.5, by - 31, bx + 1.5, by - 31, bx, by - 40);
        g.fillTriangle(bx + 3, by - 30, bx + 6, by - 30, bx + 4.5, by - 38);
        g.fillStyle(0xff2244, 1); g.fillCircle(bx - 4, by - 29, 1.5);
        g.fillStyle(0x4488ff, 1); g.fillCircle(bx + 4, by - 29, 1.5);
        break;
      case 'hat-bunnyears':
        g.fillStyle(0xff99cc, 1);
        g.fillEllipse(bx - 5, by - 38, 6, 14);
        g.fillEllipse(bx + 5, by - 38, 6, 14);
        g.fillStyle(0xffccee, 1);
        g.fillEllipse(bx - 5, by - 38, 3, 9);
        g.fillEllipse(bx + 5, by - 38, 3, 9);
        break;
      case 'hat-flowerband':
        g.fillStyle(0x33aa33, 1);
        g.fillRect(bx - 9, by - 28, 18, 3);
        [0xff4466, 0xffdd44, 0xff88cc, 0x44ddff].forEach((c, i) => {
          g.fillStyle(c, 1);
          g.fillCircle(bx + [-6, -2, 2, 6][i], by - 29, 2.5);
        });
        break;
      case 'hat-wizardhat':
        g.fillStyle(0x6622bb, 1);
        g.fillTriangle(bx - 8, by - 28, bx + 8, by - 28, bx, by - 46);
        g.fillStyle(0x4411aa, 1);
        g.fillRect(bx - 11, by - 28, 22, 3);
        g.fillStyle(0xffdd44, 1);
        g.fillCircle(bx, by - 42, 2);
        break;
      case 'hat-piratehat':
        g.fillStyle(0x111111, 1);
        g.fillRect(bx - 10, by - 30, 20, 5);
        g.fillEllipse(bx, by - 32, 14, 7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(bx - 2, by - 31, 1.5);
        g.fillCircle(bx + 2, by - 31, 1.5);
        g.fillRect(bx - 2.5, by - 29, 6, 1.5);
        break;
    }
  }

  /** Draw accessory shapes into the preview Graphics (static, facing down). */
  _drawPreviewAcc(accId, px, py) {
    const g = this._previewAccG;
    switch (accId) {
      case 'acc-wand':
        g.fillStyle(0x885533, 1);
        g.fillRect(px + 8, py - 8, 2, 12);
        g.fillStyle(0xffdd00, 1);
        g.fillCircle(px + 9, py - 10, 3);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(px + 8, py - 11, 1);
        break;
      case 'acc-cape':
        g.fillStyle(0x8822cc, 0.8);
        g.fillTriangle(px - 2, py - 14, px - 2, py + 12, px - 14, py + 6);
        break;
      case 'acc-ribbonbow':
        g.fillStyle(0xff44aa, 1);
        g.fillEllipse(px - 11, py - 14, 5, 4);
        g.fillEllipse(px - 5,  py - 14, 5, 4);
        g.fillStyle(0xff88cc, 1);
        g.fillCircle(px - 8, py - 14, 2);
        break;
      case 'acc-firefly-lantern':
        // Small hanging lantern on a stick
        g.fillStyle(0x885522, 1);
        g.fillRect(px + 8, py - 10, 1.5, 10);
        g.fillStyle(0xffee44, 0.9);
        g.fillRect(px + 5, py - 4, 7, 7);
        g.fillStyle(0xffff99, 0.6);
        g.fillCircle(px + 8.5, py - 1, 2.5);
        break;
      case 'acc-apron':
        // Simple apron bib over chest
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(px - 5, py - 10, 10, 14);
        g.fillStyle(0xdddddd, 0.6);
        g.fillRect(px - 4, py - 4, 8, 6);
        break;
      case 'acc-rainbow-sash':
        // Diagonal rainbow sash across chest
        { const sashColors = [0xff4444, 0xff8844, 0xffdd44, 0x44cc44, 0x4488ff, 0x9944ff];
          sashColors.forEach((c, si) => {
            g.fillStyle(c, 0.8);
            g.fillRect(px - 10 + si * 3, py - 12 + si * 3, 3, 3);
          }); }
        break;
    }
  }
}
