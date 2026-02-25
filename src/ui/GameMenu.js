import Phaser from 'phaser';
import { EQUIPMENT } from '../systems/Equipment.js';
import { BESTIARY_LORE } from '../data/BestiaryLore.js';
import { MATERIALS } from '../data/CraftingRecipes.js';

const TABS = ['Stats', 'Quests', 'Bestiary', 'Menu', 'Settings', 'Medals', 'Keys'];

const ACHIEVEMENTS = [
  // Phase 8-9
  { id: 'first_blood',     label: 'First Blood',     desc: 'Defeat your first enemy.' },
  { id: 'boss_slayer',     label: 'Boss Slayer',      desc: 'Defeat all 6 dungeon bosses.' },
  { id: 'lich_vanquished', label: 'Lich Vanquished',  desc: 'Defeat the Lich King.' },
  { id: 'crafter',         label: 'Crafter',          desc: 'Craft 3 items.' },
  { id: 'angler',          label: 'Angler',           desc: 'Catch 10 fish.' },
  { id: 'hoarder',         label: 'Hoarder',          desc: 'Collect 1000 gold total.' },
  { id: 'explorer',        label: 'Explorer',         desc: 'Visit all 20 maps.' },
  { id: 'true_hero',       label: 'True Hero',        desc: 'Achieve the true ending.' },
  // Phase 14
  { id: 'storyteller',     label: 'Storyteller',      desc: 'Complete all 4 NPC story arcs.' },
  // Phase 23-25
  { id: 'butterfly_collector', label: 'Nature Lover',    desc: 'Catch a butterfly of every color.' },
  { id: 'beloved_friend',      label: 'Beloved Friend',  desc: 'Gift flowers to 5 different friends.' },
  { id: 'stargazer',           label: 'Stargazer',       desc: 'Name all three constellations.' },
  { id: 'treasure_hunter',     label: 'Treasure Hunter', desc: 'Dig up all 3 buried treasures.' },
  { id: 'rainbow_chaser',      label: 'Rainbow Chaser',  desc: 'Collect all 7 rainbow crystals.' },
  // Phase 26-28
  { id: 'lord_dire_vanquished', label: 'Light Bringer',  desc: 'Defeat Lord Dire, the Lord of Darkness.' },
  { id: 'loremaster',    label: 'Loremaster',   desc: 'Collect all 7 Crystal Bearer Letters.' },
  { id: 'master_angler', label: 'Master Angler', desc: 'Catch all 8 fish species.' },
  { id: 'all_seasons',   label: 'All Seasons',   desc: 'Collect a seasonal sparkle in every season.' },
  // Phase 29-31
  { id: 'decorate_home',  label: 'Home Decorator', desc: 'Buy 3 furniture items from Clara.' },
  { id: 'grand_festival', label: 'Town Hero',      desc: 'Complete the Grand Festival celebrations.' },
  { id: 'firefly_friend', label: 'Firefly Friend', desc: 'Catch 5 fireflies on the world map.' },
  // Bestiary
  { id: 'bestiary_expert', label: 'Creature Scholar', desc: 'Discover all 21 creatures in the Bestiary.' },
];

export class GameMenu {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.activeTab = 0;
    this.questPage = 0;
    this.questTotalPages = 1;
    this.medalPage = 0;
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

    // Panel dimensions
    const panelW = 284;
    const panelH = 170;
    const panelX = w / 2;
    const panelY = h / 2 + 4;
    const panelLeft = panelX - panelW / 2;
    const panelTop = panelY - panelH / 2;
    const panelBottom = panelTop + panelH;

    // Content areas (set before building tabs/texts so they're available)
    this.leftX = panelLeft + 8;
    this.leftW = 130;
    this.rightX = panelLeft + 150;
    this.rightW = panelLeft + panelW - 8 - (panelLeft + 150); // 126
    this.pageTop = panelTop + 24; // 20px tab strip + 4px gap
    this.pageBottom = panelBottom - 10;

    // Border rect (rendered first, behind fill)
    const border = scene.add.rectangle(panelX, panelY, panelW + 4, panelH + 4, 0x4455aa);
    this.container.add(border);

