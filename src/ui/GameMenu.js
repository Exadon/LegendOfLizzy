import Phaser from 'phaser';
import { EQUIPMENT } from '../systems/Equipment.js';
import { BESTIARY_LORE } from '../data/BestiaryLore.js';

const TABS = ['Stats', 'Quests', 'Bestiary', 'Menu', 'Settings', 'Medals'];

const ACHIEVEMENTS = [
  { id: 'first_blood',     label: 'First Blood',     desc: 'Defeat your first enemy.' },
  { id: 'boss_slayer',     label: 'Boss Slayer',      desc: 'Defeat all 6 dungeon bosses.' },
  { id: 'lich_vanquished', label: 'Lich Vanquished',  desc: 'Defeat the Lich King.' },
  { id: 'crafter',         label: 'Crafter',          desc: 'Craft 3 items.' },
  { id: 'angler',          label: 'Angler',           desc: 'Catch 10 fish.' },
  { id: 'hoarder',         label: 'Hoarder',          desc: 'Collect 1000 gold total.' },
  { id: 'explorer',        label: 'Explorer',         desc: 'Visit all 20 maps.' },
  { id: 'true_hero',       label: 'True Hero',        desc: 'Achieve the true ending.' },
  { id: 'storyteller',    label: 'Storyteller',      desc: 'Complete all 4 NPC story arcs.' },
];

export class GameMenu {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.activeTab = 0;
    this.questPage = 0;
    this.questTotalPages = 1;
    this.menuCursor = 0;
    this.settingsCursor = 0; // 0=music, 1=sfx
    this._questEntries = [];
    this._pauseQuestIds = [];

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(20000)
      .setVisible(false);

