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
import { IceWitch } from '../entities/IceWitch.js';
import { SeaSerpent } from '../entities/SeaSerpent.js';
import { DeathKnight } from '../entities/DeathKnight.js';
import { LichKing } from '../entities/LichKing.js';
import { GoblinArcher } from '../entities/GoblinArcher.js';
import { MATERIAL_DROPS } from '../data/CraftingRecipes.js';
import { CRAFTING_RECIPES } from '../data/CraftingRecipes.js';

// Unified enemy reward table — used by both sword kills and magic kills
const ENEMY_REWARDS = {
  skeleton: { gold: 5, xp: 15 },
  slime: { gold: 2, xp: 8 },
  bat: { gold: 3, xp: 10 },
  ghost: { gold: 8, xp: 25 },
  scorpion: { gold: 6, xp: 18 },
  goblin: { gold: 4, xp: 12 },
  orc: { gold: 7, xp: 20 },
  goblin_archer: { gold: 6, xp: 18 },
  yeti: { gold: 10, xp: 30 },
  ice_skeleton: { gold: 5, xp: 15 },
  pirate_ghost: { gold: 8, xp: 25 },
  sea_wraith: { gold: 8, xp: 25 },
  zombie: { gold: 4, xp: 12 },
  undead_knight: { gold: 9, xp: 28 },
};

