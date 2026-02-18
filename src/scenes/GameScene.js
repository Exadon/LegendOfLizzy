import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy, Slime } from '../entities/Enemy.js';
import { NPC } from '../entities/NPC.js';
import { Chicken } from '../entities/Chicken.js';
import { QuestManager, QUESTS } from '../systems/QuestManager.js';
import { SFX } from '../systems/SFX.js';
import { MAPS, OVERWORLD_MAP } from '../data/Maps.js';
import { MapOverlay } from '../ui/MapOverlay.js';
import { GameMenu } from '../ui/GameMenu.js';
import { SaveManager } from '../systems/SaveManager.js';
import { Inventory } from '../systems/Inventory.js';
import { Music } from '../systems/Music.js';
import { Unicorn } from '../entities/Unicorn.js';
import { Fairy } from '../entities/Fairy.js';
import { Bat } from '../entities/Bat.js';
import { Ghost } from '../entities/Ghost.js';
import { SkeletonKing } from '../entities/Boss.js';
import { Scorpion } from '../entities/Scorpion.js';
import { Pharaoh } from '../entities/Pharaoh.js';
import { OrcChief } from '../entities/OrcChief.js';
import { FishingMinigame } from '../ui/FishingMinigame.js';
import { EquipmentManager, EQUIPMENT } from '../systems/Equipment.js';
import { Chest } from '../entities/Chest.js';
import { Pet } from '../entities/Pet.js';