    // Dark overlay
    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.65);
    this.container.add(overlay);

    // Book dimensions — fill most of the viewport
    const bookW = 280;
    const bookH = 168;
    const bookX = w / 2;
    const bookY = h / 2 + 6;
    const bookLeft = bookX - bookW / 2;
    const bookTop = bookY - bookH / 2;

    this.bookX = bookX;
    this.bookY = bookY;
    this.bookW = bookW;
    this.bookH = bookH;
    this.bookLeft = bookLeft;
    this.bookTop = bookTop;

    // Page content areas — two columns with spine gap
    const margin = 14;
    const spineGap = 10;
    const pageW = (bookW - margin * 2 - spineGap) / 2;
    this.leftX = bookLeft + margin;
    this.leftW = pageW;
    this.rightX = bookX + spineGap / 2;
    this.rightW = pageW;
    this.pageTop = bookTop + margin;
    this.pageBottom = bookTop + bookH - margin;

    // Book background
    const book = scene.add.image(bookX, bookY, 'book-ui', 'book-open-tan');
    book.setDisplaySize(bookW, bookH);
    this.container.add(book);

    // --- Tab buttons above the book ---
    this.tabActiveBgs = [];
    this.tabInactiveBgs = [];
    this.tabTexts = [];
    this.tabHitAreas = [];
    const tabW = 40;
    const tabH = 18;
    const activeTabH = 22;
    const tabY = bookTop - tabH / 2 + 2;
    const activeTabY = bookTop - activeTabH / 2 + 2;
    const tabStartX = bookX - (TABS.length * (tabW + 4)) / 2 + tabW / 2;

    for (let i = 0; i < TABS.length; i++) {
      const tx = tabStartX + i * (tabW + 4);

      const activeBg = scene.add.nineslice(
        tx, activeTabY, 'ui-frames', 'tab-orange',
        tabW, activeTabH, 3, 3, 3, 3
      );
      this.container.add(activeBg);
      this.tabActiveBgs.push(activeBg);

      const inactiveBg = scene.add.nineslice(
        tx, tabY, 'ui-frames', 'tab-gray',
        tabW, tabH, 3, 3, 3, 3
      );
      this.container.add(inactiveBg);
      this.tabInactiveBgs.push(inactiveBg);

      const tabLabel = scene.add.text(tx, tabY, TABS[i], {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#3d2510',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(tabLabel);
      this.tabTexts.push(tabLabel);

      const hitZone = scene.add.rectangle(tx, tabY, tabW, activeTabH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      const tabIdx = i;
      hitZone.on('pointerdown', () => {
        if (this.visible) this._switchTab(tabIdx);
      });
      this.container.add(hitZone);
      this.tabHitAreas.push(hitZone);
    }

    // --- Page content (dynamic) ---
    this.leftTitle = scene.add.text(this.leftX + this.leftW / 2, this.pageTop, '', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif',
      color: '#3d2510', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.leftTitle);

    this.leftContent = scene.add.text(this.leftX, this.pageTop + 16, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#3d2510', lineSpacing: 2,
      wordWrap: { width: this.leftW },
    });
    this.container.add(this.leftContent);

    this.rightTitle = scene.add.text(this.rightX + this.rightW / 2, this.pageTop, '', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif',
      color: '#3d2510', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.rightTitle);

    this.rightContent = scene.add.text(this.rightX, this.pageTop + 16, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#3d2510', lineSpacing: 2,
      wordWrap: { width: this.rightW },
    });
    this.container.add(this.rightContent);

    // Page indicator (bottom of book)
    this.pageIndicator = scene.add.text(bookX, this.pageBottom, '', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#7a6a5a',
    }).setOrigin(0.5, 1);
    this.container.add(this.pageIndicator);
  }

  // --- Menu items for cursor navigation ---
  _getMenuItems() {
    const items = [
      { label: 'Resume', action: () => this.close() },
      { label: 'Settings', action: () => this._switchTab(4) },
      { label: 'Save & Quit', action: () => this._saveAndQuit() },
    ];
    // Add quest tracking items
    const qm = this.scene.questManager;
    for (let i = 0; i < Math.min(this._pauseQuestIds.length, 3); i++) {
      const q = qm ? qm.getQuest(this._pauseQuestIds[i]) : null;
      if (q) {
        const qId = q.id;
        items.push({
          label: `Track: ${q.name}`,
          action: () => {
            this.scene.sfx.play('select');
            this.scene.trackedQuestId = qId;
            this.scene.updateQuestTracker();
            this._render();
          },
        });
      }
    }
    return items;
  }

  open(tab) {
    this.visible = true;
    this.activeTab = tab || 0;
    this.questPage = 0;
    this.menuCursor = 0;
    this.container.setVisible(true);
    this.scene.physics.pause();
    if (this.scene.boss && this.scene.boss.pauseTimers) this.scene.boss.pauseTimers();
    this._buildQuestEntries();
    this._render();

    this._onKeyDown = (event) => {
      if (!this.visible) return;
      const code = event.keyCode;

      // W/Up and S/Down for cursor movement
      if (code === Phaser.Input.Keyboard.KeyCodes.W ||
          code === Phaser.Input.Keyboard.KeyCodes.UP) {
        if (this.activeTab === 3) {
          this.menuCursor = Math.max(0, this.menuCursor - 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 4) {
          this.settingsCursor = Math.max(0, this.settingsCursor - 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 1 && this.questTotalPages > 1) {
          this._flipQuestPage(-1);
        }
        return;
      }
      if (code === Phaser.Input.Keyboard.KeyCodes.S ||
          code === Phaser.Input.Keyboard.KeyCodes.DOWN) {
        if (this.activeTab === 3) {
          const items = this._getMenuItems();
          this.menuCursor = Math.min(items.length - 1, this.menuCursor + 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 4) {
          this.settingsCursor = Math.min(1, this.settingsCursor + 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 1 && this.questTotalPages > 1) {
          this._flipQuestPage(1);
        }
        return;
      }

      // Enter/Space to confirm on Menu tab
      if ((code === Phaser.Input.Keyboard.KeyCodes.ENTER ||
           code === Phaser.Input.Keyboard.KeyCodes.SPACE) && this.activeTab === 3) {
        const items = this._getMenuItems();
        if (this.menuCursor < items.length) {
          items[this.menuCursor].action();
        }
        return;
      }

      // A/D or Left/Right for tab switching (or quest page flipping / settings adjustment)
      if (code === Phaser.Input.Keyboard.KeyCodes.LEFT ||
          code === Phaser.Input.Keyboard.KeyCodes.A) {
        if (this.activeTab === 4) {
          this._adjustVolume(-1);
        } else if (this.activeTab === 1 && this.questTotalPages > 1) {
          this._flipQuestPage(-1);
        } else {
          this._switchTab(Math.max(0, this.activeTab - 1));
        }
        return;
      }
      if (code === Phaser.Input.Keyboard.KeyCodes.RIGHT ||
          code === Phaser.Input.Keyboard.KeyCodes.D) {
        if (this.activeTab === 4) {
          this._adjustVolume(1);
        } else if (this.activeTab === 1 && this.questTotalPages > 1) {
          this._flipQuestPage(1);
        } else if (this.activeTab === 2) {
          this._flipQuestPage(1);
        } else {
          this._switchTab(Math.min(TABS.length - 1, this.activeTab + 1));
        }
        return;
      }

      // ESC/Q/E to close
      if (code === Phaser.Input.Keyboard.KeyCodes.ESC ||
          code === Phaser.Input.Keyboard.KeyCodes.Q ||
          code === Phaser.Input.Keyboard.KeyCodes.E) {
        this.close();
        return;
      }
    };
    this.scene.input.keyboard.on('keydown', this._onKeyDown);
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    this.scene.physics.resume();
    if (this.scene.boss && this.scene.boss.resumeTimers) this.scene.boss.resumeTimers();
    if (this._onKeyDown) {
      this.scene.input.keyboard.off('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
  }

  toggle(tab) {
    if (this.visible) {
      this.close();
    } else {
      this.open(tab);
    }
    return this.visible;
  }

  _toggleSound() {
    const isMuted = localStorage.getItem('lizzy-muted') === 'true';
    const newMuted = !isMuted;
    localStorage.setItem('lizzy-muted', newMuted);
    // Mute/unmute SFX
    const sfx = this.scene.sfx;
    if (sfx) sfx.muted = newMuted;
    // Mute/unmute music
    const music = this.scene.music;
    if (music && music.masterGain && music.ctx) {
      music.masterGain.gain.setValueAtTime(newMuted ? 0 : 1, music.ctx.currentTime);
    }
    this.scene.sfx.play('select');
    this._render();
  }

  _saveAndQuit() {
    if (this.scene._doSaveAndQuit) {
      this.scene._doSaveAndQuit();
    }
  }

  _switchTab(idx) {
    if (idx === this.activeTab) return;
    this.activeTab = idx;
    this.questPage = 0;
    this.menuCursor = 0;
    this.scene.sfx.play('select');
    this._render();
  }

  _flipQuestPage(dir) {
    const newPage = this.questPage + dir;
    if (newPage >= 0 && newPage < this.questTotalPages) {
      this.questPage = newPage;
      this._render();
    }
  }

  _buildQuestEntries() {
    const qm = this.scene.questManager;
    if (!qm) { this._questEntries = []; return; }

    const allQuests = qm.getAllQuests();
    const active = allQuests.filter(q => q.state === 'active' || q.state === 'ready');
    const completed = allQuests.filter(q => q.state === 'completed');

    this._questEntries = [];
    this._pauseQuestIds = [];

    for (const q of active) {
      const status = q.state === 'ready' ? ' [DONE]' : '';
      const progress = q.state === 'ready' ? 'Turn in to NPC' : `${q.progress}/${q.objective.count}`;
      this._questEntries.push({ name: q.name + status, detail: progress, id: q.id, done: false });
      this._pauseQuestIds.push(q.id);
    }
    for (const q of completed) {
      this._questEntries.push({ name: q.name, detail: 'Complete', id: q.id, done: true });
    }

    const perSpread = 8;
    this.questTotalPages = Math.max(1, Math.ceil(this._questEntries.length / perSpread));
  }

  _render() {
    // Update tab highlights
    for (let i = 0; i < TABS.length; i++) {
      const isActive = i === this.activeTab;
      this.tabActiveBgs[i].setVisible(isActive);
      this.tabInactiveBgs[i].setVisible(!isActive);
      this.tabTexts[i].setColor(isActive ? '#3d2510' : '#555566');
      this.tabTexts[i].setStyle({ fontStyle: isActive ? 'bold' : 'normal' });
    }

    // Clear page content
    this.leftTitle.setText('');
    this.leftContent.setText('');
    this.rightTitle.setText('');
    this.rightContent.setText('');
    this.pageIndicator.setText('');

    if (this.activeTab === 0) this._renderStats();
    else if (this.activeTab === 1) this._renderQuests();
    else if (this.activeTab === 2) this._renderBestiary();
    else if (this.activeTab === 3) this._renderMenu();
    else if (this.activeTab === 4) this._renderSettings();
    else if (this.activeTab === 5) this._renderMedals();
  }

  _renderStats() {
    this.leftTitle.setText('STATS');

    const s = this.scene;
    const lines = [
      `Level: ${s.level}`,
      `Gold: ${s.gold}`,
      `HP: ${s.player.health}/${s.player.maxHealth}`,
      `XP: ${s.xp}/${s.xpToNext}`,
      `Mana: ${Math.floor(s.player.mana)}/${s.player.maxMana}`,
    ];
    // Pet bond
    if (s.pet) {
      const aff = s.petAffection || 0;
      const hearts = Math.min(5, Math.floor(aff / 10));
      const emptyHearts = 5 - hearts;
      lines.push(``, `Pet Bond: ${'♥'.repeat(hearts)}${'♡'.repeat(emptyHearts)}`);
    }
    this.leftContent.setText(lines.join('\n'));

    this.rightTitle.setText('EQUIPMENT');
    const equipLines = [];
    if (s.equipment) {
      const wpn = EQUIPMENT[s.equipment.weapon];
      const arm = EQUIPMENT[s.equipment.armor];
      if (wpn) equipLines.push(`Wpn: ${wpn.name}`);
      if (arm) equipLines.push(`Arm: ${arm.name}`);
    }
    if (equipLines.length === 0) equipLines.push('None');
    // Materials
    const mats = s.materials || {};
    const matKeys = Object.keys(mats).filter(k => mats[k] > 0);
    if (matKeys.length > 0) {
      equipLines.push('', 'Materials:');
      for (const k of matKeys) {
        equipLines.push(`${k.replace(/_/g, ' ')}: ${mats[k]}`);
      }
    }
    this.rightContent.setText(equipLines.join('\n'));
  }

  _renderQuests() {
    if (this._questEntries.length === 0) {
      this.leftTitle.setText('QUESTS');
      this.leftContent.setText('No quests yet.\n\nTalk to NPCs with\na yellow ! above\nthem.');
      return;
    }

    const perSide = 4;
    const perSpread = perSide * 2;
    const startIdx = this.questPage * perSpread;

    const leftEntries = this._questEntries.slice(startIdx, startIdx + perSide);
    const rightEntries = this._questEntries.slice(startIdx + perSide, startIdx + perSpread);

    this.leftTitle.setText('QUESTS');
    this.leftContent.setText(this._formatQuestEntries(leftEntries));

    if (rightEntries.length > 0) {
      this.rightTitle.setText('');
      this.rightContent.setText(this._formatQuestEntries(rightEntries));
      this.rightContent.setY(this.pageTop + 16);
    }

    if (this.questTotalPages > 1) {
      this.pageIndicator.setText(`Page ${this.questPage + 1} / ${this.questTotalPages}`);
    }
  }

  _renderBestiary() {
    this.leftTitle.setText('BESTIARY');

    const bestiary = this.scene.bestiary || {};
    const entries = Object.entries(bestiary).filter(([, count]) => count > 0);

    if (entries.length === 0) {
      this.leftContent.setText('No enemies\ndefeated yet.\n\nDefeat monsters\nto fill this page.');
      return;
    }

    // Paginate: 4 entries per spread (2 left, 2 right)
    const perSpread = 4;
    const totalPages = Math.ceil(entries.length / perSpread);
    const page = (this.questPage || 0) % Math.max(1, totalPages);
    const startIdx = page * perSpread;
    const pageEntries = entries.slice(startIdx, startIdx + perSpread);
    const leftEntries = pageEntries.slice(0, 2);
    const rightEntries = pageEntries.slice(2, 4);

    const formatEntry = ([type, count]) => {
      const lore = BESTIARY_LORE[type] || {};
      const name = lore.name || type.replace(/_/g, ' ');
      const desc = lore.description || 'A dangerous foe.';
      const weak = lore.weakness ? `Weak: ${lore.weakness}` : '';
      return `${name} x${count}\n${desc}${weak ? '\n' + weak : ''}`;
    };

    this.leftTitle.setText('BESTIARY');
    this.leftContent.setText(leftEntries.map(formatEntry).join('\n\n'));

    this.rightTitle.setText('');
    this.rightContent.setText(rightEntries.length > 0 ? rightEntries.map(formatEntry).join('\n\n') : '');
    this.rightContent.setY(this.pageTop + 16);

    // Total kills
    const total = Object.values(bestiary).reduce((a, b) => a + b, 0);
    this.pageIndicator.setText(`${total} defeated | Page ${page + 1}/${Math.max(1, totalPages)}`);
  }

  _renderMenu() {
    this.leftTitle.setText('MENU');

    const items = this._getMenuItems();
    // Clamp cursor
    if (this.menuCursor >= items.length) this.menuCursor = items.length - 1;
    if (this.menuCursor < 0) this.menuCursor = 0;

    const lines = [];
    for (let i = 0; i < items.length; i++) {
      const cursor = i === this.menuCursor ? '>' : ' ';
      lines.push(`${cursor} ${items[i].label}`);
    }
    this.leftContent.setText(lines.join('\n'));

    // Show tracked quest on right page
    this.rightTitle.setText('TRACKED');
    const trackedId = this.scene.trackedQuestId;
    const qm = this.scene.questManager;
    if (trackedId && qm) {
      const q = qm.getQuest(trackedId);
      if (q && (q.state === 'active' || q.state === 'ready')) {
        const progress = q.state === 'ready' ? 'Turn in to NPC' : `${q.progress}/${q.objective.count}`;
        this.rightContent.setText(`${q.name}\n${progress}`);
      } else {
        this.rightContent.setText('None');
      }
    } else {
      this.rightContent.setText('None');
    }
  }

  _formatQuestEntries(entries) {
    if (entries.length === 0) return '';
    const lines = [];
    for (let i = 0; i < entries.length; i++) {
      if (i > 0) lines.push('');
      const e = entries[i];
      const prefix = e.done ? '*' : '>';
      lines.push(`${prefix} ${e.name}`);
      lines.push(`  ${e.detail}`);
    }
    return lines.join('\n');
  }

  _renderSettings() {
    this.leftTitle.setText('SETTINGS');

    const musicVol = parseInt(localStorage.getItem('lizzy-music-vol') ?? '7', 10);
    const sfxVol = parseInt(localStorage.getItem('lizzy-sfx-vol') ?? '8', 10);

    const _bar = (val) => {
      const filled = Math.round(val);
      return '[' + '='.repeat(filled) + '-'.repeat(10 - filled) + ']';
    };

    const lines = [
      `${this.settingsCursor === 0 ? '>' : ' '} Music Vol`,
      `  ${_bar(musicVol)} ${musicVol}`,
      '',
      `${this.settingsCursor === 1 ? '>' : ' '} SFX Vol`,
      `  ${_bar(sfxVol)} ${sfxVol}`,
    ];
    this.leftContent.setText(lines.join('\n'));

    this.rightTitle.setText('CONTROLS');
    this.rightContent.setText('W/S: select row\nLeft/Right: adjust\nA/D: also adjust');
  }

  _renderMedals() {
    this.leftTitle.setText('MEDALS');
    const achievements = this.scene.achievements || {};
    const earned = ACHIEVEMENTS.filter(a => achievements[a.id]);
    const locked = ACHIEVEMENTS.filter(a => !achievements[a.id]);

    const leftEntries = ACHIEVEMENTS.slice(0, 4);
    const rightEntries = ACHIEVEMENTS.slice(4);

    const fmt = (ach) => {
      const done = !!achievements[ach.id];
      const prefix = done ? '\u2713' : '\u25cb';
      const color = done ? '' : '';
      return `${prefix} ${ach.label}\n  ${ach.desc}`;
    };

    this.leftContent.setText(leftEntries.map(fmt).join('\n\n'));
    this.rightTitle.setText('');
    this.rightContent.setText(rightEntries.map(fmt).join('\n\n'));
    this.rightContent.setY(this.pageTop + 16);

    const total = earned.length;
    this.pageIndicator.setText(`${total}/${ACHIEVEMENTS.length} earned`);
  }

  _adjustVolume(dir) {
    const keys = ['lizzy-music-vol', 'lizzy-sfx-vol'];
    const key = keys[this.settingsCursor];
    const defaults = [7, 8];
    let val = parseInt(localStorage.getItem(key) ?? String(defaults[this.settingsCursor]), 10);
    val = Math.max(0, Math.min(10, val + dir));
    localStorage.setItem(key, String(val));

    const scene = this.scene;
    if (this.settingsCursor === 0) {
      const music = scene.music;
      if (music) music.setVolume(val / 10);
    } else {
      const sfx = scene.sfx;
      if (sfx) sfx.setVolume(val / 10);
    }
    this._render();
  }
}