// Achievement definitions (shared with GameMenu)
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
    this.isNewGamePlus = data.isNewGamePlus || false;
    this.savedStarFragments = data.starFragments || 0;
    this.savedMaterials = data.materials || {};
    this.savedDarkSeals = data.darkSeals || 0;
    this.savedPetAffection = data.petAffection || 0;
    this.savedVisitedChunks = data.visitedChunks || {};
    this.savedLichTowerUnlocked = data.lichTowerUnlocked || false;
    this.savedAchievements = data.achievements || {};
    this.savedCraftCount = data._craftCount || 0;
    this.savedFishCount = data._fishCount || 0;
    this.savedTotalGoldEarned = data._totalGoldEarned || 0;
    this.savedWeather = data.weather || 'clear';
    this.savedRegenBonus = data._regenBonus || 0;
    this.savedNpcAffection = data.npcAffection || {};
    this.savedStoryChoices = data.storyChoices || {};
    this.savedNpcGiftGiven = data.npcGiftGiven || {};
    this.savedFishLuckBonus = data.fishLuckBonus || false;
    this.savedJackTreeChoice = data.jackTreeChoice || null;
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
    this.isMountain = map.name === 'mountain' || map.name === 'mountain_cave';
    this.isHarbor = map.name === 'harbor' || map.name === 'sea_cave';
    this.isRuins = map.name === 'ruins' || map.name === 'ruins_dungeon';
    this.isLichTower = map.name === 'lich_tower';

    // SFX
    this.sfx = this.registry.get('sfx') || new SFX();

    // Music - persist across map transitions via registry
    if (!this.registry.get('music')) {
      this.registry.set('music', new Music());
    }
    this.music = this.registry.get('music');
    // Volume/mute preferences are applied by Music.init() when context is created

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

    // New biome NPCs
    if (map.name === 'mountain') this.spawnMountainNPCs();
    if (map.name === 'harbor') this.spawnHarborNPCs();
    if (map.name === 'ruins') this.spawnRuinsNPCs();

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
        const bossNames = {
          pharaoh: 'The Pharaoh', skeleton_king: 'The Skeleton King', orc_chief: 'The Orc Chief',
          ice_witch: 'The Ice Witch', sea_serpent: 'The Sea Serpent',
          death_knight: 'The Death Knight', lich_king: 'THE LICH KING',
        };
        const bossName = bossNames[map.bossType] || 'A powerful foe';
        this.showNotification(`${bossName} awaits...`);
        this.cameras.main.shake(200, 0.008);
      });
    }

    // Arena crystal (boss_room, after Skeleton King defeated)
    this._arenaWave = 0;
    this._arenaActive = false;
    this._arenaCrystal = null;
    if (map.arenaProps) {
      const caveQuest = this.questManager.getQuest('clear_cave');
      if (caveQuest && (caveQuest.state === 'completed' || caveQuest.state === 'ready')) {
        this._spawnArenaCrystal(map.arenaProps);
      }
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

    // Gamepad menu event (from Player.js)
    this.events.on('gamepad-menu', () => {
      if (!this.gameMenu.visible && !this.inDialogue && !this._shopActive && !this.overlayOpen) {
        this.sfx.play('select');
        this.gameMenu.open(0);
      }
    });

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

    // Spell system: Fireball (lv1), Ice Bolt (lv3), Heal (lv5), Chain Lightning (lv7)
    this.spells = [
      { name: 'Fireball', color: 0xff6622, manaCost: 3, damage: 3, lifetime: 600, minLevel: 1, element: 'fire' },
      { name: 'Ice Bolt', color: 0x44aaff, manaCost: 4, damage: 2, lifetime: 1000, minLevel: 3, slow: true, element: 'ice' },
      { name: 'Heal', color: 0x44ff44, manaCost: 7, healAmount: 2, cooldown: 3000, minLevel: 5, isHeal: true },
      { name: 'Chain Lightning', color: 0xffee22, manaCost: 4, damage: 3, minLevel: 7, isLightning: true, element: 'lightning' },
    ];
    this.currentSpellIndex = 0;
    this._healCooldown = 0;
    this._spellCooldown = 0;

    // Arrow group for GoblinArcher projectiles
    this.arrowGroup = this.add.group();

    // Elemental arrow key
    this._rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

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

    // Auto-complete 'visit' quests targeting the current map (Phase 14)
    this.time.delayedCall(0, () => {
      const mapName = this.mapData.name;
      this.questManager.getActiveQuests().forEach(q => {
        if (q.objective?.visitMap === mapName && q.state === 'active') {
          q.progress = 1;
          q.state = 'ready';
          this.updateQuestTracker();
        }
      });
      // Forest healing from Jack's purify choice
      if (this.isForest && this._jackTreeChoice === 'purify') {
        this.time.delayedCall(800, () => {
          const healed = Math.min(1, this.player.maxHealth - this.player.health);
          if (healed > 0) {
            this.player.health += healed;
            this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          }
          const ft = this.add.text(this.player.x, this.player.y - 24, 'Ancient tree: +1 HP', {
            fontSize: '8px', fontFamily: 'Arial, sans-serif',
            color: '#44ff88', stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(9999);
          this.tweens.add({ targets: ft, y: ft.y - 20, alpha: 0, duration: 1800, onComplete: () => ft.destroy() });
          this.showNotification('The ancient tree hums with energy.');
        });
      }
    });

    // Star fragments (for true ending)
    this.starFragments = this.savedStarFragments || 0;

    // Phase 12 state
    this.materials = this.savedMaterials || {};
    this.darkSeals = this.savedDarkSeals || 0;
    this.petAffection = this.savedPetAffection || 0;
    this.visitedChunks = this.savedVisitedChunks || {};
    this._lichTowerUnlocked = this.savedLichTowerUnlocked || false;

    // Achievement tracking
    this.achievements = this.savedAchievements || {};
    this._craftCount = this.savedCraftCount || 0;
    this._fishCount = this.savedFishCount || 0;
    this._totalGoldEarned = this.savedTotalGoldEarned || 0;

    // Phase 14: NPC affection & story state
    this.npcAffection = this.savedNpcAffection || {};
    this.storyChoices = this.savedStoryChoices || {};
    this._npcGiftGiven = this.savedNpcGiftGiven || {};
    this._fishLuckBonus = this.savedFishLuckBonus || false;
    this._jackTreeChoice = this.savedJackTreeChoice || null;

    // New Game+ setup
    this._ngpMultiplier = this.isNewGamePlus ? 1.5 : 1;

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

    // Paul random battle assist state
    this._paulHelping = false;
    this._paulHelpCooldown = 0;
    this._paulCombatTimer = 0;
    this._paulHelpThreshold = 20000 + Math.random() * 10000;

    // Fade in (white if rescued by Paul, otherwise smooth black)
    if (this.paulRescued) {
      this.cameras.main.fadeIn(600, 255, 255, 255);
      this.time.delayedCall(800, () => {
        this.showNotification('Paul the Wizard saved you! (-10 gold)');
      });
    } else {
      this._irisWipeIn(map.name);
    }

    // New Game+ notification (overworld only, first load)
    if (this.isNewGamePlus && this.isOverworld) {
      this.time.delayedCall(1000, () => {
        this.showNotification('NEW GAME+ — Enemies are stronger!');
      });
    }

    // NG+ HUD indicator
    if (this.isNewGamePlus) {
      this.add.text(this.cameras.main.width - 4, 42, 'NG+', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: '#dd88ff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(9100);
    }

    // Arrow count state
    this.arrowCount = 0;

    // Wandering merchant state
    this._merchantTimer = 0;
    this._wanderingMerchant = null;
    this._merchantStock = null;
    this._isWanderingMerchantShop = false;

    // Weather state
    this._currentWeather = this.savedWeather || 'clear';
    this._weatherTimer = 0;
    this._weatherParticles = [];
    this._weatherInterval = null;
    this._regenBonus = this.savedRegenBonus || 0;
    if (this._regenBonus > 0) {
      this._regenTimer = this.time.addEvent({
        delay: 5000,
        callback: () => {
          if (this.player && this._regenBonus > 0) {
            const healed = Math.min(this._regenBonus, this.player.maxHealth - this.player.health);
            if (healed > 0) {
              this.player.health += healed;
              this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
            }
          }
        },
        loop: true,
      });
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
      mountain: 'cave',
      mountain_cave: 'boss',
      harbor: 'cave',
      sea_cave: 'boss',
      ruins: 'cave',
      ruins_dungeon: 'boss',
      lich_tower: 'boss',
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
    this.dialogueArrow = this.add.text(w - 10, boxY + boxH - 6, '\u25BC', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b6d4a',
    }).setOrigin(1, 1);
    this.dialogueContainer.add(this.dialogueArrow);

    this.tweens.add({
      targets: this.dialogueArrow,
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
    // Don't advance while in choice mode — keyboard.once handles selection
    if (this._inChoiceMode) return;
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

  // --- Dialogue with branching choices (Phase 14) ---
  showDialogueWithChoice(lines, choices, speakerName, portraitKey) {
    this.showDialogue(lines, () => {
      // After lines complete, reopen the dialogue box for choices
      this._showChoices(choices, speakerName, portraitKey);
    }, speakerName, portraitKey);
  }

  _showChoices(choices, speakerName, portraitKey) {
    this.inDialogue = true;
    this._inChoiceMode = true;
    this.dialogueContainer.setVisible(true);
    this.physics.pause();
    if (this.boss && this.boss.pauseTimers) this.boss.pauseTimers();
    if (this.dialogueArrow) this.dialogueArrow.setVisible(false);

    this.dialogueSpeaker.setText('Choose:');
    const choiceText = choices.map((c, i) => `${i + 1}) ${c.text}`).join('\n');
    this.dialogueText.setText(choiceText);
    this.dialogueCallback = null;

    const _pick = (idx) => {
      cleanup();
      if (this.dialogueArrow) this.dialogueArrow.setVisible(true);
      this._inChoiceMode = false;
      choices[idx].callback();
      this.closeDialogue();
    };

    const onOne = () => _pick(0);
    const onTwo = () => _pick(1);
    const onEsc = () => _pick(0);

    const cleanup = () => {
      this.input.keyboard.off('keydown-ONE', onOne);
      this.input.keyboard.off('keydown-TWO', onTwo);
      this.input.keyboard.off('keydown-ESC', onEsc);
    };

    this.input.keyboard.once('keydown-ONE', onOne);
    this.input.keyboard.once('keydown-TWO', onTwo);
    this.input.keyboard.once('keydown-ESC', onEsc);
  }

  // --- NPC affection helper (Phase 14) ---
  _giveAffection(npcId, amount) {
    this.npcAffection[npcId] = Math.min(100, (this.npcAffection[npcId] || 0) + amount);
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
    } else if (map.floorTile === 'snow-floor') {
      // Mountain snow floor — white/blue checkerboard
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const shade = ((row + col) % 2 === 0) ? 0xddeeff : 0xccddee;
          this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, shade).setDepth(0);
        }
      }
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x99aabb).setDepth(0);
            }
          }
        }
      }
    } else if (map.floorTile === 'harbor-floor') {
      // Harbor — sand floor with blue water edge rows and dock planks
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          let shade;
          if (row < 3 || row >= map.height - 3) {
            // Water rows at top/bottom
            shade = ((col) % 2 === 0) ? 0x3366bb : 0x2255aa;
          } else if ((row + col) % 5 === 0) {
            shade = 0xcc9944; // dock plank
          } else {
            shade = ((row + col) % 2 === 0) ? 0xddbb88 : 0xccaa77; // sand
          }
          this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, shade).setDepth(0);
        }
      }
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x885533).setDepth(0);
            }
          }
        }
      }
    } else if (map.floorTile === 'ruins-floor') {
      // Ruins — dark grey checkerboard with procedural cracks
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const shade = ((row + col) % 2 === 0) ? 0x555566 : 0x444455;
          this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, shade).setDepth(0);
          // Procedural crack decoration on every ~13th tile
          if ((row * 7 + col * 11) % 13 === 0) {
            const cx = col * ts + ts / 2;
            const cy = row * ts + ts / 2;
            const crack = this.add.graphics().setDepth(1);
            crack.lineStyle(1, 0x222233, 0.7);
            crack.beginPath();
            crack.moveTo(cx - 3, cy - 2);
            crack.lineTo(cx + 1, cy + 1);
            crack.lineTo(cx + 3, cy + 4);
            crack.strokePath();
          }
        }
      }
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x333344).setDepth(0);
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
    if (this.isOverworld || this.isForest || this.isTown2 || this.isMountain || this.isHarbor || this.isRuins) {
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

    // Lumberjack Jack - slime quest, wanders in woods near forest entrance
    const jack = new NPC(this, 140, 480, 'lumberjack-jack', {
      id: 'lumberjack_jack',
      name: 'Lumberjack Jack',
      questId: 'slime_cleanup',
      idleAnim: 'npc-jack-idle-down',
      wanders: true,
      speed: 14,
      wanderRadius: 50,
      wanderAnims: { down: 'npc-jack-walk-down', right: 'npc-jack-walk-right', up: 'npc-jack-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 265 },    // night: inn
        { time: 0.3, x: 140, y: 480 },  // morning: forest edge
        { time: 0.5, x: 90,  y: 520 },  // midday: west woods
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
      { x: 60,  y: 90  }, // Northwest near cave entrance
      { x: 120, y: 150 }, // Cave approach path
      { x: 50,  y: 320 }, // Far west edge
      { x: 100, y: 460 }, // West edge near forest
      { x: 300, y: 720 }, // South edge
      { x: 560, y: 730 }, // South edge center
      { x: 770, y: 690 }, // South edge east
      { x: 960, y: 270 }, // Far east / desert border
      { x: 990, y: 460 }, // Far east
      { x: 910, y: 610 }, // Southeast corner
    ];
    for (const pos of skeletonPositions) {
      this.enemySpawns.push({ ...pos, type: 'skeleton' });
      this.spawnSkeleton(pos.x, pos.y);
    }

    const slimePositions = [
      { x: 70,  y: 410 }, // West edge near forest
      { x: 80,  y: 540 }, // Southwest near forest entrance
      { x: 410, y: 740 }, // South swamp
      { x: 710, y: 750 }, // South swamp east
      { x: 970, y: 160 }, // Far northeast desert border
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

  _applyNGP(enemy) {
    if (this._ngpMultiplier && this._ngpMultiplier > 1) {
      enemy.maxHp = Math.ceil((enemy.maxHp || enemy.health) * this._ngpMultiplier);
      enemy.health = enemy.maxHp;
      enemy._ngpActive = true;
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
    this._applyNGP(skel);
    this.enemies.add(skel);
    return skel;
  }

  spawnSlime(x, y) {
    const slime = new Slime(this, x, y);
    slime.spawnX = x;
    slime.spawnY = y;
    this._applyNGP(slime);
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
      } else if (e.type === 'goblin_archer') {
        this.spawnGoblinArcher(e.x, e.y);
      } else if (e.type === 'yeti') {
        this.spawnYeti(e.x, e.y);
      } else if (e.type === 'ice_skeleton') {
        this.spawnIceSkeleton(e.x, e.y);
      } else if (e.type === 'pirate_ghost') {
        this.spawnPirateGhost(e.x, e.y);
      } else if (e.type === 'sea_wraith') {
        this.spawnSeaWraith(e.x, e.y);
      } else if (e.type === 'zombie') {
        this.spawnZombie(e.x, e.y);
      } else if (e.type === 'undead_knight') {
        this.spawnUndeadKnight(e.x, e.y);
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
    } else if (bossType === 'ice_witch') {
      this.boss = new IceWitch(this, cx, cy);
    } else if (bossType === 'sea_serpent') {
      this.boss = new SeaSerpent(this, cx, cy);
    } else if (bossType === 'death_knight') {
      this.boss = new DeathKnight(this, cx, cy);
    } else if (bossType === 'lich_king') {
      this.boss = new LichKing(this, cx, cy);
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
    this._applyNGP(goblin);
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
    this._applyNGP(orc);
    this.enemies.add(orc);
    return orc;
  }

  spawnGoblinArcher(x, y) {
    const archer = new GoblinArcher(this, x, y);
    this._applyNGP(archer);
    this.enemies.add(archer);
    return archer;
  }

  spawnYeti(x, y) {
    const yeti = new Enemy(this, x, y, 'goblin-thief', {
      health: 8, speed: 25, damage: 2,
      idleAnim: 'goblin-idle-down',
      enemyType: 'yeti',
      weakness: 'fire',
      walkAnims: { right: 'goblin-walk-right', down: 'goblin-walk-down', up: 'goblin-walk-up' },
    });
    yeti.setScale(2.5);
    yeti.setTint(0xddeeff);
    yeti.body.setSize(18, 18);
    yeti.body.setOffset(7, 7);
    this._applyNGP(yeti);
    this.enemies.add(yeti);
    return yeti;
  }

  spawnIceSkeleton(x, y) {
    const iceSkel = new Enemy(this, x, y, 'skeleton', {
      health: 3, speed: 35,
      idleAnim: 'skeleton-idle-down',
      enemyType: 'ice_skeleton',
      weakness: 'fire',
      walkAnims: { right: 'skeleton-walk-right', down: 'skeleton-walk-down', up: 'skeleton-walk-up' },
    });
    iceSkel.setTint(0x88ccff);
    this._applyNGP(iceSkel);
    this.enemies.add(iceSkel);
    return iceSkel;
  }

  spawnPirateGhost(x, y) {
    const ghost = new Ghost(this, x, y);
    ghost.setTint(0x88aadd);
    ghost.enemyType = 'pirate_ghost';
    ghost.weakness = 'lightning';
    this._applyNGP(ghost);
    this.enemies.add(ghost);
    return ghost;
  }

  spawnSeaWraith(x, y) {
    const wraith = new Ghost(this, x, y);
    wraith.setTint(0x004499);
    wraith.enemyType = 'sea_wraith';
    wraith.weakness = 'lightning';
    wraith.speed = 40;
    wraith.damage = 2;
    this._applyNGP(wraith);
    this.enemies.add(wraith);
    return wraith;
  }

  spawnZombie(x, y) {
    const zombie = new Enemy(this, x, y, 'miner-mike', {
      health: 4, speed: 22, damage: 1,
      idleAnim: 'miner-idle-down',
      enemyType: 'zombie',
      weakness: 'fire',
      walkAnims: { right: 'miner-walk-right', down: 'miner-walk-down', up: 'miner-walk-up' },
    });
    zombie.setTint(0x667744);
    zombie.body.setSize(14, 18);
    zombie.body.setOffset(9, 8);
    this._applyNGP(zombie);
    this.enemies.add(zombie);
    return zombie;
  }

  spawnUndeadKnight(x, y) {
    const knight = new Enemy(this, x, y, 'orc-grunt', {
      health: 6, speed: 30, damage: 2,
      idleAnim: 'orc-idle-down',
      enemyType: 'undead_knight',
      weakness: 'lightning',
      walkAnims: { right: 'orc-walk-right', down: 'orc-walk-down', up: 'orc-walk-up' },
    });
    knight.setTint(0x553355);
    knight.body.setSize(14, 14);
    knight.body.setOffset(9, 14);
    this._applyNGP(knight);
    this.enemies.add(knight);
    return knight;
  }

  // Spawned by DeathKnight summon ability
  _spawnDeathKnightMinion(x, y) {
    const minion = this.spawnZombie(x, y);
    minion.setTint(0x441166);
    return minion;
  }

  _spawnArenaCrystal(arenaProps) {
    for (const prop of arenaProps) {
      if (prop.type !== 'challenge_crystal') continue;
      const crystal = this.add.rectangle(prop.x, prop.y, 10, 10, 0x88aaff);
      crystal.setDepth(prop.y + 1);
      this.tweens.add({
        targets: crystal,
        alpha: { from: 0.5, to: 1 },
        scaleX: { from: 0.9, to: 1.1 },
        scaleY: { from: 1.1, to: 0.9 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
      const label = this.add.text(prop.x, prop.y - 14, '[E] Arena', {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: '#aaccff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(prop.y + 2);
      // Physics zone
      const zone = this.add.zone(prop.x, prop.y, 20, 20);
      this.physics.add.existing(zone, true);
      this._arenaCrystal = { zone, crystal, label, x: prop.x, y: prop.y };
    }
  }

  _checkArenaCrystalInteract() {
    if (!this._arenaCrystal || this._arenaActive) return;
    const { zone } = this._arenaCrystal;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
    if (d > 24) return;
    const q = this.questManager.getQuest('arena_challenge');
    if (!q) return;
    if (q.state === 'available') {
      this.showDialogue(q.dialogue.available, () => {
        this.questManager.acceptQuest('arena_challenge');
        this.showNotification('Quest: Arena Champion');
        this.sfx.play('questAccept');
        this._startArenaWave(1);
      }, 'Arena Crystal', null);
    } else if (q.state === 'active') {
      this._startArenaWave(this._arenaWave + 1);
    } else if (q.state === 'ready') {
      this._completeArenaQuest();
    }
  }

  _startArenaWave(waveNum) {
    if (this._arenaActive) return;
    this._arenaActive = true;
    this._arenaWave = waveNum;
    this.showNotification(`WAVE ${waveNum} BEGIN!`);
    this.cameras.main.shake(200, 0.006);

    const spawnWaveEnemies = () => {
      const cx = this.worldWidth / 2;
      const cy = this.worldHeight / 2;
      const enemies = [];
      if (waveNum === 1) {
        for (let i = 0; i < 3; i++) enemies.push(this.spawnSkeleton(cx + (i - 1) * 24, cy - 40));
      } else if (waveNum === 2) {
        for (let i = 0; i < 5; i++) enemies.push(this.spawnSkeleton(cx + (i - 2) * 20, cy - 40));
        enemies.push(this.spawnSlime(cx - 30, cy + 20));
      } else {
        for (let i = 0; i < 7; i++) enemies.push(this.spawnSkeleton(cx + (i - 3) * 18, cy - 40));
        enemies.push(this.spawnSlime(cx - 40, cy + 20));
        enemies.push(this.spawnSlime(cx + 40, cy + 20));
      }
      this._arenaWaveEnemies = enemies.filter(Boolean);
      this._arenaCheckTimer = this.time.addEvent({
        delay: 500,
        callback: () => this._checkArenaWaveComplete(waveNum),
        loop: true,
      });
    };

    this.time.delayedCall(600, spawnWaveEnemies);
  }

  _checkArenaWaveComplete(waveNum) {
    if (!this._arenaWaveEnemies) return;
    const alive = this._arenaWaveEnemies.filter(e => e && e.active && !e.isDead);
    if (alive.length > 0) return;

    if (this._arenaCheckTimer) { this._arenaCheckTimer.remove(); this._arenaCheckTimer = null; }
    this._arenaActive = false;
    this._arenaWaveEnemies = [];

    if (waveNum >= 3) {
      // All waves done
      const q = this.questManager.getQuest('arena_challenge');
      if (q && q.state === 'active') {
        q.progress = 3;
        q.state = 'ready';
        this.updateQuestTracker();
      }
      this._completeArenaQuest();
    } else {
      this.showNotification(`Wave ${waveNum} cleared! Next wave: interact crystal`);
    }
  }

  _completeArenaQuest() {
    const q = this.questManager.getQuest('arena_challenge');
    if (!q || q.state !== 'ready') return;
    this.questManager.completeQuest('arena_challenge');
    this.giveQuestReward('arena_challenge');
    this.showNotification('Arena Champion! +150 Gold +200 XP');
    this.sfx.play('questComplete');
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

    // Secret chests (star fragments)
    const secretDefs = this.mapData.secretChests || [];
    for (const def of secretDefs) {
      const chest = new Chest(this, def.x, def.y);
      chest.chestId = def.id;
      chest.isSecret = true;
      chest.secretLoot = def.loot;
      // Golden tint to distinguish
      chest.setTint(0xffaa00);
      if (opened.includes(def.id)) {
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

    // Secret chest: give star fragment
    if (nearest.isSecret && nearest.secretLoot === 'star_fragment') {
      this.starFragments = (this.starFragments || 0) + 1;
      this.showNotification(`★ Star Fragment found! (${this.starFragments}/3)`);
      if (this.starFragments >= 3) {
        this.time.delayedCall(500, () => this.showNotification('All Star Fragments collected!'));
      }
      return true;
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
    let dmg = baseDmg + equipBonus + levelBonus + (this._fairyAttackBuff ? 1 : 0);
    // Fire sword elemental bonus
    const weapon = this.equipment ? this.equipment.getWeapon() : null;
    if (weapon && weapon.id === 'fire_sword' && enemy.weakness === 'fire') dmg *= 2;
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

      // Material drop
      this._tryDropMaterial(enemy);

      // Pet affection
      if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 1);

      // Achievement check
      this._checkAchievements();

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

    const door = zone.doorData;

    // Lich Tower requires all 6 biome bosses defeated
    if (door.requiresLichTower && !this._lichTowerUnlocked) {
      this.showNotification('The Lich Tower is sealed. Defeat all dungeon bosses first!');
      return;
    }

    this._doorCooldown = true;
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
        isNewGamePlus: this.isNewGamePlus,
        starFragments: this.starFragments,
        materials: this.materials,
        darkSeals: this.darkSeals,
        petAffection: this.petAffection,
        visitedChunks: this.visitedChunks,
        lichTowerUnlocked: this._lichTowerUnlocked,
        achievements: this.achievements,
        _craftCount: this._craftCount,
        _fishCount: this._fishCount,
        _totalGoldEarned: this._totalGoldEarned,
        weather: this._currentWeather,
        _regenBonus: this._regenBonus,
        npcAffection: this.npcAffection,
        storyChoices: this.storyChoices,
        npcGiftGiven: this._npcGiftGiven,
        fishLuckBonus: this._fishLuckBonus,
        jackTreeChoice: this._jackTreeChoice,
      });
    });
  }

  _irisWipeOut(onComplete) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (onComplete) onComplete();
    });
  }

  _irisWipeIn(mapName) {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    // Welcome toast for named locations
    const welcomeMap = { town2: 'Woodhaven', overworld: 'Greendale' };
    const welcome = welcomeMap[mapName];
    if (welcome) {
      this.time.delayedCall(600, () => this.showNotification(`Welcome to ${welcome}`));
    }
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

    // Wandering Merchant (dynamic spawn)
    if (nearestNPC.npcId === 'wandering_merchant') {
      this._openWanderingMerchantShop();
      return;
    }

    // Shop NPC
    if (nearestNPC.role === 'shop') {
      this.openShopMenu(nearestNPC);
      return;
    }

    // Traveling Merchant (Woodhaven)
    if (nearestNPC.npcId === 'town2_merchant') {
      this._openMerchantShop();
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

    // Alchemist Vera
    if (nearestNPC.npcId === 'alchemist_vera') {
      this._openCraftingMenu();
      return;
    }

    // Hermit Rolf (mountain quests)
    if (nearestNPC.npcId === 'hermit_rolf') {
      this._handleChainedQuests(nearestNPC, ['yeti_hunt', 'frozen_tome', 'clear_mountain'], name, portrait);
      return;
    }

    // Harbor Captain (harbor quests)
    if (nearestNPC.npcId === 'harbor_captain') {
      this._handleChainedQuests(nearestNPC, ['pirate_trouble', 'lost_anchor', 'clear_harbor'], name, portrait);
      return;
    }

    // Gravekeeper Mort (ruins quests)
    if (nearestNPC.npcId === 'gravekeeper_mort') {
      this._handleChainedQuests(nearestNPC, ['banish_undead', 'sacred_relic', 'clear_ruins'], name, portrait);
      return;
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

      // Phase 14: Arc 1 — bob_deed_recovery → bob_farm_investment
      const deliveryDone = deliveryQuest?.state === 'completed';
      const deedQuest = this.questManager.getQuest('bob_deed_recovery');
      const investQuest = this.questManager.getQuest('bob_farm_investment');
      if (deliveryDone) {
        if (deedQuest && deedQuest.state === 'available') {
          this.showDialogue(deedQuest.dialogue.available, () => {
            this.questManager.acceptQuest('bob_deed_recovery');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + deedQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (deedQuest && (deedQuest.state === 'active' || deedQuest.state === 'ready')) {
          this.showDialogue(deedQuest.dialogue[deedQuest.state], () => {
            if (deedQuest.state === 'ready') {
              this.giveQuestReward('bob_deed_recovery');
              this.questManager.completeQuest('bob_deed_recovery');
              this._giveAffection('farmer_bob', 5);
              this.updateQuestTracker();
              this.showNotification('Quest Complete!');
              this.sfx.play('questComplete');
            }
          }, name, portrait);
          return;
        }
        if (deedQuest && deedQuest.state === 'completed' && investQuest && investQuest.state === 'available') {
          this.showDialogue(investQuest.dialogue.available, () => {
            this.questManager.acceptQuest('bob_farm_investment');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + investQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (investQuest && investQuest.state === 'active') {
          this.showDialogue(investQuest.dialogue.active, null, name, portrait);
          return;
        }
        if (investQuest && investQuest.state === 'ready') {
          this.showDialogueWithChoice(investQuest.dialogue.ready, [
            {
              text: 'Keep it yours — small farms have heart.',
              callback: () => {
                this.storyChoices.bob = 'solo';
                this._giveAffection('farmer_bob', 5);
                this.giveQuestReward('bob_farm_investment');
                this.questManager.completeQuest('bob_farm_investment');
                this.updateQuestTracker();
                this.showNotification('Quest Complete!');
                this.sfx.play('questComplete');
                this._checkAchievements();
              },
            },
            {
              text: "Let Buba in — together you'll grow stronger.",
              callback: () => {
                this.storyChoices.bob = 'partner';
                this._giveAffection('farmer_bob', 10);
                this.giveQuestReward('bob_farm_investment');
                this.questManager.completeQuest('bob_farm_investment');
                this.updateQuestTracker();
                this.showNotification('Quest Complete!');
                this.sfx.play('questComplete');
                this._checkAchievements();
              },
            },
          ], name, portrait);
          return;
        }
      }
    }

    // Miner Mike: chain clear_cave → clear_temple, then Phase 14 arc
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

      // Phase 14: Arc 2 — mike_journal_fragment → mike_family_locket
      const caveDone = caveQuest?.state === 'completed';
      const journalQuest = this.questManager.getQuest('mike_journal_fragment');
      const locketQuest = this.questManager.getQuest('mike_family_locket');
      if (caveDone) {
        if (journalQuest && journalQuest.state === 'available') {
          this.showDialogue(journalQuest.dialogue.available, () => {
            this.questManager.acceptQuest('mike_journal_fragment');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + journalQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (journalQuest && (journalQuest.state === 'active' || journalQuest.state === 'ready')) {
          this.showDialogue(journalQuest.dialogue[journalQuest.state], () => {
            if (journalQuest.state === 'ready') {
              this.giveQuestReward('mike_journal_fragment');
              this.questManager.completeQuest('mike_journal_fragment');
              this._giveAffection('miner_mike', 5);
              this.updateQuestTracker();
              this.showNotification('Quest Complete!');
              this.sfx.play('questComplete');
            }
          }, name, portrait);
          return;
        }
        if (journalQuest && journalQuest.state === 'completed' && locketQuest && locketQuest.state === 'available') {
          this.showDialogue(locketQuest.dialogue.available, () => {
            this.questManager.acceptQuest('mike_family_locket');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + locketQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (locketQuest && locketQuest.state === 'active') {
          this.showDialogue(locketQuest.dialogue.active, null, name, portrait);
          return;
        }
        if (locketQuest && locketQuest.state === 'ready') {
          this.showDialogueWithChoice(locketQuest.dialogue.ready, [
            {
              text: 'Tell them the truth — they deserve to know.',
              callback: () => {
                this.storyChoices.mike = 'truth';
                this._giveAffection('miner_mike', 10);
                this.addXP(100);
                this.giveQuestReward('mike_family_locket');
                this.questManager.completeQuest('mike_family_locket');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! +100 XP bonus');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['They\'ll grieve. But truth\nis a gift too.'], null, name, portrait);
                });
              },
            },
            {
              text: 'Tell them he died a hero protecting the temple.',
              callback: () => {
                this.storyChoices.mike = 'hero';
                this._giveAffection('miner_mike', 5);
                this.addGold(120);
                this.giveQuestReward('mike_family_locket');
                this.questManager.completeQuest('mike_family_locket');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! +120g bonus');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['I hope it brings\nthem peace.'], null, name, portrait);
                });
              },
            },
          ], name, portrait);
          return;
        }
      }
    }

    // Fisherman Fin: chain explore_pond → catch_fish, then Phase 14 arc
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

      // Phase 14: Arc 3 — fin_sea_essence → fin_deep_cast
      const harborFishDone = this.questManager.getQuest('harbor_fish')?.state === 'completed';
      const seaEssenceQuest = this.questManager.getQuest('fin_sea_essence');
      const deepCastQuest = this.questManager.getQuest('fin_deep_cast');
      if (harborFishDone) {
        if (seaEssenceQuest && seaEssenceQuest.state === 'available') {
          this.showDialogue(seaEssenceQuest.dialogue.available, () => {
            this.questManager.acceptQuest('fin_sea_essence');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + seaEssenceQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (seaEssenceQuest && (seaEssenceQuest.state === 'active' || seaEssenceQuest.state === 'ready')) {
          this.showDialogue(seaEssenceQuest.dialogue[seaEssenceQuest.state], () => {
            if (seaEssenceQuest.state === 'ready') {
              this.giveQuestReward('fin_sea_essence');
              this.questManager.completeQuest('fin_sea_essence');
              this._giveAffection('fisherman_fin', 5);
              this.updateQuestTracker();
              this.showNotification('Quest Complete!');
              this.sfx.play('questComplete');
            }
          }, name, portrait);
          return;
        }
        if (seaEssenceQuest && seaEssenceQuest.state === 'completed' && deepCastQuest && deepCastQuest.state === 'available') {
          this.showDialogue(deepCastQuest.dialogue.available, () => {
            this.questManager.acceptQuest('fin_deep_cast');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + deepCastQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (deepCastQuest && deepCastQuest.state === 'active') {
          this.showDialogue(deepCastQuest.dialogue.active, null, name, portrait);
          return;
        }
        if (deepCastQuest && deepCastQuest.state === 'ready') {
          this.showDialogueWithChoice(deepCastQuest.dialogue.ready, [
            {
              text: 'Release it — some things are beyond trophies.',
              callback: () => {
                this.storyChoices.fin = 'release';
                this._giveAffection('fisherman_fin', 10);
                this._fishLuckBonus = true;
                this.giveQuestReward('fin_deep_cast');
                this.questManager.completeQuest('fin_deep_cast');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! Lucky Lure unlocked!');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['The sea remembers kindness.'], null, name, portrait);
                });
              },
            },
            {
              text: "Keep it — you've earned this moment of glory!",
              callback: () => {
                this.storyChoices.fin = 'keep';
                this._giveAffection('fisherman_fin', 5);
                this.addGold(100);
                this.giveQuestReward('fin_deep_cast');
                this.questManager.completeQuest('fin_deep_cast');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! +100g');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['I\'m going to mount it\non the inn wall!'], null, name, portrait);
                });
              },
            },
          ], name, portrait);
          return;
        }
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

    // Lumberjack Jack: chain slime_cleanup → lost_axe, then Phase 14 arc
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

      // Phase 14: Arc 4 — jack_tree_investigation → jack_tree_materials
      const axeDone = axeQuest?.state === 'completed';
      const treeInvestQuest = this.questManager.getQuest('jack_tree_investigation');
      const treeMatsQuest = this.questManager.getQuest('jack_tree_materials');
      if (axeDone) {
        if (treeInvestQuest && treeInvestQuest.state === 'available') {
          this.showDialogue(treeInvestQuest.dialogue.available, () => {
            this.questManager.acceptQuest('jack_tree_investigation');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + treeInvestQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (treeInvestQuest && (treeInvestQuest.state === 'active' || treeInvestQuest.state === 'ready')) {
          this.showDialogue(treeInvestQuest.dialogue[treeInvestQuest.state], () => {
            if (treeInvestQuest.state === 'ready') {
              this.giveQuestReward('jack_tree_investigation');
              this.questManager.completeQuest('jack_tree_investigation');
              this._giveAffection('lumberjack_jack', 5);
              this.updateQuestTracker();
              this.showNotification('Quest Complete!');
              this.sfx.play('questComplete');
            }
          }, name, portrait);
          return;
        }
        if (treeInvestQuest && treeInvestQuest.state === 'completed' && treeMatsQuest && treeMatsQuest.state === 'available') {
          this.showDialogue(treeMatsQuest.dialogue.available, () => {
            this.questManager.acceptQuest('jack_tree_materials');
            this.updateQuestTracker();
            this.showNotification('Quest: ' + treeMatsQuest.name);
            this.sfx.play('questAccept');
          }, name, portrait);
          return;
        }
        if (treeMatsQuest && treeMatsQuest.state === 'active') {
          this.showDialogue(treeMatsQuest.dialogue.active, null, name, portrait);
          return;
        }
        if (treeMatsQuest && treeMatsQuest.state === 'ready') {
          this.showDialogueWithChoice(treeMatsQuest.dialogue.ready, [
            {
              text: 'Purify it — some things are worth more than gold.',
              callback: () => {
                this.storyChoices.jack = 'purify';
                this._jackTreeChoice = 'purify';
                this._giveAffection('lumberjack_jack', 10);
                this.giveQuestReward('jack_tree_materials');
                this.questManager.completeQuest('jack_tree_materials');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! Ancient tree purified!');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['The forest will\nthank you, Lizzy.'], null, name, portrait);
                });
              },
            },
            {
              text: 'Cut it down — take the gold and build something new.',
              callback: () => {
                this.storyChoices.jack = 'cut';
                this._jackTreeChoice = 'cut';
                this._giveAffection('lumberjack_jack', 5);
                this.addGold(120);
                this.giveQuestReward('jack_tree_materials');
                this.questManager.completeQuest('jack_tree_materials');
                this.updateQuestTracker();
                this.showNotification('Quest Complete! +120g');
                this.sfx.play('questComplete');
                this._checkAchievements();
                this.time.delayedCall(200, () => {
                  this.showDialogue(['Finest lumber I\'ve\never seen.'], null, name, portrait);
                });
              },
            },
          ], name, portrait);
          return;
        }
      }
    }

    // Phase 14: Buba signed_note interaction for bob_farm_investment
    if (nearestNPC.npcId === 'farmer_buba') {
      const investQuest = this.questManager.getQuest('bob_farm_investment');
      if (investQuest && investQuest.state === 'active') {
        this.showDialogue(
          ['I\'ve been saving to help Bob!\nHere, take this note.'],
          () => {
            this.questManager.trackEvent('collect', { target: 'signed_note' });
            this.updateQuestTracker();
            this.showNotification('Got Buba\'s Note!');
            this.sfx.play('itemPickup');
          },
          name, portrait
        );
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

    // Phase 14: One-time affection gift at >= 60 (fires before other dialogue)
    const _arcNpcIds = ['farmer_bob', 'miner_mike', 'fisherman_fin', 'lumberjack_jack'];
    if (_arcNpcIds.includes(nearestNPC.npcId)) {
      const _nid = nearestNPC.npcId;
      if ((this.npcAffection[_nid] || 0) >= 60 && !this._npcGiftGiven[_nid]) {
        this._npcGiftGiven[_nid] = true;
        const giftLines = {
          farmer_bob:      ['Thank you for everything, Lizzy!\nHere\'s 75 gold from the harvest.'],
          miner_mike:      ['You\'ve done so much for me, Lizzy.\nTake my Miner\'s Lantern!', 'Your torch will burn\nbrighter in the dark.'],
          fisherman_fin:   ['You\'re a true friend, Lizzy.\nTake this Lucky Lure!', 'It\'ll help you\ncatch fish!'],
          lumberjack_jack: ['I couldn\'t ask for a better ally.\nLet me teach you a trick!', '+1 Attack — the strength\nof a woodsman!'],
        };
        const giftEffects = {
          farmer_bob:      () => this.addGold(75),
          miner_mike:      () => { this._torchBonus = true; },
          fisherman_fin:   () => { this._fishLuckBonus = true; },
          lumberjack_jack: () => { this.playerAttackBonus += 1; },
        };
        this.showDialogue(giftLines[_nid], () => {
          if (giftEffects[_nid]) giftEffects[_nid]();
          this.showNotification('Received a special gift!');
        }, name, portrait);
        return;
      }
    }

    // Post-Lich NPC victory dialogue
    if (this.questManager.getQuest('defeat_lich')?.state === 'completed') {
      const postLichLines = {
        innkeeper:        ['With the Lich gone, I\'ve had the best\nweek of business in years!'],
        innkeeper_bob:    ['With the Lich gone, I\'ve had the best\nweek of business in years!'],
        farmer_bob:       ['With the Lich gone, I\'ve had the best\nweek of business in years!'],
        miner_mike:       ['The mines feel lighter.\nWhatever darkness Voleth spread... it\'s lifted.'],
        ranger_reed:      ['The forest is healing.\nBirds are returning — I\'ve never seen so many.'],
        hermit_rolf:      ['History repeats. Voleth\'s own people sealed\nhim away once before. You\'ve done it again.'],
        gravekeeper_mort: ['The undead are finally at rest.\nVoleth promised eternity. Greendale gave them peace.'],
        harbor_captain:   ['Ships are already returning!\nWord travels fast of your victory.'],
      };
      const pLines = postLichLines[nearestNPC.npcId];
      if (pLines) {
        this.showDialogue(pLines, null, name, portrait);
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
    const questsDone = (id) => {
      const q = this.questManager.getQuest(id);
      return q && (q.state === 'completed' || q.state === 'ready');
    };

    const caveDone = questsDone('clear_cave');
    const templeDone = questsDone('clear_temple');
    const forestDone = questsDone('clear_forest');
    const mountainDone = questsDone('clear_mountain');
    const harborDone = questsDone('clear_harbor');
    const ruinsDone = questsDone('clear_ruins');

    // Unlock Lich Tower when all 6 biome bosses defeated
    if (caveDone && templeDone && forestDone && mountainDone && harborDone && ruinsDone) {
      if (!this._lichTowerUnlocked) {
        this._lichTowerUnlocked = true;
        this.showNotification('All dungeon bosses defeated! The Lich Tower is now open!');
        // Auto-complete lich_warning
        const lichWarn = this.questManager.getQuest('lich_warning');
        if (lichWarn && lichWarn.state === 'active') {
          lichWarn.progress = 1;
          lichWarn.state = 'ready';
          this.updateQuestTracker();
        }
      }
    }
    // Old 3-boss checkpoint: award intermediate victory notification
    else if (caveDone && templeDone && forestDone && !this._phase12Started) {
      this._phase12Started = true;
      this.showNotification('Three dungeons cleared! Explore further...');
    }
  }

  _triggerLichVictory() {
    this.time.delayedCall(3000, () => {
      const questsCompleted = this.questManager.getAllQuests()
        .filter(q => q.state === 'completed' || q.state === 'ready').length;
      const trueEnding = this.starFragments >= 3;
      this.cameras.main.fadeOut(1500, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UI');
        this.scene.start('Victory', {
          level: this.level,
          gold: this.gold,
          questsCompleted,
          trueEnding,
          lichEnding: true,
          achievements: this.achievements,
        });
      });
    });
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
      if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 2);
    }
    this._checkAchievements();
    // Auto-save on quest milestone
    this.time.delayedCall(100, () => SaveManager.save(this));
  }

  // --- Quest variety: escort, timed, fetch ---

  _spawnFetchItems() {
    // Legacy: Lost Axe in forest
    const axeQuest = this.questManager.getQuest('lost_axe');
    if (axeQuest && axeQuest.state === 'active' && this.mapData.name === 'forest') {
      const obj = axeQuest.objective;
      this._spawnFetchItem(obj.fetchX, obj.fetchY, 'Axe', 0xffaa00, axeQuest, 'Found the Lost Axe!');
    }

    // Generic: from map.fetchItems array (new maps)
    const fetchItems = this.mapData.fetchItems;
    if (!fetchItems) return;
    for (const fi of fetchItems) {
      // Find quest with matching fetchItem id
      const quest = Object.values(this.questManager.quests).find(
        q => q.state === 'active' && q.objective && q.objective.fetchItemId === fi.id
      );
      if (!quest) continue;

      const colors = {
        frozen_tome: 0x88ccff, lost_anchor: 0x4488ff, sacred_relic: 0xddaa44,
        deed_scroll: 0xddcc88, journal_fragment: 0xbbaa88, family_locket: 0xffdd44,
      };
      const labels = {
        frozen_tome: 'Tome', lost_anchor: 'Anchor', sacred_relic: 'Relic',
        deed_scroll: 'Deed', journal_fragment: 'Journal', family_locket: 'Locket',
      };
      const msgs = {
        frozen_tome: 'Found the Frozen Tome!', lost_anchor: 'Found the Lost Anchor!', sacred_relic: 'Found the Sacred Relic!',
        deed_scroll: 'Found the Farm Deed!', journal_fragment: 'Found the Journal!', family_locket: 'Found the Locket!',
      };
      this._spawnFetchItem(fi.x, fi.y, labels[fi.id] || fi.id, colors[fi.id] || 0xffaa00, quest, msgs[fi.id] || 'Item Found!');
    }
  }

  _spawnFetchItem(fx, fy, labelText, color, quest, notif) {
    const item = this.add.rectangle(fx, fy, 8, 8, color);
    item.setDepth(9000);
    this.tweens.add({ targets: item, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    const label = this.add.text(fx, fy - 10, labelText, {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd00', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9001);
    const zone = this.add.zone(fx, fy, 16, 16);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (item._collected) return;
      item._collected = true;
      quest.progress = quest.objective.count;
      quest.state = 'ready';
      this.updateQuestTracker();
      this.showNotification(notif);
      this.sfx.play('itemPickup');
      item.destroy();
      label.destroy();
      zone.destroy();
    });
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
      this._totalGoldEarned = (this._totalGoldEarned || 0) + amount;
      this.showFloatingText(this.player.x, this.player.y - 12, `+${amount}g`, '#ffdd00');
      this._checkAchievements();
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
      const healed = Math.min(4, this.player.maxHealth - this.player.health);
      if (healed <= 0) {
        // Refund - already at full HP
        this.inventory.addItem('health_potion', 1);
        this.events.emit('inventory-changed', this.inventory.slots);
        return;
      }
      this.player.health = Math.min(this.player.health + 4, this.player.maxHealth);
      this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      this.showPotionEffect(0xe74c3c);
      this.sfx.play('heal');
      this.showNotification(`+${healed} HP`);
    } else if (itemId === 'speed_potion') {
      const originalSpeed = this.player.speed;
      this.player.speed = Math.round(originalSpeed * 1.6);
      this.showPotionEffect(0x3498db);
      this.showNotification('Speed boost! (8s)');
      this.time.delayedCall(8000, () => {
        if (this.player) this.player.speed = originalSpeed;
      });
    } else if (itemId === 'shield_potion') {
      this.player.invulnerable = true;
      this.player.invulnerableTimer = 5000;
      this.player.setTint(0xaaddff);
      this.showPotionEffect(0xf1c40f);
      this.showNotification('Shield active! (5s)');
      this.time.delayedCall(5000, () => {
        if (this.player) { this.player.invulnerable = false; this.player.clearTint(); }
      });
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
      { id: 'health_potion', name: 'Health Potion', price: 15, color: '#e74c3c', type: 'potion', desc: 'Restores 4 HP' },
      { id: 'speed_potion', name: 'Speed Potion', price: 30, color: '#3498db', type: 'potion', desc: '1.6x speed, 8s' },
      { id: 'shield_potion', name: 'Shield Potion', price: 50, color: '#f1c40f', type: 'potion', desc: 'Invincible, 5s' },
      { id: 'elemental_arrow', name: 'Fire Arrows x5', price: 30, color: '#ff6622', type: 'arrow', desc: 'Fire dmg vs enemy' },
      { id: 'rune_stone', name: 'Rune Stone', price: 120, color: '#8844ff', type: 'rune', desc: '+1 max mana' },
      { id: 'antidote', name: 'Antidote', price: 25, color: '#44cc44', type: 'antidote', desc: 'Clears slow effect' },
      { id: 'torch_bundle', name: 'Torch Bundle', price: 40, color: '#ffaa22', type: 'torch', desc: '+50% cave light, 3m' },
    ];

    // NG+ exclusive item
    if (this.isNewGamePlus) {
      shopItems.push({ id: 'void_shard', name: 'Void Shard', price: 500, color: '#cc88ff', type: 'special', desc: '+1 ATK perm' });
    }

    // NG+ price adjustment (1.5x)
    if (this.isNewGamePlus) {
      shopItems.forEach(item => { item.price = Math.ceil(item.price * 1.5); });
    }

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
    this._isWanderingMerchantShop = false;
    this.inDialogue = false;
  }

  _reopenCurrentShop() {
    const isWM = this._isWanderingMerchantShop;
    if (this.shopContainer) { this.shopContainer.destroy(); this.shopContainer = null; }
    this._shopActive = false;
    this.inDialogue = false;
    if (isWM) this._openWanderingMerchantShop();
    else this.openShopMenu(this._shopNPC);
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
      this._reopenCurrentShop();
      return;
    }

    // Special one-time items
    if (item.type === 'special' && item.id === 'void_shard') {
      this.addGold(-item.price);
      this.sfx.play('levelUp');
      this.playerAttackBonus = (this.playerAttackBonus || 0) + 1;
      this.showNotification('Void Shard: +1 ATK permanently!');
      this.closeShop();
      return;
    }
    if (item.type === 'arrow') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      this.arrowCount = (this.arrowCount || 0) + 5;
      this.showNotification(`Fire Arrows: ${this.arrowCount} remaining`);
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }
    if (item.type === 'rune') {
      this.addGold(-item.price);
      this.sfx.play('levelUp');
      this.player.maxMana = Math.min(12, this.player.maxMana + 1);
      this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
      this.showNotification('+1 Max Mana!');
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }
    if (item.type === 'antidote') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      if (this.player._slowed) {
        this.player._slowed = false;
        this.player.speed = this.player._baseSpeed || this.player.speed;
      }
      this.showNotification('Antidote used!');
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }
    if (item.type === 'torch') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      this._torchBonus = true;
      this.showNotification('Torch Bundle active! (3 min)');
      this.time.delayedCall(180000, () => { this._torchBonus = false; });
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }

    // Wandering merchant special items
    if (item.type === 'star_potion') {
      this.addGold(-item.price);
      this.sfx.play('heal');
      this.player.mana = this.player.maxMana;
      this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
      this.showNotification('Star Potion: Full mana restored!');
      this.closeShop();
      return;
    }
    if (item.type === 'magic_seed') {
      this.addGold(-item.price);
      this.sfx.play('heal');
      this._regenBonus = (this._regenBonus || 0) + 1;
      this.showNotification(`Magic Seed: +1 HP regen/5s! (Total: ${this._regenBonus})`);
      if (!this._regenTimer) {
        this._regenTimer = this.time.addEvent({
          delay: 5000,
          callback: () => {
            if (this.player && this._regenBonus > 0) {
              const healed = Math.min(this._regenBonus, this.player.maxHealth - this.player.health);
              if (healed > 0) {
                this.player.health += healed;
                this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
              }
            }
          },
          loop: true,
        });
      }
      this.closeShop();
      return;
    }
    if (item.type === 'ancient_map') {
      this.addGold(-item.price);
      this.sfx.play('questComplete');
      const mName = this.mapData.name;
      const cSize = mName === 'overworld' ? 128 : 64;
      if (!this.visitedChunks[mName]) this.visitedChunks[mName] = [];
      const visited = new Set(this.visitedChunks[mName]);
      const cX = Math.ceil(this.worldWidth / cSize);
      const cY = Math.ceil(this.worldHeight / cSize);
      for (let cy = 0; cy < cY; cy++) {
        for (let cx = 0; cx < cX; cx++) visited.add(`${cx},${cy}`);
      }
      this.visitedChunks[mName] = Array.from(visited);
      this.showNotification('Ancient Map: Current map fully revealed!');
      this.closeShop();
      return;
    }
    if (item.type === 'speed_crystal') {
      this.addGold(-item.price);
      this.sfx.play('levelUp');
      this.player.speed = Math.round(this.player.speed * 1.1);
      this.player._baseSpeed = this.player.speed;
      this.showNotification('Speed Crystal: +10% speed permanently!');
      this.closeShop();
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
    this._reopenCurrentShop();
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

    // Chain Lightning — separate handler
    if (spell.isLightning) {
      this._castLightning(spell);
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
      // Elemental weakness/resist
      let magicDmg = p.damage;
      let dmgType = 'magic';
      if (spell.element && enemy.weakness === spell.element) {
        magicDmg = magicDmg * 2;
        dmgType = 'weakness';
      }
      enemy.takeDamage(magicDmg, this.player.x, this.player.y);
      this.sfx.play('hit');
      this.showDamageNumber(enemy.x, enemy.y - 8, magicDmg, dmgType);

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
        // Material drop
        this._tryDropMaterial(enemy);
        // Pet affection
        if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 1);
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

  _castLightning(spell) {
    this.player.mana -= spell.manaCost;
    this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
    this.sfx.play('fireball'); // closest SFX to lightning

    // Find nearest enemy within 200px
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of this.enemies.getChildren()) {
      if (!e.active || !e.takeDamage) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < 200 && d < nearestDist) { nearest = e; nearestDist = d; }
    }
    if (!nearest) return;

    // Hit primary target
    let primaryDmg = spell.damage;
    if (nearest.weakness === 'lightning') {
      primaryDmg *= 2;
      this.showDamageNumber(nearest.x, nearest.y - 8, primaryDmg, 'weakness');
    } else {
      this.showDamageNumber(nearest.x, nearest.y - 8, primaryDmg, 'magic');
    }
    nearest.takeDamage(primaryDmg, this.player.x, this.player.y);

    // Lightning arc from player to nearest
    this._drawLightningArc(this.player.x, this.player.y, nearest.x, nearest.y, 0xffee22);

    // Handle primary kill
    if (nearest.health <= 0 && nearest !== this.boss) {
      this.sfx.play('enemyDeath');
      this.spawnDeathEffect(nearest.x, nearest.y);
      this.spawnLootDrop(nearest.x, nearest.y);
      if (nearest.enemyType) this.questManager.trackEvent('kill', { target: nearest.enemyType });
      const r = ENEMY_REWARDS[nearest.enemyType] || { gold: 3, xp: 10 };
      this.addGold(r.gold); this.addXP(r.xp);
      if (nearest.enemyType && this.bestiary) this.bestiary[nearest.enemyType] = (this.bestiary[nearest.enemyType] || 0) + 1;
      this._tryDropMaterial(nearest);
      if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 1);
      this.updateQuestTracker();
    }

    // Chain to 2nd enemy within 100px of first
    let chain = null;
    let chainDist = Infinity;
    for (const e of this.enemies.getChildren()) {
      if (!e.active || !e.takeDamage || e === nearest || e.health <= 0) continue;
      const d = Phaser.Math.Distance.Between(nearest.x, nearest.y, e.x, e.y);
      if (d < 100 && d < chainDist) { chain = e; chainDist = d; }
    }
    if (chain) {
      const chainDmg = chain.weakness === 'lightning' ? 4 : 2;
      chain.takeDamage(chainDmg, nearest.x, nearest.y);
      this.showDamageNumber(chain.x, chain.y - 8, chainDmg, chain.weakness === 'lightning' ? 'weakness' : 'magic');
      this._drawLightningArc(nearest.x, nearest.y, chain.x, chain.y, 0xffee22);

      if (chain.health <= 0 && chain !== this.boss) {
        this.sfx.play('enemyDeath');
        this.spawnDeathEffect(chain.x, chain.y);
        this.spawnLootDrop(chain.x, chain.y);
        if (chain.enemyType) this.questManager.trackEvent('kill', { target: chain.enemyType });
        const r2 = ENEMY_REWARDS[chain.enemyType] || { gold: 3, xp: 10 };
        this.addGold(r2.gold); this.addXP(r2.xp);
        if (chain.enemyType && this.bestiary) this.bestiary[chain.enemyType] = (this.bestiary[chain.enemyType] || 0) + 1;
        this._tryDropMaterial(chain);
        if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 1);
        this.updateQuestTracker();
      }
    }
  }

  _drawLightningArc(x1, y1, x2, y2, color = 0xffee22) {
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 20;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
    const g = this.add.graphics().setDepth(9992);
    g.lineStyle(2, color, 0.9);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(midX, midY);
    g.lineTo(x2, y2);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  _tryDropMaterial(enemy) {
    if (!enemy.enemyType) return;
    const matId = MATERIAL_DROPS[enemy.enemyType];
    if (!matId) return;
    if (Math.random() > 0.2) return; // 20% chance

    this.materials = this.materials || {};
    this.materials[matId] = (this.materials[matId] || 0) + 1;

    // Floating text
    this.showFloatingText(enemy.x, enemy.y - 16, `+${matId.replace(/_/g, ' ')}`, '#ccff88');

    // Quest tracking
    this.questManager.trackEvent('collect_material', { materialId: matId });
    this.updateQuestTracker();
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
              isNewGamePlus: this.isNewGamePlus,
              starFragments: this.starFragments,
              materials: this.materials,
              darkSeals: this.darkSeals,
              petAffection: this.petAffection,
              visitedChunks: this.visitedChunks,
              lichTowerUnlocked: this._lichTowerUnlocked,
              achievements: this.achievements,
              _craftCount: this._craftCount,
              _fishCount: this._fishCount,
              _totalGoldEarned: this._totalGoldEarned,
              weather: this._currentWeather,
              _regenBonus: this._regenBonus,
              npcAffection: this.npcAffection,
              storyChoices: this.storyChoices,
              npcGiftGiven: this._npcGiftGiven,
              fishLuckBonus: this._fishLuckBonus,
              jackTreeChoice: this._jackTreeChoice,
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
    if (type === 'weakness') {
      color = '#ff8800'; // bright orange for elemental weakness
      scale = 1.5;
    } else if (type === 'magic') {
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
        isNewGamePlus: this.isNewGamePlus,
        starFragments: this.starFragments,
        materials: this.materials,
        darkSeals: this.darkSeals,
        petAffection: this.petAffection,
        visitedChunks: this.visitedChunks,
        lichTowerUnlocked: this._lichTowerUnlocked,
        achievements: this.achievements,
        _craftCount: this._craftCount,
        _fishCount: this._fishCount,
        _totalGoldEarned: this._totalGoldEarned,
        weather: this._currentWeather,
        _regenBonus: this._regenBonus,
        npcAffection: this.npcAffection,
        storyChoices: this.storyChoices,
        npcGiftGiven: this._npcGiftGiven,
        fishLuckBonus: this._fishLuckBonus,
        jackTreeChoice: this._jackTreeChoice,
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

    // Traveling Merchant NPC
    const merchant = new NPC(this, 280, 180, 'miner-mike', {
      id: 'town2_merchant',
      name: 'Traveling Merchant',
      idleAnim: 'npc-mike-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 20,
      wanderAnims: { down: 'npc-mike-walk-down', right: 'npc-mike-walk-right', up: 'npc-mike-walk-up' },
      dialogueLines: [
        'I have rare wares!\nInterest you in anything?',
        'Exotic goods from distant\nlands! Best prices around!',
      ],
    });
    merchant.setTint(0xddaa55); // Gold tint for merchant
    this.npcs.add(merchant);

    // Notice Board (static NPC)
    const board = new NPC(this, 380, 150, 'lumberjack-jack', {
      id: 'town2_board',
      name: 'Notice Board',
      idleAnim: 'npc-jack-idle-down',
      wanders: false,
      dialogueLines: [
        'WANTED: Forest Patrol\nSpeak with Ranger Reed.',
        'LOST: One golden axe.\nSpeak with Lumberjack Jack.',
        'NOTICE: Arena in cave\nBoss room. Champions welcome.',
      ],
    });
    board.setTint(0xaa8844); // Wooden tint for board
    board.setScale(0.8);
    this.npcs.add(board);
  }

  spawnMountainNPCs() {
    const rolf = new NPC(this, 120, 200, 'miner-mike', {
      id: 'hermit_rolf',
      name: 'Hermit Rolf',
      idleAnim: 'npc-mike-idle-down',
      wanders: false,
      questId: 'yeti_hunt',
      dialogueLines: ['The mountain is overrun\nwith yetis and ice skeletons!'],
    });
    rolf.setTint(0xaabbcc);
    this.npcs.add(rolf);
  }

  spawnHarborNPCs() {
    const captain = new NPC(this, 200, 200, 'lumberjack-jack', {
      id: 'harbor_captain',
      name: 'Captain Vex',
      idleAnim: 'npc-jack-idle-down',
      wanders: false,
      questId: 'pirate_trouble',
      dialogueLines: ['Pirate ghosts have taken\nover the harbor! Help us!'],
    });
    captain.setTint(0x8899bb);
    this.npcs.add(captain);
  }

  spawnRuinsNPCs() {
    const mort = new NPC(this, 160, 180, 'lumberjack-jack', {
      id: 'gravekeeper_mort',
      name: 'Gravekeeper Mort',
      idleAnim: 'npc-jack-idle-down',
      wanders: false,
      questId: 'banish_undead',
      dialogueLines: ['The ruins are full of\nthe walking dead. Drive them back!'],
    });
    mort.setTint(0x667755);
    this.npcs.add(mort);

    const vera = new NPC(this, 200, 220, 'miner-mike', {
      id: 'alchemist_vera',
      name: 'Alchemist Vera',
      idleAnim: 'npc-mike-idle-down',
      wanders: false,
      dialogueLines: ['I can craft wondrous\nthings if you bring materials!'],
    });
    vera.setTint(0xaa88ff);
    this.npcs.add(vera);
  }

  _openCraftingMenu() {
    const lines = ['=== Alchemy ===', `Gold: ${this.gold}g`, ''];
    CRAFTING_RECIPES.forEach((r, i) => {
      const ingredients = r.ingredients.map(ing => {
        const have = (this.materials[ing.material] || 0);
        return `${ing.material.replace(/_/g, ' ')}(${have}/${ing.count})`;
      }).join(', ');
      lines.push(`${i + 1}) ${r.name} — ${ingredients}`);
    });
    lines.push('', 'Press 1-5 to craft');
    this.showDialogue(lines, () => {}, 'Alchemist Vera', null);

    for (let i = 0; i < Math.min(5, CRAFTING_RECIPES.length); i++) {
      const recipe = CRAFTING_RECIPES[i];
      const key = ['keydown-ONE', 'keydown-TWO', 'keydown-THREE', 'keydown-FOUR', 'keydown-FIVE'][i];
      this.input.keyboard.once(key, () => this._doCraft(recipe));
    }
  }

  _doCraft(recipe) {
    // Check ingredients
    for (const ing of recipe.ingredients) {
      if ((this.materials[ing.material] || 0) < ing.count) {
        this.sfx.play('menuCancel');
        this.showNotification(`Need more ${ing.material.replace(/_/g, ' ')}!`);
        return;
      }
    }
    // Deduct
    for (const ing of recipe.ingredients) {
      this.materials[ing.material] -= ing.count;
    }
    // Apply result
    const res = recipe.result;
    if (res.type === 'item') {
      this.inventory.addItem(res.id, res.count || 1);
      this.events.emit('inventory-changed', this.inventory.slots);
      this.showNotification(`Crafted: ${recipe.name}!`);
    } else if (res.type === 'mana') {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + res.amount);
      this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
      this.showNotification(`+${res.amount} Mana!`);
    } else if (res.type === 'equip') {
      this.equipment.equip(res.id);
      const hpBonus = this.equipment.getHPBonus();
      if (hpBonus > 0 && this.player.maxHealth < 10 + hpBonus) {
        this.player.maxHealth = 10 + hpBonus;
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }
      this.showNotification(`Equipped: ${res.id.replace(/_/g, ' ')}!`);
    } else if (res.type === 'maxMana') {
      this.player.maxMana = (this.player.maxMana || 10) + res.amount;
      this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
      this.showNotification(`+${res.amount} Max Mana!`);
    }
    // Track crafting quest + achievement
    this.questManager.trackEvent('craft', { id: recipe.id });
    this.updateQuestTracker();
    this._craftCount = (this._craftCount || 0) + 1;
    this._checkAchievements();
    this.sfx.play('questComplete');
  }

  // Generic chain: finds the first quest in the chain that isn't completed and shows its dialogue
  _handleChainedQuests(nearestNPC, questIds, name, portrait) {
    for (const qid of questIds) {
      const q = this.questManager.getQuest(qid);
      if (!q) continue;
      if (q.state === 'available') {
        this.showDialogue(q.dialogue.available, () => {
          this.questManager.acceptQuest(qid);
          this.updateQuestTracker();
          this.showNotification('Quest: ' + q.name);
          this.sfx.play('questAccept');
        }, name, portrait);
        return;
      }
      if (q.state === 'active') {
        this.showDialogue(q.dialogue.active, null, name, portrait);
        return;
      }
      if (q.state === 'ready') {
        this.showDialogue(q.dialogue.ready, () => {
          this.giveQuestReward(qid);
          this.questManager.completeQuest(qid);
          this.updateQuestTracker();
          this.showNotification('Quest Complete!');
          this.sfx.play('questComplete');
        }, name, portrait);
        return;
      }
      // completed: try next in chain
    }
    // All done
    this.showDialogue(['Thank you for all your help!\nThe region is at peace.'], null, name, portrait);
  }

  _openMerchantShop() {
    const dayPhase = this.dayTime < 0.4 ? 0 : this.dayTime < 0.7 ? 1 : 2;
    const stock = [
      [{ label: 'Health Potion', id: 'health_potion', cost: 30 }, { label: 'Shield Potion', id: 'shield_potion', cost: 40 }, { label: 'Speed Potion', id: 'speed_potion', cost: 35 }],
      [{ label: 'Shield Potion', id: 'shield_potion', cost: 45 }, { label: 'Health Potion', id: 'health_potion', cost: 25 }, { label: 'Speed Potion', id: 'speed_potion', cost: 32 }],
      [{ label: 'Speed Potion', id: 'speed_potion', cost: 28 }, { label: 'Health Potion', id: 'health_potion', cost: 35 }, { label: 'Shield Potion', id: 'shield_potion', cost: 50 }],
    ][dayPhase];

    const lines = [`Gold: ${this.gold}g`, '', ...stock.map((s, i) => `${i + 1}) ${s.label} — ${s.cost}g`)];
    this.showDialogue(lines, () => {}, 'Merchant', null);

    const buyItem = (item) => {
      if (this.gold >= item.cost) {
        this.gold -= item.cost;
        this.events.emit('gold-changed', this.gold);
        this.inventory.addItem(item.id, 1);
        this.events.emit('inventory-changed', this.inventory.slots);
        this.sfx.play('pickup');
        this.showNotification(`Bought: ${item.label}`);
      } else {
        this.sfx.play('menuCancel');
        this.showNotification('Not enough gold!');
      }
    };
    this.input.keyboard.once('keydown-ONE', () => buyItem(stock[0]));
    this.input.keyboard.once('keydown-TWO', () => buyItem(stock[1]));
    this.input.keyboard.once('keydown-THREE', () => buyItem(stock[2]));
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

  // --- Achievement system ---
  _checkAchievements() {
    const qm = this.questManager;
    if (!qm) return;
    const bestiary = this.bestiary || {};
    const bossQuests = ['clear_cave', 'clear_temple', 'clear_forest', 'clear_mountain', 'clear_harbor', 'clear_ruins'];

    for (const ach of ACHIEVEMENTS) {
      if (this.achievements[ach.id]) continue;
      let earned = false;

      switch (ach.id) {
        case 'first_blood':
          earned = Object.values(bestiary).some(v => v > 0);
          break;
        case 'boss_slayer':
          earned = bossQuests.every(qid => qm.getQuest(qid)?.state === 'completed');
          break;
        case 'lich_vanquished':
          earned = qm.getQuest('defeat_lich')?.state === 'completed';
          break;
        case 'crafter':
          earned = (this._craftCount || 0) >= 3;
          break;
        case 'angler':
          earned = (this._fishCount || 0) >= 10;
          break;
        case 'hoarder':
          earned = (this._totalGoldEarned || 0) >= 1000;
          break;
        case 'explorer':
          earned = Object.keys(this.visitedChunks || {}).length >= 20;
          break;
        case 'true_hero':
          earned = (this.starFragments || 0) >= 3 && qm.getQuest('defeat_lich')?.state === 'completed';
          break;
        case 'storyteller':
          earned = !!(this.storyChoices?.bob && this.storyChoices?.mike &&
                      this.storyChoices?.fin && this.storyChoices?.jack);
          break;
      }

      if (earned) {
        this.achievements[ach.id] = Date.now();
        this.showNotification(`Achievement: ${ach.label}!`);
        this.sfx.play('levelUp');
      }
    }
  }

  // --- Goblin raid event ---
  _triggerGoblinRaid() {
    this._raidActive = true;
    this.showNotification('\u26a0 Goblins are raiding Greendale!');
    this.sfx.play('menuCancel');

    // Spawn goblins at map edges near town
    const spawnPoints = [
      { x: 40, y: 200 }, { x: 40, y: 380 },
      { x: 200, y: 760 }, { x: 400, y: 760 },
      { x: 100, y: 100 }, { x: 160, y: 60 },
      { x: 900, y: 200 },
    ];
    this.raidEnemies = this.raidEnemies || this.physics.add.group();

    const toSpawn = Phaser.Utils.Array.Shuffle([...spawnPoints]).slice(0, 7);
    let archers = 0, goblins = 0;
    for (const pos of toSpawn) {
      if (archers < 4) {
        const a = this.spawnGoblinArcher(pos.x, pos.y);
        if (a) { this.raidEnemies.add(a); archers++; }
      } else {
        const g = this.spawnGoblin(pos.x, pos.y);
        if (g) { this.raidEnemies.add(g); goblins++; }
      }
    }

    // 90-second timeout
    this.time.delayedCall(90000, () => {
      if (this._raidActive) {
        this._raidActive = false;
        const stillAlive = this.raidEnemies?.getChildren().filter(e => e.active && e.health > 0).length || 0;
        if (stillAlive > 0) {
          this.showNotification('Raid succeeded... Greendale suffered losses.');
        } else {
          this.showNotification('Raid repelled! +100g +150xp');
          this.addGold(100);
          this.addXP(150);
        }
      }
    });
  }

  // --- Elemental Arrow ---
  _fireElementalArrow() {
    if ((this.arrowCount || 0) <= 0) return;
    this.arrowCount--;

    // Find nearest enemy within 150px
    let target = null;
    let nearestDist = 150;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || !e.health || e.health <= 0) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < nearestDist) { target = e; nearestDist = d; }
    });

    const dirs = { down: { x: 0, y: 1 }, up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, left: { x: -1, y: 0 } };
    let d = dirs[this.player.direction] || { x: 1, y: 0 };
    if (target) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      d = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    const arrow = this.add.rectangle(
      this.player.x + d.x * 12,
      this.player.y + d.y * 12,
      6, 3, 0xff4400, 0.95
    );
    arrow.setDepth(9999);
    this.physics.add.existing(arrow, false);
    arrow.body.setVelocity(d.x * 220, d.y * 220);
    arrow.body.setAllowGravity(false);

    // Destroy after range
    this.time.delayedCall(700, () => { if (arrow.active) arrow.destroy(); });

    // Hit detection
    this.physics.add.overlap(arrow, this.enemies, (_, enemy) => {
      if (!arrow.active || !enemy.active || !enemy.health || enemy.health <= 0) return;
      arrow.destroy();
      let dmg = 3;
      if (enemy.weakness === 'fire') dmg *= 2;
      enemy.takeDamage(dmg, this.player.x, this.player.y);
      this.showDamageNumber(enemy.x, enemy.y - 8, dmg);
      const pop = this.add.circle(enemy.x, enemy.y, 6, 0xff4400, 0.7);
      pop.setDepth(9999);
      this.tweens.add({ targets: pop, scale: 2, alpha: 0, duration: 200, onComplete: () => pop.destroy() });
    });

    this.sfx.play('fireball');
    this.showNotification(`Fire Arrows: ${this.arrowCount} left`);
  }

  // --- Wandering Merchant ---
  _spawnWanderingMerchant() {
    const px = 200 + Math.random() * 300;
    const py = 200 + Math.random() * 100;
    const merchant = new NPC(this, px, py, 'miner-mike', {
      id: 'wandering_merchant',
      name: 'Wandering Merchant',
      wanders: true,
      speed: 15,
      wanderRadius: 60,
    });
    merchant.setTint(0xffee44);
    this.npcs.add(merchant);
    this._wanderingMerchant = merchant;
    this._merchantStock = null; // will be picked first shop open
    this.showNotification('A wandering merchant has appeared!');
    this.sfx.play('questAccept');
    // Auto-despawn after 3 minutes
    this.time.delayedCall(180000, () => this._despawnWanderingMerchant());
  }

  _despawnWanderingMerchant() {
    if (this._wanderingMerchant && this._wanderingMerchant.active) {
      this._wanderingMerchant.prompt?.destroy();
      this._wanderingMerchant.questIcon?.destroy();
      this._wanderingMerchant.destroy();
    }
    this._wanderingMerchant = null;
    this._merchantStock = null;
    this._merchantTimer = 0;
  }

  _openWanderingMerchantShop() {
    const MERCHANT_POOL = [
      { id: 'star_potion',     name: 'Star Potion',    price: 75,  color: '#ffdd88', type: 'star_potion',  desc: 'Restore all mana' },
      { id: 'rune_stone',      name: 'Rune Stone',     price: 120, color: '#8844ff', type: 'rune',         desc: '+1 max mana' },
      { id: 'magic_seed',      name: 'Magic Seed',     price: 90,  color: '#44ee44', type: 'magic_seed',   desc: '+1 HP regen/5s' },
      { id: 'ancient_map',     name: 'Ancient Map',    price: 60,  color: '#ccbb77', type: 'ancient_map',  desc: 'Reveal current map' },
      { id: 'elemental_arrow', name: 'Fire Arrows x5', price: 50,  color: '#ff6622', type: 'arrow',        desc: 'Fire damage' },
      { id: 'speed_crystal',   name: 'Speed Crystal',  price: 80,  color: '#aaddff', type: 'speed_crystal',desc: '+10% speed perm' },
    ];
    if (!this._merchantStock) {
      this._merchantStock = Phaser.Utils.Array.Shuffle([...MERCHANT_POOL]).slice(0, 3);
    }
    const shopItems = this._merchantStock;

    this.inDialogue = true;
    this.player.setVelocity(0, 0);

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const itemCount = shopItems.length;
    const boxW = w - 24;
    const boxH = 28 + itemCount * 14;
    const boxX = w / 2;
    const boxY = h - boxH / 2 - 8;

    this.shopContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(10000);
    const bg = this.add.nineslice(boxX, boxY, 'ui-frames', 'panel-yellow', boxW, boxH, 8, 8, 8, 8);
    this.shopContainer.add(bg);

    const title = this.add.text(boxX, boxY - boxH / 2 + 6, `Wandering Merchant  (Gold: ${this.gold})`, {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#3d2510',
    }).setOrigin(0.5, 0);
    this.shopContainer.add(title);

    shopItems.forEach((item, i) => {
      const y = boxY - boxH / 2 + 20 + i * 14;
      const label = this.add.text(20, y, `${i + 1}: ${item.name} (${item.desc})`, {
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

    this._shopActive = true;
    this._shopItems = shopItems;
    this._shopNPC = this._wanderingMerchant;
    this._isWanderingMerchantShop = true;
    this._shopEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._shopExtraKeys = [];

    // Despawn 1 min after first talk
    if (!this._merchantTalkTimer) {
      this._merchantTalkTimer = true;
      this.time.delayedCall(60000, () => this._despawnWanderingMerchant());
    }
  }

  // --- Weather System ---
  _changeWeather(newWeather) {
    // Clear existing weather effects
    if (this._weatherParticles) {
      this._weatherParticles.forEach(p => { try { if (p && p.active) p.destroy(); } catch(_) {} });
    }
    this._weatherParticles = [];
    if (this._weatherInterval) { this._weatherInterval.remove(false); this._weatherInterval = null; }

    const wasWeather = this._currentWeather;
    this._currentWeather = newWeather;

    // Restore enemy detection ranges if clearing bad weather
    if (wasWeather === 'rain' || wasWeather === 'fog') {
      this.enemies.getChildren().forEach(e => {
        if (e._weatherDetectReduced) {
          e.detectRange = e._origDetectRange || 80;
          e._weatherDetectReduced = false;
        }
      });
    }
    if (wasWeather === 'snow' && this.player?._blizzardSlowed) {
      this.player.speed = this.player._baseSpeed || this.player.speed;
      this.player._blizzardSlowed = false;
    }

    if (newWeather === 'clear') {
      this.showNotification('The weather clears up.');
      return;
    }

    if (newWeather === 'rain') {
      this.showNotification('It starts to rain...');
      this.enemies.getChildren().forEach(e => {
        if (!e._weatherDetectReduced) {
          e._origDetectRange = e.detectRange || 80;
          e.detectRange = Math.round((e.detectRange || 80) * 0.5);
          e._weatherDetectReduced = true;
        }
      });
      // Spawn initial drops and keep interval
      for (let i = 0; i < 20; i++) this._spawnRainDrop();
      this._weatherInterval = this.time.addEvent({
        delay: 150,
        callback: () => { if (this._currentWeather === 'rain') this._spawnRainDrop(); },
        loop: true,
      });
    } else if (newWeather === 'snow') {
      this.showNotification('A blizzard rolls in...');
      if (this.player) {
        this.player._baseSpeed = this.player._baseSpeed || this.player.speed;
        this.player.speed = Math.round(this.player._baseSpeed * 0.9);
        this.player._blizzardSlowed = true;
      }
    } else if (newWeather === 'fog') {
      this.showNotification('Fog rolls in from the sea...');
      this.enemies.getChildren().forEach(e => {
        if (!e._weatherDetectReduced) {
          e._origDetectRange = e.detectRange || 80;
          e.detectRange = Math.round((e.detectRange || 80) * 0.5);
          e._weatherDetectReduced = true;
        }
      });
      this._weatherInterval = this.time.addEvent({
        delay: 300,
        callback: () => {
          if (this._currentWeather !== 'fog') { this._weatherInterval?.remove(false); return; }
          const cam = this.cameras.main;
          const fx = cam.scrollX + Math.random() * cam.width;
          const fy = cam.scrollY + Math.random() * cam.height;
          const fog = this.add.circle(fx, fy, 8, 0xffffff, 0.04);
          fog.setDepth(9990);
          this.tweens.add({ targets: fog, x: fx + 15, alpha: 0, duration: 4000, onComplete: () => fog.destroy() });
        },
        loop: true,
      });
    }
  }

  _spawnRainDrop() {
    const cam = this.cameras.main;
    const rx = cam.scrollX + Math.random() * cam.width;
    const drop = this.add.rectangle(rx, cam.scrollY - 4, 1, 6, 0xaaddff, 0.6);
    drop.setDepth(9990);
    this.tweens.add({
      targets: drop,
      y: cam.scrollY + cam.height + 10,
      x: rx + 8,
      alpha: 0.2,
      duration: 600 + Math.random() * 400,
      onComplete: () => { try { if (drop.active) drop.destroy(); } catch(_) {} },
    });
  }

  // --- Paul the Wizard Battle Assist ---
  _paulBattleHelp(nearbyEnemies) {
    if (this._paulHelping || this._paulRescueActive) return;
    this._paulHelping = true;

    const cam = this.cameras.main;
    const paulSX = cam.width - 28;  // screen-space x (right edge)
    const paulSY = 60;              // screen-space y (just below HUD)

    // Paul sprite (screen-space)
    const paulSprite = this.add.sprite(paulSX, paulSY, 'miner-mike', 0);
    paulSprite.setTint(0x9966ff).setScale(1.0).setAlpha(0).setDepth(10001).setScrollFactor(0);

    // Wizard hat (screen-space graphics)
    const hat = this.add.graphics().setDepth(10002).setScrollFactor(0);
    hat.setAlpha(0);
    const hatX = paulSX;
    const hatY = paulSY - 22;
    hat.fillStyle(0x5522aa);  hat.fillEllipse(hatX, hatY + 2, 18, 4);
    hat.fillStyle(0x6633cc);  hat.fillTriangle(hatX, hatY - 11, hatX - 6, hatY + 1, hatX + 6, hatY + 1);
    hat.fillStyle(0xffdd00);  hat.fillCircle(hatX, hatY - 4, 1.5);

    // "Paul" name tag
    const nameTag = this.add.text(paulSX, paulSY + 20, 'Paul', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#cc88ff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10001).setAlpha(0).setScrollFactor(0);

    // Fade Paul in
    this.tweens.add({ targets: [paulSprite, hat, nameTag], alpha: 1, duration: 250 });

    // Magic sparkle around Paul while he charges
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 60, () => {
        if (!paulSprite.active) return;
        const sx = paulSX + (Math.random() - 0.5) * 22;
        const sy = paulSY + (Math.random() - 0.5) * 22;
        const spark = this.add.circle(sx, sy, 1.5, 0xcc88ff, 0.8).setScrollFactor(0).setDepth(10003);
        this.tweens.add({ targets: spark, alpha: 0, y: sy - 8, duration: 300, onComplete: () => spark.destroy() });
      });
    }

    // Execute assist after brief pause
    this.time.delayedCall(450, () => {
      if (!this.player?.active) { this._paulHelping = false; paulSprite.destroy(); hat.destroy(); nameTag.destroy(); return; }
      this._executePaulAssist(nearbyEnemies, cam, paulSX, paulSY);

      // Fade Paul out after the effect
      this.time.delayedCall(1400, () => {
        this.tweens.add({
          targets: [paulSprite, hat, nameTag],
          alpha: 0,
          duration: 300,
          onComplete: () => {
            paulSprite.destroy();
            hat.destroy();
            nameTag.destroy();
            this._paulHelping = false;
          },
        });
      });
    });
  }

  _executePaulAssist(nearbyEnemies, cam, paulSX, paulSY) {
    const assists = ['fireball', 'heal', 'freeze', 'shield'];
    const available = assists.filter(a => a !== 'heal' || this.player.health < this.player.maxHealth);
    const type = available[Math.floor(Math.random() * available.length)];

    const quips = {
      fireball: ["I've got a spell for that!", "Arcane fire, away!"],
      heal:     ["Stay strong, Lizzy!", "Healing light!"],
      freeze:   ["Cool it, you lot!", "Let's chill things down!"],
      shield:   ["I've got your back!", "Shield of the arcane!"],
    };
    const q = quips[type];
    this.showNotification(`Paul: "${q[Math.floor(Math.random() * q.length)]}"`);

    if (type === 'fireball') {
      const target = nearbyEnemies.find(e => e.active && e.health > 0);
      if (!target) return;
      this.sfx.play('fireball');

      // World-space start point at Paul's screen position
      const fbX = cam.scrollX + paulSX;
      const fbY = cam.scrollY + paulSY;
      const fb = this.add.circle(fbX, fbY, 5, 0xaa44ff, 0.95);
      fb.setDepth(10000);
      this.physics.add.existing(fb, false);
      const angle = Phaser.Math.Angle.Between(fbX, fbY, target.x, target.y);
      fb.body.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);
      fb.body.setAllowGravity(false);

      // Trail
      const trailTimer = this.time.addEvent({
        delay: 25,
        callback: () => {
          if (!fb.active) { trailTimer.remove(); return; }
          const t = this.add.circle(fb.x, fb.y, 3, 0xcc66ff, 0.5);
          t.setDepth(9999);
          this.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 180, onComplete: () => t.destroy() });
        },
        loop: true,
      });

      // Hit detection
      this.physics.add.overlap(fb, this.enemies, (ball, enemy) => {
        if (!ball.active || !enemy.active || !enemy.health || enemy.health <= 0) return;
        ball.destroy();
        trailTimer.remove();
        enemy.takeDamage(3, fbX, fbY);
        this.showDamageNumber(enemy.x, enemy.y - 8, 3, 'magic');
        const burst = this.add.circle(enemy.x, enemy.y, 8, 0xaa44ff, 0.7);
        burst.setDepth(9999);
        this.tweens.add({ targets: burst, scale: 2.5, alpha: 0, duration: 250, onComplete: () => burst.destroy() });
      });
      this.time.delayedCall(900, () => { if (fb.active) { fb.destroy(); trailTimer.remove(); } });

    } else if (type === 'heal') {
      const healed = Math.min(2, this.player.maxHealth - this.player.health);
      if (healed > 0) {
        this.player.health += healed;
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      }
      this.sfx.play('heal');
      this.showFloatingText(this.player.x, this.player.y - 20, `+${healed} HP`, '#cc88ff');
      // Purple healing particles
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = this.add.circle(this.player.x, this.player.y, 2, 0xaa66ff, 0.8).setDepth(9999);
        this.tweens.add({
          targets: p,
          x: this.player.x + Math.cos(a) * 16,
          y: this.player.y + Math.sin(a) * 16 - 8,
          alpha: 0, duration: 450,
          onComplete: () => p.destroy(),
        });
      }

    } else if (type === 'freeze') {
      this.sfx.play('select');
      nearbyEnemies.forEach(e => {
        if (!e.active || e.health <= 0 || e._frozen) return;
        e._frozen = true;
        e.setTint(0x88ccff);
        const origDetect = e.detectRange;
        const origSpeed = e.speed;
        e.detectRange = 0;
        e.speed = 0;
        e.body?.setVelocity(0, 0);
        this.time.delayedCall(3000, () => {
          if (e.active) { e._frozen = false; e.clearTint(); e.detectRange = origDetect; e.speed = origSpeed; }
        });
      });
      // Ice blast ring expanding from player
      const ring = this.add.circle(this.player.x, this.player.y, 8, 0x88ccff, 0.4).setDepth(9999);
      this.tweens.add({ targets: ring, scale: 6, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const s = this.add.circle(this.player.x, this.player.y, 2, 0xffffff, 0.9).setDepth(9999);
        this.tweens.add({
          targets: s,
          x: this.player.x + Math.cos(a) * 45,
          y: this.player.y + Math.sin(a) * 45,
          alpha: 0, duration: 600,
          onComplete: () => s.destroy(),
        });
      }

    } else if (type === 'shield') {
      this.sfx.play('select');
      this.player.invulnerable = true;
      this.player.setTint(0xcc88ff);
      const shield = this.add.circle(this.player.x, this.player.y, 16, 0xaa66ff, 0.35).setDepth(9999);
      const followTimer = this.time.addEvent({
        delay: 16,
        callback: () => {
          if (!shield.active || !this.player?.active) return;
          shield.x = this.player.x;
          shield.y = this.player.y;
        },
        loop: true,
      });
      this.tweens.add({ targets: shield, scaleX: 1.1, scaleY: 1.1, alpha: 0.2, duration: 400, yoyo: true, repeat: 4 });
      this.time.delayedCall(4000, () => {
        followTimer.remove();
        if (this.player?.active) { this.player.invulnerable = false; this.player.clearTint(); }
        if (shield.active) this.tweens.add({ targets: shield, alpha: 0, duration: 200, onComplete: () => shield.destroy() });
      });
    }
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

    // Track visited chunks for fog-of-war
    {
      const chunkSize = this.isOverworld ? 128 : 64;
      const cx = Math.floor(this.player.x / chunkSize);
      const cy = Math.floor(this.player.y / chunkSize);
      const key = `${cx},${cy}`;
      const mapName = this.mapData.name;
      if (!this.visitedChunks[mapName]) this.visitedChunks[mapName] = [];
      if (!this.visitedChunks[mapName].includes(key)) {
        this.visitedChunks[mapName].push(key);
        // Check explorer achievement periodically
        if (this.visitedChunks[mapName].length % 5 === 0) this._checkAchievements();
      }
    }

    // Item hotbar
    for (let i = 0; i < this.itemKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.itemKeys[i])) {
        this.useItem(i);
      }
    }

    // Elemental arrows (R key)
    if (this._rKey && Phaser.Input.Keyboard.JustDown(this._rKey) && (this.arrowCount || 0) > 0) {
      this._fireElementalArrow();
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
      // Priority: NPC > Arena Crystal > Chest > Fishing
      let npcNearby = false;
      this.npcs.getChildren().forEach((n) => { if (n.canInteract) npcNearby = true; });
      if (npcNearby) {
        this.handleNPCInteraction();
      } else if (this._arenaCrystal && !this.inDialogue) {
        this._checkArenaCrystalInteract();
      } else if (this.handleChestOpen()) {
        // Chest was opened
      } else if (this._handleBedRest()) {
        // Bed rest interaction
      } else if (this._handleBookshelf()) {
        // Bookshelf was read
      } else if (this._nearPond && this.isOverworld) {
        this.fishingGame.start(this.level, false);
      } else if (this._nearHarborDock) {
        this.fishingGame.start(this.level, true);
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

      // Pet affection tiers
      if ((this.petAffection || 0) >= 10) {
        this._petAbilityTimer = (this._petAbilityTimer || 0) - delta;
        if (this._petAbilityTimer <= 0) {
          const aff = this.petAffection;
          if (aff >= 50) {
            // Tier 3: sparkle aura around pet
            this._petAbilityTimer = 400;
            const sp = this.add.circle(
              this.pet.x + (Math.random() - 0.5) * 10,
              this.pet.y + (Math.random() - 0.5) * 10,
              2, 0xffdd44, 0.8
            );
            sp.setDepth(9999);
            this.tweens.add({ targets: sp, y: sp.y - 10, alpha: 0, duration: 300, onComplete: () => sp.destroy() });
          } else if (aff >= 25) {
            // Tier 2: pulse glow on nearby chests
            this._petAbilityTimer = 800;
            this.chests.getChildren().forEach(chest => {
              if (chest.opened) return;
              const cd = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, chest.x, chest.y);
              if (cd < 32) {
                this.tweens.add({ targets: chest, alpha: { from: 1, to: 0.5 }, duration: 200, yoyo: true });
              }
            });
          } else {
            // Tier 1: 20% chance to attack nearest enemy within 48px
            this._petAbilityTimer = 1000;
            if (Math.random() < 0.2) {
              let nearestE = null;
              let nearestD = 48;
              this.enemies.getChildren().forEach(e => {
                if (!e.active || !e.health || e.health <= 0) return;
                const ed = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, e.x, e.y);
                if (ed < nearestD) { nearestE = e; nearestD = ed; }
              });
              if (nearestE) {
                nearestE.takeDamage(1, this.pet.x, this.pet.y);
                const ps = this.add.circle(nearestE.x, nearestE.y, 4, 0xffdd44, 0.8);
                ps.setDepth(9999);
                this.tweens.add({ targets: ps, scale: 0, alpha: 0, duration: 200, onComplete: () => ps.destroy() });
              }
            }
          }
        }
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

    // Goblin raid event (overworld, day only, every 3 min)
    if (this.isOverworld && !this._raidActive) {
      this._overworldTime = (this._overworldTime || 0) + delta;
      this._raidCooldown = (this._raidCooldown || 0) - delta;
      if (this._overworldTime > 180000 && this._raidCooldown <= 0 && this.dayTime > 0.25 && this.dayTime < 0.8) {
        this._overworldTime = 0;
        this._raidCooldown = 300000;
        this._triggerGoblinRaid();
      }
    }

    // Wandering merchant timer (overworld only, every 5 min)
    if (this.isOverworld && !this._wanderingMerchant) {
      this._merchantTimer = (this._merchantTimer || 0) + delta;
      if (this._merchantTimer > 300000) {
        this._merchantTimer = 0;
        this._spawnWanderingMerchant();
      }
    }

    // Weather change timer (every 4 min, 30% chance to toggle)
    this._weatherTimer = (this._weatherTimer || 0) + delta;
    if (this._weatherTimer > 240000) {
      this._weatherTimer = 0;
      if (Math.random() < 0.3) {
        const biome = this.isOverworld ? 'overworld' : this.isForest ? 'forest' :
          this.isMountain ? 'mountain' : this.isHarbor ? 'harbor' :
          this.isRuins ? 'ruins' : null;
        if (biome) {
          const weatherByBiome = { overworld: 'rain', forest: 'rain', mountain: 'snow', harbor: 'fog', ruins: 'rain' };
          const newWeather = this._currentWeather === 'clear' ? weatherByBiome[biome] : 'clear';
          if (newWeather) this._changeWeather(newWeather);
        }
      }
    }

    // Paul the Wizard random battle assist
    if (!this.inDialogue && !this._shopActive && !this._paulHelping && !this._paulRescueActive && this.player?.active) {
      if (this._paulHelpCooldown > 0) this._paulHelpCooldown -= delta;
      const combatEnemies = this.enemies.getChildren().filter(e =>
        e.active && e.health > 0 &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) < 120
      );
      if (combatEnemies.length > 0 && this._paulHelpCooldown <= 0) {
        this._paulCombatTimer = (this._paulCombatTimer || 0) + delta;
        if (this._paulCombatTimer >= this._paulHelpThreshold) {
          this._paulCombatTimer = 0;
          this._paulHelpThreshold = 20000 + Math.random() * 10000;
          this._paulHelpCooldown = 40000 + Math.random() * 15000;
          this._paulBattleHelp(combatEnemies);
        }
      } else if (combatEnemies.length === 0) {
        this._paulCombatTimer = 0;
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
    this._nearHarborDock = false;
    if (this.isOverworld) {
      const pondCX = 35.5 * 16;
      const pondCY = 18 * 16;
      const dPond = Phaser.Math.Distance.Between(this.player.x, this.player.y, pondCX, pondCY);
      this._nearPond = dPond < 50;
    }
    // Harbor fishing spot
    if (this.isHarbor && this.mapData.hasFishingSpot) {
      const distDock = Phaser.Math.Distance.Between(this.player.x, this.player.y, 320, 60);
      this._nearHarborDock = distDock < 40;
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
      } else if (this.isMountain) {
        // Snowflakes drifting down
        this._ambientTimer = 600;
        for (let si = 0; si < 2; si++) {
          const sx = cx + (Math.random() - 0.5) * cam.width;
          const sy = cy + (Math.random() - 0.5) * cam.height * 0.6;
          const snow = this.add.circle(sx, sy, 1.5, 0xffffff, 0.6);
          snow.setDepth(9990);
          this.tweens.add({
            targets: snow,
            y: sy + 25 + Math.random() * 20,
            x: sx + (Math.random() - 0.5) * 10,
            alpha: 0, duration: 2000,
            onComplete: () => snow.destroy(),
          });
        }
      } else if (this.isHarbor) {
        // Blue sparkles rising + foam drifting
        this._ambientTimer = 700;
        const hx = cx + (Math.random() - 0.5) * cam.width;
        const hy = cy + (Math.random() - 0.5) * cam.height;
        const sparkle = this.add.circle(hx, hy, 2, 0xaaddff, 0.7);
        sparkle.setDepth(9990);
        this.tweens.add({
          targets: sparkle,
          y: hy - 18,
          alpha: 0, duration: 1500,
          onComplete: () => sparkle.destroy(),
        });
        // Foam dot near water line
        const foamY = cam.scrollY + 20 + Math.random() * 30;
        const foamX = cx + (Math.random() - 0.5) * cam.width;
        const foam = this.add.circle(foamX, foamY, 1.5, 0xffffff, 0.5);
        foam.setDepth(9990);
        this.tweens.add({
          targets: foam,
          x: foamX + 20,
          alpha: 0, duration: 2000,
          onComplete: () => foam.destroy(),
        });
      } else if (this.isRuins) {
        // Purple spores drifting up
        this._ambientTimer = 800;
        for (let ri = 0; ri < 2; ri++) {
          const rx = cx + (Math.random() - 0.5) * cam.width;
          const ry = cy + (Math.random() - 0.5) * cam.height;
          const spore = this.add.circle(rx, ry, 1.5, 0x9944aa, 0.5);
          spore.setDepth(9990);
          this.tweens.add({
            targets: spore,
            y: ry - 22,
            alpha: 0, duration: 2500,
            onComplete: () => spore.destroy(),
          });
        }
      } else if (this.isLichTower) {
        // Void particles orbiting map center
        this._ambientTimer = 400;
        const mapCX = this.worldWidth / 2;
        const mapCY = this.worldHeight / 2;
        for (let vi = 0; vi < 3; vi++) {
          const angle = Math.random() * Math.PI * 2;
          const r = 30 + Math.random() * 50;
          const vx = mapCX + Math.cos(angle) * r;
          const vy = mapCY + Math.sin(angle) * r;
          const voidP = this.add.circle(vx, vy, 2, 0x220033, 0.7);
          voidP.setDepth(9990);
          const newAngle = angle + 0.6;
          this.tweens.add({
            targets: voidP,
            x: mapCX + Math.cos(newAngle) * r,
            y: mapCY + Math.sin(newAngle) * r,
            alpha: 0, duration: 800,
            onComplete: () => voidP.destroy(),
          });
        }
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
      // Light radius scales with mana (60-100px), extended by torch bundle
      const manaRatio = this.player.mana / this.player.maxMana;
      const torchMultiplier = this._torchBonus ? 1.5 : 1.0;
      const lightScale = (0.6 + manaRatio * 0.4) * torchMultiplier; // 0.6 to 1.5
      this.darknessRT.erase('torch-light', px - 80 * lightScale, py - 80 * lightScale);
    }

    // Depth sort
    this.player.setDepth(this.player.y);
    this.enemies.getChildren().forEach((e) => e.setDepth(e.y));
  }
}