// Unified enemy reward table — used by both sword kills and magic kills
const ENEMY_REWARDS = {
  skeleton: { gold: 5, xp: 15 },
  slime: { gold: 2, xp: 8 },
  bat: { gold: 3, xp: 10 },
  ghost: { gold: 8, xp: 25 },
  scorpion: { gold: 6, xp: 18 },
  goblin: { gold: 4, xp: 12 },
  orc: { gold: 7, xp: 20 },
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.mapData = data.mapData || OVERWORLD_MAP;
    this.savedQuestState = data.questState || null;
    this.savedPlayerHealth = data.playerHealth || null;
    this.savedGold = data.gold || 0;
    this.savedXP = data.xp || 0;
    this.savedLevel = data.level || 1;
    this.savedInventory = data.inventory || null;
    this.savedDayTime = data.dayTime ?? null;
    this.savedEquipment = data.equipment || null;
    this.paulRescued = data.paulRescued || false;
    this.savedOpenedChests = data.openedChests || [];
    this.savedTrackedQuestId = data.trackedQuestId || null;
    this.savedBestiary = data.bestiary || {};
    this.savedTimedQuestId = data.timedQuestId || null;
    this.savedTimedRemaining = data.timedRemaining || 0;
    this.savedTutorialShown = data.tutorialShown || false;
    this.savedEscortActive = data.escortActive || false;
    this.savedEscortNpcId = data.escortNpcId || null;
    this.savedPlayerAttackBonus = data.playerAttackBonus || 0;
    this.savedUnlockedTeleports = data.unlockedTeleports || [];
    // Prevent instant door re-trigger when spawning near an exit
    this._doorCooldown = !!data.mapData;
  }

  create() {
    const map = this.mapData;
    this.worldWidth = map.width * map.tileSize;
    this.worldHeight = map.height * map.tileSize;
    this.isOverworld = map.name === 'overworld';
    this.isCave = map.isDark || false;
    this.isTemple = map.floorTile === 'sand-floor';
    this.isForest = map.name === 'forest' || map.name === 'forest_boss';
    this.isTown2 = map.name === 'town2';

    // SFX
    this.sfx = this.registry.get('sfx') || new SFX();

    // Music - persist across map transitions via registry
    if (!this.registry.get('music')) {
      this.registry.set('music', new Music());
    }
    this.music = this.registry.get('music');
    // Apply saved mute preference to music
    if (localStorage.getItem('lizzy-muted') === 'true' && this.music && this.music.masterGain && this.music.ctx) {
      this.music.masterGain.gain.setValueAtTime(0, this.music.ctx.currentTime);
    }

    // Quest system
    this.questManager = new QuestManager();
    for (const quest of Object.values(QUESTS)) {
      this.questManager.addQuest(quest);
    }
    if (this.savedQuestState) {
      this.questManager.restoreState(this.savedQuestState);
    }

    this.buildWorld(map);

    // Player
    const spawn = map.playerSpawn || { x: 200, y: 128 };
    this.player = new Player(this, spawn.x, spawn.y);
    if (this.savedPlayerHealth !== null) {
      this.player.health = this.savedPlayerHealth;
    }

    // NPCs
    this.npcs = this.add.group();
    if (this.isOverworld) {
      this.spawnNPCs();
    }

    // Interior NPCs
    if (map.interiorNPCs) {
      this.spawnInteriorNPCs(map.interiorNPCs);
    }

    // Town2 NPCs
    if (this.isTown2) {
      this.spawnTown2NPCs();
    }

    // Enemies
    this.enemies = this.add.group();
    if (this.isOverworld) {
      this.spawnEnemies();
    }

    // Cave/dungeon/forest enemies from map data
    if (map.enemies) {
      this.spawnMapEnemies(map.enemies);
    }

    // Boss (boss room only)
    this.boss = null;
    if (map.hasBoss) {
      this.spawnBoss(map.bossType);
      this.time.delayedCall(800, () => {
        const bossNames = { pharaoh: 'The Pharaoh', skeleton_king: 'The Skeleton King', orc_chief: 'The Orc Chief' };
        const bossName = bossNames[map.bossType] || 'A powerful foe';
        this.showNotification(`${bossName} awaits...`);
        this.cameras.main.shake(200, 0.008);
      });
    }

    // Chickens (overworld only)
    this.chickens = this.add.group();
    if (this.isOverworld) {
      this.spawnChickens();
    }

    // Treasure chests
    this.chests = this.add.group();
    this.spawnChests();

    // Unicorns (overworld only)
    this.unicorns = this.add.group();
    if (this.isOverworld) {
      this.spawnUnicorns();
    }

    // Fairies (overworld only)
    this.fairies = this.add.group();
    if (this.isOverworld) {
      this.spawnFairies();
    }

    // Ghosts (overworld only, appear at night)
    this.ghosts = this.add.group();
    if (this.isOverworld) {
      this.spawnGhosts();
    }

    // Interaction key
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Map and quest book keys
    this.mapKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.petBarkKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.questKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Menu key
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.trackedQuestId = this.savedTrackedQuestId || null;

    // Magic attack key
    this.magicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.magicProjectiles = this.add.group();

    // Spell system: Fireball (lv1), Ice Bolt (lv3), Heal (lv5)
    this.spells = [
      { name: 'Fireball', color: 0xff6622, manaCost: 3, damage: 3, lifetime: 600, minLevel: 1 },
      { name: 'Ice Bolt', color: 0x44aaff, manaCost: 4, damage: 2, lifetime: 1000, minLevel: 3, slow: true },
      { name: 'Heal', color: 0x44ff44, manaCost: 7, healAmount: 2, cooldown: 3000, minLevel: 5, isHeal: true },
    ];
    this.currentSpellIndex = 0;
    this._healCooldown = 0;
    this._spellCooldown = 0;

    // Inventory hotbar keys
    this.itemKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ];

    // Collisions
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.npcs);
    this.physics.add.collider(this.npcs, this.obstacles);
    this.physics.add.collider(this.npcs, this.npcs);

    this.physics.add.overlap(
      this.player.swordHitbox,
      this.enemies,
      this.handleSwordHit,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyContact,
      null,
      this
    );

    if (this.isOverworld) {
      this.physics.add.overlap(
        this.player,
        this.chickens,
        this.handleChickenCollect,
        null,
        this
      );
    }

    // Unicorn healing overlap
    if (this.isOverworld) {
      this.physics.add.overlap(this.player, this.unicorns, this.handleUnicornContact, null, this);
    }

    // Fairy buff overlap
    if (this.isOverworld) {
      this.physics.add.overlap(this.player, this.fairies, this.handleFairyContact, null, this);
    }

    // Ghost combat
    if (this.isOverworld) {
      this.physics.add.overlap(this.player.swordHitbox, this.ghosts, this.handleSwordHit, null, this);
      this.physics.add.overlap(this.player, this.ghosts, this.handleEnemyContact, null, this);
    }

    if (this.doorZones) {
      this.physics.add.overlap(
        this.player,
        this.doorZones,
        this.handleDoor,
        null,
        this
      );
    }

    // Clear door cooldown after player has moved away from spawn
    if (this._doorCooldown) {
      this.time.delayedCall(800, () => { this._doorCooldown = false; });
    }

    // Pond visit overlap (set up here because player must exist)
    if (this.pondVisitZone) {
      this.physics.add.overlap(this.player, this.pondVisitZone, () => {
        if (this._pondVisited) return;
        const quest = this.questManager.getQuest('explore_pond');
        if (!quest || quest.state !== 'active') return;
        this._pondVisited = true;
        this.questManager.trackEvent('visit', { target: 'pond' });
        this.updateQuestTracker();
        this.showNotification('Discovered: The Pond');
      });
    }

    // Camera — viewport below the 38px HUD bar
    this.cameras.main.setViewport(0, 38, 320, 202);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Dialogue state
    this.inDialogue = false;
    this.dialogueLines = [];
    this.dialogueIndex = 0;
    this.dialogueCallback = null;
    this.createDialogueUI();

    // Quest tracker UI (below inventory hotbar in top-right)
    this.questTrackerText = this.add.text(this.cameras.main.width - 4, 4, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(9000);
    this.updateQuestTracker();

    // Loot drops group
    this.lootDrops = this.add.group();

    // Hit-freeze state
    this._inHitFreeze = false;
    this._fairyAttackBuff = false;

    // Bestiary (enemy kill tracking)
    this.bestiary = this.savedBestiary || {};

    // Escort quest state
    this._escortNPC = null;
    this._escortActive = false;

    // Restore escort across map transitions
    if (this.savedEscortActive && this.savedEscortNpcId && this.isOverworld) {
      const escortQuest = this.questManager.getQuest('escort_chloe');
      if (escortQuest && escortQuest.state === 'active') {
        // Respawn the escort NPC near the player
        this.time.delayedCall(100, () => {
          this.npcs.getChildren().forEach((npc) => {
            if (npc.npcId === this.savedEscortNpcId) {
              npc.setPosition(this.player.x + 16, this.player.y + 16);
              this._escortNPC = npc;
              this._escortActive = true;
              npc._isEscorted = true;
            }
          });
        });
      }
    }

    // Timed quest state — restore across map transitions
    this._timedQuestId = this.savedTimedQuestId || null;
    this._timedRemaining = this.savedTimedRemaining || 0;
    this._timedText = null;
    if (this._timedQuestId && this._timedRemaining > 0) {
      this._timedText = this.add.text(this.cameras.main.width / 2, 14, '', {
        fontSize: '12px', fontFamily: 'Arial, sans-serif',
        color: '#ff4444', stroke: '#000000', strokeThickness: 3,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9500);
    }

    // Fetch quest: spawn collectible if active and in correct map
    this._spawnFetchItems();

    // Gold and XP
    this.gold = this.savedGold || 0;
    this.xp = this.savedXP || 0;
    this.level = this.savedLevel || 1;
    this.xpToNext = this.level * 100;
    this.playerAttackBonus = this.savedPlayerAttackBonus || 0;

    // Inventory
    this.inventory = new Inventory();
    if (this.savedInventory) {
      this.inventory.restoreState(this.savedInventory);
    } else if (!this.savedQuestState) {
      // New game: start with 1 health potion
      this.inventory.addItem('health_potion', 1);
    }

    // Equipment
    this.equipment = new EquipmentManager();
    if (this.savedEquipment) {
      this.equipment.restoreState(this.savedEquipment);
    }
    // Apply armor HP bonus
    const hpBonus = this.equipment.getHPBonus();
    if (hpBonus > 0) {
      this.player.maxHealth += hpBonus;
      if (this.savedPlayerHealth === null) {
        this.player.health = this.player.maxHealth;
      }
    }

    // Teleport system
    this.unlockedTeleports = this.savedUnlockedTeleports || [];
    this._spawnTeleportStone();

    // Map overlay and game menu (unified pause + quests)
    this.mapOverlay = new MapOverlay(this, this.unlockedTeleports);
    this.gameMenu = new GameMenu(this);
    this.overlayOpen = false;

    // Pet companion (unlocked after defeating Skeleton King)
    this.pet = null;
    const caveQuest = this.questManager.getQuest('clear_cave');
    if (caveQuest && caveQuest.state === 'completed') {
      const spawn = this.mapData.playerSpawn || { x: 200, y: 128 };
      this.pet = new Pet(this, spawn.x + 16, spawn.y + 16);
    }

    // Fishing minigame
    this.fishingGame = new FishingMinigame(this);
    this._nearPond = false;

    // Auto-save every 30 seconds
    this.time.addEvent({
      delay: 30000,
      callback: () => { SaveManager.save(this); this.events.emit('auto-saved'); },
      loop: true,
    });

    // Day/night cycle (overworld only)
    // dayTime: 0-1 where 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    this.dayTime = this.savedDayTime ?? 0.35; // start in morning
    this.daySpeed = 0.008; // full cycle ~125 seconds
    this.isNight = false;
    if (this.isOverworld) {
      this.dayOverlay = this.add.rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000033, 0
      ).setScrollFactor(0).setDepth(8000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    // Boss defeat auto-save
    this.events.on('boss-defeated', () => { SaveManager.save(this); });

    // Paul the Wizard rescue on death
    this.events.on('player-dying', () => this._paulRescue());
    this._paulRescueActive = false;

    // Fade in (white if rescued by Paul)
    if (this.paulRescued) {
      this.cameras.main.fadeIn(600, 255, 255, 255);
      this.time.delayedCall(800, () => {
        this.showNotification('Paul the Wizard saved you! (-10 gold)');
      });
    } else {
      this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    // Start music for this map — map-based track selection
    const mapName = map.name;
    const trackMap = {
      overworld: 'overworld',
      cave: 'cave',
      boss_room: 'boss',
      desert_temple: 'desert',
      pharaoh_chamber: 'boss',
      forest: 'cave',
      forest_boss: 'boss',
      town2: 'interior',
    };
    const trackName = trackMap[mapName] || (mapName.includes('interior') ? 'interior' : 'interior');
    this.time.delayedCall(500, () => {
      this.music.crossfade(trackName, this.sfx);
    });

    // Cave darkness fog-of-war
    this.darknessRT = null;
    if (this.isCave) {
      this.darknessRT = this.add.renderTexture(0, 0, 320, 202);
      this.darknessRT.setScrollFactor(0);
      this.darknessRT.setDepth(7999); // above world, below UI
    }

    // Launch UI scene for hearts/game over only
    if (!this.scene.isActive('UI')) {
      this.scene.launch('UI');
    }

    // Controls tutorial on first game
    this.tutorialShown = this.savedTutorialShown || false;
    if (!this.tutorialShown && !this.savedQuestState) {
      this._showTutorial();
    }

    // Emit state after UI is launched so displays render correctly
    this.time.delayedCall(0, () => {
      if (this.savedPlayerHealth !== null) {
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }
      this.events.emit('gold-changed', this.gold);
      this.events.emit('xp-changed', this.xp, this.xpToNext, this.level);
      this.events.emit('inventory-changed', this.inventory.slots);
    });
  }

  // --- Dialogue UI ---
  createDialogueUI() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const boxH = 54;
    const boxY = h - boxH;

    this.dialogueContainer = this.add.container(0, 0)
      .setScrollFactor(0).setDepth(10000).setVisible(false);

    // Full-width dark background
    const bg = this.add.rectangle(w / 2, boxY + boxH / 2, w, boxH, 0x1a1020, 0.92);
    this.dialogueContainer.add(bg);

    // Top border
    const border = this.add.rectangle(w / 2, boxY, w, 1, 0x8b6d4a);
    this.dialogueContainer.add(border);

    // Portrait frame
    const portraitSize = 28;
    const portraitX = 4 + portraitSize / 2;
    const portraitY = boxY + boxH / 2;
    this.dialoguePortraitBg = this.add.rectangle(portraitX, portraitY, portraitSize + 4, portraitSize + 4, 0x3d2510);
    this.dialoguePortraitBg.setVisible(false);
    this.dialogueContainer.add(this.dialoguePortraitBg);
    this.dialoguePortrait = this.add.image(portraitX, portraitY, '__DEFAULT');
    this.dialoguePortrait.setDisplaySize(portraitSize, portraitSize);
    this.dialoguePortrait.setVisible(false);
    this.dialogueContainer.add(this.dialoguePortrait);

    // Text offset when portrait is shown
    const textX = 40;

    // Speaker name
    this.dialogueSpeaker = this.add.text(textX, boxY + 4, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd00',
      fontStyle: 'bold',
    });
    this.dialogueContainer.add(this.dialogueSpeaker);

    // Dialogue text
    this.dialogueText = this.add.text(textX, boxY + 18, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8e0d0',
      wordWrap: { width: w - textX - 16 },
      lineSpacing: 3,
    });
    this.dialogueContainer.add(this.dialogueText);

    // Advance arrow
    const arrow = this.add.text(w - 10, boxY + boxH - 6, '\u25BC', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b6d4a',
    }).setOrigin(1, 1);
    this.dialogueContainer.add(arrow);

    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.2 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  showDialogue(lines, callback, speakerName, portraitKey) {
    this.inDialogue = true;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueCallback = callback;
    this.dialogueSpeaker.setText(speakerName || '');
    this.dialogueContainer.setVisible(true);
    this.player.setVelocity(0, 0);
    this.physics.pause();
    if (this.boss && this.boss.pauseTimers) this.boss.pauseTimers();

    // Show portrait if available
    const texKey = portraitKey ? `portrait-${portraitKey}` : null;
    if (texKey && this.textures.exists(texKey)) {
      this.dialoguePortrait.setTexture(texKey);
      this.dialoguePortrait.setVisible(true);
      this.dialoguePortraitBg.setVisible(true);
    } else {
      this.dialoguePortrait.setVisible(false);
      this.dialoguePortraitBg.setVisible(false);
    }

    // Start typewriter effect for first line
    this._startTypewriter(lines[0]);
  }

  _startTypewriter(fullText) {
    this._typewriterFull = fullText;
    this._typewriterIndex = 0;
    this._typewriterDone = false;
    this.dialogueText.setText('');

    // Clear previous timer if any
    if (this._typewriterTimer) {
      this._typewriterTimer.remove();
      this._typewriterTimer = null;
    }

    let charCount = 0;
    this._typewriterTimer = this.time.addEvent({
      delay: 25,
      callback: () => {
        if (this._typewriterDone) return;
        this._typewriterIndex++;
        this.dialogueText.setText(fullText.substring(0, this._typewriterIndex));
        charCount++;
        // Blip SFX every 3rd character
        if (charCount % 3 === 0) this.sfx.play('dialogue');
        if (this._typewriterIndex >= fullText.length) {
          this._typewriterDone = true;
          if (this._typewriterTimer) {
            this._typewriterTimer.remove();
            this._typewriterTimer = null;
          }
        }
      },
      loop: true,
    });
  }

  _skipTypewriter() {
    if (this._typewriterTimer) {
      this._typewriterTimer.remove();
      this._typewriterTimer = null;
    }
    this._typewriterDone = true;
    this.dialogueText.setText(this._typewriterFull);
  }

  advanceDialogue() {
    // If typewriter is still running, skip to full text first
    if (!this._typewriterDone) {
      this._skipTypewriter();
      return;
    }

    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueLines.length) {
      this._startTypewriter(this.dialogueLines[this.dialogueIndex]);
    } else {
      this.closeDialogue();
    }
  }

  closeDialogue() {
    // Clean up typewriter
    if (this._typewriterTimer) {
      this._typewriterTimer.remove();
      this._typewriterTimer = null;
    }
    this._typewriterDone = true;

    this.dialogueContainer.setVisible(false);
    this.inDialogue = false;
    // Resume physics unless ESC menu is open
    if (!this.gameMenu || !this.gameMenu.visible) {
      this.physics.resume();
      if (this.boss && this.boss.resumeTimers) this.boss.resumeTimers();
    }
    if (this.dialogueCallback) {
      this.dialogueCallback();
      this.dialogueCallback = null;
    }
  }

  // --- World building ---
  buildWorld(map) {
    const ts = map.tileSize;

    // Floor rendering
    if (map.floorTile === 'cave-floor') {
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          this.add.image(col * ts, row * ts, 'cave-floor').setOrigin(0, 0);
        }
      }
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x3a2a1a)
                .setDepth(0);
            }
          }
        }
      }
    } else if (map.floorTile === 'sand-floor') {
      // Desert temple sand floor
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const shade = ((row + col) % 2 === 0) ? 0xddcc88 : 0xd4c080;
          this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, shade).setDepth(0);
        }
      }
      // Sandstone walls
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x8b7355).setDepth(0);
            }
          }
        }
      }
    } else if (map.floorTile === 'forest-floor') {
      // Outdoor forest — grass base with dark green tint
      const grassTex = this.textures.get('grass-middle');
      const gw = grassTex.getSourceImage().width;
      const gh = grassTex.getSourceImage().height;
      for (let x = 0; x < this.worldWidth; x += gw) {
        for (let y = 0; y < this.worldHeight; y += gh) {
          this.add.image(x, y, 'grass-middle').setOrigin(0, 0);
        }
      }
      // Dark green tint overlay for forest feel
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          if (!map.layers.collision || map.layers.collision[row]?.[col] !== 1) {
            this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x225522, 0.3).setDepth(0);
          }
        }
      }
      // Dense tree canopy fill for collision tiles + oak-tree sprites
      if (map.layers.collision) {
        // Base: dark green fill for all collision tiles (forest canopy from above)
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x1a4d1a).setDepth(0);
            }
          }
        }
        // Place oak-tree sprites at edges of tree clusters (where collision meets walkable)
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] !== 1) continue;
            // Check if this tile borders a walkable tile (edge of cluster)
            const neighbors = [
              map.layers.collision[row - 1]?.[col],
              map.layers.collision[row + 1]?.[col],
              map.layers.collision[row]?.[col - 1],
              map.layers.collision[row]?.[col + 1],
            ];
            const isEdge = neighbors.some(n => n === 0 || n === undefined);
            // Place tree sprites on edge tiles, spaced out
            if (isEdge && (row + col) % 3 === 0) {
              const tx = col * ts + ts / 2;
              const ty = row * ts + ts / 2;
              const tree = this.add.image(tx, ty - 8, 'oak-tree-small');
              tree.setScale(0.5 + Math.random() * 0.2);
              tree.setDepth(ty + 10);
              tree.setTint(0xccddcc);
            }
            // Scatter a few interior trees too for depth
            if (!isEdge && (row * 7 + col * 13) % 11 === 0) {
              const tx = col * ts + ts / 2;
              const ty = row * ts + ts / 2;
              const tree = this.add.image(tx, ty - 6, 'oak-tree-small');
              tree.setScale(0.4 + Math.random() * 0.15);
              tree.setDepth(ty + 5);
              tree.setTint(0xbbccbb);
            }
          }
        }
      }
    } else if (map.floorTile === 'wood-floor') {
      // Interior wood floor
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          this.add.image(col * ts, row * ts, 'wood-floor', 0).setOrigin(0, 0);
        }
      }
      // Draw walls using colored rectangles
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x5c3a1e)
                .setDepth(0);
            }
          }
        }
      }
    } else if (map.layers.ground) {
      const tileTextures = ['grass-middle', 'water-middle', 'path-middle'];
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const tileId = map.layers.ground[row]?.[col] ?? 0;
          const texKey = tileTextures[tileId] || 'grass-middle';
          this.add.image(col * ts, row * ts, texKey).setOrigin(0, 0);
        }
      }
    } else {
      const grassTex = this.textures.get('grass-middle');
      const gw = grassTex.getSourceImage().width;
      const gh = grassTex.getSourceImage().height;
      for (let x = 0; x < this.worldWidth; x += gw) {
        for (let y = 0; y < this.worldHeight; y += gh) {
          this.add.image(x, y, 'grass-middle').setOrigin(0, 0);
        }
      }
    }

    this.obstacles = this.physics.add.staticGroup();

    if (map.layers.collision) {
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          if (map.layers.collision[row]?.[col] === 1) {
            const block = this.obstacles.create(col * ts + ts / 2, row * ts + ts / 2, null);
            block.setVisible(false);
            block.body.setSize(ts, ts);
          }
        }
      }
    }

    // Object configs
    const objectConfigs = {
      'oak-tree': { texture: 'oak-tree', bodyW: 20, bodyH: 12 },
      'oak-tree-small': { texture: 'oak-tree-small', bodyW: 14, bodyH: 8 },
      'house-wood': { texture: 'house-wood', bodyW: -8, bodyH: 20 },
      'chest': { texture: 'chest', bodyW: 14, bodyH: 8 },
    };

    for (const obj of (map.objects || [])) {
      const cfg = objectConfigs[obj.type];
      if (!cfg) continue;

      const sprite = this.add.image(obj.x, obj.y, cfg.texture)
        .setOrigin(0.5, 1.0)
        .setDepth(obj.y);

      const bw = cfg.bodyW < 0 ? sprite.width + cfg.bodyW : cfg.bodyW;
      const zone = this.add.zone(obj.x, obj.y - cfg.bodyH / 2, bw, cfg.bodyH);
      this.obstacles.add(zone);
    }

    // Environmental decorations
    if (this.isOverworld || this.isForest || this.isTown2) {
      this.decorateWorld(map);
    }

    // Interior furniture
    if (map.furniture) {
      this.decorateInterior(map);
    }

    // Door triggers
    this.doorZones = this.physics.add.staticGroup();
    for (const door of (map.doors || [])) {
      const zone = this.add.zone(
        door.x + door.width / 2,
        door.y + door.height / 2,
        door.width,
        door.height
      );
      this.physics.add.existing(zone, true);
      zone.doorData = door;
      this.doorZones.add(zone);
    }
  }

  decorateInterior(map) {
    for (const item of (map.furniture || [])) {
      if (item.type === 'bed') {
        // Simple colored rectangles for furniture
        const bed = this.add.rectangle(item.x, item.y, 24, 36, 0x884422);
        bed.setDepth(item.y);
        const pillow = this.add.rectangle(item.x, item.y - 12, 18, 8, 0xdddddd);
        pillow.setDepth(item.y + 1);
        const blanket = this.add.rectangle(item.x, item.y + 6, 20, 16, 0x4466aa);
        blanket.setDepth(item.y + 1);
        // Collision
        const zone = this.add.zone(item.x, item.y, 24, 36);
        this.obstacles.add(zone);
        // Mark as interactable bed if in house_interior
        if (map.name === 'house_interior') {
          zone.isBed = true;
        }
      } else if (item.type === 'counter') {
        // Shop/inn counter
        const counter = this.add.rectangle(item.x, item.y, 64, 14, 0x774422);
        counter.setDepth(item.y);
        const top = this.add.rectangle(item.x, item.y - 3, 66, 10, 0x996633);
        top.setDepth(item.y + 1);
        const zone = this.add.zone(item.x, item.y, 64, 14);
        this.obstacles.add(zone);
      } else if (item.type === 'table') {
        const table = this.add.rectangle(item.x, item.y, 28, 20, 0x996633);
        table.setDepth(item.y);
        const top = this.add.rectangle(item.x, item.y - 2, 30, 16, 0xaa7744);
        top.setDepth(item.y + 1);
        const zone = this.add.zone(item.x, item.y, 28, 20);
        this.obstacles.add(zone);
      } else if (item.type === 'bookshelf') {
        const shelf = this.add.rectangle(item.x, item.y, 20, 28, 0x553311);
        shelf.setDepth(item.y);
        // Book rows
        this.add.rectangle(item.x, item.y - 6, 16, 6, 0x884422).setDepth(item.y + 1);
        this.add.rectangle(item.x, item.y + 2, 16, 6, 0x446688).setDepth(item.y + 1);
        this.add.rectangle(item.x, item.y + 10, 16, 6, 0x668844).setDepth(item.y + 1);
        const zone = this.add.zone(item.x, item.y, 20, 28);
        this.obstacles.add(zone);
        // Interactable bookshelf: lore text on E
        if (item.lore !== false) {
          zone.bookshelf = true;
        }
      } else if (item.type === 'barrel') {
        const body = this.add.circle(item.x, item.y, 7, 0x885533);
        body.setDepth(item.y);
        this.add.circle(item.x, item.y, 5, 0x996644).setDepth(item.y + 1);
        this.add.ellipse(item.x, item.y - 3, 12, 3, 0xaa7755).setDepth(item.y + 2);
        const zone = this.add.zone(item.x, item.y, 14, 14);
        this.obstacles.add(zone);
      } else if (item.type === 'shelf') {
        const shelf = this.add.rectangle(item.x, item.y, 18, 24, 0x664422);
        shelf.setDepth(item.y);
        this.add.rectangle(item.x, item.y - 4, 14, 4, 0xddaa44).setDepth(item.y + 1);
        this.add.rectangle(item.x, item.y + 4, 14, 4, 0xcc8833).setDepth(item.y + 1);
        const zone = this.add.zone(item.x, item.y, 18, 24);
        this.obstacles.add(zone);
      }
    }
  }

  spawnNPCs() {
    // Farmer Bob - skeleton quest + delivery quest
    const bob = new NPC(this, 460, 120, 'farmer-bob', {
      id: 'farmer_bob',
      name: 'Farmer Bob',
      questId: 'skeleton_hunt',
      idleAnim: 'npc-bob-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-bob-walk-down', right: 'npc-bob-walk-right', up: 'npc-bob-walk-up' },
      schedule: [
        { time: 0, x: 500, y: 85 },    // night: near house
        { time: 0.3, x: 460, y: 120 },  // morning: fields
        { time: 0.65, x: 480, y: 100 }, // afternoon: near house
        { time: 0.8, x: 500, y: 85 },   // evening: home
      ],
    });
    this.npcs.add(bob);

    // Farmer Buba - chicken quest
    const buba = new NPC(this, 180, 180, 'farmer-buba', {
      id: 'farmer_buba',
      name: 'Farmer Buba',
      questId: 'chicken_roundup',
      idleAnim: 'npc-buba-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 35,
      wanderAnims: { down: 'npc-buba-walk-down', right: 'npc-buba-walk-right', up: 'npc-buba-walk-up' },
      schedule: [
        { time: 0, x: 200, y: 160 },    // night: near home
        { time: 0.3, x: 180, y: 180 },  // morning: fields
        { time: 0.7, x: 200, y: 160 },  // evening: home
      ],
    });
    this.npcs.add(buba);

    // Chef Chloe - delivery recipient, wanders near pond
    const chloe = new NPC(this, 520, 320, 'chef-chloe', {
      id: 'chef_chloe',
      name: 'Chef Chloe',
      idleAnim: 'npc-chloe-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-chloe-walk-down', right: 'npc-chloe-walk-right', up: 'npc-chloe-walk-up' },
      dialogueLines: ['I love cooking with\nfresh ingredients!', 'The pond has the best\nwater for my recipes!'],
      schedule: [
        { time: 0, x: 300, y: 480 },    // night: near shop
        { time: 0.3, x: 520, y: 320 },  // morning: by pond
        { time: 0.65, x: 400, y: 400 }, // afternoon: center
        { time: 0.8, x: 300, y: 480 },  // evening: shop
      ],
    });
    this.npcs.add(chloe);

    // Fisherman Fin - pond quest
    const fin = new NPC(this, 580, 310, 'fisherman-fin', {
      id: 'fisherman_fin',
      name: 'Fisherman Fin',
      questId: 'explore_pond',
      idleAnim: 'npc-fin-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 25,
      wanderAnims: { down: 'npc-fin-walk-down', right: 'npc-fin-walk-right', up: 'npc-fin-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 265 },    // night: inn
        { time: 0.25, x: 580, y: 310 },  // dawn: dock by pond
        { time: 0.7, x: 720, y: 265 },   // evening: inn
      ],
    });
    this.npcs.add(fin);

    // Lumberjack Jack - slime quest, wanders in woods
    const jack = new NPC(this, 350, 350, 'lumberjack-jack', {
      id: 'lumberjack_jack',
      name: 'Lumberjack Jack',
      questId: 'slime_cleanup',
      idleAnim: 'npc-jack-idle-down',
      wanders: true,
      speed: 14,
      wanderRadius: 50,
      wanderAnims: { down: 'npc-jack-walk-down', right: 'npc-jack-walk-right', up: 'npc-jack-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 265 },    // night: near inn
        { time: 0.3, x: 350, y: 350 },  // morning: forest
        { time: 0.5, x: 200, y: 300 },  // midday: west woods
        { time: 0.75, x: 720, y: 265 }, // dusk: inn
      ],
    });
    this.npcs.add(jack);

    // Miner Mike - cave boss quest, wanders east
    const mike = new NPC(this, 680, 250, 'miner-mike', {
      id: 'miner_mike',
      name: 'Miner Mike',
      questId: 'clear_cave',
      idleAnim: 'npc-mike-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 40,
      wanderAnims: { down: 'npc-mike-walk-down', right: 'npc-mike-walk-right', up: 'npc-mike-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 265 },    // night: inn
        { time: 0.25, x: 80, y: 100 },   // dawn: near mine entrance
        { time: 0.5, x: 680, y: 250 },   // midday: fields
        { time: 0.8, x: 720, y: 265 },   // evening: inn
      ],
    });
    this.npcs.add(mike);

    // Ranger Reed - forest dungeon quest chain: scout_forest → clear_forest
    const reed = new NPC(this, 120, 400, 'lumberjack-jack', {
      id: 'ranger_reed',
      name: 'Ranger Reed',
      questId: 'scout_forest',
      idleAnim: 'npc-jack-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-jack-walk-down', right: 'npc-jack-walk-right', up: 'npc-jack-walk-up' },
      schedule: [
        { time: 0, x: 120, y: 400 },
        { time: 0.3, x: 100, y: 420 },
        { time: 0.7, x: 120, y: 400 },
      ],
    });
    reed.setTint(0x88bb88); // Green tint to distinguish from Jack
    this.npcs.add(reed);
  }

  spawnInteriorNPCs(npcDefs) {
    for (const def of npcDefs) {
      // Build idle anim name from texture
      const texBase = def.texture.replace('farmer-', 'npc-').replace('chef-', 'npc-').replace('fisherman-', 'npc-').replace('lumberjack-', 'npc-').replace('miner-', 'npc-');
      const shortName = def.texture.split('-')[1] || def.texture;
      const idleAnim = `npc-${shortName}-idle-down`;

      const npc = new NPC(this, def.x, def.y, def.texture, {
        id: def.id,
        name: def.name,
        idleAnim: idleAnim,
        dialogueLines: def.role === 'shop'
          ? ['Welcome to my shop!\nPress 1-3 to buy!']
          : ['Welcome to the inn!\nRest and recover!'],
      });
      npc.role = def.role;
      this.npcs.add(npc);
    }
  }

  spawnEnemies() {
    // Store spawn data for respawning
    this.enemySpawns = [];
    this.respawnQueue = [];

    const skeletonPositions = [
      { x: 400, y: 300 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 650, y: 350 },
      { x: 350, y: 500 },
      { x: 100, y: 250 },
      { x: 700, y: 450 },
      // New enemies in expanded area
      { x: 850, y: 350 },
      { x: 900, y: 500 },
      { x: 500, y: 650 },
    ];
    for (const pos of skeletonPositions) {
      this.enemySpawns.push({ ...pos, type: 'skeleton' });
      this.spawnSkeleton(pos.x, pos.y);
    }

    const slimePositions = [
      { x: 300, y: 350 },
      { x: 450, y: 400 },
      { x: 150, y: 200 },
      { x: 650, y: 450 },
      { x: 750, y: 600 },
    ];
    for (const pos of slimePositions) {
      this.enemySpawns.push({ ...pos, type: 'slime' });
      this.spawnSlime(pos.x, pos.y);
    }

    // Goblins near forest entrance
    const goblinPositions = [
      { x: 60, y: 380 },
      { x: 120, y: 440 },
      { x: 140, y: 380 },
    ];
    for (const pos of goblinPositions) {
      this.enemySpawns.push({ ...pos, type: 'goblin' });
      this.spawnGoblin(pos.x, pos.y);
    }
  }

  spawnSkeleton(x, y) {
    const skel = new Enemy(this, x, y, 'skeleton', {
      health: 3,
      speed: 35,
      idleAnim: 'skeleton-idle-down',
      enemyType: 'skeleton',
    });
    skel.spawnX = x;
    skel.spawnY = y;
    this.enemies.add(skel);
    return skel;
  }

  spawnSlime(x, y) {
    const slime = new Slime(this, x, y);
    slime.spawnX = x;
    slime.spawnY = y;
    this.enemies.add(slime);
    return slime;
  }

  queueRespawn(spawnData) {
    this.respawnQueue.push({
      ...spawnData,
      timer: 60000, // 60 seconds
    });
  }

  spawnMapEnemies(enemyList) {
    for (const e of enemyList) {
      if (e.type === 'bat') {
        const bat = new Bat(this, e.x, e.y);
        this.enemies.add(bat);
      } else if (e.type === 'skeleton') {
        this.spawnSkeleton(e.x, e.y);
      } else if (e.type === 'slime') {
        this.spawnSlime(e.x, e.y);
      } else if (e.type === 'scorpion') {
        this.spawnScorpion(e.x, e.y);
      } else if (e.type === 'goblin') {
        this.spawnGoblin(e.x, e.y);
      } else if (e.type === 'orc') {
        this.spawnOrc(e.x, e.y);
      }
    }
  }

  spawnBoss(bossType) {
    const cx = this.worldWidth / 2;
    const cy = this.worldHeight * 0.35;
    if (bossType === 'pharaoh') {
      this.boss = new Pharaoh(this, cx, cy);
    } else if (bossType === 'orc_chief') {
      this.boss = new OrcChief(this, cx, cy);
    } else {
      this.boss = new SkeletonKing(this, cx, cy);
    }
    this.enemies.add(this.boss);
  }

  spawnScorpion(x, y) {
    const scorpion = new Scorpion(this, x, y);
    this.enemies.add(scorpion);
    return scorpion;
  }

  spawnGoblin(x, y) {
    const goblin = new Enemy(this, x, y, 'goblin-thief', {
      health: 3,
      speed: 45,
      idleAnim: 'goblin-idle-down',
      enemyType: 'goblin',
      walkAnims: { right: 'goblin-walk-right', down: 'goblin-walk-down', up: 'goblin-walk-up' },
    });
    goblin.body.setSize(12, 12);
    goblin.body.setOffset(10, 16);
    this.enemies.add(goblin);
    return goblin;
  }

  spawnOrc(x, y) {
    const orc = new Enemy(this, x, y, 'orc-grunt', {
      health: 5,
      speed: 30,
      damage: 2,
      idleAnim: 'orc-idle-down',
      enemyType: 'orc',
      walkAnims: { right: 'orc-walk-right', down: 'orc-walk-down', up: 'orc-walk-up' },
    });
    orc.body.setSize(14, 14);
    orc.body.setOffset(9, 14);
    this.enemies.add(orc);
    return orc;
  }

  spawnChickens() {
    const chickenPositions = [
      { x: 220, y: 220 },
      { x: 160, y: 260 },
      { x: 280, y: 200 },
      { x: 240, y: 280 },
      { x: 130, y: 170 },
      { x: 300, y: 250 },
    ];
    for (const pos of chickenPositions) {
      const chicken = new Chicken(this, pos.x, pos.y);
      this.chickens.add(chicken);
    }
  }

  handleChickenCollect(player, chicken) {
    if (chicken.collected) return;

    const quest = this.questManager.getQuest('chicken_roundup');
    if (!quest || quest.state !== 'active') return;

    if (chicken.collect()) {
      this.sfx.play('chickenCollect');
      const updated = this.questManager.trackEvent('collect', { target: 'chicken' });
      if (updated) {
        this.updateQuestTracker();
      }
    }
  }

  spawnUnicorns() {
    // Rare — only 2 unicorns on the whole map
    const positions = [
      { x: 650, y: 500 },
      { x: 120, y: 380 },
    ];
    for (const pos of positions) {
      const unicorn = new Unicorn(this, pos.x, pos.y);
      this.unicorns.add(unicorn);
    }
  }

  spawnFairies() {
    // Near pond and forest areas
    const positions = [
      { x: 540, y: 280, color: 0 },
      { x: 580, y: 340, color: 1 },
      { x: 160, y: 290, color: 2 },
      { x: 400, y: 430, color: 3 },
      { x: 300, y: 160, color: 0 },
    ];
    for (const pos of positions) {
      const fairy = new Fairy(this, pos.x, pos.y, pos.color);
      this.fairies.add(fairy);
    }
  }

  spawnGhosts() {
    // Ghosts spawn positions — they only become active at night
    this._ghostSpawns = [
      { x: 350, y: 420 },
      { x: 550, y: 180 },
      { x: 680, y: 400 },
    ];
    this._ghostsSpawned = false;
  }

  spawnChests() {
    const isForest = this.mapData.name === 'forest';
    const positions = this.isOverworld
      ? [
          { x: 440, y: 480 }, { x: 720, y: 140 }, { x: 100, y: 420 },
          { x: 620, y: 500 }, { x: 280, y: 100 },
        ]
      : this.isCave
      ? [{ x: 240, y: 100 }, { x: 60, y: 180 }]
      : this.isTemple
      ? [{ x: 60, y: 60 }, { x: 260, y: 60 }]
      : isForest
      ? [{ x: 100, y: 160 }, { x: 420, y: 280 }]
      : [];

    // Check saved opened chests
    const opened = this.savedOpenedChests || [];
    for (const pos of positions) {
      const chest = new Chest(this, pos.x, pos.y);
      const id = chest.chestId;
      if (opened.includes(id)) {
        chest.opened = true;
        chest.setTint(0x888888);
        chest.setAlpha(0.6);
        chest.prompt.destroy();
      }
      this.chests.add(chest);
    }
  }

  handleChestOpen() {
    let nearest = null;
    let nearestDist = 30;
    this.chests.getChildren().forEach((c) => {
      if (c.opened) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y - 8);
      if (d < nearestDist) { nearest = c; nearestDist = d; }
    });
    if (!nearest) return false;

    const loot = nearest.open(this);
    if (!loot) return false;

    this.sfx.play('chestOpen');
    this.cameras.main.shake(50, 0.004);

    // Chest opening animation — scale pop + sparkles
    if (nearest.sprite) {
      this.tweens.add({
        targets: nearest.sprite,
        scaleX: 1.3, scaleY: 1.3,
        duration: 150, yoyo: true, ease: 'Back.easeOut',
      });
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sparkle = this.add.circle(nearest.x, nearest.y - 8, 2, 0xffdd00, 0.9);
      sparkle.setDepth(9999);
      this.tweens.add({
        targets: sparkle,
        x: nearest.x + Math.cos(angle) * 18,
        y: nearest.y - 8 + Math.sin(angle) * 18,
        alpha: 0, scale: 0.2,
        duration: 400, ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      });
    }

    if (loot.type === 'gold') {
      this.addGold(loot.amount);
    } else if (loot.type === 'potion') {
      this.inventory.addItem(loot.id, 1);
      this.events.emit('inventory-changed', this.inventory.slots);
    } else if (loot.type === 'xp') {
      this.addXP(loot.amount);
    }

    this.showNotification(`Chest: ${loot.label}`);
    return true;
  }

  handleUnicornContact(player, unicorn) {
    if (player.health >= player.maxHealth) return;
    if (!unicorn.canHeal) return;

    const healed = unicorn.tryHeal(player);
    if (healed) {
      this.events.emit('player-health-changed', player.health, player.maxHealth);
      this.sfx.play('unicornHeal');
      this.showNotification(`Unicorn healed you! +${healed} HP`);
    }
  }

  handleFairyContact(player, fairy) {
    if (fairy.buffGiven) return;
    const result = fairy.giveBuff(player, this);
    if (result) {
      this.sfx.play('fairyBuff');
      this.showNotification(result.message);
    }
  }

  handleSwordHit(hitbox, enemy) {
    if (!enemy.takeDamage) return;
    if (enemy.health <= 0) return;

    const ex = enemy.x;
    const ey = enemy.y;

    const baseDmg = this.player.attackPower || 1;
    const equipBonus = this.equipment ? this.equipment.getAttackBonus() : 0;
    const levelBonus = this.playerAttackBonus || 0;
    const dmg = baseDmg + equipBonus + levelBonus + (this._fairyAttackBuff ? 1 : 0);
    enemy.takeDamage(dmg, this.player.x, this.player.y);

    // Combat juice - stronger feedback for charged/combo hits
    this.sfx.play('hit');
    const shakeIntensity = dmg > 1 ? 0.008 : 0.004;
    this.cameras.main.shake(50, shakeIntensity);
    this.showDamageNumber(ex, ey - 8, dmg);
    this.hitFreeze(dmg > 1 ? 60 : 40);

    if (enemy.health <= 0) {
      // Boss handles its own death sequence
      if (enemy === this.boss) return;

      this.sfx.play('enemyDeath');
      this.spawnDeathEffect(ex, ey);
      this.spawnLootDrop(ex, ey);

      if (enemy.enemyType) {
        const updated = this.questManager.trackEvent('kill', { target: enemy.enemyType });
        if (updated) {
          this.updateQuestTracker();
        }
      }

      // Gold + XP reward
      const reward = ENEMY_REWARDS[enemy.enemyType] || { gold: 3, xp: 10 };
      this.addGold(reward.gold);
      this.addXP(reward.xp);

      // Track bestiary
      if (enemy.enemyType && this.bestiary) {
        this.bestiary[enemy.enemyType] = (this.bestiary[enemy.enemyType] || 0) + 1;
      }

      // Queue respawn
      if (enemy.spawnX !== undefined && this.respawnQueue) {
        this.queueRespawn({ x: enemy.spawnX, y: enemy.spawnY, type: enemy.enemyType || 'slime' });
      }
    }
  }

  handleEnemyContact(player, enemy) {
    if (enemy.damage && !player.invulnerable) {
      const nightBonus = this.isNight ? 1 : 0;
      player.takeDamage(enemy.damage + nightBonus);
      this.sfx.play('playerHurt');
      this.cameras.main.shake(80, 0.006);
      this.hitFreeze(30);
    }
  }

  handleDoor(player, zone) {
    if (this._doorCooldown) return;
    this._doorCooldown = true;

    const door = zone.doorData;
    this.player.setVelocity(0, 0);
    this.sfx.play('doorEnter');

    // Crossfade music on map transition (fade out, new track plays on restart)
    if (this.music) this.music.fadeOut(0.3);

    const targetMap = MAPS[door.targetMap];
    if (!targetMap) {
      // Fallback: teleport within same map
      this._irisWipeOut(() => {
        this.player.setPosition(door.targetX, door.targetY);
        this._irisWipeIn();
        this.time.delayedCall(500, () => {
          this._doorCooldown = false;
        });
      });
      return;
    }

    // Save quest state and transition to new map
    const questState = this.questManager.saveState();
    const playerHealth = this.player.health;

    this._irisWipeOut(() => {
      this.scene.stop('UI');
      this.scene.restart({
        mapData: {
          ...targetMap,
          playerSpawn: { x: door.targetX, y: door.targetY },
        },
        questState: questState,
        playerHealth: playerHealth,
        gold: this.gold,
        xp: this.xp,
        level: this.level,
        inventory: this.inventory.saveState(),
        dayTime: this.dayTime,
        equipment: this.equipment.saveState(),
        openedChests: this._getOpenedChests(),
        trackedQuestId: this.trackedQuestId,
        bestiary: this.bestiary,
        timedQuestId: this._timedQuestId,
        timedRemaining: this._timedRemaining,
        tutorialShown: this.tutorialShown,
        escortActive: this._escortActive,
        escortNpcId: this._escortNPC ? this._escortNPC.npcId : null,
        playerAttackBonus: this.playerAttackBonus,
        unlockedTeleports: this.unlockedTeleports,
      });
    });
  }

  _irisWipeOut(onComplete) {
    // Smooth wipe: brief freeze + fast fade
    this.cameras.main.flash(100, 255, 255, 255, false, (cam, progress) => {
      if (progress >= 0.5 && !this._wipeTriggered) {
        this._wipeTriggered = true;
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this._wipeTriggered = false;
          if (onComplete) onComplete();
        });
      }
    });
  }

  _irisWipeIn() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  handleNPCInteraction() {
    if (this.inDialogue) return;

    let nearestNPC = null;
    this.npcs.getChildren().forEach((npc) => {
      if (npc.canInteract) nearestNPC = npc;
    });

    if (!nearestNPC) return;

    const name = nearestNPC.npcName;
    const portrait = nearestNPC.texture.key;

    // Shop NPC
    if (nearestNPC.role === 'shop') {
      this.openShopMenu(nearestNPC);
      return;
    }

    // Inn NPC — check for innkeeper quest first
    if (nearestNPC.role === 'inn') {
      const medQuest = this.questManager.getQuest('urgent_medicine');
      if (medQuest && (medQuest.state === 'available' || medQuest.state === 'active' || medQuest.state === 'ready')) {
        // Fall through to quest handling below
      } else {
        this.handleInnInteraction(nearestNPC);
        return;
      }
    }

    // Check if this NPC is a turnIn target for a delivery quest
    for (const quest of Object.values(this.questManager.quests)) {
      if (quest.turnIn === nearestNPC.npcId && quest.state === 'active') {
        this.showDialogue(quest.turnInDialogue, () => {
          quest.progress = quest.objective.count;
          quest.state = 'ready';
          this.updateQuestTracker();
          this.showNotification('Delivery Complete!');
          this.sfx.play('questComplete');
        }, name, portrait);
        return;
      }
    }

    // Normal quest/dialogue flow
    const quest = nearestNPC.questId ? this.questManager.getQuest(nearestNPC.questId) : null;
    const lines = nearestNPC.getDialogue(this.questManager, this);

    // Check if Bob has another quest (special_delivery) after skeleton_hunt is done
    if (nearestNPC.npcId === 'farmer_bob') {
      const skeletonQuest = this.questManager.getQuest('skeleton_hunt');
      const deliveryQuest = this.questManager.getQuest('special_delivery');
      if (skeletonQuest && skeletonQuest.state === 'completed' && deliveryQuest && deliveryQuest.state === 'available') {
        this.showDialogue(deliveryQuest.dialogue.available, () => {
          this.questManager.acceptQuest('special_delivery');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + deliveryQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (deliveryQuest && (deliveryQuest.state === 'active' || deliveryQuest.state === 'ready')) {
        const dLines = deliveryQuest.dialogue[deliveryQuest.state];
        this.showDialogue(dLines, () => {
          if (deliveryQuest.state === 'ready') {
            this.giveQuestReward('special_delivery');
            this.questManager.completeQuest('special_delivery');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Miner Mike: chain clear_cave → clear_temple
    if (nearestNPC.npcId === 'miner_mike') {
      const caveQuest = this.questManager.getQuest('clear_cave');
      const templeQuest = this.questManager.getQuest('clear_temple');
      if (caveQuest && caveQuest.state === 'completed' && templeQuest && templeQuest.state === 'available') {
        this.showDialogue(templeQuest.dialogue.available, () => {
          this.questManager.acceptQuest('clear_temple');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + templeQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (templeQuest && (templeQuest.state === 'active' || templeQuest.state === 'ready')) {
        const tLines = templeQuest.dialogue[templeQuest.state];
        this.showDialogue(tLines, () => {
          if (templeQuest.state === 'ready') {
            this.giveQuestReward('clear_temple');
            this.questManager.completeQuest('clear_temple');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Fisherman Fin: chain explore_pond → catch_fish
    if (nearestNPC.npcId === 'fisherman_fin') {
      const pondQuest = this.questManager.getQuest('explore_pond');
      const fishQuest = this.questManager.getQuest('catch_fish');
      if (pondQuest && pondQuest.state === 'completed' && fishQuest && fishQuest.state === 'available') {
        this.showDialogue(fishQuest.dialogue.available, () => {
          this.questManager.acceptQuest('catch_fish');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + fishQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (fishQuest && (fishQuest.state === 'active' || fishQuest.state === 'ready')) {
        const fLines = fishQuest.dialogue[fishQuest.state];
        this.showDialogue(fLines, () => {
          if (fishQuest.state === 'ready') {
            this.giveQuestReward('catch_fish');
            this.questManager.completeQuest('catch_fish');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Chef Chloe: chain special_delivery → escort_chloe
    if (nearestNPC.npcId === 'chef_chloe') {
      const deliveryQuest = this.questManager.getQuest('special_delivery');
      const escortQuest = this.questManager.getQuest('escort_chloe');
      if (deliveryQuest && deliveryQuest.state === 'completed' && escortQuest && escortQuest.state === 'available') {
        this.showDialogue(escortQuest.dialogue.available, () => {
          this.questManager.acceptQuest('escort_chloe');
          this._startEscort('chef_chloe');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + escortQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (escortQuest && escortQuest.state === 'active') {
        this.showDialogue(escortQuest.dialogue.active, null, name, portrait);
        return;
      }
      if (escortQuest && escortQuest.state === 'ready') {
        this.showDialogue(escortQuest.dialogue.ready, () => {
          this.giveQuestReward('escort_chloe');
          this.questManager.completeQuest('escort_chloe');
          this.updateQuestTracker();
          this.showNotification('Quest Complete!');
          this.sfx.play('questComplete');
        }, name, portrait);
        return;
      }
    }

    // Innkeeper: urgent_medicine (timed delivery quest)
    if (nearestNPC.npcId === 'innkeeper') {
      const medQuest = this.questManager.getQuest('urgent_medicine');
      if (medQuest && medQuest.state === 'available') {
        this.showDialogue(medQuest.dialogue.available, () => {
          this.questManager.acceptQuest('urgent_medicine');
          this._startTimedQuest('urgent_medicine', medQuest.timeLimit);
          this.updateQuestTracker();
          this.showNotification('Quest: ' + medQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (medQuest && (medQuest.state === 'active' || medQuest.state === 'ready')) {
        this.showDialogue(medQuest.dialogue[medQuest.state], () => {
          if (medQuest.state === 'ready') {
            this.giveQuestReward('urgent_medicine');
            this.questManager.completeQuest('urgent_medicine');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Lumberjack Jack: chain slime_cleanup → lost_axe
    if (nearestNPC.npcId === 'lumberjack_jack') {
      const slimeQuest = this.questManager.getQuest('slime_cleanup');
      const axeQuest = this.questManager.getQuest('lost_axe');
      if (slimeQuest && slimeQuest.state === 'completed' && axeQuest && axeQuest.state === 'available') {
        this.showDialogue(axeQuest.dialogue.available, () => {
          this.questManager.acceptQuest('lost_axe');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + axeQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (axeQuest && (axeQuest.state === 'active' || axeQuest.state === 'ready')) {
        const aLines = axeQuest.dialogue[axeQuest.state];
        this.showDialogue(aLines, () => {
          if (axeQuest.state === 'ready') {
            this.giveQuestReward('lost_axe');
            this.questManager.completeQuest('lost_axe');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Ranger Reed: chain scout_forest → clear_forest
    if (nearestNPC.npcId === 'ranger_reed') {
      const scoutQuest = this.questManager.getQuest('scout_forest');
      const forestQuest = this.questManager.getQuest('clear_forest');
      if (scoutQuest && scoutQuest.state === 'completed' && forestQuest && forestQuest.state === 'available') {
        this.showDialogue(forestQuest.dialogue.available, () => {
          this.questManager.acceptQuest('clear_forest');
          this.updateQuestTracker();
          this.showNotification('Quest: ' + forestQuest.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (forestQuest && (forestQuest.state === 'active' || forestQuest.state === 'ready')) {
        const fLines = forestQuest.dialogue[forestQuest.state];
        this.showDialogue(fLines, () => {
          if (forestQuest.state === 'ready') {
            this.giveQuestReward('clear_forest');
            this.questManager.completeQuest('clear_forest');
            this.updateQuestTracker();
            this.showNotification('Quest Complete!');
            this.sfx.play('questComplete');
          }
        }, name, portrait);
        return;
      }
    }

    // Add time-aware greeting and dialogue variety for non-quest dialogue
    let finalLines = lines;
    if (!quest || quest.state === 'completed') {
      finalLines = this._getVariedDialogue(nearestNPC, lines);
    }

    this.showDialogue(finalLines, () => {
      if (quest) {
        if (quest.state === 'available') {
          this.questManager.acceptQuest(quest.id);
          this.updateQuestTracker();
          this.showNotification('Quest: ' + quest.name);
          this.sfx.play('questAccept');
        } else if (quest.state === 'ready') {
          this.giveQuestReward(quest.id);
          this.questManager.completeQuest(quest.id);
          this.updateQuestTracker();
          this.showNotification('Quest Complete!');
          this.sfx.play('questComplete');
        }
      }
    }, name, portrait);
  }

  updateQuestTracker() {
    const active = this.questManager.getActiveQuests();
    if (active.length === 0) {
      this.questTrackerText.setText('');
      return;
    }

    // Show tracked quest, or first active if none tracked
    let tracked = null;
    if (this.trackedQuestId) {
      tracked = active.find(q => q.id === this.trackedQuestId);
    }
    if (!tracked) {
      tracked = active[0];
      this.trackedQuestId = tracked.id;
    }

    let line;
    if (tracked.state === 'ready') {
      line = `${tracked.name} - Done!`;
    } else {
      line = `${tracked.name}\n${tracked.objective.description}: ${tracked.progress}/${tracked.objective.count}`;
    }
    this.questTrackerText.setText(line);
  }

  _doSaveAndQuit() {
    this.sfx.play('select');
    SaveManager.save(this);
    this.gameMenu.close();
    this.scene.stop('UI');
    this.scene.start('Title');
  }

  checkVictory() {
    const cave = this.questManager.getQuest('clear_cave');
    const temple = this.questManager.getQuest('clear_temple');
    const forest = this.questManager.getQuest('clear_forest');
    const caveDone = cave && (cave.state === 'completed' || cave.state === 'ready');
    const templeDone = temple && (temple.state === 'completed' || temple.state === 'ready');
    const forestDone = forest && (forest.state === 'completed' || forest.state === 'ready');
    if (caveDone && templeDone && forestDone) {
      // Both bosses defeated - trigger victory after delay
      this.time.delayedCall(3000, () => {
        const questsCompleted = this.questManager.getAllQuests()
          .filter(q => q.state === 'completed' || q.state === 'ready').length;
        this.cameras.main.fadeOut(1500, 255, 255, 255);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('UI');
          this.scene.start('Victory', {
            level: this.level,
            gold: this.gold,
            questsCompleted,
          });
        });
      });
    }
  }

  showNotification(msg) {
    // Add to UIScene so it renders over the HUD bar (full 320x240 viewport)
    const ui = this.scene.get('UI');
    const target = ui || this;
    const w = 320;

    const notif = target.add.text(w / 2, 20, msg, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9999);

    target.tweens.add({
      targets: notif,
      alpha: 0,
      y: '-=10',
      duration: 2500,
      ease: 'Power2',
      onComplete: () => { notif.destroy(); },
    });
  }

  giveQuestReward(questId) {
    const quest = this.questManager.getQuest(questId);
    if (quest && quest.reward) {
      if (quest.reward.gold) this.addGold(quest.reward.gold);
      if (quest.reward.xp) this.addXP(quest.reward.xp);
    }
    // Auto-save on quest milestone
    this.time.delayedCall(100, () => SaveManager.save(this));
  }

  // --- Quest variety: escort, timed, fetch ---

  _spawnFetchItems() {
    const axeQuest = this.questManager.getQuest('lost_axe');
    if (axeQuest && axeQuest.state === 'active' && this.mapData.name === 'forest') {
      const obj = axeQuest.objective;
      const item = this.add.rectangle(obj.fetchX, obj.fetchY, 8, 8, 0xffaa00);
      item.setDepth(9000);
      // Sparkle effect
      this.tweens.add({
        targets: item, alpha: 0.5, duration: 500, yoyo: true, repeat: -1,
      });
      const label = this.add.text(obj.fetchX, obj.fetchY - 10, 'Axe', {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: '#ffdd00', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9001);
      // Physics zone for pickup
      const zone = this.add.zone(obj.fetchX, obj.fetchY, 16, 16);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        if (item._collected) return;
        item._collected = true;
        axeQuest.progress = axeQuest.objective.count;
        axeQuest.state = 'ready';
        this.updateQuestTracker();
        this.showNotification('Found the Lost Axe!');
        this.sfx.play('itemPickup');
        item.destroy();
        label.destroy();
        zone.destroy();
      });
    }
  }

  _startEscort(npcId) {
    // Find the NPC and make them follow the player
    this.npcs.getChildren().forEach((npc) => {
      if (npc.npcId === npcId) {
        this._escortNPC = npc;
        this._escortActive = true;
        npc._isEscorted = true;
      }
    });
  }

  _updateEscort(delta) {
    if (!this._escortActive || !this._escortNPC || !this._escortNPC.active) {
      this._escortActive = false;
      return;
    }

    const npc = this._escortNPC;
    const player = this.player;
    const dist = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);

    // Follow player if too far
    if (dist > 30) {
      const angle = Phaser.Math.Angle.Between(npc.x, npc.y, player.x, player.y);
      npc.body.setVelocity(Math.cos(angle) * 35, Math.sin(angle) * 35);
    } else {
      npc.body.setVelocity(0, 0);
    }

    // Check if reached destination
    const quest = this.questManager.getQuest('escort_chloe');
    if (quest && quest.state === 'active') {
      const dest = quest.objective.destination;
      const distDest = Phaser.Math.Distance.Between(npc.x, npc.y, dest.x, dest.y);
      if (distDest < 30) {
        quest.progress = quest.objective.count;
        quest.state = 'ready';
        this._escortActive = false;
        npc._isEscorted = false;
        this.updateQuestTracker();
        this.showNotification('Chloe reached the inn!');
        this.sfx.play('questComplete');
      }
    }
  }

  _startTimedQuest(questId, timeLimit) {
    this._timedQuestId = questId;
    this._timedRemaining = timeLimit * 1000; // convert to ms
    // Create timer display
    if (!this._timedText) {
      this._timedText = this.add.text(this.cameras.main.width / 2, 14, '', {
        fontSize: '12px', fontFamily: 'Arial, sans-serif',
        color: '#ff4444', stroke: '#000000', strokeThickness: 3,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9500);
    }
  }

  _updateTimedQuest(delta) {
    if (!this._timedQuestId) return;

    const quest = this.questManager.getQuest(this._timedQuestId);
    if (!quest || quest.state !== 'active') {
      // Quest completed or no longer active
      this._timedQuestId = null;
      if (this._timedText) { this._timedText.destroy(); this._timedText = null; }
      return;
    }

    this._timedRemaining -= delta;
    const secs = Math.max(0, Math.ceil(this._timedRemaining / 1000));

    if (this._timedText) {
      this._timedText.setText(`Time: ${secs}s`);
      this._timedText.setColor(secs <= 15 ? '#ff0000' : '#ff4444');
    }

    if (this._timedRemaining <= 0) {
      // Time's up — fail the quest
      quest.state = 'available';
      quest.progress = 0;
      this._timedQuestId = null;
      if (this._timedText) { this._timedText.destroy(); this._timedText = null; }
      this.updateQuestTracker();
      this.showNotification('Time\'s up! Quest failed.');
      this.sfx.play('playerHurt');
    }
  }

  // --- Gold & XP ---
  addGold(amount) {
    this.gold += amount;
    this.events.emit('gold-changed', this.gold);
    if (amount > 0) {
      this.showFloatingText(this.player.x, this.player.y - 12, `+${amount}g`, '#ffdd00');
    }
  }

  addXP(amount) {
    if (amount > 0) {
      this.showFloatingText(this.player.x, this.player.y - 20, `+${amount} XP`, '#44bb44');
    }
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = this.level * 100;

      // Stat gains on level-up
      let bonusMsg = '';
      if (this.level % 2 === 0) {
        this.player.maxHealth += 2;
        this.player.health = Math.min(this.player.health + 2, this.player.maxHealth);
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
        bonusMsg += ' +HP';
      }
      if (this.level % 3 === 0) {
        this.player.speed = Math.round(this.player.speed * 1.05);
        bonusMsg += ' +SPD';
      }
      if (this.level % 4 === 0) {
        this.playerAttackBonus = (this.playerAttackBonus || 0) + 1;
        bonusMsg += ' +ATK';
      }
      if (this.level % 5 === 0) {
        this.player.maxMana += 2;
        this.player.mana = Math.min(this.player.mana + 2, this.player.maxMana);
        this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
        bonusMsg += ' +MANA';
      }

      this.showNotification(`Level Up! Lv.${this.level}${bonusMsg}`);
      this.sfx.play('levelUp');

      // Check for spell unlocks at this level
      for (const spell of this.spells) {
        if (spell.minLevel === this.level) {
          this.time.delayedCall(1200, () => {
            this.showNotification(`New Spell: ${spell.name}! (TAB to select)`);
          });
        }
      }

      // Level-up effects: camera zoom pulse
      this.cameras.main.zoomTo(1.05, 250, 'Sine.easeOut', false, (cam, progress) => {
        if (progress === 1) this.cameras.main.zoomTo(1, 250, 'Sine.easeIn');
      });

      // White flash overlay
      const flash = this.add.rectangle(
        this.cameras.main.width / 2, this.cameras.main.height / 2,
        this.cameras.main.width, this.cameras.main.height,
        0xffffff, 0.3
      ).setScrollFactor(0).setDepth(9998);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 400,
        onComplete: () => flash.destroy(),
      });

      // Golden sparkle particles radiating from player
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const sparkle = this.add.circle(this.player.x, this.player.y, 2, 0xffdd00, 0.9);
        sparkle.setDepth(9999);
        this.tweens.add({
          targets: sparkle,
          x: this.player.x + Math.cos(angle) * 28,
          y: this.player.y + Math.sin(angle) * 28,
          alpha: 0, scale: 0.3,
          duration: 500, ease: 'Power2',
          onComplete: () => sparkle.destroy(),
        });
      }
    }
    this.events.emit('xp-changed', this.xp, this.xpToNext, this.level);
  }

  // --- Inventory ---
  useItem(slotIndex) {
    const itemId = this.inventory.useItem(slotIndex);
    if (!itemId) return;

    this.sfx.play('potionUse');
    this.events.emit('inventory-changed', this.inventory.slots);

    if (itemId === 'health_potion') {
      const healed = Math.min(2, this.player.maxHealth - this.player.health);
      if (healed <= 0) {
        // Refund - inventory was already decremented, re-add
        this.inventory.addItem('health_potion', 1);
        this.events.emit('inventory-changed', this.inventory.slots);
        return;
      }
      this.player.health = Math.min(this.player.health + 2, this.player.maxHealth);
      this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      this.showPotionEffect(0xe74c3c);
      this.showNotification('+2 HP');
    } else if (itemId === 'speed_potion') {
      const originalSpeed = this.player.speed;
      this.player.speed = Math.round(originalSpeed * 1.5);
      this.showPotionEffect(0x3498db);
      this.showNotification('Speed Boost!');
      this.time.delayedCall(8000, () => {
        this.player.speed = originalSpeed;
      });
    } else if (itemId === 'shield_potion') {
      this.player.invulnerable = true;
      this.player.invulnerableTimer = 5000;
      this.showPotionEffect(0xf1c40f);
      this.showNotification('Shield Active!');
    }
  }

  showPotionEffect(color) {
    // Ring burst around player
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.add.circle(this.player.x, this.player.y, 2, color, 0.8);
      particle.setDepth(9999);
      this.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * 18,
        y: this.player.y + Math.sin(angle) * 18,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // --- Day/Night ---
  _updateDayNight() {
    // dayTime: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    const t = this.dayTime;
    let alpha, r, g, b;

    if (t < 0.2) {
      // Night (midnight to pre-dawn)
      alpha = 0.45;
      r = 0x10; g = 0x10; b = 0x40;
    } else if (t < 0.3) {
      // Dawn transition
      const p = (t - 0.2) / 0.1;
      alpha = 0.45 * (1 - p);
      r = Math.round(0x10 + (0xff - 0x10) * p);
      g = Math.round(0x10 + (0xbb - 0x10) * p);
      b = Math.round(0x40 + (0x88 - 0x40) * p);
    } else if (t < 0.65) {
      // Day (morning to afternoon)
      alpha = 0;
      r = 0xff; g = 0xff; b = 0xff;
    } else if (t < 0.75) {
      // Dusk transition
      const p = (t - 0.65) / 0.1;
      alpha = 0.35 * p;
      r = Math.round(0xff - (0xff - 0x80) * p);
      g = Math.round(0xff - (0xff - 0x50) * p);
      b = Math.round(0xff - (0xff - 0x30) * p);
    } else if (t < 0.85) {
      // Sunset to night
      const p = (t - 0.75) / 0.1;
      alpha = 0.35 + 0.1 * p;
      r = Math.round(0x80 - (0x80 - 0x10) * p);
      g = Math.round(0x50 - (0x50 - 0x10) * p);
      b = Math.round(0x30 + (0x40 - 0x30) * p);
    } else {
      // Deep night
      alpha = 0.45;
      r = 0x10; g = 0x10; b = 0x40;
    }

    const color = (r << 16) | (g << 8) | b;
    this.dayOverlay.setFillStyle(color, alpha);

    // Track night state for enemy damage bonus
    const wasNight = this.isNight;
    this.isNight = t < 0.2 || t >= 0.8;

    if (this.isNight && !wasNight) {
      this.showNotification('Night falls... enemies grow stronger');
    } else if (!this.isNight && wasNight) {
      this.showNotification('Dawn breaks');
    }

    // Emit time label for UI
    let timeLabel;
    if (t < 0.2) timeLabel = 'Night';
    else if (t < 0.3) timeLabel = 'Dawn';
    else if (t < 0.5) timeLabel = 'Morning';
    else if (t < 0.65) timeLabel = 'Afternoon';
    else if (t < 0.75) timeLabel = 'Dusk';
    else if (t < 0.85) timeLabel = 'Evening';
    else timeLabel = 'Night';
    this.events.emit('time-changed', timeLabel);
  }

  // --- Shop & Inn ---
  openShopMenu(npc) {
    // Build shop inventory: potions + next equipment tier
    const shopItems = [
      { id: 'health_potion', name: 'Health Potion', price: 15, color: '#e74c3c', type: 'potion', desc: 'Restores 2 HP' },
      { id: 'speed_potion', name: 'Speed Potion', price: 30, color: '#3498db', type: 'potion', desc: '1.5x speed, 8s' },
      { id: 'shield_potion', name: 'Shield Potion', price: 50, color: '#f1c40f', type: 'potion', desc: 'Invincible, 5s' },
    ];

    // Show equipment upgrades the player doesn't own yet
    const weaponTiers = ['wooden_sword', 'iron_sword', 'fire_sword'];
    const armorTiers = ['cloth_armor', 'leather_armor', 'iron_armor'];
    const currentWeaponIdx = weaponTiers.indexOf(this.equipment.weapon);
    const currentArmorIdx = armorTiers.indexOf(this.equipment.armor);
    if (currentWeaponIdx < weaponTiers.length - 1) {
      const next = EQUIPMENT[weaponTiers[currentWeaponIdx + 1]];
      shopItems.push({ id: next.id, name: next.name, price: next.price, color: next.color, type: 'equip', desc: next.description });
    }
    if (currentArmorIdx < armorTiers.length - 1) {
      const next = EQUIPMENT[armorTiers[currentArmorIdx + 1]];
      shopItems.push({ id: next.id, name: next.name, price: next.price, color: next.color, type: 'equip', desc: next.description });
    }

    this.inDialogue = true;
    this.player.setVelocity(0, 0);

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const itemCount = Math.min(shopItems.length, 5);
    const boxW = w - 24;
    const boxH = 28 + itemCount * 14;
    const boxX = w / 2;
    const boxY = h - boxH / 2 - 8;

    this.shopContainer = this.add.container(0, 0)
      .setScrollFactor(0).setDepth(10000);

    const bg = this.add.nineslice(
      boxX, boxY, 'ui-frames', 'panel-yellow',
      boxW, boxH, 8, 8, 8, 8
    );
    this.shopContainer.add(bg);

    const title = this.add.text(boxX, boxY - boxH / 2 + 6, `${npc.npcName}'s Shop  (Gold: ${this.gold})`, {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#3d2510',
    }).setOrigin(0.5, 0);
    this.shopContainer.add(title);

    shopItems.forEach((item, i) => {
      const y = boxY - boxH / 2 + 20 + i * 14;
      const prefix = i < 9 ? `${i + 1}` : '*';
      const suffix = item.desc ? ` (${item.desc})` : '';
      const label = this.add.text(20, y, `${prefix}: ${item.name}${suffix}`, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#2a1a08',
      }).setScrollFactor(0);
      const price = this.add.text(w - 20, y, `${item.price}g`, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif',
        color: this.gold >= item.price ? '#2a1a08' : '#999999',
      }).setOrigin(1, 0).setScrollFactor(0);
      this.shopContainer.add(label);
      this.shopContainer.add(price);
    });

    const hint = this.add.text(boxX, boxY + boxH / 2 - 6, 'ESC to close', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#8b6d4a',
    }).setOrigin(0.5, 1).setScrollFactor(0);
    this.shopContainer.add(hint);

    // Shop input handling
    this._shopActive = true;
    this._shopItems = shopItems;
    this._shopNPC = npc;
    this._shopEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Add keys 4 and 5 for equipment slots
    this._shopExtraKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
    ];
  }

  closeShop() {
    if (this.shopContainer) {
      this.shopContainer.destroy();
      this.shopContainer = null;
    }
    this._shopActive = false;
    this.inDialogue = false;
  }

  handleShopBuy(index) {
    const item = this._shopItems[index];
    if (!item) return;
    this.sfx.play('select');
    if (this.gold < item.price) {
      this.showNotification('Not enough gold!');
      return;
    }

    if (item.type === 'equip') {
      // Equipment purchase
      const equip = EQUIPMENT[item.id];
      if (!equip) return;
      this.addGold(-item.price);
      this.sfx.play('coinSpend');

      const oldHPBonus = this.equipment.getHPBonus();
      this.equipment.equip(item.id);
      const newHPBonus = this.equipment.getHPBonus();

      // Apply armor HP change
      if (newHPBonus !== oldHPBonus) {
        const diff = newHPBonus - oldHPBonus;
        this.player.maxHealth += diff;
        this.player.health = Math.min(this.player.health + Math.max(0, diff), this.player.maxHealth);
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }

      this.showNotification(`Equipped ${equip.name}!`);
      this.closeShop();
      this.openShopMenu(this._shopNPC);
      return;
    }

    // Potion purchase
    const added = this.inventory.addItem(item.id, 1);
    if (added <= 0) {
      this.showNotification('Inventory full!');
      return;
    }
    this.addGold(-item.price);
    this.sfx.play('coinSpend');
    this.events.emit('inventory-changed', this.inventory.slots);
    // Refresh shop display
    this.closeShop();
    this.openShopMenu(this._shopNPC);
  }

  handleInnInteraction(npc) {
    const name = npc.npcName;
    const portrait = npc.texture.key;
    const cost = 10;

    if (this.player.health >= this.player.maxHealth) {
      this.showDialogue(
        ['You look healthy already!\nNo need to rest.'],
        null, name, portrait
      );
      return;
    }

    if (this.gold < cost) {
      this.showDialogue(
        [`A night's rest costs ${cost} gold.\nYou don't have enough...`],
        null, name, portrait
      );
      return;
    }

    this.showDialogue(
      [`Welcome! Rest for ${cost} gold?\nYou look like you need it!`, 'Sweet dreams...'],
      () => {
        this.addGold(-cost);
        // Fade to black rest visual
        const cam = this.cameras.main;
        const restOverlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0)
          .setScrollFactor(0).setDepth(12000);
        const restText = this.add.text(cam.width / 2, cam.height / 2, 'Resting...', {
          fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(12001).setAlpha(0);

        this.tweens.add({
          targets: restOverlay, alpha: 1, duration: 300,
          onComplete: () => {
            this.tweens.add({ targets: restText, alpha: 1, duration: 200 });
            this.time.delayedCall(500, () => {
              // Heal during hold
              this.player.health = this.player.maxHealth;
              this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
              this.sfx.play('potionUse');
              this.tweens.add({
                targets: [restOverlay, restText], alpha: 0, duration: 300,
                onComplete: () => {
                  restOverlay.destroy();
                  restText.destroy();
                  this.showNotification('Fully rested!');
                },
              });
            });
          },
        });
      }, name, portrait
    );
  }

  _castMagic() {
    const spell = this.spells[this.currentSpellIndex];
    if (!spell || this.level < spell.minLevel) return;
    if (this.player.mana < spell.manaCost) return;

    // Heal spell
    if (spell.isHeal) {
      if (this._healCooldown > 0) return;
      if (this.player.health >= this.player.maxHealth) {
        this.sfx.play('menuCancel');
        this.showNotification('Already full HP!');
        return;
      }
      this.player.mana -= spell.manaCost;
      this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
      this._healCooldown = spell.cooldown;
      const healed = Math.min(spell.healAmount, this.player.maxHealth - this.player.health);
      if (healed > 0) {
        this.player.health += healed;
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }
      this.sfx.play('heal');
      this.showFloatingText(this.player.x, this.player.y - 20, `+${healed} HP`, '#44ff44');
      // Green flash overlay
      const healFlash = this.add.rectangle(
        this.cameras.main.width / 2, this.cameras.main.height / 2,
        this.cameras.main.width, this.cameras.main.height,
        0x44ff44, 0.15
      ).setScrollFactor(0).setDepth(9998);
      this.tweens.add({ targets: healFlash, alpha: 0, duration: 300, onComplete: () => healFlash.destroy() });
      // Green healing particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const p = this.add.circle(this.player.x, this.player.y, 2, 0x44ff44, 0.8);
        p.setDepth(9999);
        this.tweens.add({
          targets: p,
          x: this.player.x + Math.cos(angle) * 16,
          y: this.player.y + Math.sin(angle) * 16 - 8,
          alpha: 0, duration: 400,
          onComplete: () => p.destroy(),
        });
      }
      return;
    }

    // Projectile spells (Fireball / Ice Bolt)
    this.player.mana -= spell.manaCost;
    this.events.emit('mana-changed', this.player.mana, this.player.maxMana);

    const dirs = {
      down: { x: 0, y: 1 },
      up: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      left: { x: -1, y: 0 },
    };
    const d = dirs[this.player.direction];
    const speed = 140;
    const color = spell.color;

    // Create magic projectile
    const projShape = spell.slow
      ? this.add.rectangle(this.player.x + d.x * 12, this.player.y + d.y * 12, 6, 6, color, 0.9)
      : this.add.circle(this.player.x + d.x * 12, this.player.y + d.y * 12, 4, color, 0.9);
    projShape.setDepth(9999);
    this.physics.add.existing(projShape, false);
    projShape.body.setVelocity(d.x * speed, d.y * speed);
    projShape.body.setAllowGravity(false);
    projShape.damage = spell.damage;
    projShape.slow = spell.slow || false;
    if (spell.slow) projShape.setRotation(Math.PI / 4); // diamond shape

    // Glow trail
    const glow = this.add.circle(projShape.x, projShape.y, 6, color, 0.3);
    glow.setDepth(9998);

    // SFX
    this.sfx.play(spell.slow ? 'icebolt' : 'fireball');

    // Update glow position
    const trailTimer = this.time.addEvent({
      delay: 16,
      callback: () => {
        if (!projShape.active) { glow.destroy(); trailTimer.remove(); return; }
        glow.setPosition(projShape.x, projShape.y);
        const trail = this.add.circle(projShape.x, projShape.y, 2, color, 0.4);
        trail.setDepth(9997);
        this.tweens.add({
          targets: trail, alpha: 0, scale: 0, duration: 200,
          onComplete: () => trail.destroy(),
        });
      },
      loop: true,
    });

    // Enemy collision
    this.physics.add.overlap(projShape, this.enemies, (p, enemy) => {
      if (!enemy.takeDamage || enemy.health <= 0) return;
      enemy.takeDamage(p.damage, this.player.x, this.player.y);
      this.sfx.play('hit');
      this.showDamageNumber(enemy.x, enemy.y - 8, p.damage, 'magic');

      // Ice slow effect
      if (p.slow && enemy.speed && !enemy._slowed) {
        enemy._slowed = true;
        const origSpeed = enemy.speed;
        enemy.speed = Math.round(origSpeed * 0.4);
        enemy.setTint(0x88ccff);
        this.time.delayedCall(1000, () => {
          if (enemy.active) {
            enemy.speed = origSpeed;
            enemy._slowed = false;
            enemy.clearTint();
          }
        });
      }

      // Impact burst
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const spark = this.add.circle(p.x, p.y, 2, color, 0.8);
        spark.setDepth(9999);
        this.tweens.add({
          targets: spark,
          x: p.x + Math.cos(angle) * 10,
          y: p.y + Math.sin(angle) * 10,
          alpha: 0, duration: 150,
          onComplete: () => spark.destroy(),
        });
      }

      glow.destroy();
      trailTimer.remove();
      p.destroy();

      // Check death
      if (enemy.health <= 0 && enemy !== this.boss) {
        this.sfx.play('enemyDeath');
        this.spawnDeathEffect(enemy.x, enemy.y);
        this.spawnLootDrop(enemy.x, enemy.y);
        if (enemy.enemyType) {
          const updated = this.questManager.trackEvent('kill', { target: enemy.enemyType });
          if (updated) this.updateQuestTracker();
        }
        const reward = ENEMY_REWARDS[enemy.enemyType] || { gold: 3, xp: 10 };
        this.addGold(reward.gold);
        this.addXP(reward.xp);
        // Track bestiary
        if (enemy.enemyType && this.bestiary) {
          this.bestiary[enemy.enemyType] = (this.bestiary[enemy.enemyType] || 0) + 1;
        }
      }
    });

    // Destroy after lifetime
    this.time.delayedCall(spell.lifetime, () => {
      if (projShape.active) {
        glow.destroy();
        trailTimer.remove();
        projShape.destroy();
      }
    });
  }

  _getOpenedChests() {
    const ids = [...(this.savedOpenedChests || [])];
    this.chests.getChildren().forEach((c) => {
      if (c.opened && !ids.includes(c.chestId)) ids.push(c.chestId);
    });
    return ids;
  }

  // --- Paul the Wizard rescue ---
  _paulRescue() {
    if (this._paulRescueActive) return;
    this._paulRescueActive = true;

    // Freeze everything
    this.physics.world.pause();
    if (this.music) this.music.fadeOut(0.8);

    const px = this.player.x;
    const py = this.player.y;

    // Death animation: red tint + screen flash
    this.player.setTint(0xff4444);
    const deathFlash = this.add.rectangle(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      this.cameras.main.width, this.cameras.main.height,
      0xffffff, 0.6
    ).setScrollFactor(0).setDepth(9998);
    this.tweens.add({
      targets: deathFlash, alpha: 0, duration: 300,
      onComplete: () => deathFlash.destroy(),
    });

    // Paul appears with a flash (after death animation delay)
    this.time.delayedCall(900, () => {
      this.sfx.play('wizardTeleport');

      // Magic flash
      const flash = this.add.circle(px + 20, py, 6, 0x8844ff, 0.9);
      flash.setDepth(10000);
      this.tweens.add({
        targets: flash,
        radius: 30,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });

      // Paul sprite (uses miner-mike texture tinted purple as wizard)
      this._paulSprite = this.add.sprite(px + 20, py, 'miner-mike', 0);
      this._paulSprite.setTint(0x9966ff);
      this._paulSprite.setDepth(10001);

      // Wizard hat (purple triangle + brim) — sits on Paul's head
      const hatX = px + 20;
      const hatY = py - 10;
      this._paulHat = this.add.graphics();
      this._paulHat.setDepth(10002);
      // Hat brim (drawn first, behind cone)
      this._paulHat.fillStyle(0x5522aa);
      this._paulHat.fillEllipse(hatX, hatY + 2, 20, 5);
      // Hat cone
      this._paulHat.fillStyle(0x6633cc);
      this._paulHat.fillTriangle(hatX, hatY - 12, hatX - 7, hatY + 1, hatX + 7, hatY + 1);
      // Star on hat
      this._paulHat.fillStyle(0xffdd00);
      this._paulHat.fillCircle(hatX, hatY - 4, 1.5);

      // Shield bubble around Lizzy
      const shield = this.add.circle(px, py, 12, 0x8844ff, 0.3);
      shield.setDepth(9999);
      shield.setStrokeStyle(1, 0xaa66ff);
      this.tweens.add({
        targets: shield,
        radius: 20,
        alpha: 0.5,
        duration: 300,
        yoyo: true,
        repeat: 1,
      });

      // Dialogue
      this.time.delayedCall(600, () => {
        const cam = this.cameras.main;
        const dialogBg = this.add.rectangle(cam.width / 2, cam.height / 2 - 20, cam.width - 24, 28, 0x1a1a2e, 0.95)
          .setScrollFactor(0).setDepth(11000).setStrokeStyle(1, 0x8844ff);
        const dialogName = this.add.text(16, cam.height / 2 - 30, 'Paul the Wizard', {
          fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#aa88ff', fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(11001);
        const dialogText = this.add.text(16, cam.height / 2 - 20, 'Not so fast, Lizzy! I\'ve got you covered!', {
          fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
          wordWrap: { width: cam.width - 40 },
        }).setScrollFactor(0).setDepth(11001);

        // Teleport sequence after dialogue
        this.time.delayedCall(2000, () => {
          dialogBg.destroy();
          dialogName.destroy();
          dialogText.destroy();

          // Swirling particles
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const star = this.add.circle(px, py, 2, 0xaa66ff, 0.9);
            star.setDepth(10002);
            this.tweens.add({
              targets: star,
              x: px + Math.cos(angle) * 30,
              y: py + Math.sin(angle) * 30,
              alpha: 0,
              duration: 500,
              onComplete: () => star.destroy(),
            });
          }

          shield.destroy();
          this.sfx.play('wizardTeleport');

          // Fade to white
          this.cameras.main.fadeOut(600, 255, 255, 255);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this._paulHat) { this._paulHat.destroy(); this._paulHat = null; }
            if (this._paulSprite) { this._paulSprite.destroy(); this._paulSprite = null; }

            // Restart at overworld with full health
            const questState = this.questManager.saveState();
            this.scene.stop('UI');
            this.scene.restart({
              mapData: MAPS.overworld,
              questState: questState,
              playerHealth: null, // full health
              gold: Math.max(0, this.gold - 10), // lose 10 gold as penalty
              xp: this.xp,
              level: this.level,
              inventory: this.inventory.saveState(),
              dayTime: this.dayTime,
              equipment: this.equipment.saveState(),
              openedChests: this._getOpenedChests(),
              trackedQuestId: this.trackedQuestId,
              bestiary: this.bestiary,
              timedQuestId: this._timedQuestId,
              timedRemaining: this._timedRemaining,
              tutorialShown: this.tutorialShown,
              paulRescued: true, // flag for notification
              playerAttackBonus: this.playerAttackBonus,
              unlockedTeleports: this.unlockedTeleports,
            });
          });
        });
      });
    });
  }

  // --- Combat juice ---
  spawnDeathEffect(x, y) {
    const colors = [0xffffff, 0xffdd00, 0xff8844, 0xffaaaa];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const color = colors[i % colors.length];
      const particle = this.add.circle(x, y, 2, color);
      particle.setDepth(9999);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 24,
        y: y + Math.sin(angle) * 24,
        alpha: 0,
        scale: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  spawnLootDrop(x, y) {
    if (Math.random() > 0.45) return;

    // 30% chance to drop a potion instead of a heart
    if (Math.random() < 0.3) {
      this.spawnPotionDrop(x, y);
      return;
    }

    const heart = this.add.circle(x, y, 3, 0xe74c3c);
    heart.setDepth(y);
    this.physics.add.existing(heart, false);
    heart.body.setVelocity(
      (Math.random() - 0.5) * 50,
      -40
    );
    heart.body.setDrag(80);
    heart.body.setAllowGravity(false);

    this.tweens.add({
      targets: heart,
      scale: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(400, () => {
      if (!heart.active) return;
      heart.body.setVelocity(0, 0);
      this.tweens.add({
        targets: heart,
        y: heart.y - 3,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.physics.add.overlap(this.player, heart, () => {
      if (!heart.active) return;
      if (this.player.health < this.player.maxHealth) {
        this.player.health = Math.min(this.player.health + 2, this.player.maxHealth);
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }
      this.sfx.play('pickup');

      const flash = this.add.circle(heart.x, heart.y, 6, 0xffffff, 0.8);
      flash.setDepth(9999);
      this.tweens.add({
        targets: flash,
        scale: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      });

      heart.destroy();
    });

    this.time.delayedCall(8000, () => {
      if (!heart.active) return;
      this.tweens.add({
        targets: heart,
        alpha: 0,
        duration: 800,
        onComplete: () => heart.destroy(),
      });
    });
  }

  spawnPotionDrop(x, y) {
    // Weighted random potion type
    const roll = Math.random();
    let potionId, color;
    if (roll < 0.55) {
      potionId = 'health_potion';
      color = 0xe74c3c;
    } else if (roll < 0.85) {
      potionId = 'speed_potion';
      color = 0x3498db;
    } else {
      potionId = 'shield_potion';
      color = 0xf1c40f;
    }

    const potion = this.add.circle(x, y, 3, color);
    potion.setDepth(y);
    this.physics.add.existing(potion, false);
    potion.body.setVelocity(
      (Math.random() - 0.5) * 50,
      -40
    );
    potion.body.setDrag(80);
    potion.body.setAllowGravity(false);

    // Inner highlight dot
    const highlight = this.add.circle(x, y, 1.5, 0xffffff, 0.6);
    highlight.setDepth(y + 1);

    this.tweens.add({
      targets: [potion, highlight],
      scale: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(400, () => {
      if (!potion.active) return;
      potion.body.setVelocity(0, 0);
      this.tweens.add({
        targets: [potion, highlight],
        y: '-=3',
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.physics.add.overlap(this.player, potion, () => {
      if (!potion.active) return;
      const added = this.inventory.addItem(potionId, 1);
      if (added > 0) {
        this.sfx.play('pickup');
        this.events.emit('inventory-changed', this.inventory.slots);
        this.showNotification('+1 ' + potionId.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }

      const flash = this.add.circle(potion.x, potion.y, 6, 0xffffff, 0.8);
      flash.setDepth(9999);
      this.tweens.add({
        targets: flash,
        scale: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      });

      highlight.destroy();
      potion.destroy();
    });

    this.time.delayedCall(10000, () => {
      if (!potion.active) return;
      this.tweens.add({
        targets: [potion, highlight],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          highlight.destroy();
          potion.destroy();
        },
      });
    });
  }

  showDamageNumber(x, y, amount, type = 'normal') {
    // Color by type: gold for high damage, blue for magic, red default
    let color = '#ff4444';
    let scale = 1;
    if (type === 'magic') {
      color = '#88bbff';
    } else if (amount > 1) {
      color = '#ffdd00';
      scale = 1.3;
    }

    // Clamp to camera viewport so numbers don't fly off-screen
    const cam = this.cameras.main;
    x = Phaser.Math.Clamp(x, cam.scrollX + 12, cam.scrollX + cam.width - 12);
    y = Phaser.Math.Clamp(y, cam.scrollY + 12, cam.scrollY + cam.height - 12);

    const text = this.add.text(x + (Math.random() - 0.5) * 8, y, `-${amount}`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999).setScale(scale);

    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      scale: scale * 0.5,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showFloatingText(x, y, msg, color) {
    // Clamp to camera viewport so text doesn't fly off-screen
    const cam = this.cameras.main;
    x = Phaser.Math.Clamp(x, cam.scrollX + 12, cam.scrollX + cam.width - 12);
    y = Phaser.Math.Clamp(y, cam.scrollY + 12, cam.scrollY + cam.height - 12);

    const text = this.add.text(x + (Math.random() - 0.5) * 6, y, msg, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);

    this.tweens.add({
      targets: text,
      y: y - 18,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  hitFreeze(ms) {
    if (this._inHitFreeze) return;
    this._inHitFreeze = true;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => {
      this.physics.world.resume();
      this._inHitFreeze = false;
    });
  }

  // --- Environmental decoration ---
  decorateWorld(map) {
    const ts = map.tileSize;

    // Forest map decorations
    if (map.name === 'forest') {
      this._decorateForest(map);
      return;
    }

    // Town2 decorations
    if (map.name === 'town2') {
      this._decorateTown2(map);
      return;
    }

    // Forest boss decorations
    if (map.name === 'forest_boss') {
      return; // No extra decorations for boss arena
    }

    // --- Overworld decorations below ---

    // Biome overlays
    for (const biome of (map.biomes || [])) {
      for (let row = biome.y1; row < biome.y2; row++) {
        for (let col = biome.x1; col < biome.x2; col++) {
          if (biome.type === 'desert') {
            this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0xddcc88, 0.5).setDepth(0);
          } else if (biome.type === 'forest') {
            this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x225522, 0.3).setDepth(0);
          }
        }
      }
    }

    // Desert cacti
    const cactiPositions = [
      { x: 640, y: 60 }, { x: 700, y: 30 }, { x: 750, y: 80 },
      { x: 670, y: 130 }, { x: 730, y: 170 }, { x: 760, y: 50 },
    ];
    for (const c of cactiPositions) {
      // Simple cactus: green rectangles
      const stem = this.add.rectangle(c.x, c.y, 4, 14, 0x44aa44);
      stem.setDepth(c.y);
      const armL = this.add.rectangle(c.x - 4, c.y - 2, 4, 6, 0x44aa44);
      armL.setDepth(c.y);
      const armR = this.add.rectangle(c.x + 4, c.y - 4, 4, 5, 0x44aa44);
      armR.setDepth(c.y);
      const zone = this.add.zone(c.x, c.y, 6, 12);
      this.obstacles.add(zone);
    }

    // Desert temple entrance (stone pillars and archway)
    const templeX = 692;
    const templeY = 168;
    // Left pillar
    this.add.rectangle(templeX - 18, templeY - 8, 8, 24, 0x8b7355).setDepth(templeY + 10);
    this.add.rectangle(templeX - 18, templeY - 22, 10, 6, 0x9a8466).setDepth(templeY + 11);
    // Right pillar
    this.add.rectangle(templeX + 18, templeY - 8, 8, 24, 0x8b7355).setDepth(templeY + 10);
    this.add.rectangle(templeX + 18, templeY - 22, 10, 6, 0x9a8466).setDepth(templeY + 11);
    // Arch top
    this.add.rectangle(templeX, templeY - 22, 44, 6, 0x9a8466).setDepth(templeY + 12);
    // Dark entrance
    this.add.rectangle(templeX, templeY, 24, 14, 0x222211).setDepth(templeY - 1);
    // Obstacle zones for pillars
    const pillarL = this.add.zone(templeX - 18, templeY - 8, 8, 24);
    this.obstacles.add(pillarL);
    const pillarR = this.add.zone(templeX + 18, templeY - 8, 8, 24);
    this.obstacles.add(pillarR);

    // Forest extra trees (dense west forest) — use oak-tree sprites
    const forestTrees = [
      { x: 30, y: 280 }, { x: 60, y: 320 }, { x: 40, y: 360 },
      { x: 80, y: 400 }, { x: 50, y: 440 }, { x: 100, y: 350 },
      { x: 20, y: 480 }, { x: 70, y: 520 },
    ];
    for (const t of forestTrees) {
      const tree = this.add.image(t.x, t.y - 12, 'oak-tree-small');
      tree.setScale(0.6);
      tree.setDepth(t.y + 1);
      const zone = this.add.zone(t.x, t.y, 10, 12);
      this.obstacles.add(zone);
    }

    // Dirt path from spawn area to Bob's house
    const pathTiles = [];
    for (let x = 12; x <= 29; x++) {
      pathTiles.push([x, 7], [x, 8]);
    }
    for (let y = 3; y <= 7; y++) {
      pathTiles.push([28, y], [29, y]);
    }
    for (const [px, py] of pathTiles) {
      this.add.image(px * ts, py * ts, 'path-middle').setOrigin(0, 0);
    }

    // Small pond
    const pondTiles = [
      [35, 17], [36, 17],
      [34, 18], [35, 18], [36, 18], [37, 18],
      [35, 19], [36, 19],
    ];
    for (const [px, py] of pondTiles) {
      this.add.image(px * ts, py * ts, 'water-middle').setOrigin(0, 0);
      const zone = this.add.zone(px * ts + ts / 2, py * ts + ts / 2, ts, ts);
      this.obstacles.add(zone);
    }

    // Pond visit zone (larger area around the pond for exploration quest)
    // Overlap is set up later in create() after player exists
    this.pondVisitZone = this.add.zone(35.5 * ts, 18 * ts, 6 * ts, 5 * ts);
    this.physics.add.existing(this.pondVisitZone, true);
    this._pondVisited = false;

    // Flowers
    const flowers = [
      { x: 120, y: 180, color: 0xff6b6b },
      { x: 280, y: 160, color: 0xffdd44 },
      { x: 420, y: 355, color: 0xff88cc },
      { x: 560, y: 420, color: 0x88ccff },
      { x: 180, y: 385, color: 0xffdd44 },
      { x: 650, y: 280, color: 0xff6b6b },
      { x: 330, y: 140, color: 0xff88cc },
      { x: 480, y: 520, color: 0x88ccff },
      { x: 720, y: 320, color: 0xffdd44 },
      { x: 60, y: 400, color: 0xff6b6b },
    ];
    for (const f of flowers) {
      this.add.circle(f.x, f.y + 2, 1, 0x44aa44).setDepth(1);
      this.add.circle(f.x, f.y, 2, f.color).setDepth(2);
    }

    // Cave entrance visual
    const caveX = 60;
    const caveY = 88;
    this.add.rectangle(caveX, caveY, 28, 20, 0x3a2a1a).setDepth(caveY - 1);
    this.add.rectangle(caveX, caveY - 10, 30, 6, 0x555544).setDepth(caveY);
    this.add.text(caveX, caveY - 18, 'CAVE', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#888866',
    }).setOrigin(0.5).setDepth(caveY + 1);

    // Forest entrance — wide dirt path with trees flanking
    const forestX = 80;
    const forestY = 420;
    // Dirt path leading south
    for (let i = -2; i <= 2; i++) {
      this.add.image(forestX + i * 16, forestY, 'path-middle').setOrigin(0.5);
      this.add.image(forestX + i * 16, forestY + 16, 'path-middle').setOrigin(0.5);
    }
    // Flanking trees
    this.add.image(forestX - 30, forestY - 8, 'oak-tree-small').setScale(0.6).setDepth(forestY + 2);
    this.add.image(forestX + 30, forestY - 8, 'oak-tree-small').setScale(0.6).setDepth(forestY + 2);
    this.add.text(forestX, forestY - 20, 'FOREST', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#668866',
    }).setOrigin(0.5).setDepth(forestY + 3);

    // Signpost near forest entrance
    this.add.rectangle(120, 410, 2, 12, 0x664422).setDepth(411);
    this.add.rectangle(120, 404, 24, 8, 0x885533).setDepth(412);
    this.add.text(120, 404, '→ Woods', {
      fontSize: '6px', fontFamily: 'Arial, sans-serif', color: '#ddccaa',
    }).setOrigin(0.5).setDepth(413);

    // Teleport stone visual in overworld
    if (map.teleportStone) {
      const ts2 = map.teleportStone;
      // Stone base
      this.add.rectangle(ts2.x, ts2.y + 4, 16, 8, 0x666677).setDepth(ts2.y);
      // Crystal
      this.add.triangle(ts2.x, ts2.y - 4, -4, 6, 4, 6, 0, -6, 0x4488ff).setDepth(ts2.y + 1);
      // Pulsing glow
      const glow = this.add.circle(ts2.x, ts2.y - 4, 8, 0x4488ff, 0.2).setDepth(ts2.y - 1);
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
      // Label
      this.add.text(ts2.x, ts2.y + 12, ts2.name, {
        fontSize: '6px', fontFamily: 'Arial, sans-serif', color: '#88aaff', stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(ts2.y + 2);
    }

    // Rocks
    const rocks = [
      { x: 340, y: 280 },
      { x: 500, y: 385 },
      { x: 620, y: 155 },
      { x: 160, y: 460 },
      { x: 740, y: 520 },
    ];
    for (const r of rocks) {
      const rock = this.add.ellipse(r.x, r.y, 8, 5, 0x777777);
      rock.setDepth(r.y);
      const highlight = this.add.ellipse(r.x - 1, r.y - 1, 4, 2, 0x999999);
      highlight.setDepth(r.y + 1);
      const zone = this.add.zone(r.x, r.y, 6, 4);
      this.obstacles.add(zone);
    }
  }

  _decorateForest() {
    // Scattered small trees and mushrooms on walkable tiles
    const forestDecorations = [
      { x: 180, y: 60, type: 'mushroom' },
      { x: 300, y: 100, type: 'mushroom' },
      { x: 100, y: 220, type: 'log' },
      { x: 350, y: 300, type: 'mushroom' },
      { x: 200, y: 350, type: 'log' },
      { x: 450, y: 200, type: 'mushroom' },
      { x: 280, y: 450, type: 'log' },
      { x: 150, y: 480, type: 'mushroom' },
    ];
    for (const d of forestDecorations) {
      if (d.type === 'mushroom') {
        this.add.circle(d.x, d.y + 2, 2, 0x885533).setDepth(d.y);
        this.add.circle(d.x, d.y, 3, 0xcc4444).setDepth(d.y + 1);
        this.add.circle(d.x - 1, d.y - 1, 1, 0xffdddd).setDepth(d.y + 2);
      } else if (d.type === 'log') {
        this.add.rectangle(d.x, d.y, 18, 5, 0x664422).setDepth(d.y);
        this.add.rectangle(d.x, d.y - 1, 16, 3, 0x885533).setDepth(d.y + 1);
      }
    }
    // Flowers in forest clearings
    const forestFlowers = [
      { x: 200, y: 120, color: 0xff88cc },
      { x: 350, y: 250, color: 0xffdd44 },
      { x: 120, y: 360, color: 0x88ccff },
      { x: 400, y: 350, color: 0xff6b6b },
      { x: 260, y: 500, color: 0xffdd44 },
    ];
    for (const f of forestFlowers) {
      this.add.circle(f.x, f.y + 2, 1, 0x44aa44).setDepth(1);
      this.add.circle(f.x, f.y, 2, f.color).setDepth(2);
    }
    // Path stones between entrances
    const pathStones = [
      { x: 320, y: 520 }, { x: 300, y: 500 }, { x: 280, y: 480 },
      { x: 260, y: 460 }, { x: 240, y: 440 }, { x: 220, y: 420 },
      { x: 200, y: 400 }, { x: 180, y: 380 }, { x: 170, y: 350 },
      { x: 160, y: 320 }, { x: 155, y: 280 }, { x: 155, y: 240 },
      { x: 155, y: 200 }, { x: 155, y: 160 }, { x: 155, y: 120 },
      { x: 155, y: 80 }, { x: 155, y: 50 },
    ];
    for (const s of pathStones) {
      this.add.rectangle(s.x, s.y, 6, 4, 0x887766, 0.5).setDepth(0);
    }
  }

  _decorateTown2(map) {
    // Town paths
    const pathAreas = [
      // Main east-west path
      { x1: 0, y1: 13, x2: 35, y2: 15 },
      // Path to shop
      { x1: 16, y1: 6, x2: 19, y2: 13 },
      // Path to inn
      { x1: 25, y1: 11, x2: 28, y2: 15 },
    ];
    const ts = map.tileSize;
    for (const p of pathAreas) {
      for (let row = p.y1; row < p.y2; row++) {
        for (let col = p.x1; col < p.x2; col++) {
          this.add.image(col * ts, row * ts, 'path-middle').setOrigin(0, 0);
        }
      }
    }

    // Flowers
    const flowers = [
      { x: 140, y: 150, color: 0xff88cc },
      { x: 350, y: 120, color: 0xffdd44 },
      { x: 200, y: 320, color: 0x88ccff },
      { x: 400, y: 340, color: 0xff6b6b },
    ];
    for (const f of flowers) {
      this.add.circle(f.x, f.y + 2, 1, 0x44aa44).setDepth(1);
      this.add.circle(f.x, f.y, 2, f.color).setDepth(2);
    }

    // Fences
    const fencePositions = [
      { x: 100, y: 100, w: 60 },
      { x: 400, y: 280, w: 40 },
    ];
    for (const fence of fencePositions) {
      for (let i = 0; i < fence.w; i += 8) {
        // Post
        this.add.rectangle(fence.x + i, fence.y, 2, 8, 0x885533).setDepth(fence.y);
        // Rail
        this.add.rectangle(fence.x + i + 4, fence.y - 2, 8, 2, 0x996644).setDepth(fence.y);
      }
      const zone = this.add.zone(fence.x + fence.w / 2, fence.y, fence.w, 8);
      this.obstacles.add(zone);
    }

    // Teleport stone visual
    if (map.teleportStone) {
      const ts2 = map.teleportStone;
      this.add.rectangle(ts2.x, ts2.y + 4, 16, 8, 0x666677).setDepth(ts2.y);
      this.add.triangle(ts2.x, ts2.y - 4, -4, 6, 4, 6, 0, -6, 0x4488ff).setDepth(ts2.y + 1);
      const glow = this.add.circle(ts2.x, ts2.y - 4, 8, 0x4488ff, 0.2).setDepth(ts2.y - 1);
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
      this.add.text(ts2.x, ts2.y + 12, ts2.name, {
        fontSize: '6px', fontFamily: 'Arial, sans-serif', color: '#88aaff', stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(ts2.y + 2);
    }

    // Welcome sign
    this.add.rectangle(160, 200, 2, 12, 0x664422).setDepth(201);
    this.add.rectangle(160, 194, 36, 10, 0x885533).setDepth(202);
    this.add.text(160, 194, 'Woodhaven', {
      fontSize: '6px', fontFamily: 'Arial, sans-serif', color: '#ddccaa',
    }).setOrigin(0.5).setDepth(203);
  }

  _spawnTeleportStone() {
    const map = this.mapData;
    if (!map.teleportStone) return;

    const ts = map.teleportStone;
    // Create overlap zone for the teleport stone
    this.teleportStoneZone = this.add.zone(ts.x, ts.y, 24, 24);
    this.physics.add.existing(this.teleportStoneZone, true);
    this.teleportStoneZone.stoneName = ts.name;
    this.teleportStoneZone.stoneMap = map.name;

    this.physics.add.overlap(this.player, this.teleportStoneZone, () => {
      this._nearTeleportStone = true;
    });
    this._nearTeleportStone = false;
  }

  _handleTeleportStone() {
    if (!this._nearTeleportStone || !this.teleportStoneZone) return;
    this._nearTeleportStone = false; // reset each frame, re-set by overlap

    if (!Phaser.Input.Keyboard.JustDown(this.interactKey)) return;

    const mapName = this.teleportStoneZone.stoneMap;
    const stoneName = this.teleportStoneZone.stoneName;

    if (!this.unlockedTeleports.includes(mapName)) {
      // Unlock this teleport
      this.unlockedTeleports.push(mapName);
      this.sfx.play('wizardTeleport');
      this.showNotification(`Teleport unlocked: ${stoneName}!`);
      // Flash the stone
      const flash = this.add.circle(this.teleportStoneZone.x, this.teleportStoneZone.y - 4, 16, 0x4488ff, 0.6);
      flash.setDepth(10000);
      this.tweens.add({ targets: flash, alpha: 0, radius: 30, duration: 500, onComplete: () => flash.destroy() });
    } else {
      this.showNotification('Teleport stone active.\nOpen map (M) to teleport.');
    }
  }

  _teleportTo(targetMapName) {
    const targetMap = MAPS[targetMapName];
    if (!targetMap || !targetMap.teleportStone) return;

    this.sfx.play('wizardTeleport');
    if (this.music) this.music.fadeOut(0.3);

    const questState = this.questManager.saveState();
    const playerHealth = this.player.health;

    this._irisWipeOut(() => {
      this.scene.stop('UI');
      this.scene.restart({
        mapData: {
          ...targetMap,
          playerSpawn: { x: targetMap.teleportStone.x, y: targetMap.teleportStone.y + 16 },
        },
        questState: questState,
        playerHealth: playerHealth,
        gold: this.gold,
        xp: this.xp,
        level: this.level,
        inventory: this.inventory.saveState(),
        dayTime: this.dayTime,
        equipment: this.equipment.saveState(),
        openedChests: this._getOpenedChests(),
        trackedQuestId: this.trackedQuestId,
        bestiary: this.bestiary,
        timedQuestId: this._timedQuestId,
        timedRemaining: this._timedRemaining,
        tutorialShown: this.tutorialShown,
        escortActive: this._escortActive,
        escortNpcId: this._escortNPC ? this._escortNPC.npcId : null,
        playerAttackBonus: this.playerAttackBonus,
        unlockedTeleports: this.unlockedTeleports,
      });
    });
  }

  spawnTown2NPCs() {
    // Guard NPC
    const guard = new NPC(this, 180, 240, 'lumberjack-jack', {
      id: 'town2_guard',
      name: 'Guard',
      idleAnim: 'npc-jack-idle-down',
      dialogueLines: [
        'Welcome to Woodhaven!\nWe\'re a quiet forest village.',
        'The forest to the west\nis dangerous. Be careful!',
      ],
    });
    guard.setTint(0x8888cc); // Blue tint for guard
    this.npcs.add(guard);

    // Villager NPC
    const villager = new NPC(this, 350, 300, 'farmer-buba', {
      id: 'town2_villager',
      name: 'Elder Moss',
      idleAnim: 'npc-buba-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 25,
      wanderAnims: { down: 'npc-buba-walk-down', right: 'npc-buba-walk-right', up: 'npc-buba-walk-up' },
      dialogueLines: [
        'Woodhaven was founded by\ntravelers who braved the forest.',
        'The teleport stones were built\nby ancient wizards long ago.',
        'Trade between our towns keeps\nus all prosperous!',
      ],
    });
    villager.setTint(0x99bb99); // Green tint for elder
    this.npcs.add(villager);
  }

  _getVariedDialogue(npc, defaultLines) {
    const npcDialogues = {
      farmer_bob: [
        'These crops won\'t tend themselves!',
        'Watch out for skeletons in the fields.',
        'I heard strange sounds from the cave...',
      ],
      miner_mike: [
        'The mines are getting dangerous.',
        'I found some gold ore yesterday!',
        'Be careful in the caves, adventurer.',
      ],
      fisherman_fin: [
        'The fish are biting today!',
        'There\'s something big in the deep water...',
        'A good day for fishing!',
      ],
      chef_chloe: [
        'I\'ve been cooking all day!',
        'The inn needs fresh supplies.',
        'Have you tried the stew?',
      ],
      ranger_reed: [
        'The forest grows more dangerous...',
        'I\'ve seen orc tracks near the entrance.',
        'Stay sharp out there!',
      ],
      lumberjack_jack: [
        'These trees are ancient...',
        'I lost my axe somewhere in the dungeon.',
        'The forest hides many secrets.',
      ],
    };

    const extraLines = npcDialogues[npc.npcId];
    if (!extraLines) return defaultLines;

    // Track dialogue index per NPC
    if (!npc._dialogueIndex) npc._dialogueIndex = 0;
    npc._dialogueIndex++;

    // Time-aware greeting
    let greeting = '';
    if (this.dayTime < 0.3) greeting = 'Good morning! ';
    else if (this.dayTime > 0.7) greeting = 'Good evening! ';
    else greeting = 'Hello! ';

    const lineIndex = (npc._dialogueIndex - 1) % extraLines.length;
    return [greeting + extraLines[lineIndex]];
  }

  _handleBedRest() {
    if (this.mapData.name !== 'house_interior') return false;
    let found = false;
    this.obstacles.getChildren().forEach((zone) => {
      if (!zone.isBed) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (d < 35 && !found) {
        found = true;
        this.showDialogue(['Rest until morning?\nYou feel at home here.'], () => {
          // Restore 2 HP and set time to dawn
          const healed = Math.min(2, this.player.maxHealth - this.player.health);
          if (healed > 0) {
            this.player.health += healed;
            this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          }
          this.dayTime = 0.3; // dawn
          // Rest visual
          const cam = this.cameras.main;
          const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0)
            .setScrollFactor(0).setDepth(12000);
          const text = this.add.text(cam.width / 2, cam.height / 2, 'Zzz...', {
            fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
            fontStyle: 'bold',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(12001).setAlpha(0);
          this.tweens.add({
            targets: overlay, alpha: 1, duration: 300,
            onComplete: () => {
              this.tweens.add({ targets: text, alpha: 1, duration: 200 });
              this.time.delayedCall(500, () => {
                this.sfx.play('potionUse');
                this.tweens.add({
                  targets: [overlay, text], alpha: 0, duration: 300,
                  onComplete: () => {
                    overlay.destroy();
                    text.destroy();
                    const msg = healed > 0 ? `Rested! +${healed} HP` : 'Rested until morning.';
                    this.showNotification(msg);
                  },
                });
              });
            },
          });
        });
      }
    });
    return found;
  }

  _handleBookshelf() {
    const loreLines = [
      'The ancient texts speak of three great evils sealed in dungeons beneath the land...',
      'Long ago, a wizard named Paul watched over these lands. His magic keeps the balance.',
      'Legends tell of a warrior who will rise to vanquish darkness and restore peace.',
    ];
    // Check if player is near any bookshelf obstacle
    let found = false;
    this.obstacles.getChildren().forEach((zone) => {
      if (!zone.bookshelf) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (d < 30 && !found) {
        found = true;
        const line = loreLines[Math.floor(Math.random() * loreLines.length)];
        this.showDialogue([line], null, 'Book');
      }
    });
    return found;
  }

  _showTutorial() {
    this.physics.pause();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(15000);
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    container.add(overlay);

    const title = this.add.text(w / 2, 20, 'CONTROLS', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffdd00',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(title);

    const controls = [
      'WASD: Move',
      'SPACE: Attack',
      'E: Interact',
      'F: Cast Spell',
      'TAB: Cycle Spell',
      'ESC: Menu',
      'M: Map',
    ];
    const controlText = this.add.text(w / 2, 50, controls.join('\n'), {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2, lineSpacing: 6, align: 'center',
    }).setOrigin(0.5, 0);
    container.add(controlText);

    const prompt = this.add.text(w / 2, h - 16, 'Press any key to continue', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#aaaaaa',
    }).setOrigin(0.5);
    container.add(prompt);
    this.tweens.add({
      targets: prompt, alpha: { from: 1, to: 0.3 },
      duration: 600, yoyo: true, repeat: -1,
    });

    this.input.keyboard.once('keydown', () => {
      container.destroy();
      this.tutorialShown = true;
      this.physics.resume();
    });
  }

  update(time, delta) {
    // Pause menu
    // Game menu handles its own input when open
    if (this.gameMenu.visible) return;

    if (Phaser.Input.Keyboard.JustDown(this.escKey) && !this.inDialogue && !this._shopActive && !this.overlayOpen) {
      this.sfx.play('select');
      this.gameMenu.open(0); // Stats tab
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.questKey) && !this.inDialogue && !this._shopActive && !this.overlayOpen) {
      this.sfx.play('select');
      this.gameMenu.open(1); // Quests tab
      return;
    }

    // Handle overlay toggles
    if (Phaser.Input.Keyboard.JustDown(this.mapKey) && !this.inDialogue) {
      this.overlayOpen = this.mapOverlay.toggle(
        this.player.x, this.player.y,
        this.worldWidth, this.worldHeight,
        this.isOverworld ? this.npcs : null,
        this.isOverworld ? this.questManager : null,
        this.mapData.name,
        this.unlockedTeleports
      );
      return;
    }

    // Block input while overlay is open (but handle teleport)
    if (this.overlayOpen) {
      this.mapOverlay.handleInput();
      if (this.mapOverlay._pendingTeleport) {
        const dest = this.mapOverlay._pendingTeleport;
        this.mapOverlay._pendingTeleport = null;
        this.mapOverlay.hide();
        this.overlayOpen = false;
        this._teleportTo(dest);
      }
      return;
    }

    // Teleport stone interaction
    this._handleTeleportStone();
    this._nearTeleportStone = false; // Reset each frame

    // Shop menu input
    if (this._shopActive) {
      if (Phaser.Input.Keyboard.JustDown(this._shopEscKey)) {
        this.closeShop();
        return;
      }
      for (let i = 0; i < this.itemKeys.length; i++) {
        if (Phaser.Input.Keyboard.JustDown(this.itemKeys[i])) {
          this.handleShopBuy(i);
          return;
        }
      }
      if (this._shopExtraKeys) {
        for (let i = 0; i < this._shopExtraKeys.length; i++) {
          if (Phaser.Input.Keyboard.JustDown(this._shopExtraKeys[i])) {
            this.handleShopBuy(3 + i);
            return;
          }
        }
      }
      return;
    }

    // During dialogue, only allow advancing
    if (this.inDialogue) {
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.player.attackKey)) {
        this.advanceDialogue();
      }
      return;
    }

    this.player.update(time, delta);

    // Item hotbar
    for (let i = 0; i < this.itemKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.itemKeys[i])) {
        this.useItem(i);
      }
    }

    // Fishing minigame update
    if (this.fishingGame.active) {
      this.fishingGame.update(delta);
      return;
    }

    // Spell cycling with Tab
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      const available = this.spells.filter(s => this.level >= s.minLevel);
      if (available.length > 1) {
        this.currentSpellIndex = (this.currentSpellIndex + 1) % this.spells.length;
        // Skip spells above player level
        while (this.level < this.spells[this.currentSpellIndex].minLevel) {
          this.currentSpellIndex = (this.currentSpellIndex + 1) % this.spells.length;
        }
        const spell = this.spells[this.currentSpellIndex];
        this.showNotification(`Spell: ${spell.name}`);
        this.sfx.play('select');
        this.events.emit('spell-changed', this.currentSpellIndex, spell);
      }
    }

    // Heal cooldown
    if (this._healCooldown > 0) this._healCooldown -= delta;
    if (this._spellCooldown > 0) this._spellCooldown -= delta;

    // Magic attack
    const currentSpell = this.spells[this.currentSpellIndex];
    if (Phaser.Input.Keyboard.JustDown(this.magicKey) && this._spellCooldown <= 0) {
      if (currentSpell && this.player.mana >= currentSpell.manaCost && this.level >= currentSpell.minLevel) {
        this._spellCooldown = 500;
        this._castMagic();
      } else if (currentSpell && this.level < currentSpell.minLevel) {
        this.sfx.play('menuCancel');
        this.showNotification(`Spell locked! (Lv.${currentSpell.minLevel} required)`);
      } else if (currentSpell && this.player.mana < currentSpell.manaCost) {
        this.sfx.play('menuCancel');
        this.showNotification('Not enough mana!');
      }
    }

    // NPC interaction / chest / fishing
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      // Priority: NPC > Chest > Fishing
      let npcNearby = false;
      this.npcs.getChildren().forEach((n) => { if (n.canInteract) npcNearby = true; });
      if (npcNearby) {
        this.handleNPCInteraction();
      } else if (this.handleChestOpen()) {
        // Chest was opened
      } else if (this._handleBedRest()) {
        // Bed rest interaction
      } else if (this._handleBookshelf()) {
        // Bookshelf was read
      } else if (this._nearPond && this.isOverworld) {
        this.fishingGame.start();
      }
    }

    // Update NPCs
    this.npcs.getChildren().forEach((npc) => {
      if (npc.update && !npc._isEscorted) {
        npc.update(time, delta, this.player, this.questManager, this.dayTime);
      }
    });

    // Escort quest update
    this._updateEscort(delta);

    // Timed quest update
    this._updateTimedQuest(delta);

    // Update enemies
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) {
        enemy.update(time, delta, this.player);
      }
    });

    // Update chickens
    this.chickens.getChildren().forEach((chicken) => {
      if (chicken.update && !chicken.collected) {
        chicken.update(time, delta);
      }
    });

    // Update pet
    if (this.pet) {
      this.pet.update(time, delta, this.player);
      this.pet.collectNearbyLoot(this);
      // Pet bark ability (P key)
      if (Phaser.Input.Keyboard.JustDown(this.petBarkKey)) {
        this.pet.bark(this);
      }
    }

    // Update chests
    this.chests.getChildren().forEach((c) => {
      if (c.update && !c.opened) c.update(time, delta, this.player);
    });

    // Update unicorns
    this.unicorns.getChildren().forEach((u) => {
      if (u.update) u.update(time, delta);
    });

    // Update fairies
    this.fairies.getChildren().forEach((f) => {
      if (f.update && !f.buffGiven) f.update(time, delta);
    });

    // Ghost night spawning/despawning
    if (this._ghostSpawns && this.isOverworld) {
      if (this.isNight && !this._ghostsSpawned) {
        this._ghostsSpawned = true;
        for (const pos of this._ghostSpawns) {
          const ghost = new Ghost(this, pos.x, pos.y);
          this.ghosts.add(ghost);
          this.enemies.add(ghost);
        }
      } else if (!this.isNight && this._ghostsSpawned) {
        this._ghostsSpawned = false;
        // Fade out and destroy ghosts at dawn — remove from both groups
        const ghostList = [...this.ghosts.getChildren()];
        for (const g of ghostList) {
          if (g._destroyVisuals) g._destroyVisuals();
          this.enemies.remove(g, true);
          this.ghosts.remove(g, true);
          g.destroy();
        }
      }
    }

    // Update ghosts
    this.ghosts.getChildren().forEach((g) => {
      if (g.update && g.health > 0) g.update(time, delta, this.player);
    });

    // Process respawn queue
    if (this.respawnQueue) {
      for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
        this.respawnQueue[i].timer -= delta;
        if (this.respawnQueue[i].timer <= 0) {
          const spawn = this.respawnQueue.splice(i, 1)[0];
          // Only respawn if player is far enough away
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, spawn.x, spawn.y);
          if (dist > 120) {
            if (spawn.type === 'skeleton') {
              this.spawnSkeleton(spawn.x, spawn.y);
            } else if (spawn.type === 'goblin') {
              this.spawnGoblin(spawn.x, spawn.y);
            } else if (spawn.type === 'orc') {
              this.spawnOrc(spawn.x, spawn.y);
            } else if (spawn.type === 'bat') {
              const bat = new Bat(this, spawn.x, spawn.y);
              this.enemies.add(bat);
            } else if (spawn.type === 'scorpion') {
              this.spawnScorpion(spawn.x, spawn.y);
            } else if (spawn.type === 'ghost') {
              const ghost = new Ghost(this, spawn.x, spawn.y);
              this.enemies.add(ghost);
              this.ghosts.add(ghost);
            } else {
              this.spawnSlime(spawn.x, spawn.y);
            }
          } else {
            // Too close, retry in 10 seconds
            spawn.timer = 10000;
            this.respawnQueue.push(spawn);
          }
        }
      }
    }

    // Day/night cycle update
    if (this.dayOverlay) {
      this.dayTime += (delta / 1000) * this.daySpeed;
      if (this.dayTime >= 1) this.dayTime -= 1;
      this._updateDayNight();
    }

    // Footstep dust particles
    this._dustTimer = (this._dustTimer || 0) - delta;
    if (this._dustTimer <= 0 && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
      this._dustTimer = 180;
      const dust = this.add.circle(
        this.player.x + (Math.random() - 0.5) * 4,
        this.player.y + 6,
        1.5,
        this.isCave ? 0x665544 : (this.isTemple ? 0xddcc88 : 0xccbb99),
        0.5
      );
      dust.setDepth(this.player.y - 1);
      this.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 2,
        y: dust.y + 3,
        duration: 300,
        onComplete: () => dust.destroy(),
      });
    }

    // Check if near pond for fishing
    if (this.isOverworld) {
      const pondCX = 35.5 * 16;
      const pondCY = 18 * 16;
      const dPond = Phaser.Math.Distance.Between(this.player.x, this.player.y, pondCX, pondCY);
      this._nearPond = dPond < 50;
    }

    // Water shimmer (overworld)
    if (this.isOverworld) {
      this._shimmerTimer = (this._shimmerTimer || 0) - delta;
      if (this._shimmerTimer <= 0) {
        this._shimmerTimer = 800;
        // Pond center area
        const sx = 35 * 16 + Math.random() * 48;
        const sy = 17 * 16 + Math.random() * 48;
        const sparkle = this.add.circle(sx, sy, 1, 0xffffff, 0.6);
        sparkle.setDepth(sy + 1);
        this.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 0.3,
          duration: 600,
          onComplete: () => sparkle.destroy(),
        });
      }
    }

    // Ambient particles
    this._ambientTimer = (this._ambientTimer || 0) - delta;
    if (this._ambientTimer <= 0) {
      const cam = this.cameras.main;
      const cx = cam.scrollX + cam.width / 2;
      const cy = cam.scrollY + cam.height / 2;

      if (this.isOverworld && this.isNight) {
        // Night fireflies: yellow-green dots with sine-wave drift
        this._ambientTimer = 600;
        const fx = cx + (Math.random() - 0.5) * cam.width;
        const fy = cy + (Math.random() - 0.5) * cam.height;
        const firefly = this.add.circle(fx, fy, 1.5, 0xccff44, 0);
        firefly.setDepth(9990);
        this.tweens.add({
          targets: firefly,
          alpha: { from: 0, to: 0.7 },
          x: fx + (Math.random() - 0.5) * 20,
          y: fy + Math.sin(Math.random() * Math.PI * 2) * 12,
          duration: 1500, yoyo: true,
          onComplete: () => firefly.destroy(),
        });
      } else if (this.isCave) {
        // Cave dust: gray particles drifting down
        this._ambientTimer = 800;
        const dx = cx + (Math.random() - 0.5) * cam.width;
        const dy = cy + (Math.random() - 0.5) * cam.height * 0.5;
        const dust = this.add.circle(dx, dy, 1, 0x888888, 0.4);
        dust.setDepth(9990);
        this.tweens.add({
          targets: dust,
          y: dy + 20 + Math.random() * 15,
          alpha: 0, duration: 2000,
          onComplete: () => dust.destroy(),
        });
      } else if (this.isTemple) {
        // Desert/temple sand: tan particles drifting horizontally
        this._ambientTimer = 700;
        const sx = cx - cam.width / 2;
        const sy = cy + (Math.random() - 0.5) * cam.height;
        const sand = this.add.circle(sx, sy, 1, 0xddbb77, 0.35);
        sand.setDepth(9990);
        this.tweens.add({
          targets: sand,
          x: sx + cam.width * 0.6,
          y: sy + (Math.random() - 0.5) * 10,
          alpha: 0, duration: 2500,
          onComplete: () => sand.destroy(),
        });
      } else {
        this._ambientTimer = 1000; // No particles for other maps
      }
    }

    // Cave darkness update
    if (this.darknessRT) {
      const cam = this.cameras.main;
      this.darknessRT.fill(0x000000, 0.92);
      // Player screen position relative to camera viewport
      const px = this.player.x - cam.scrollX;
      const py = this.player.y - cam.scrollY;
      // Light radius scales with mana (60-100px)
      const manaRatio = this.player.mana / this.player.maxMana;
      const lightScale = 0.6 + manaRatio * 0.4; // 0.6 to 1.0
      this.darknessRT.erase('torch-light', px - 80 * lightScale, py - 80 * lightScale);
    }

    // Depth sort
    this.player.setDepth(this.player.y);
    this.enemies.getChildren().forEach((e) => e.setDepth(e.y));
  }
}