    // Fill rect
    const fill = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x111133);
    this.container.add(fill);

    // --- Tab strip (inside panel top row, 20px tall) ---
    this.tabRects = [];
    this.tabTexts = [];
    this.tabHitAreas = [];
    const tabW = 36;
    const tabH = 20;
    const tabGap = 4;
    const tabStripY = panelTop + tabH / 2; // center of 20px strip
    const tabStartX = panelLeft + 4 + tabW / 2; // 4px margin + half-tab

    this._tabClickAreas = [];
    for (let i = 0; i < TABS.length; i++) {
      const tx = tabStartX + i * (tabW + tabGap);

      const tabRect = scene.add.rectangle(tx, tabStripY, tabW, tabH, 0x1a2244);
      this.container.add(tabRect);
      this.tabRects.push(tabRect);

      const tabLabel = scene.add.text(tx, tabStripY, TABS[i], {
        fontSize: '9px',
        fontFamily: 'Arial, sans-serif',
        color: '#7788aa',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(tabLabel);
      this.tabTexts.push(tabLabel);

      // Store logical position for manual pointer hit-testing (setInteractive on
      // scrollFactor=0 container children is unreliable with a viewport y-offset)
      this._tabClickAreas.push({ x: tx, y: tabStripY, hw: tabW / 2, hh: tabH / 2 });
    }

    // --- Page content (dynamic) ---
    this.leftTitle = scene.add.text(this.leftX + this.leftW / 2, this.pageTop, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#aabbee', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.leftTitle);

    this.leftContent = scene.add.text(this.leftX, this.pageTop + 13, '', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ccddff', lineSpacing: 2,
      wordWrap: { width: this.leftW },
    });
    this.container.add(this.leftContent);

    this.rightTitle = scene.add.text(this.rightX + this.rightW / 2, this.pageTop, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#aabbee', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.rightTitle);

    this.rightContent = scene.add.text(this.rightX, this.pageTop + 13, '', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ccddff', lineSpacing: 2,
      wordWrap: { width: this.rightW },
    });
    this.container.add(this.rightContent);

    // Page indicator (above hint line)
    this.pageIndicator = scene.add.text(panelX, panelBottom - 13, '', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#7788aa',
    }).setOrigin(0.5, 1);
    this.container.add(this.pageIndicator);

    // Hint line at very bottom
    const hint = scene.add.text(panelX, panelBottom - 3, 'A/D: tabs  \u2022  W/S: item  \u2022  \u2190\u2192: adjust  \u2022  ESC: close', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#445566',
    }).setOrigin(0.5, 1);
    this.container.add(hint);
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
    this.medalPage = 0;
    this.menuCursor = 0;
    this.container.setVisible(true);
    this.scene.physics.pause();
    if (this.scene.boss && this.scene.boss.pauseTimers) this.scene.boss.pauseTimers();
    this._buildQuestEntries();
    this._render();

    const KC = Phaser.Input.Keyboard.KeyCodes;

    this._onKeyDown = (event) => {
      if (!this.visible) return;
      const code = event.keyCode;

      // Number keys 1-7: jump directly to a tab
      if (code >= 49 && code <= 55) {
        this._switchTab(code - 49);
        return;
      }

      // W / Up arrow — navigate UP within the active tab
      if (code === KC.W || code === KC.UP) {
        if (this.activeTab === 3) {
          this.menuCursor = Math.max(0, this.menuCursor - 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 4) {
          this.settingsCursor = Math.max(0, this.settingsCursor - 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 1 || this.activeTab === 2) {
          this._flipQuestPage(-1);
        } else if (this.activeTab === 5) {
          this._flipMedalPage(-1);
        }
        return;
      }

      // S / Down arrow — navigate DOWN within the active tab
      if (code === KC.S || code === KC.DOWN) {
        if (this.activeTab === 3) {
          const items = this._getMenuItems();
          this.menuCursor = Math.min(items.length - 1, this.menuCursor + 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 4) {
          this.settingsCursor = Math.min(1, this.settingsCursor + 1);
          this.scene.sfx.play('select');
          this._render();
        } else if (this.activeTab === 1 || this.activeTab === 2) {
          this._flipQuestPage(1);
        } else if (this.activeTab === 5) {
          this._flipMedalPage(1);
        }
        return;
      }

      // A — switch to PREVIOUS tab (wraps around)
      if (code === KC.A) {
        this._switchTab((this.activeTab - 1 + TABS.length) % TABS.length);
        return;
      }

      // D — switch to NEXT tab (wraps around)
      if (code === KC.D) {
        this._switchTab((this.activeTab + 1) % TABS.length);
        return;
      }

      // Left arrow — within-tab horizontal action (adjust volume / flip page)
      if (code === KC.LEFT) {
        if (this.activeTab === 4) {
          this._adjustVolume(-1);
        } else if (this.activeTab === 1 || this.activeTab === 2) {
          this._flipQuestPage(-1);
        } else if (this.activeTab === 5) {
          this._flipMedalPage(-1);
        } else {
          this._switchTab((this.activeTab - 1 + TABS.length) % TABS.length);
        }
        return;
      }

      // Right arrow — within-tab horizontal action (adjust volume / flip page)
      if (code === KC.RIGHT) {
        if (this.activeTab === 4) {
          this._adjustVolume(1);
        } else if (this.activeTab === 1 || this.activeTab === 2) {
          this._flipQuestPage(1);
        } else if (this.activeTab === 5) {
          this._flipMedalPage(1);
        } else {
          this._switchTab((this.activeTab + 1) % TABS.length);
        }
        return;
      }

      // Enter / Space — confirm selection on Menu tab
      if ((code === KC.ENTER || code === KC.SPACE) && this.activeTab === 3) {
        const items = this._getMenuItems();
        if (this.menuCursor < items.length) {
          items[this.menuCursor].action();
        }
        return;
      }

      // ESC — close (backup; GameScene.update also handles this via JustDown)
      if (code === KC.ESC) {
        this.close();
        return;
      }
    };
    this.scene.input.keyboard.on('keydown', this._onKeyDown);

    // Manual pointer handler for tab clicks.
    // Phaser's setInteractive() hit-detection is unreliable for scrollFactor=0
    // objects inside a container when the camera has a viewport y-offset.
    // pointer.y is in game-pixel space (0-240); the GameScene camera viewport
    // starts at y=38 game pixels, so camera-local y = pointer.y - 38.
    const VIEWPORT_Y = 38;
    this._onPointerDown = (pointer) => {
      if (!this.visible) return;
      const localY = pointer.y - VIEWPORT_Y;
      for (let i = 0; i < TABS.length; i++) {
        const ta = this._tabClickAreas[i];
        if (pointer.x >= ta.x - ta.hw && pointer.x <= ta.x + ta.hw &&
            localY  >= ta.y - ta.hh && localY  <= ta.y + ta.hh) {
          this._switchTab(i);
          return;
        }
      }
    };
    this.scene.input.on('pointerdown', this._onPointerDown);
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
    if (this._onPointerDown) {
      this.scene.input.off('pointerdown', this._onPointerDown);
      this._onPointerDown = null;
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
    const sfx = this.scene.sfx;
    if (sfx) sfx.muted = newMuted;
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
    this.medalPage = 0;
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

  _flipMedalPage(dir) {
    const perPage = 8;
    const totalPages = Math.max(1, Math.ceil(ACHIEVEMENTS.length / perPage));
    const newPage = this.medalPage + dir;
    if (newPage >= 0 && newPage < totalPages) {
      this.medalPage = newPage;
      this.scene.sfx.play('select');
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
      this.tabRects[i].setFillStyle(isActive ? 0x334488 : 0x1a2244);
      this.tabTexts[i].setColor(isActive ? '#ffffff' : '#7788aa');
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
    else if (this.activeTab === 6) this._renderKeys();
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
    if (s.achievements?.lord_dire_vanquished) {
      lines.push('', 'Title: Light Bringer');
    }
    // Phase 23 — Butterfly journal
    if (s.hasNet) {
      const bf = s.caughtButterflies || {};
      const total = Object.values(bf).reduce((a, b) => a + b, 0);
      const types = [
        bf.yellow ? `yellow:${bf.yellow}` : null,
        bf.green  ? `green:${bf.green}`   : null,
        bf.blue   ? `blue:${bf.blue}`     : null,
        bf.orange ? `orange:${bf.orange}` : null,
      ].filter(Boolean);
      lines.push('', `Butterflies: ${total}`);
      if (types.length > 0) lines.push(types.join('  '));
    }
    // Pet info
    if (s.pet && s.petType) {
      const aff = s.petAffection || 0;
      const hearts = Math.min(5, Math.floor(aff / 10));
      const emptyHearts = 5 - hearts;
      const tier = aff >= 50 ? 3 : aff >= 25 ? 2 : aff >= 10 ? 1 : 0;
      const petNames = { slime: 'Slimey', bat: 'Batty', mushroom: 'Spore', fairy: 'Glimmer' };
      const petName = petNames[s.petType] || s.petType;
      lines.push(``, `Pet: ${petName}  [Tier ${tier}]`, `Bond: ${'♥'.repeat(hearts)}${'♡'.repeat(emptyHearts)} (${aff}/50)`);
    }
    // Phase 29 — Cozy score
    if (s._calcCozyScore) {
      const cozy = s._calcCozyScore();
      const stars = '✦'.repeat(cozy) + '✧'.repeat(5 - cozy);
      lines.push('', `Home: ${stars}`);
    }
    // Places visited (unique maps entered)
    const _visitedMaps = s._visitedMaps || new Set();
    const _totalMaps = 40;
    lines.push('', `Maps visited: ${_visitedMaps.size}/${_totalMaps}`);
    // Kills & fish
    if (s._totalKills) lines.push(`Enemies defeated: ${s._totalKills}`);
    if (s._fishCount) lines.push(`Fish caught: ${s._fishCount}`);
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
        const matName = MATERIALS[k]?.name ?? k.replace(/_/g, ' ');
        equipLines.push(`${matName}: ${mats[k]}`);
      }
    }
    // Phase 23 — Seeds
    if (s.hasWateringCan) {
      const seeds = s.seeds || {};
      const seedEntries = Object.entries(seeds).filter(([, v]) => v > 0);
      if (seedEntries.length > 0) {
        equipLines.push('', 'Seeds:');
        seedEntries.forEach(([t, v]) => equipLines.push(`${t}: ${v}`));
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
      this.rightContent.setY(this.pageTop + 13);
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
    this.rightContent.setY(this.pageTop + 13);

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

    // Show tracked quest on right side
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
    this.rightContent.setText('W/S: select row\n\u2190\u2192: adjust volume\n\nA/D: switch tabs\n1-7: jump to tab');
  }

  _renderMedals() {
    const perPage = 8; // 4 left + 4 right per page
    const totalPages = Math.max(1, Math.ceil(ACHIEVEMENTS.length / perPage));
    const page = Math.min(this.medalPage || 0, totalPages - 1);
    const startIdx = page * perPage;
    const pageAchs = ACHIEVEMENTS.slice(startIdx, startIdx + perPage);

    const achievements = this.scene.achievements || {};
    const earned = ACHIEVEMENTS.filter(a => achievements[a.id]);

    const fmt = (ach) => {
      if (!ach) return '';
      const done = !!achievements[ach.id];
      const prefix = done ? '\u2713' : '\u25cb';
      return `${prefix} ${ach.label}\n  ${ach.desc}`;
    };

    const leftEntries = pageAchs.slice(0, 4);
    const rightEntries = pageAchs.slice(4, 8);

    this.leftTitle.setText('MEDALS');
    this.leftContent.setText(leftEntries.map(fmt).join('\n\n'));
    this.rightTitle.setText('');
    this.rightContent.setText(rightEntries.map(fmt).join('\n\n'));
    this.rightContent.setY(this.pageTop + 13);

    const total = earned.length;
    const pageLabel = totalPages > 1 ? `  W/S: page ${page + 1}/${totalPages}` : '';
    this.pageIndicator.setText(`${total}/${ACHIEVEMENTS.length} earned${pageLabel}`);
  }

  _renderKeys() {
    this.leftTitle.setText('MOVE / COMBAT');
    this.leftContent.setText(
      'WASD \u2014 Move\nSPACE \u2014 Attack\nE \u2014 Interact\nF \u2014 Cast Spell\nTAB \u2014 Cycle Spell\nQ \u2014 Pet ability\nSHIFT \u2014 Dodge roll\nJ \u2014 Adventure Journal\nZ \u2014 Dance emote'
    );
    this.rightTitle.setText('SYSTEM / UI');
    this.rightContent.setText(
      'ESC \u2014 Pause menu\nA/D \u2014 Prev/next tab\nW/S \u2014 Navigate item\n\u2190\u2192 \u2014 Adjust value\n1-7 \u2014 Jump to tab\nM \u2014 Map/Teleport'
    );
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
