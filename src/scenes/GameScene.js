import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy, Slime } from '../entities/Enemy.js';
import { NPC } from '../entities/NPC.js';
import { Chicken } from '../entities/Chicken.js';
import { QuestManager, QUESTS } from '../systems/QuestManager.js';
import { SFX } from '../systems/SFX.js';
import { MAPS, OVERWORLD_MAP, WORLD_MAP } from '../data/Maps.js';
import { WizardBoss } from '../entities/WizardBoss.js';
import { CoralBeast } from '../entities/CoralBeast.js';
import { SandLich } from '../entities/SandLich.js';
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
import { WardrobeOverlay } from '../ui/WardrobeOverlay.js';
import { Sheep } from '../entities/Sheep.js';
import { Cow }   from '../entities/Cow.js';
import { Horse } from '../entities/Horse.js';
import { LordDire } from '../entities/LordDire.js';

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
  coral_enemy: { gold: 4, xp: 12 },
};

// Achievement definitions (shared with GameMenu)
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

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.mapData = data.mapData || WORLD_MAP;
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
    this.savedTotalKills = data._totalKills || 0;
    this.savedVisitedMaps = data._visitedMaps || [];
    this.savedWeather = data.weather || 'clear';
    this.savedRegenBonus = data._regenBonus || 0;
    this.savedNpcAffection = data.npcAffection || {};
    this.savedStoryChoices = data.storyChoices || {};
    this.savedNpcGiftGiven = data.npcGiftGiven || {};
    this.savedFishLuckBonus = data.fishLuckBonus || false;
    this.savedJackTreeChoice = data.jackTreeChoice || null;
    // Phase 15 — Wardrobe
    this.savedEquippedOutfit   = data.equippedOutfit   || null;
    this.savedUnlockedWardrobe = data.unlockedWardrobe || null;
    // Phase 16 — Pet choice
    this.savedPetType = data.petType || null;
    // Phase 20 — Farm
    this.savedFarmAnimals  = data.farmAnimals  || { sheep: false, cow: false, horse: false };
    this.savedFarmProduces = data.farmProduces || { wool: 0, milk: 0 };
    this.savedFarmFed      = data.farmFed      || { sheep: false, cow: false };
    // Phase 22 — Story Mode + Pet Name
    this.savedStoryMode = data.storyMode || false;
    this.savedPetName = data.petName || null;
    // Phase 24 — Friends & Flowers
    this.savedFlowerGiftsGiven  = data.flowerGiftsGiven  || {};
    this.savedTreasureMapsFound = data.treasureMapsFound || [];
    this.savedDigSpotsDug       = data.digSpotsDug       || [];
    this.savedStargazerComplete = data.stargazerComplete  || false;
    // Phase 23 — Gather, Cook & Grow
    this.savedFarmAnimalNames  = data.farmAnimalNames  || { sheep: null, cow: null, horse: null };
    this.savedHasNet           = data.hasNet           || false;
    this.savedCaughtButterflies = data.caughtButterflies || {};
    this.savedHasWateringCan   = data.hasWateringCan   || false;
    this.savedSeeds            = data.seeds            || {};
    this.savedGardenFlowers    = data.gardenFlowers    || {};
    // Phase 25 — Sparkle & Shine
    this.savedRainbowCrystals  = data.rainbowCrystals  || [];
    // Phase 27 — A Hero's Welcome
    this.savedBearerLetters    = data.bearerLetters     || [];
    this.savedThankYouGiven    = data.thankYouGiven      || [];
    this.savedHouseCandles     = data.houseCandles       || false;
    // Phase 28 — Fish Tales & Cozy Seasons
    this.savedCaughtFishSpecies = data.caughtFishSpecies || {};
    this.savedDreamsHad         = data.dreamsHad         || 0;
    this.savedSeasonTokens      = data.seasonTokens      || [];
    this.savedSeasonIndex       = data.seasonIndex       || 0;
    // Phase 29 — Cozy Corners
    this.savedHouseDecor  = data.houseDecor  || {};
    this.savedHouseTheme  = data.houseTheme  || null;
    this.savedMusicMelody = data.musicMelody || 0;
    // Phase 30 — Grand Festival
    this.savedFestivalComplete = data.festivalComplete || false;
    this.savedFestivalStalls   = data.festivalStalls   || [];
    // Phase 31 — Wishes & Wonders
    this.savedWishesGranted   = data.wishesGranted   || 0;
    this.savedFirefliesCaught = data.firefliesCaught || 0;
    // Prevent instant door re-trigger when spawning near an exit
    this._doorCooldown = !!data.mapData;
  }

  create() {
    const map = this.mapData;
    this.worldWidth = map.width * map.tileSize;
    this.worldHeight = map.height * map.tileSize;
    this.isOverworld = map.name === 'overworld' || map.name === 'world';
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

    // Phase 15 — Wardrobe state
    this.equippedOutfit   = this.savedEquippedOutfit   || { hat: null, dress: null, acc: null };
    this.unlockedWardrobe = this.savedUnlockedWardrobe || {};

    // Wardrobe UI (created before Player so overlay depth is correct)
    this.wardrobeOverlay = new WardrobeOverlay(this);

    // Player
    const spawn = map.playerSpawn || { x: 200, y: 128 };
    this.player = new Player(this, spawn.x, spawn.y);
    if (this.savedPlayerHealth !== null) {
      this.player.health = this.savedPlayerHealth;
    }
    // Apply saved outfit immediately
    this.player.setOutfit(this.equippedOutfit);

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

    // Phase 19: new town NPCs
    if (map.name === 'harbor_town') this.spawnHarborTownNPCs();
    if (map.name === 'forest_town') this.spawnForestTownNPCs();
    if (map.name === 'desert_town') this.spawnDesertTownNPCs();

    // Phase 20: farm
    if (map.farmMap) {
      this._spawnFarmNPC();
      this._spawnHayBale();
      this.time.delayedCall(100, () => this.spawnFarmAnimals());
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
      this.time.delayedCall(600, () => {
        const bossNames = {
          pharaoh: 'The Pharaoh', skeleton_king: 'The Skeleton King', orc_chief: 'The Orc Chief',
          ice_witch: 'The Ice Witch', sea_serpent: 'The Sea Serpent',
          death_knight: 'The Death Knight', lich_king: 'THE LICH KING',
          wizard_boss: 'The Arcane Wizard', coral_beast: 'The Coral Beast', sand_lich: 'The Sand Lich',
          lord_dire: 'LORD DIRE',
        };
        const bossName = bossNames[map.bossType] || 'A Powerful Foe';
        this.cameras.main.shake(350, 0.01);
        // Cinematic boss title card
        const _ui = this.scene.get('UI') || this;
        const _w = 320, _cx = _w / 2, _cy = 101;
        const _flash = _ui.add.rectangle(_cx, _cy, _w, 202, 0x220000, 0.7)
          .setScrollFactor(0).setDepth(15000);
        const _nameT = _ui.add.text(_cx, _cy + 30, bossName, {
          fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
          color: '#ff4444', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(15001).setAlpha(0);
        const _subT = _ui.add.text(_cx, _cy + 48, '— Boss Encounter —', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#ffaaaa', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(15001).setAlpha(0);
        _ui.tweens.add({ targets: _nameT, alpha: 1, y: _cy + 18, duration: 400, ease: 'Power2' });
        _ui.tweens.add({ targets: _subT, alpha: 1, duration: 400, delay: 200 });
        _ui.tweens.add({ targets: [_flash, _nameT, _subT], alpha: 0, duration: 600, delay: 1600,
          onComplete: () => { _flash.destroy(); _nameT.destroy(); _subT.destroy(); } });
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
    this.petAbilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.danceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.journalKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    // Menu key
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.trackedQuestId = this.savedTrackedQuestId || null;

    // Magic attack key
    this.magicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.magicProjectiles = this.add.group();

    // Spell system: Blue Flame (lv1, weak+far), Fireball (lv1, strong+short), Ice Bolt (lv3), Heal (lv5), Chain Lightning (lv7)
    this.spells = [
      { name: 'Blue Flame', color: 0x2266ff, manaCost: 2, damage: 2, speed: 190, lifetime: 950, minLevel: 1, element: 'fire' },
      { name: 'Fireball',   color: 0xff3311, manaCost: 4, damage: 5, speed: 120, lifetime: 500, minLevel: 1, element: 'fire' },
      { name: 'Ice Bolt',   color: 0x44aaff, manaCost: 4, damage: 2, speed: 140, lifetime: 1000, minLevel: 3, slow: true, element: 'ice' },
      { name: 'Heal',       color: 0x44ff44, manaCost: 7, healAmount: 2, cooldown: 3000, minLevel: 5, isHeal: true },
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
    this.petType = this.savedPetType || null;
    this.visitedChunks = this.savedVisitedChunks || {};
    this._lichTowerUnlocked = this.savedLichTowerUnlocked || false;

    // Achievement tracking
    this.achievements = this.savedAchievements || {};
    this._craftCount = this.savedCraftCount || 0;
    this._fishCount = this.savedFishCount || 0;
    this._totalGoldEarned = this.savedTotalGoldEarned || 0;
    this._totalKills = this.savedTotalKills || 0;
    this._visitedMaps = new Set(this.savedVisitedMaps || []);

    // Phase 14: NPC affection & story state
    this.npcAffection = this.savedNpcAffection || {};
    this.storyChoices = this.savedStoryChoices || {};
    this._npcGiftGiven = this.savedNpcGiftGiven || {};
    this._fishLuckBonus = this.savedFishLuckBonus || false;
    this._jackTreeChoice = this.savedJackTreeChoice || null;

    // Phase 20 — Farm state
    this.farmAnimals  = this.savedFarmAnimals;
    this.farmProduces = this.savedFarmProduces;
    this.farmFed      = this.savedFarmFed;

    // Phase 22 — Story Mode + Pet Name
    this.storyMode = this.savedStoryMode || false;
    this.petName = this.savedPetName || null;
    // Phase 25/26 state
    this.rainbowCrystals   = [...this.savedRainbowCrystals];
    this._petMaxBondShown  = false;
    this._outfitReactedNPCs = new Set();
    this._direPortalGfx    = null;
    this._direPortalLabel  = null;
    // Phase 27 state
    this.bearerLetters = [...this.savedBearerLetters];
    this.thankYouGiven = [...this.savedThankYouGiven];
    this.houseCandles  = this.savedHouseCandles || !!this.achievements?.lord_dire_vanquished;
    this._heroTitle    = null;
    // Phase 28 state
    this.caughtFishSpecies = { ...this.savedCaughtFishSpecies };
    this.dreamsHad         = this.savedDreamsHad;
    this.seasonTokens      = [...this.savedSeasonTokens];
    this.seasonIndex       = this.savedSeasonIndex;
    this._seasonTimer      = 0;
    this._seasonOverlay    = null;
    this._bedZone          = null;
    this._bedLabel         = null;
    this._dreamBonusApplied = false;
    // Phase 29 state
    this.houseDecor  = { ...this.savedHouseDecor };
    this.houseTheme  = this.savedHouseTheme;
    this.musicMelody = this.savedMusicMelody;
    this._cozyBuffTimer  = 0;
    this._musicBoxZone   = null;
    this._musicBoxLabel  = null;
    // Phase 30 state
    this.festivalComplete = this.savedFestivalComplete;
    this.festivalStalls   = [...this.savedFestivalStalls];
    this._festivalCakeBuff      = 0;
    this._festivalStallLabels   = [];
    this._festivalDanceZone     = null;
    this._festivalFlowerZone    = null;
    // Phase 31 state
    this.wishesGranted    = this.savedWishesGranted;
    this.firefliesCaught  = this.savedFirefliesCaught;
    this._luckyStarActive = false;
    this._luckyStarTimer  = 0;
    this._luckyStarOrb    = null;
    this._fireflies       = [];
    // Phase 24 state
    this.flowerGiftsGiven  = { ...this.savedFlowerGiftsGiven };
    this.treasureMapsFound = [...this.savedTreasureMapsFound];
    this.digSpotsDug       = [...this.savedDigSpotsDug];
    this.stargazerComplete = this.savedStargazerComplete;
    this._digSpots         = [];
    this._corkboardZone    = null;
    this._telescopeZone    = null;
    // Phase 23 state
    this.farmAnimalNames   = { ...this.savedFarmAnimalNames };
    this.hasNet            = this.savedHasNet;
    this.caughtButterflies = { ...this.savedCaughtButterflies };
    this.hasWateringCan    = this.savedHasWateringCan;
    this.seeds             = { ...this.savedSeeds };
    this.gardenFlowers     = { ...this.savedGardenFlowers };
    this._gardenPatches    = [];
    this._nearCauldron     = false;
    this._butterflySpawnTimer = 0;
    this._farmSheep   = null;
    this._farmCow     = null;
    this._farmHorse   = null;
    this._hayBaleZone = null;
    this._nearHayBale = false;
    this._ridingHorse = false;
    this._preRideSpeed = 80;
    this._bossUiShown = false;
    this._bossDisplayName = '';

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

    // Pet companion (unlocked after defeating Skeleton King, type chosen by player)
    this.pet = null;
    this._critters = [];
    this._kennelCost = 0;
    {
      const caveQuest = this.questManager.getQuest('clear_cave');
      if (caveQuest && caveQuest.state === 'completed') {
        if (this.petType) {
          const spawn = this.mapData.playerSpawn || { x: 200, y: 128 };
          this.pet = new Pet(this, spawn.x + 16, spawn.y + 16, this.petType);
        } else if (this.isOverworld) {
          this.time.delayedCall(1500, () => this._showPetChoice('first'));
        }
      }
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
      world: 'overworld',
      cave: 'cave',
      boss_room: 'boss',
      desert_temple: 'desert',
      pharaoh_chamber: 'boss',
      forest: 'forest',
      forest_boss: 'boss',
      town2: 'interior',
      harbor_town: 'interior',
      forest_town: 'forest',
      desert_town: 'desert',
      mountain: 'mountain',
      mountain_cave: 'boss',
      harbor: 'cave',
      sea_cave: 'boss',
      ruins: 'ruins',
      ruins_dungeon: 'boss',
      shadow_keep: 'boss',
      arcane_crypt: 'boss',
      beach_dungeon: 'boss',
      wizard_tower_1f: 'cave',
      wizard_tower_2f: 'boss',
      wizard_tower_top: 'boss',
      lich_tower: 'boss',
      farm: 'overworld',
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
      this.events.emit('spell-changed', this.currentSpellIndex, this.spells[this.currentSpellIndex]);
    });

    // Track visited maps
    this._visitedMaps.add(this.mapData.name);

    // Schedule ambient SFX per biome
    this._scheduleAmbientSfx();

    // Phase 23 — Garden patches (world/overworld map)
    if (this.isOverworld) this._initGardenPatches();
    // Phase 24 — Dig spots (world/overworld map)
    if (this.isOverworld) this._initDigSpots();
    // Phase 26 — Shadow Citadel portal + opening lore (world map only)
    if (this.mapData.name === 'world') {
      this._spawnDirePortal();
      this._showDireIntroLore();
      // Phase 27 — Hero title + victory parade after Lord Dire defeated
      // Phase 31 — Wishing well + fireflies (always on world map)
      this._spawnWishingWell();
      this._scheduleFireflySpawns();
      if (this.achievements?.lord_dire_vanquished) {
        this._checkParade();
        // Phase 30 — Festival zone
        this._spawnFestivalZone();
        this._heroTitle = this.add.text(0, 0, '★ Light Bringer ★', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(1500);
        this.tweens.add({ targets: this._heroTitle, alpha: { from: 0.6, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
      }
    }
    // Phase 27 — Bearer scroll in boss rooms (revisit after crystal collected)
    this._spawnBearerScroll();
    // Phase 28 — Season tints (world map only)
    this._initSeasons();
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
    const portraitSize = 44;
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
    const textX = 54;

    // Speaker name
    this.dialogueSpeaker = this.add.text(textX, boxY + 4, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd00',
      stroke: '#442200',
      strokeThickness: 2,
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
    // Clean up any pending choice-mode listeners
    if (this._cleanupChoiceListeners) this._cleanupChoiceListeners();
    this._inChoiceMode = false;
    this._currentChoices = null;

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
    this._currentChoices = choices;
    this.dialogueContainer.setVisible(true);
    this.physics.pause();
    if (this.boss && this.boss.pauseTimers) this.boss.pauseTimers();
    if (this.dialogueArrow) this.dialogueArrow.setVisible(false);

    this.dialogueSpeaker.setText('Choose:');
    const choiceText = choices.map((c, i) => `${i + 1}) ${c.text}`).join('\n');
    this.dialogueText.setText(choiceText);
    this.dialogueCallback = null;

    const _pick = (idx) => {
      if (this._cleanupChoiceListeners) this._cleanupChoiceListeners();
      if (this.dialogueArrow) this.dialogueArrow.setVisible(true);
      this._inChoiceMode = false;
      this._currentChoices = null;
      choices[idx].callback();
      this.closeDialogue();
    };

    const onOne   = () => _pick(0);
    const onTwo   = () => _pick(1);
    const onThree = () => _pick(2);
    const onFour  = () => _pick(3);

    // Store cleanup so closeDialogue() and the ESC update-loop handler can call it
    this._cleanupChoiceListeners = () => {
      this.input.keyboard.off('keydown-ONE',   onOne);
      this.input.keyboard.off('keydown-TWO',   onTwo);
      this.input.keyboard.off('keydown-THREE', onThree);
      this.input.keyboard.off('keydown-FOUR',  onFour);
      this._cleanupChoiceListeners = null;
    };

    this.input.keyboard.once('keydown-ONE', onOne);
    this.input.keyboard.once('keydown-TWO', onTwo);
    if (choices.length > 2) this.input.keyboard.once('keydown-THREE', onThree);
    if (choices.length > 3) this.input.keyboard.once('keydown-FOUR',  onFour);
    // ESC is handled in update() to avoid opening the game menu in the same frame
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
    } else if (map.floorTile === 'shadow-floor') {
      // Shadow Citadel — very dark purple/black checkerboard with void veins
      for (let row = 0; row < map.height; row++) {
        for (let col = 0; col < map.width; col++) {
          const shade = ((row + col) % 2 === 0) ? 0x1a0022 : 0x110018;
          this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, shade).setDepth(0);
          if ((row * 5 + col * 9) % 11 === 0) {
            const vx = col * ts + ts / 2, vy = row * ts + ts / 2;
            const vein = this.add.graphics().setDepth(1);
            vein.lineStyle(1, 0x6600aa, 0.5);
            vein.lineBetween(vx - 4, vy - 2, vx + 2, vy + 3);
          }
        }
      }
      if (map.layers.collision) {
        for (let row = 0; row < map.height; row++) {
          for (let col = 0; col < map.width; col++) {
            if (map.layers.collision[row]?.[col] === 1) {
              this.add.rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts, 0x0d0011).setDepth(0);
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

    // Boat dock zone (harbor map only)
    this._boatDockZone = null;
    if (map.name === 'harbor') {
      this._boatDockZone = this.add.zone(400, 64, 48, 32);
      this.physics.add.existing(this._boatDockZone, true);
      // Ferry dock sign
      const dockSign = this.add.rectangle(400, 48, 76, 16, 0x8b6914);
      dockSign.setDepth(200);
      this.add.text(400, 48, 'Ferry Dock', {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(201);
    }

    // Environmental decorations
    const isNewTown = map.name === 'harbor_town' || map.name === 'forest_town' || map.name === 'desert_town';
    if (this.isOverworld || this.isForest || this.isTown2 || this.isMountain || this.isHarbor || this.isRuins || isNewTown) {
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
          // Phase 28 — [E] Rest interaction zone
          this._bedZone = this.add.zone(item.x, item.y, 36, 50);
          this.physics.add.existing(this._bedZone, true);
          this._bedLabel = this.add.text(item.x, item.y - 26, '[E] Rest', {
            fontSize: '9px', fontFamily: 'Arial, sans-serif',
            color: '#ffffff', stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(item.y + 200).setAlpha(0);
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
      } else if (item.type === 'mirror') {
        // Phase 15 — decorative magical mirror (silver frame + reflective interior)
        // Frame (outer silver border)
        const frame = this.add.rectangle(item.x, item.y, 20, 26, 0xccccee);
        frame.setDepth(item.y);
        // Rounded top arch effect
        this.add.ellipse(item.x, item.y - 7, 20, 10, 0xbbbbdd).setDepth(item.y + 0.5);
        // Mirror glass interior
        this.add.rectangle(item.x, item.y, 14, 20, 0x99ccff, 0.7).setDepth(item.y + 1);
        // Sparkle accents (two small diamonds)
        this.add.star(item.x - 4, item.y - 4, 4, 2, 4, 0xffffff, 0.9).setDepth(item.y + 2);
        this.add.star(item.x + 4, item.y + 4, 4, 2, 4, 0xffffff, 0.7).setDepth(item.y + 2);
        // "E" prompt label
        const mirrorPrompt = this.add.text(item.x, item.y - 20, '[E]', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffddff', stroke: '#440066', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(item.y + 3);
        // Gentle pulse tween on the prompt
        this.tweens.add({ targets: mirrorPrompt, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
        // Interaction zone (no collision — player can walk up to it)
        const mZone = this.add.zone(item.x, item.y, 20, 26);
        this.physics.add.existing(mZone, false);
        mZone.body.enable = false; // no collision, just used for proximity check
        mZone.isMirror = true;
        if (!this._mirrorZones) this._mirrorZones = [];
        this._mirrorZones.push(mZone);
      } else if (item.type === 'corkboard') {
        // Phase 24 — Butterfly display board (cork-colored rectangle with pushpin dots)
        const board = this.add.rectangle(item.x, item.y, 22, 18, 0xcc8844);
        board.setDepth(item.y);
        this.add.rectangle(item.x, item.y, 20, 16, 0xddaa66).setDepth(item.y + 1);
        // Decorative colored pins
        const pinColors = [0xff6688, 0x88aaff, 0xffdd00, 0x88ee88];
        pinColors.forEach((col, i) => {
          this.add.circle(item.x - 6 + i * 4, item.y - 4, 1.5, col).setDepth(item.y + 2);
        });
        this.add.text(item.x, item.y + 4, 'Board', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#553311',
          stroke: '#ddcc99', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(item.y + 2);
        const bZone = this.add.zone(item.x, item.y, 22, 18);
        this.physics.add.existing(bZone, true);
        this.obstacles.add(bZone);
        this._corkboardZone = { x: item.x, y: item.y };
      } else if (item.type === 'telescope') {
        // Phase 24 — Stargazing telescope (dark tube on tripod)
        const tube = this.add.rectangle(item.x + 2, item.y - 4, 14, 6, 0x333355);
        tube.setDepth(item.y);
        tube.setRotation(-0.3);
        this.add.rectangle(item.x - 2, item.y + 4, 4, 8, 0x444466).setDepth(item.y - 1);
        this.add.circle(item.x + 7, item.y - 6, 3, 0x88aaff, 0.7).setDepth(item.y + 1);
        this.add.text(item.x, item.y + 10, 'Scope', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#8888cc',
          stroke: '#000022', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(item.y + 2);
        const tZone = this.add.zone(item.x, item.y, 22, 22);
        this.physics.add.existing(tZone, true);
        this.obstacles.add(tZone);
        this._telescopeZone = { x: item.x, y: item.y };
      } else if (item.type === 'candle_stand') {
        // Phase 27 — Cozy home candles (only visible after buying or Lord Dire defeated)
        if (!this.houseCandles) return;
        // Holder base
        this.add.rectangle(item.x, item.y + 5, 8, 4, 0x886644).setDepth(item.y);
        // Candle body
        this.add.rectangle(item.x, item.y - 1, 4, 8, 0xffeecc).setDepth(item.y + 1);
        // Flame
        const flame = this.add.ellipse(item.x, item.y - 7, 4, 5, 0xffaa00, 0.9);
        flame.setDepth(item.y + 2);
        this.tweens.add({ targets: flame, scaleX: 0.6, scaleY: 1.2, duration: 200 + Math.random() * 100, yoyo: true, repeat: -1 });
        // Warm glow halo
        const glow = this.add.circle(item.x, item.y - 3, 14, 0xffcc44, 0.12);
        glow.setDepth(item.y - 1);
        this.tweens.add({ targets: glow, alpha: 0.05, duration: 280, yoyo: true, repeat: -1 });
      } else if (item.type === 'cauldron') {
        // Phase 23 — Cooking cauldron (black pot with green bubbles)
        const pot = this.add.circle(item.x, item.y + 2, 9, 0x222222);
        pot.setDepth(item.y);
        const rim = this.add.ellipse(item.x, item.y - 4, 18, 8, 0x444444);
        rim.setDepth(item.y + 1);
        const steam1 = this.add.circle(item.x - 3, item.y - 10, 2, 0x44ff88, 0.7);
        const steam2 = this.add.circle(item.x + 3, item.y - 10, 2, 0x44ff88, 0.7);
        steam1.setDepth(item.y + 2); steam2.setDepth(item.y + 2);
        this.tweens.add({ targets: steam1, y: item.y - 18, alpha: 0, duration: 1200, yoyo: false, repeat: -1, delay: 0 });
        this.tweens.add({ targets: steam2, y: item.y - 18, alpha: 0, duration: 1200, yoyo: false, repeat: -1, delay: 600 });
        const zone = this.add.zone(item.x, item.y, 18, 18);
        this.physics.add.existing(zone, true);
        this.obstacles.add(zone);
        this._cauldronZone = { x: item.x, y: item.y };
        this._cauldronLabel = this.add.text(item.x, item.y - 18, '[E] Cook', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#44ff88', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999).setAlpha(0);
      }
    }

    // Phase 29 — Dynamic house decor (player-bought furniture from Clara)
    if (map.name === 'house_interior') {
      this._applyHouseTheme();
      const d = this.houseDecor || {};

      if (d.flower_vase) {
        // Small vase with colorful flowers on windowsill
        this.add.rectangle(80, 40, 6, 8, 0x88aacc).setDepth(41); // vase
        this.add.circle(80, 33, 3, 0xff6688, 0.9).setDepth(42);  // flower
        this.add.circle(77, 35, 2, 0xffaa44, 0.9).setDepth(42);
        this.add.circle(83, 35, 2, 0xff88cc, 0.9).setDepth(42);
      }

      if (d.fancy_rug) {
        // Decorative rug — oval on the floor
        const rug = this.add.ellipse(112, 88, 48, 22, 0xcc4444, 0.7);
        rug.setDepth(1);
        const rugInner = this.add.ellipse(112, 88, 36, 14, 0xffcc44, 0.5);
        rugInner.setDepth(2);
      }

      if (d.potted_plant) {
        // Green potted plant in corner
        this.add.rectangle(176, 84, 10, 6, 0x8b5e3c).setDepth(85); // pot
        this.add.ellipse(176, 76, 14, 14, 0x44aa33, 0.9).setDepth(86); // leaves
        this.add.ellipse(172, 72, 8, 10, 0x33881a, 0.8).setDepth(86);
        this.add.ellipse(180, 74, 8, 10, 0x44aa22, 0.8).setDepth(86);
      }

      if (d.wall_painting) {
        // Small framed painting above bookshelf area
        this.add.rectangle(96, 30, 18, 12, 0x664422).setDepth(31); // frame
        this.add.rectangle(96, 30, 14, 8, 0x88aacc).setDepth(32);  // sky
        this.add.ellipse(96, 33, 10, 6, 0x44aa33, 0.8).setDepth(32); // hills
        this.add.circle(100, 27, 2, 0xffdd44, 0.9).setDepth(32);   // sun
      }

      if (d.pet_bed && this.petType) {
        // Small pet bed in lower-left corner
        const bedBase = this.add.ellipse(48, 112, 20, 12, 0xcc8844, 0.9);
        bedBase.setDepth(111);
        const bedPillow = this.add.ellipse(48, 110, 12, 8, 0xffeecc, 0.8);
        bedPillow.setDepth(112);
        // Cute "ZZz" label
        this.add.text(48, 103, 'zzz', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#aaaacc', fontStyle: 'normal',
        }).setOrigin(0.5).setDepth(113);
      }

      if (d.music_box) {
        // Music box — small wooden box with spinning top
        this.add.rectangle(48, 52, 12, 8, 0x774422).setDepth(53); // base
        this.add.rectangle(48, 48, 10, 4, 0x996633).setDepth(54); // lid
        const noteDot = this.add.circle(52, 44, 2, 0xffdd00, 0.9).setDepth(55);
        this.tweens.add({ targets: noteDot, alpha: { from: 0.2, to: 1 }, y: '-=4',
          duration: 800, yoyo: false, repeat: -1, ease: 'Power1' });
        // Interaction zone
        this._musicBoxZone = { x: 48, y: 52 };
        this._musicBoxLabel = this.add.text(48, 40, '[E] Music', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffdd88', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999).setAlpha(0);
      }
    }
  }

  spawnNPCs() {
    // Farmer Bob - skeleton quest + delivery quest
    const bob = new NPC(this, 648, 192, 'farmer-bob', {
      id: 'farmer_bob',
      name: 'Farmer Bob',
      questId: 'skeleton_hunt',
      idleAnim: 'npc-bob-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-bob-walk-down', right: 'npc-bob-walk-right', up: 'npc-bob-walk-up' },
      schedule: [
        { time: 0, x: 620, y: 160 },    // night: near house
        { time: 0.3, x: 648, y: 192 },  // morning: fields
        { time: 0.65, x: 640, y: 175 }, // afternoon: near house
        { time: 0.8, x: 620, y: 160 },  // evening: home
      ],
    });
    this.npcs.add(bob);

    // Farmer Buba - chicken quest
    const buba = new NPC(this, 680, 320, 'farmer-buba', {
      id: 'farmer_buba',
      name: 'Farmer Buba',
      questId: 'chicken_roundup',
      idleAnim: 'npc-buba-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 35,
      wanderAnims: { down: 'npc-buba-walk-down', right: 'npc-buba-walk-right', up: 'npc-buba-walk-up' },
      schedule: [
        { time: 0, x: 680, y: 310 },    // night: near home
        { time: 0.3, x: 680, y: 320 },  // morning: fields
        { time: 0.7, x: 680, y: 310 },  // evening: home
      ],
    });
    this.npcs.add(buba);

    // Chef Chloe - delivery recipient, wanders near pond
    const chloe = new NPC(this, 700, 240, 'chef-chloe', {
      id: 'chef_chloe',
      name: 'Chef Chloe',
      idleAnim: 'npc-chloe-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-chloe-walk-down', right: 'npc-chloe-walk-right', up: 'npc-chloe-walk-up' },
      dialogueLines: ['I love cooking with\nfresh ingredients!', 'The pond has the best\nwater for my recipes!'],
      schedule: [
        { time: 0, x: 680, y: 240 },    // night: near shop
        { time: 0.3, x: 700, y: 240 },  // morning: town area
        { time: 0.65, x: 720, y: 200 }, // afternoon: center
        { time: 0.8, x: 680, y: 240 },  // evening: shop
      ],
    });
    this.npcs.add(chloe);

    // Fisherman Fin - pond quest
    const fin = new NPC(this, 660, 380, 'fisherman-fin', {
      id: 'fisherman_fin',
      name: 'Fisherman Fin',
      questId: 'explore_pond',
      idleAnim: 'npc-fin-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 25,
      wanderAnims: { down: 'npc-fin-walk-down', right: 'npc-fin-walk-right', up: 'npc-fin-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 160 },    // night: inn
        { time: 0.25, x: 660, y: 380 },  // dawn: by pond/lake
        { time: 0.7, x: 720, y: 160 },   // evening: inn
      ],
    });
    this.npcs.add(fin);

    // Lumberjack Jack - slime quest, wanders in woods near forest entrance
    const jack = new NPC(this, 224, 320, 'lumberjack-jack', {
      id: 'lumberjack_jack',
      name: 'Lumberjack Jack',
      questId: 'slime_cleanup',
      idleAnim: 'npc-jack-idle-down',
      wanders: true,
      speed: 14,
      wanderRadius: 50,
      wanderAnims: { down: 'npc-jack-walk-down', right: 'npc-jack-walk-right', up: 'npc-jack-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 160 },    // night: inn
        { time: 0.3, x: 224, y: 320 },  // morning: forest edge
        { time: 0.5, x: 192, y: 350 },  // midday: west woods
        { time: 0.75, x: 720, y: 160 }, // dusk: inn
      ],
    });
    this.npcs.add(jack);

    // Miner Mike - cave boss quest, wanders east
    const mike = new NPC(this, 720, 224, 'miner-mike', {
      id: 'miner_mike',
      name: 'Miner Mike',
      questId: 'clear_cave',
      idleAnim: 'npc-mike-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 40,
      wanderAnims: { down: 'npc-mike-walk-down', right: 'npc-mike-walk-right', up: 'npc-mike-walk-up' },
      schedule: [
        { time: 0, x: 720, y: 160 },    // night: inn
        { time: 0.25, x: 144, y: 96 },   // dawn: near mine entrance
        { time: 0.5, x: 720, y: 224 },   // midday: fields
        { time: 0.8, x: 720, y: 160 },   // evening: inn
      ],
    });
    this.npcs.add(mike);

    // Ranger Reed - forest dungeon quest chain: scout_forest → clear_forest
    const reed = new NPC(this, 256, 352, 'lumberjack-jack', {
      id: 'ranger_reed',
      name: 'Ranger Reed',
      questId: 'scout_forest',
      idleAnim: 'npc-jack-idle-down',
      wanders: true,
      speed: 10,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-jack-walk-down', right: 'npc-jack-walk-right', up: 'npc-jack-walk-up' },
      schedule: [
        { time: 0, x: 256, y: 352 },
        { time: 0.3, x: 240, y: 370 },
        { time: 0.7, x: 256, y: 352 },
      ],
    });
    reed.setTint(0x88bb88); // Green tint to distinguish from Jack
    this.npcs.add(reed);

    // Brock the Beastmaster — kennel NPC for pet swapping (Phase 16)
    const brock = new NPC(this, 700, 300, 'farmer-bob', {
      id: 'kennel_keeper',
      name: 'Brock',
      idleAnim: 'npc-bob-idle-down',
      wanders: false,
      dialogueLines: ["Brock: Come back after\nyour first adventure!"],
    });
    brock.setTint(0xcc8844);
    this.npcs.add(brock);

    // Town guards — south gate (forest path) and north gate (cave path)
    const guardSouth = new NPC(this, 320, 432, 'farmer-bob', {
      id: 'guard_south',
      name: 'Guard',
      idleAnim: 'npc-bob-idle-down',
      wanders: false,
      dialogueLines: ['Guard: I watch the south gate.'],
    });
    guardSouth.setTint(0x8899cc);
    this.npcs.add(guardSouth);

    const guardNorth = new NPC(this, 144, 128, 'farmer-bob', {
      id: 'guard_north',
      name: 'Guard',
      idleAnim: 'npc-bob-idle-down',
      wanders: false,
      dialogueLines: ['Guard: The cave lies to the north.'],
    });
    guardNorth.setTint(0x8899cc);
    this.npcs.add(guardNorth);

    // Clara the Crafter — Phase 29 furniture/decor shop (near town cluster)
    const clara = new NPC(this, 548, 200, 'farmer-bob', {
      id: 'clara_crafter',
      name: 'Clara',
      questId: 'decorate_home',
      idleAnim: 'npc-bob-idle-down',
      wanders: false,
      dialogueLines: ['Clara: Let me help you\nmake your home extra cozy!'],
    });
    clara.setTint(0xffaacc); // Pink tint
    this.npcs.add(clara);

    // Phase 30 — Festival NPCs (only after Lord Dire defeated, world map only)
    if (this.mapData.name === 'world' && this.achievements?.lord_dire_vanquished) {
      const edna = new NPC(this, 764, 200, 'farmer-bob', {
        id: 'cook_edna', name: 'Cook Edna', questId: null,
        idleAnim: 'npc-bob-idle-down', wanders: false,
        dialogueLines: ['Edna: Welcome to the\nGrand Festival!'],
      });
      edna.setTint(0xffcc88);
      this.npcs.add(edna);

      const pip = new NPC(this, 764, 220, 'farmer-bob', {
        id: 'bard_pip', name: 'Bard Pip', questId: 'festival_dance',
        idleAnim: 'npc-bob-idle-down', wanders: false,
        dialogueLines: ["Pip: Come dance with us!"],
      });
      pip.setTint(0xaaddff);
      this.npcs.add(pip);
    }
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
      } else if (e.type === 'ghost') {
        const g = new Ghost(this, e.x, e.y);
        this._applyNGP(g);
        this.enemies.add(g);
      } else if (e.type === 'coral_enemy') {
        const coral = new Enemy(this, e.x, e.y, 'skeleton', {
          health: 3, speed: 35, enemyType: 'coral_enemy',
          idleAnim: 'skeleton-idle-down', damage: 1,
        });
        coral.setTint(0x44ccbb);
        this._applyNGP(coral);
        this.enemies.add(coral);
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
    const bossDisplayNames = {
      pharaoh: 'The Pharaoh', skeleton_king: 'Skeleton King', orc_chief: 'Orc Chief',
      ice_witch: 'Ice Witch', sea_serpent: 'Sea Serpent',
      death_knight: 'Death Knight', lich_king: 'Lich King',
      wizard_boss: 'Arcane Wizard', coral_beast: 'Coral Beast', sand_lich: 'Sand Lich',
      lord_dire: 'Lord Dire',
    };
    this._bossDisplayName = bossDisplayNames[bossType] || 'Boss';
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
    } else if (bossType === 'wizard_boss') {
      this.boss = new WizardBoss(this, cx, cy);
    } else if (bossType === 'coral_beast') {
      this.boss = new CoralBeast(this, cx, cy);
    } else if (bossType === 'sand_lich') {
      this.boss = new SandLich(this, cx, cy);
    } else if (bossType === 'lord_dire') {
      this.boss = new LordDire(this, cx, cy);
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

    // Phase 15 — Wardrobe loot chests
    if (nearest.isSecret && nearest.secretLoot === 'wardrobe_bunny') {
      this._unlockWardrobeItem('hat-bunnyears', 'Bunny Ears');
      this.time.delayedCall(600, () => this._unlockWardrobeItem('outfit-bunny', 'Bunny Suit'));
      return true;
    }
    if (nearest.isSecret && nearest.secretLoot === 'wardrobe_wizard') {
      this._unlockWardrobeItem('hat-wizardhat', 'Wizard Hat');
      return true;
    }
    if (nearest.isSecret && nearest.secretLoot === 'wardrobe_cape') {
      this._unlockWardrobeItem('acc-cape', 'Flowing Cape');
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

      // Track bestiary — check for completion on first discovery of each type
      if (enemy.enemyType && this.bestiary) {
        const _wasNew = !this.bestiary[enemy.enemyType];
        this.bestiary[enemy.enemyType] = (this.bestiary[enemy.enemyType] || 0) + 1;
        if (_wasNew && !this._bestiaryComplete) {
          const BESTIARY_TOTAL = 21;
          const _known = Object.keys(this.bestiary).length;
          if (_known >= BESTIARY_TOTAL) {
            this._bestiaryComplete = true;
            this._unlockAchievement('bestiary_expert', 'Creature Scholar');
            this.showNotification('📖 Bestiary complete!\nEvery creature catalogued!');
          }
        }
      }

      // Material drop
      this._tryDropMaterial(enemy);

      // Pet affection
      if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 1);

      // Total kill counter (for stats)
      this._totalKills = (this._totalKills || 0) + 1;

      // Kill combo counter (reset after 2.2s of no kills)
      if (this._comboResetEvent) { this._comboResetEvent.remove(false); }
      this._killCombo = (this._killCombo || 0) + 1;
      this._comboResetEvent = this.time.delayedCall(2200, () => { this._killCombo = 0; });
      if (this._killCombo >= 2) {
        const comboColors = ['#ffee44', '#ff8844', '#ff4488', '#cc44ff', '#44ccff'];
        const col = comboColors[Math.min(this._killCombo - 2, comboColors.length - 1)];
        this.showFloatingText(ex, ey - 10, `×${this._killCombo} COMBO!`, col);
        if (this._killCombo >= 3 && this.sfx) this.sfx.play('levelUp');
      }

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

    // Shadow Citadel requires all 7 crystals + Lich King defeated
    if (door.requiresAllCrystals) {
      const lichDone = this.questManager.getQuest('defeat_lich')?.state === 'completed';
      const crystalsDone = (this.rainbowCrystals || []).length >= 7;
      if (!lichDone) {
        this.showNotification('The Shadow Citadel is sealed.\nDefeat the Lich King first!');
        return;
      }
      if (!crystalsDone) {
        const missing = 7 - (this.rainbowCrystals || []).length;
        this.showNotification(`${missing} Light Shard${missing !== 1 ? 's' : ''} still missing...\nDefeat dungeon bosses to find them.`);
        return;
      }
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
        _totalKills: this._totalKills || 0,
        _visitedMaps: Array.from(this._visitedMaps || []),
        weather: this._currentWeather,
        _regenBonus: this._regenBonus,
        npcAffection: this.npcAffection,
        storyChoices: this.storyChoices,
        npcGiftGiven: this._npcGiftGiven,
        fishLuckBonus: this._fishLuckBonus,
        jackTreeChoice: this._jackTreeChoice,
        equippedOutfit: this.equippedOutfit,
        unlockedWardrobe: this.unlockedWardrobe,
        petType: this.petType,
        farmAnimals:  this.farmAnimals  || { sheep: false, cow: false, horse: false },
        farmProduces: this.farmProduces || { wool: 0, milk: 0 },
        farmFed:      this.farmFed      || { sheep: false, cow: false },
        petName:      this.petName       || null,
        storyMode:    this.storyMode    || false,
        farmAnimalNames:   this.farmAnimalNames   || { sheep: null, cow: null, horse: null },
        hasNet:            this.hasNet             || false,
        caughtButterflies: this.caughtButterflies  || {},
        hasWateringCan:    this.hasWateringCan     || false,
        seeds:             this.seeds              || {},
        gardenFlowers:     this.gardenFlowers      || {},
        flowerGiftsGiven:  this.flowerGiftsGiven   || {},
        treasureMapsFound: this.treasureMapsFound  || [],
        digSpotsDug:       this.digSpotsDug        || [],
        stargazerComplete: this.stargazerComplete   || false,
        rainbowCrystals:   this.rainbowCrystals    || [],
        bearerLetters: this.bearerLetters || [],
        thankYouGiven: this.thankYouGiven || [],
        houseCandles:  this.houseCandles  || false,
        caughtFishSpecies: this.caughtFishSpecies || {},
        dreamsHad:         this.dreamsHad         || 0,
        seasonTokens:      this.seasonTokens      || [],
        seasonIndex:       this.seasonIndex       || 0,
        houseDecor:  this.houseDecor  || {},
        houseTheme:  this.houseTheme  || null,
        musicMelody: this.musicMelody || 0,
        festivalComplete: this.festivalComplete || false,
        festivalStalls:   this.festivalStalls   || [],
        wishesGranted:    this.wishesGranted    || 0,
        firefliesCaught:  this.firefliesCaught  || 0,
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
    const welcomeMap = { town2: 'Woodhaven', overworld: 'Greendale', world: 'The World', harbor_town: 'Harbor Town', forest_town: 'Forest Town', desert_town: 'Desert Town', farm: 'Sunridge Farm' };
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

    // Phase 25 — Outfit reactions (one-time per NPC per session, skip merchants/guards)
    if (nearestNPC.npcId && !this._outfitReactedNPCs.has(nearestNPC.npcId) &&
        !['wandering_merchant', 'guard_south', 'guard_north'].includes(nearestNPC.npcId)) {
      const reaction = this._getOutfitReaction(nearestNPC.npcId, name);
      if (reaction) {
        this._outfitReactedNPCs.add(nearestNPC.npcId);
        this.showDialogue([reaction], null, name, portrait);
        return;
      }
    }

    // Phase 27 — Thank-you gifts (one-time per NPC after Lord Dire defeated)
    const _thankYouNPCs = ['bob', 'mike', 'fin', 'jack', 'reed', 'rolf', 'innkeeper'];
    if (this.achievements?.lord_dire_vanquished && nearestNPC.npcId &&
        !this.thankYouGiven.includes(nearestNPC.npcId) &&
        _thankYouNPCs.includes(nearestNPC.npcId)) {
      this.thankYouGiven.push(nearestNPC.npcId);
      const _gifts = {
        bob:       { lines: ['"You saved the whole world, Lizzy!', 'A true hero deserves a reward!"'], gold: 30 },
        mike:      { lines: ['"Light Bringer! I knew you could do it.', 'Here, take my finest gems!"'], gold: 25 },
        fin:       { lines: ['"The sea is peaceful again, thanks to you!', 'From the fishermen — our thanks."'], gold: 20 },
        jack:      { lines: ['"The forest sings for you, brave Lizzy!', 'A ranger\'s thanks."'], gold: 20 },
        reed:      { lines: ['"You defeated Lord Dire himself!', 'Take this reward, champion."'], gold: 25 },
        rolf:      { lines: ['"The mountain folk cheer for you!', 'You\'ve earned this, hero."'], gold: 20 },
        innkeeper: { lines: ['"Our heroine! Stay free anytime.', 'And take this gold — you\'ve earned it!"'], gold: 15 },
      };
      const gift = _gifts[nearestNPC.npcId];
      if (gift) {
        this.addGold(gift.gold);
        this.showDialogue([...gift.lines, `(+${gift.gold} gold)`], null, name, portrait);
        return;
      }
    }

    // Phase 24 — Flower gifting (intercept if player has a flower to give)
    if (this._hasFlowerToGive && nearestNPC.npcId) {
      this._tryGiveFlower(nearestNPC, name, portrait);
      return;
    }

    // Weather comments (once per NPC per weather period; skip merchants/guards)
    if (this._currentWeather && this._currentWeather !== 'clear' && nearestNPC.npcId &&
        !['wandering_merchant', 'guard_south', 'guard_north'].includes(nearestNPC.npcId) &&
        !(this._weatherNpcShown && this._weatherNpcShown.has(nearestNPC.npcId))) {
      const _wc = this._getWeatherNpcComment(nearestNPC.npcId, this._currentWeather);
      if (_wc) {
        if (!this._weatherNpcShown) this._weatherNpcShown = new Set();
        this._weatherNpcShown.add(nearestNPC.npcId);
        this.showDialogue([_wc], null, name, portrait);
        return;
      }
    }

    // Time-of-day NPC greetings (once per period per NPC, skip guards/merchants)
    if (nearestNPC.npcId &&
        !['wandering_merchant', 'guard_south', 'guard_north'].includes(nearestNPC.npcId)) {
      const _tc = this._getTimeNpcComment(nearestNPC.npcId, this._currentTimeLabel);
      if (_tc) {
        if (!this._timeGreetNpcShown) this._timeGreetNpcShown = {};
        const _tKey = `${nearestNPC.npcId}_${this._currentTimeLabel}`;
        if (!this._timeGreetNpcShown[_tKey]) {
          this._timeGreetNpcShown[_tKey] = true;
          this.showDialogue([_tc], null, name, portrait);
          return;
        }
      }
    }

    // Seasonal NPC greetings (once per NPC per season, skip guards/merchants)
    if (nearestNPC.npcId &&
        !['wandering_merchant', 'guard_south', 'guard_north'].includes(nearestNPC.npcId)) {
      const _seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
      const _curSeason = _seasonNames[(this.seasonIndex || 0) % 4];
      const _scKey = `${nearestNPC.npcId}_${_curSeason}`;
      if (!this._seasonNpcShown) this._seasonNpcShown = {};
      if (!this._seasonNpcShown[_scKey]) {
        const _sc2 = this._getSeasonNpcComment(nearestNPC.npcId, _curSeason);
        if (_sc2) {
          this._seasonNpcShown[_scKey] = true;
          this.showDialogue([_sc2], null, name, portrait);
          return;
        }
      }
    }

    // Wandering Merchant (dynamic spawn)
    if (nearestNPC.npcId === 'wandering_merchant') {
      this._openWanderingMerchantShop();
      return;
    }

    // Town guards
    if (nearestNPC.npcId === 'guard_south') {
      this.showDialogue(["Guard: I watch the south gate.\nThe forest lies beyond —\nstay alert out there."], null, 'Guard', portrait);
      return;
    }
    if (nearestNPC.npcId === 'guard_north') {
      this.showDialogue(["Guard: The cave to the north\nis crawling with skeletons.\nEnter with caution."], null, 'Guard', portrait);
      return;
    }

    // New Phase 18/19 NPC handlers
    if (nearestNPC.npcId === 'sand_scholar') {
      this._handleChainedQuests(nearestNPC, ['arcane_mystery'], name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'forest_herbalist') {
      this._handleChainedQuests(nearestNPC, ['gather_herbs'], name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'desert_sage') {
      this._handleChainedQuests(nearestNPC, ['desert_pilgrimage'], name, portrait);
      return;
    }
    if (['sailor_ned', 'sailor_mae', 'forest_elder', 'woodswoman', 'forester',
         'desert_merchant', 'sand_dancer'].includes(nearestNPC.npcId)) {
      this.showDialogue(nearestNPC.dialogueLines || ['...'], null, name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'ferry_captain') {
      this._handleChainedQuests(nearestNPC, ['island_explorer'], name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'harbor_captain' && (this.mapData.name === 'harbor_town' || this.mapData.name === 'harbor')) {
      this._handleChainedQuests(nearestNPC, ['beach_threat', 'clear_beach_dungeon'], name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'harbor_innkeeper' || nearestNPC.npcId === 'forest_innkeeper' || nearestNPC.npcId === 'desert_innkeeper') {
      this.showDialogue(["Rest here for the night?\nThat'll be 5 gold."], () => {
        if (this.gold >= 5) {
          this.addGold(-5);
          this.player.health = this.player.maxHealth;
          this.showNotification('Rested! HP restored.');
          this.sfx.play('levelUp');
        } else {
          this.showDialogue(["You don't have enough gold!"], null, name, portrait);
        }
      }, name, portrait);
      return;
    }
    if (nearestNPC.npcId === 'harbor_shopkeeper' || nearestNPC.npcId === 'forest_shopkeeper' || nearestNPC.npcId === 'desert_shopkeeper') {
      this.openShop();
      return;
    }

    // Farm Manager — Rosa (Phase 20)
    if (nearestNPC.npcId === 'farm_manager') {
      this._handleFarmManager(nearestNPC, name, portrait);
      return;
    }

    // Clara the Crafter — Phase 29 furniture/decor shop
    if (nearestNPC.npcId === 'clara_crafter') {
      const q = this.questManager.getQuest('decorate_home');
      if (q && q.state === 'available') {
        this.showDialogue(q.dialogue.available, () => {
          this.questManager.acceptQuest('decorate_home');
          this.updateQuestTracker();
          this.sfx.play('questAccept');
          this.showNotification('Quest: Home Sweet Home');
          this.time.delayedCall(200, () => this._openDecorShop());
        }, name, portrait);
        return;
      }
      if (q && q.state === 'ready') {
        this.showDialogue(q.dialogue.ready, () => {
          this.addGold(q.reward.gold);
          this.addXP(q.reward.xp);
          this.questManager.completeQuest('decorate_home');
          this.updateQuestTracker();
          this.sfx.play('questComplete');
          this.showNotification('Quest Complete!');
          this._checkAchievements();
          this.time.delayedCall(200, () => this._openDecorShop());
        }, name, portrait);
        return;
      }
      this._openDecorShop();
      return;
    }

    // Cook Edna — Phase 30 festival cake stall
    if (nearestNPC.npcId === 'cook_edna') {
      // Phase 31 — Edna's feast quest (available after festival is complete)
      const ednaFeast = this.questManager.getQuest('edna_feast');
      if (this.festivalComplete && ednaFeast && ednaFeast.state !== 'completed') {
        this._handleChainedQuests(nearestNPC, ['edna_feast'], name, portrait);
        return;
      }
      if (ednaFeast && ednaFeast.state === 'completed') {
        this.showDialogue(["Edna: That feast was amazing!\nCome cook with me anytime! ♥"], null, name, portrait);
        return;
      }
      if (this.festivalStalls.includes('cake')) {
        this.showDialogue(['Edna: Glad you enjoyed\nthe festival cake! ♥'], null, name, portrait);
        return;
      }
      if (this.gold < 5) {
        this.showDialogue(['Edna: Festival cake is only 5g!\nCome back when you can!'], null, name, portrait);
        return;
      }
      this.showDialogue(
        ['Edna: One slice of festival cake!\nMagically baked with love. Enjoy! ♥'],
        () => {
          this.addGold(-5);
          this.festivalStalls.push('cake');
          this.sfx.play('cookDone');
          this.showNotification('Festival Cake! HP restores faster for 60s!');
          this._festivalCakeBuff = 60000;
          this._checkFestivalStalls();
        },
        name, portrait
      );
      return;
    }

    // Bard Pip — Phase 30 festival dance quest
    if (nearestNPC.npcId === 'bard_pip') {
      const q = this.questManager.getQuest('festival_dance');
      if (q && q.state === 'available') {
        this.showDialogue(q.dialogue.available, () => {
          this.questManager.acceptQuest('festival_dance');
          this.updateQuestTracker();
          this.sfx.play('questAccept');
          this.showNotification('Quest: Dance at the Festival!');
        }, name, portrait);
        return;
      }
      if (q && q.state === 'ready') {
        this.showDialogue(q.dialogue.ready, () => {
          this.addGold(q.reward.gold);
          this.addXP(q.reward.xp);
          this.questManager.completeQuest('festival_dance');
          this.updateQuestTracker();
          this.sfx.play('questComplete');
          this.showNotification('Quest Complete! Dance champion!');
          this._checkAchievements();
        }, name, portrait);
        return;
      }
      this.showDialogue(q?.dialogue?.completed || ["Pip: Keep dancing and\nspread the joy!"], null, name, portrait);
      return;
    }

    // Kennel NPC — Brock the Beastmaster (Phase 16)
    if (nearestNPC.npcId === 'kennel_keeper') {
      const caveQuest = this.questManager.getQuest('clear_cave');
      if (!caveQuest || caveQuest.state !== 'completed') {
        this.showDialogue(["Brock: Come back after\nyour first adventure!"], null, 'Brock', portrait);
        return;
      }
      if (this.petType && this.gold < 50) {
        this.showDialogue(["Brock: I need 50g to find\nyou a new companion."], null, 'Brock', portrait);
        return;
      }
      this._kennelCost = this.petType ? 50 : 0;
      this._showPetChoice('kennel');
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
      // Phase 28 — Starfish buddy comment (one-time, after legendary catch)
      if ((this.caughtFishSpecies?.['Starfish'] || 0) > 0 && !this._finStarfishComment) {
        this._finStarfishComment = true;
        this.showDialogue([
          'A STARFISH?! I\'ve fished\nthese waters for 30 years...',
          'Never once seen one.\nYou must have a gift, kid.',
          '"The sea chose you."\nThat\'s what the old sailors say.',
        ], null, name, portrait);
        return;
      }
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

      // Phase 15: Buba wardrobe gifts — ribbon bow at ≥80 affection, flower band at ≥60
      const bubaAff = this.npcAffection['farmer_buba'] || 0;
      if (bubaAff >= 80 && !this._npcGiftGiven['buba_ribbonbow']) {
        this._npcGiftGiven['buba_ribbonbow'] = true;
        this.showDialogue(
          ['You\'re my dearest friend, Lizzy!\nI made this ribbon bow just for you!'],
          () => this._unlockWardrobeItem('acc-ribbonbow', 'Ribbon Bow'),
          name, portrait
        );
        return;
      }
      if (bubaAff >= 60 && !this._npcGiftGiven['buba_flowerband']) {
        this._npcGiftGiven['buba_flowerband'] = true;
        this.showDialogue(
          ['These flowers are blooming so nicely.\nHere\'s a flower band for you, Lizzy!'],
          () => this._unlockWardrobeItem('hat-flowerband', 'Flower Band'),
          name, portrait
        );
        return;
      }

      // Give affection on every friendly Buba interaction
      this._giveAffection('farmer_buba', 2);
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
      const count = tracked.objective.count;
      line = count != null
        ? `${tracked.name}\n${tracked.objective.description}: ${tracked.progress || 0}/${count}`
        : `${tracked.name}\n${tracked.objective.description}`;
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
        this._celebrationBurst('boss');
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
    this._celebrationBurst('boss');
    // Extended delay: gives time to collect crystal_pink before deciding victory path
    this.time.delayedCall(4000, () => {
      // If player has all 7 crystals, unlock Shadow Citadel instead of ending
      if ((this.rainbowCrystals || []).length >= 7) {
        this._checkShadowCitadelUnlock();
        return;
      }
      // Normal lich ending
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
          petType: this.petType || null,
          petAffection: this.petAffection || 0,
          petName: this.petName || null,
        });
      });
    });
  }

  showNotification(msg) {
    // Cap simultaneous notifications at 4 to prevent pile-up
    this._notifCount = this._notifCount || 0;
    if (this._notifCount >= 4) return;
    const slot = this._notifCount;
    this._notifCount++;

    // Render in UIScene (above HUD), stacked below the 38px HUD bar
    const ui = this.scene.get('UI');
    const target = ui || this;
    const w = 320;
    // Each slot starts 18px lower so multiple notifications don't overlap
    const startY = 50 + slot * 18;

    // Pill background for readability — wide enough for any message
    const lines = msg.split('\n').length;
    const pillH = 14 + (lines - 1) * 14;
    const pillW = Math.min(288, Math.max(140, msg.replace(/\n/g, '').length * 7));
    const pill = target.add.rectangle(w / 2, startY, pillW, pillH, 0x000022, 0.75)
      .setOrigin(0.5).setScrollFactor(0).setDepth(9998);

    const notif = target.add.text(w / 2, startY, msg, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000022',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9999);

    const DURATION = 3500; // Long enough for a child to read
    target.tweens.add({
      targets: [notif, pill],
      alpha: 0,
      y: `-=${12}`,
      duration: DURATION,
      ease: 'Power1',
      onComplete: () => { notif.destroy(); pill.destroy(); this._notifCount--; },
    });
  }

  // Phase 22 — Dance emote (Z key)
  _doDance() {
    if (this._danceCooldown) return;
    this._danceCooldown = true;
    this.time.delayedCall(1500, () => { this._danceCooldown = false; });

    // Scale pulse — quick squish + grow
    this.tweens.add({
      targets: this.player,
      scaleX: 1.35, scaleY: 0.75,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.player.setScale(1),
    });

    // Rainbow tint flash
    const flashColors = [0xff88cc, 0x88ddff, 0xffdd44, 0x88ffaa];
    flashColors.forEach((color, i) => {
      this.time.delayedCall(i * 70, () => {
        if (!this.player?.active) return;
        this.player.setTint(color);
        if (i === flashColors.length - 1) {
          this.time.delayedCall(70, () => {
            if (!this.player?.active) return;
            if (this.player._dressTint) this.player.setTint(this.player._dressTint);
            else this.player.clearTint();
          });
        }
      });
    });

    // Pastel sparkle burst
    const sparkColors = [0xff88cc, 0x88ccff, 0xffdd44, 0xaaffaa, 0xffaaff, 0xffcc88];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const s = this.add.star(this.player.x, this.player.y, 4, 2, 4, sparkColors[i % sparkColors.length]);
      s.setDepth(9999);
      this.tweens.add({
        targets: s,
        x: this.player.x + Math.cos(angle) * 22,
        y: this.player.y + Math.sin(angle) * 22,
        alpha: 0, scale: 0.3,
        duration: 500, ease: 'Power2',
        onComplete: () => s.destroy(),
      });
    }

    // Floating music note
    const note = this.add.text(this.player.x + 8, this.player.y - 10, '\u266a', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: '#ffaacc', stroke: '#000000', strokeThickness: 2,
    }).setDepth(9999);
    this.tweens.add({
      targets: note,
      y: note.y - 18, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => note.destroy(),
    });

    // NPCs within 48px mirror the dance with a hop + tint
    this.npcs.getChildren().forEach(npc => {
      const dx = npc.x - this.player.x;
      const dy = npc.y - this.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 48) {
        npc.setTint(0xffddff);
        this.tweens.add({
          targets: npc, y: npc.y - 5, duration: 130,
          yoyo: true, repeat: 1,
          onComplete: () => npc.clearTint(),
        });
      }
    });

    this.sfx.play('select');
  }

  // Phase 22 — Celebration burst effects
  _celebrationBurst(type) {
    if (!this.player) return;
    const px = this.player.x;
    const py = this.player.y;

    if (type === 'quest') {
      // Confetti shower — colorful rectangles burst from player
      const colors = [0xff5555, 0xffdd00, 0x55ff88, 0x55aaff, 0xff88ee, 0xff8800];
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 32;
        const conf = this.add.rectangle(px, py, 3 + Math.random() * 3, 2 + Math.random() * 3, colors[i % colors.length]);
        conf.setDepth(9999).setRotation(Math.random() * Math.PI);
        this.tweens.add({
          targets: conf,
          x: px + Math.cos(angle) * dist,
          y: py + Math.sin(angle) * dist - 8,
          alpha: 0,
          rotation: conf.rotation + Math.PI * 3,
          duration: 600 + Math.random() * 400,
          ease: 'Power2',
          onComplete: () => conf.destroy(),
        });
      }
      // Gold coin ring
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const coin = this.add.circle(px, py, 3, 0xffdd00);
        coin.setDepth(9999);
        this.tweens.add({
          targets: coin,
          x: px + Math.cos(angle) * 22,
          y: py + Math.sin(angle) * 22 - 6,
          alpha: 0, scale: 0.4,
          duration: 500, ease: 'Power2',
          onComplete: () => coin.destroy(),
        });
      }

    } else if (type === 'boss') {
      // Screen flash
      const flash = this.add.rectangle(160, 101, 320, 202, 0xffffff, 0.45)
        .setScrollFactor(0).setDepth(9989);
      this.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });
      // Rainbow strips across viewport
      const rainbowColors = [0xff4444, 0xff8800, 0xffdd00, 0x44cc44, 0x4488ff, 0xcc44ff];
      rainbowColors.forEach((color, i) => {
        const strip = this.add.rectangle(160, 55 + i * 9, 320, 7, color, 0.55)
          .setScrollFactor(0).setDepth(9988);
        this.tweens.add({ targets: strip, alpha: 0, duration: 800, delay: i * 40, onComplete: () => strip.destroy() });
      });
      // Big star explosion from player
      const starColors = [0xffdd00, 0xff8800, 0xff88ee, 0xffffff, 0x88ffff, 0xffaaff];
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 12 + Math.random() * 48;
        const star = this.add.star(px, py, 4, 2, 5, starColors[i % starColors.length]);
        star.setDepth(9999);
        this.tweens.add({
          targets: star,
          x: px + Math.cos(angle) * dist,
          y: py + Math.sin(angle) * dist,
          alpha: 0, scale: 0.2,
          duration: 900 + Math.random() * 500,
          delay: Math.random() * 200,
          ease: 'Power2',
          onComplete: () => star.destroy(),
        });
      }

    } else if (type === 'unlock') {
      // Pastel glitter pop
      const colors = [0xffbbee, 0xbbddff, 0xffeeaa, 0xbbffcc, 0xeeccff];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const g = this.add.star(px, py - 8, 4, 2, 4, colors[i % colors.length]);
        g.setDepth(9999);
        this.tweens.add({
          targets: g,
          x: px + Math.cos(angle) * 18,
          y: py - 8 + Math.sin(angle) * 18,
          alpha: 0, scale: 0.3,
          duration: 450, ease: 'Power2',
          onComplete: () => g.destroy(),
        });
      }
    }
  }

  // Phase 15 — Wardrobe unlock helper
  _unlockWardrobeItem(id, name) {
    if (this.unlockedWardrobe[id]) return; // already unlocked
    this.unlockedWardrobe[id] = true;
    this.showNotification(`New wardrobe item: ${name}!`);
    this.sfx.play('levelUp');
    this._celebrationBurst('unlock');
  }

  giveQuestReward(questId) {
    const quest = this.questManager.getQuest(questId);
    if (quest && quest.reward) {
      if (quest.reward.gold) this.addGold(quest.reward.gold);
      if (quest.reward.xp) this.addXP(quest.reward.xp);
      if (this.pet) this.petAffection = Math.min(50, (this.petAffection || 0) + 2);
      // Show reward breakdown so the player knows exactly what they earned
      const parts = [];
      if (quest.reward.gold) parts.push(`+${quest.reward.gold}g`);
      if (quest.reward.xp) parts.push(`+${quest.reward.xp} XP`);
      if (parts.length > 0) {
        this.time.delayedCall(300, () => this.showNotification(`Reward: ${parts.join('  ')}`));
      }
    }
    this._celebrationBurst('quest');
    // Phase 15 — wardrobe unlocks tied to quest completion
    if (questId === 'clear_harbor') {
      this.time.delayedCall(600, () => {
        this._unlockWardrobeItem('hat-piratehat', 'Pirate Hat');
        this._unlockWardrobeItem('outfit-pirate', 'Pirate Coat');
      });
    }
    this._checkAchievements();
    // Auto-save on quest milestone
    this.time.delayedCall(100, () => SaveManager.save(this));
  }

  // --- Quest variety: escort, timed, fetch ---

  _spawnFetchItems() {
    // Phase 24 — Treasure maps (always visible if not yet found)
    const tmSpawns = this.mapData.treasureMapSpawns;
    if (tmSpawns) {
      for (const tm of tmSpawns) {
        if (this.treasureMapsFound.includes(tm.id)) continue;
        const item = this.add.rectangle(tm.x, tm.y, 9, 9, 0xffdd44).setDepth(9000);
        this.tweens.add({ targets: item, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
        this.add.text(tm.x, tm.y - 11, tm.label || 'Map!', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffdd00', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9001);
        const zone = this.add.zone(tm.x, tm.y, 18, 18);
        this.physics.add.existing(zone, true);
        this.physics.add.overlap(this.player, zone, () => {
          if (item._collected) return;
          item._collected = true;
          item.destroy(); zone.destroy();
          this._onTreasureMapFound(tm.id);
        });
      }
    }

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
    // Phase 31 — Lucky Star doubles positive gold gains (from enemies/chests, not wishes)
    let finalAmount = amount;
    if (amount > 0 && this._luckyStarActive) {
      finalAmount = amount * 2;
    }
    this.gold += finalAmount;
    this.events.emit('gold-changed', this.gold);
    if (finalAmount > 0) {
      this._totalGoldEarned = (this._totalGoldEarned || 0) + finalAmount;
      const _goldLabel = this._luckyStarActive ? `+${finalAmount}g ★2×` : `+${finalAmount}g`;
      this.showFloatingText(this.player.x, this.player.y - 12, _goldLabel, this._luckyStarActive ? '#ffee44' : '#ffdd00');
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
      // Confetti burst at player position
      const _lvlColors = [0xffdd00, 0xff88cc, 0x88ffcc, 0xaaddff, 0xffaa44, 0xcc88ff];
      for (let _ci = 0; _ci < 14; _ci++) {
        const _angle = Math.random() * Math.PI * 2;
        const _dist = 20 + Math.random() * 30;
        const _conf = this.add.rectangle(
          this.player.x, this.player.y,
          4, 4, _lvlColors[Math.floor(Math.random() * _lvlColors.length)], 0.9
        ).setDepth(9990).setAngle(Math.random() * 360);
        this.tweens.add({
          targets: _conf,
          x: this.player.x + Math.cos(_angle) * _dist,
          y: this.player.y - 30 - Math.random() * 20 + Math.sin(_angle) * _dist * 0.5,
          alpha: 0,
          angle: _conf.angle + 180,
          duration: 700 + Math.random() * 400,
          delay: _ci * 30,
          onComplete: () => _conf.destroy(),
        });
      }
      this.showFloatingText(this.player.x, this.player.y - 30, `★ Lv.${this.level}!`, '#ffdd44');

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
      // Star shower falling from above
      const starColors = [0xffdd44, 0xff88cc, 0x88ccff, 0xaaffaa, 0xffaaff];
      for (let i = 0; i < 10; i++) {
        const sx = this.player.x - 40 + Math.random() * 80;
        const sy = this.player.y - 50 - Math.random() * 20;
        const star = this.add.star(sx, sy, 5, 2, 5, starColors[i % starColors.length]);
        star.setDepth(9999);
        this.tweens.add({
          targets: star,
          y: sy + 45 + Math.random() * 15,
          alpha: 0, scale: 0.2,
          duration: 550 + Math.random() * 300,
          delay: i * 40,
          ease: 'Power1',
          onComplete: () => star.destroy(),
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
    if (this._currentTimeLabel !== timeLabel) {
      this._currentTimeLabel = timeLabel;
      // Reset time greeting Set so NPCs can greet again for new period
      if (this._timeGreetNpcShown) this._timeGreetNpcShown = {};
    }
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

    // Phase 23 — Nature tools & seeds
    if (!this.hasNet) {
      shopItems.push({ id: 'butterfly_net', name: 'Butterfly Net', price: 30, color: '#88ddff', type: 'net', desc: 'Catch butterflies! [E]' });
    }
    if (!this.hasWateringCan) {
      shopItems.push({ id: 'watering_can', name: 'Watering Can', price: 20, color: '#4499ff', type: 'watering_can', desc: 'Grow flowers!' });
    }
    if (this.hasWateringCan) {
      shopItems.push({ id: 'rose_seed', name: 'Rose Seeds', price: 10, color: '#ff6688', type: 'seed', seedType: 'rose', desc: '+1 rose seed' });
      shopItems.push({ id: 'sunflower_seed', name: 'Sunflower Seeds', price: 10, color: '#ffdd00', type: 'seed', seedType: 'sunflower', desc: '+1 sunflower seed' });
      shopItems.push({ id: 'violet_seed', name: 'Violet Seeds', price: 10, color: '#cc88ff', type: 'seed', seedType: 'violet', desc: '+1 violet seed' });
    }

    // Phase 15 — Wardrobe items (only show if not already unlocked)
    if (!this.unlockedWardrobe['hat-crown']) {
      shopItems.push({ id: 'hat-crown', name: 'Gold Crown', price: 150, color: '#ffdd00', type: 'wardrobe', desc: 'Wardrobe hat' });
    }
    if (!this.unlockedWardrobe['outfit-princess']) {
      shopItems.push({ id: 'outfit-princess', name: 'Princess Dress', price: 200, color: '#ffaadd', type: 'wardrobe', desc: 'Wardrobe dress' });
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
    const itemCount = Math.min(shopItems.length, 9);
    const rowH = 12;
    const boxW = w - 8;
    const boxH = 22 + itemCount * rowH + 12;
    const boxX = w / 2;
    const boxY = h - boxH / 2 - 4;

    this.shopContainer = this.add.container(0, 0)
      .setScrollFactor(0).setDepth(10000);

    // Simple dark background
    const bg = this.add.rectangle(boxX, boxY, boxW, boxH, 0x111133, 0.95);
    this.shopContainer.add(bg);
    // Top border line
    const border = this.add.rectangle(boxX, boxY - boxH / 2, boxW, 1, 0x4455aa);
    this.shopContainer.add(border);

    const title = this.add.text(boxX, boxY - boxH / 2 + 4, `${npc.npcName}'s Shop  \u2014  ${this.gold}g`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#aabbff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.shopContainer.add(title);

    shopItems.slice(0, itemCount).forEach((item, i) => {
      const y = boxY - boxH / 2 + 18 + i * rowH;
      const prefix = `${i + 1}`;
      const canAfford = this.gold >= item.price;
      const isNewWardrobe = item.type === 'wardrobe' && !this.unlockedWardrobe?.[item.id];
      // Glow dot for affordable new wardrobe items
      if (canAfford && isNewWardrobe) {
        const dot = this.add.circle(4, y + 5, 3, 0xffdd44, 0.9).setScrollFactor(0);
        this.shopContainer.add(dot);
        this.tweens.add({ targets: dot, alpha: 0.2, duration: 550, yoyo: true, repeat: -1 });
      }
      const newTag = isNewWardrobe ? ' ✦' : '';
      const label = this.add.text(8, y, `${prefix}: ${item.name}${newTag} (${item.desc})`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: canAfford ? (isNewWardrobe ? '#ffe488' : '#ddddff') : '#666677',
        stroke: '#000000', strokeThickness: 2,
      }).setScrollFactor(0);
      const price = this.add.text(w - 8, y, `${item.price}g`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: canAfford ? '#ffdd88' : '#555566',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0).setScrollFactor(0);
      this.shopContainer.add(label);
      this.shopContainer.add(price);
    });

    const hint = this.add.text(boxX, boxY + boxH / 2 - 2, 'ESC to close', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#8899aa',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setScrollFactor(0);
    this.shopContainer.add(hint);

    // Shop input handling
    this._shopActive = true;
    this._shopItems = shopItems;
    this._shopNPC = npc;
    this._shopEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Extra keys 4-9 for additional shop items (antidote, torch, wardrobe, equipment)
    this._shopExtraKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE),
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

    // Phase 15 — Wardrobe purchase
    if (item.type === 'wardrobe') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      this._unlockWardrobeItem(item.id, item.name);
      this.closeShop();
      this._reopenCurrentShop();
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
    if (item.type === 'net') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      this.hasNet = true;
      this.showNotification('Butterfly Net acquired!\nPress [E] near butterflies!');
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }
    if (item.type === 'watering_can') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      this.hasWateringCan = true;
      this.showNotification('Watering Can! Now buy seeds\nand grow flowers!');
      this.closeShop();
      this._reopenCurrentShop();
      return;
    }
    if (item.type === 'seed') {
      this.addGold(-item.price);
      this.sfx.play('coinSpend');
      const st = item.seedType;
      this.seeds[st] = (this.seeds[st] || 0) + 1;
      this.showNotification(`${item.name} x1 added!\nPlant near your house.`);
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
    const speed = spell.speed || 140;
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
    this.sfx.play(spell.slow ? 'icebolt' : spell.color === 0x2266ff ? 'icebolt' : 'fireball');

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
        // First-time weakness discovery — notify player + auto-fill bestiary
        if (enemy.enemyType && spell.element) {
          if (!this._weaknessRevealed) this._weaknessRevealed = new Set();
          const _wKey = `${enemy.enemyType}_${spell.element}`;
          if (!this._weaknessRevealed.has(_wKey)) {
            this._weaknessRevealed.add(_wKey);
            const _eName = (enemy.enemyType || 'enemy').replace(/_/g, ' ');
            this.showNotification(`\u2726 Weakness!\n${_eName} \u2192 ${spell.element}`);
            if (this.bestiary && !this.bestiary[enemy.enemyType]) {
              this.bestiary[enemy.enemyType] = 1;
            }
          }
        }
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
              gold: this.storyMode ? this.gold : Math.max(0, this.gold - 10), // lose 10 gold as penalty (skipped in Story Mode)
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
              _totalKills: this._totalKills || 0,
              _visitedMaps: Array.from(this._visitedMaps || []),
              weather: this._currentWeather,
              _regenBonus: this._regenBonus,
              npcAffection: this.npcAffection,
              storyChoices: this.storyChoices,
              npcGiftGiven: this._npcGiftGiven,
              fishLuckBonus: this._fishLuckBonus,
              jackTreeChoice: this._jackTreeChoice,
              equippedOutfit: this.equippedOutfit,
              unlockedWardrobe: this.unlockedWardrobe,
              petType: this.petType,
              farmAnimals:  this.farmAnimals  || { sheep: false, cow: false, horse: false },
              farmProduces: this.farmProduces || { wool: 0, milk: 0 },
              farmFed:      this.farmFed      || { sheep: false, cow: false },
              petName:      this.petName       || null,
        storyMode:    this.storyMode    || false,
        farmAnimalNames:   this.farmAnimalNames   || { sheep: null, cow: null, horse: null },
        hasNet:            this.hasNet             || false,
        caughtButterflies: this.caughtButterflies  || {},
        hasWateringCan:    this.hasWateringCan     || false,
        seeds:             this.seeds              || {},
        gardenFlowers:     this.gardenFlowers      || {},
        flowerGiftsGiven:  this.flowerGiftsGiven   || {},
        treasureMapsFound: this.treasureMapsFound  || [],
        digSpotsDug:       this.digSpotsDug        || [],
        stargazerComplete: this.stargazerComplete   || false,
        rainbowCrystals:   this.rainbowCrystals    || [],
        bearerLetters: this.bearerLetters || [],
        thankYouGiven: this.thankYouGiven || [],
        houseCandles:  this.houseCandles  || false,
        caughtFishSpecies: this.caughtFishSpecies || {},
        dreamsHad:         this.dreamsHad         || 0,
        seasonTokens:      this.seasonTokens      || [],
        seasonIndex:       this.seasonIndex       || 0,
        houseDecor:  this.houseDecor  || {},
        houseTheme:  this.houseTheme  || null,
        musicMelody: this.musicMelody || 0,
        festivalComplete: this.festivalComplete || false,
        festivalStalls:   this.festivalStalls   || [],
        wishesGranted:    this.wishesGranted    || 0,
        firefliesCaught:  this.firefliesCaught  || 0,
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

    // New town maps — simple decoration
    if (map.name === 'harbor_town' || map.name === 'forest_town' || map.name === 'desert_town') {
      this._decorateNewTown(map);
      return;
    }

    // World map uses overworld decorations below
    // --- Overworld/World decorations below ---

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
      { x: 880, y: 60 }, { x: 940, y: 30 }, { x: 990, y: 80 },
      { x: 860, y: 130 }, { x: 920, y: 170 }, { x: 1000, y: 50 },
      { x: 1050, y: 100 }, { x: 960, y: 200 },
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
    const templeX = 864;
    const templeY = 96;
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
      { x: 30, y: 200 }, { x: 60, y: 250 }, { x: 40, y: 300 },
      { x: 80, y: 350 }, { x: 50, y: 400 }, { x: 100, y: 450 },
      { x: 20, y: 480 }, { x: 70, y: 530 },
      { x: 30, y: 560 }, { x: 60, y: 600 }, { x: 40, y: 640 },
      { x: 80, y: 680 }, { x: 100, y: 720 },
    ];
    for (const t of forestTrees) {
      const tree = this.add.image(t.x, t.y - 12, 'oak-tree-small');
      tree.setScale(0.6);
      tree.setDepth(t.y + 1);
      const zone = this.add.zone(t.x, t.y, 10, 12);
      this.obstacles.add(zone);
    }

    // Dirt path from spawn area to town cluster
    const pathTiles = [];
    for (let x = 36; x <= 45; x++) {
      pathTiles.push([x, 11], [x, 12]);
    }
    for (let y = 8; y <= 11; y++) {
      pathTiles.push([40, y], [41, y]);
    }
    for (const [px, py] of pathTiles) {
      this.add.image(px * ts, py * ts, 'path-middle').setOrigin(0, 0);
    }

    // Small pond
    const pondTiles = [
      [38, 22], [39, 22],
      [37, 23], [38, 23], [39, 23], [40, 23],
      [38, 24], [39, 24],
    ];
    for (const [px, py] of pondTiles) {
      this.add.image(px * ts, py * ts, 'water-middle').setOrigin(0, 0);
      const zone = this.add.zone(px * ts + ts / 2, py * ts + ts / 2, ts, ts);
      this.obstacles.add(zone);
    }

    // Pond visit zone (larger area around the pond for exploration quest)
    // Overlap is set up later in create() after player exists
    this.pondVisitZone = this.add.zone(38.5 * ts, 23 * ts, 6 * ts, 5 * ts);
    this.physics.add.existing(this.pondVisitZone, true);
    this._pondVisited = false;

    // Flowers
    const flowers = [
      { x: 580, y: 200, color: 0xff6b6b },
      { x: 620, y: 240, color: 0xffdd44 },
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
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ccccaa',
      stroke: '#000000', strokeThickness: 3,
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
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#88cc88',
      stroke: '#002200', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(forestY + 3);

    // Signpost near forest entrance
    this.add.rectangle(120, 412, 2, 14, 0x664422).setDepth(411);
    this.add.rectangle(120, 404, 44, 12, 0x885533).setDepth(412);
    this.add.text(120, 404, '→ Woods', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ddccaa', stroke: '#331100', strokeThickness: 2,
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
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#88aaff', stroke: '#000033', strokeThickness: 2,
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
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#88aaff', stroke: '#000033', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(ts2.y + 2);
    }

    // Welcome sign
    this.add.rectangle(160, 202, 2, 14, 0x664422).setDepth(201);
    this.add.rectangle(160, 194, 68, 14, 0x885533).setDepth(202);
    this.add.text(160, 194, 'Woodhaven', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ddccaa', stroke: '#331100', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(203);
  }

  _decorateNewTown(map) {
    const ts = map.tileSize;
    // Simple sign and flowers for new towns
    const signX = Math.floor(map.width / 2) * ts;
    const signY = Math.floor(map.height / 2 - 1) * ts;

    const townNames = {
      harbor_town: 'Harbor Town',
      forest_town: 'Forest Town',
      desert_town: 'Desert Town',
    };
    const name = townNames[map.name] || 'Town';
    const sign = this.add.rectangle(signX, signY, 76, 16, 0x5c3a1e);
    sign.setDepth(signY + 10);
    this.add.text(signX, signY, name, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(signY + 11);

    // Small flower clusters
    const colors = [0xff6b6b, 0xffdd44, 0xaaffaa, 0x88ddff];
    for (let i = 0; i < 8; i++) {
      const fx = Math.random() * map.width * ts;
      const fy = Math.random() * map.height * ts;
      this.add.circle(fx, fy, 2, colors[i % colors.length]).setDepth(1);
    }
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
        _totalKills: this._totalKills || 0,
        _visitedMaps: Array.from(this._visitedMaps || []),
        weather: this._currentWeather,
        _regenBonus: this._regenBonus,
        npcAffection: this.npcAffection,
        storyChoices: this.storyChoices,
        npcGiftGiven: this._npcGiftGiven,
        fishLuckBonus: this._fishLuckBonus,
        jackTreeChoice: this._jackTreeChoice,
        equippedOutfit: this.equippedOutfit,
        unlockedWardrobe: this.unlockedWardrobe,
        petType: this.petType,
        farmAnimals:  this.farmAnimals  || { sheep: false, cow: false, horse: false },
        farmProduces: this.farmProduces || { wool: 0, milk: 0 },
        farmFed:      this.farmFed      || { sheep: false, cow: false },
        petName:      this.petName       || null,
        storyMode:    this.storyMode    || false,
        farmAnimalNames:   this.farmAnimalNames   || { sheep: null, cow: null, horse: null },
        hasNet:            this.hasNet             || false,
        caughtButterflies: this.caughtButterflies  || {},
        hasWateringCan:    this.hasWateringCan     || false,
        seeds:             this.seeds              || {},
        gardenFlowers:     this.gardenFlowers      || {},
        flowerGiftsGiven:  this.flowerGiftsGiven   || {},
        treasureMapsFound: this.treasureMapsFound  || [],
        digSpotsDug:       this.digSpotsDug        || [],
        stargazerComplete: this.stargazerComplete   || false,
        rainbowCrystals:   this.rainbowCrystals    || [],
        bearerLetters: this.bearerLetters || [],
        thankYouGiven: this.thankYouGiven || [],
        houseCandles:  this.houseCandles  || false,
        caughtFishSpecies: this.caughtFishSpecies || {},
        dreamsHad:         this.dreamsHad         || 0,
        seasonTokens:      this.seasonTokens      || [],
        seasonIndex:       this.seasonIndex       || 0,
        houseDecor:  this.houseDecor  || {},
        houseTheme:  this.houseTheme  || null,
        musicMelody: this.musicMelody || 0,
        festivalComplete: this.festivalComplete || false,
        festivalStalls:   this.festivalStalls   || [],
        wishesGranted:    this.wishesGranted    || 0,
        firefliesCaught:  this.firefliesCaught  || 0,
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

  spawnHarborTownNPCs() {
    const captain = new NPC(this, 280, 200, 'farmer-bob', {
      id: 'ferry_captain',
      name: 'Ferry Captain',
      idleAnim: 'npc-bob-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['I ferry travelers to the islands.\nStep aboard when ready!'],
    });
    captain.setTint(0x4488bb);
    this.npcs.add(captain);

    const harbCaptain = new NPC(this, 200, 300, 'miner-mike', {
      id: 'harbor_captain',
      name: 'Captain Vex',
      idleAnim: 'npc-mike-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['The coastal waters are troubled.\nI need a brave adventurer!'],
    });
    harbCaptain.setTint(0x334455);
    this.npcs.add(harbCaptain);

    const ned = new NPC(this, 160, 240, 'farmer-bob', {
      id: 'sailor_ned',
      name: 'Sailor Ned',
      idleAnim: 'npc-bob-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ["Rough seas today!\nBut nothing a sailor can't handle."],
    });
    ned.setTint(0x6699aa);
    this.npcs.add(ned);

    const mae = new NPC(this, 380, 260, 'chef-chloe', {
      id: 'sailor_mae',
      name: 'Sailor Mae',
      idleAnim: 'npc-chloe-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['The harbor town is busier\nthan ever these days!'],
    });
    mae.setTint(0x5577aa);
    this.npcs.add(mae);
  }

  spawnForestTownNPCs() {
    const herbalist = new NPC(this, 180, 200, 'farmer-buba', {
      id: 'forest_herbalist',
      name: 'Forest Herbalist',
      idleAnim: 'npc-buba-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['The deep forest has rare herbs\nI need for my remedies.'],
    });
    herbalist.setTint(0x44aa66);
    this.npcs.add(herbalist);

    const elder = new NPC(this, 260, 180, 'farmer-bob', {
      id: 'forest_elder',
      name: 'Forest Elder',
      idleAnim: 'npc-bob-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['This forest town was built by\nthose who respect the ancient woods.',
        'The trees have long memories.'],
    });
    elder.setTint(0x225522);
    this.npcs.add(elder);

    const woodswoman = new NPC(this, 120, 260, 'chef-chloe', {
      id: 'woodswoman',
      name: 'Woodswoman',
      idleAnim: 'npc-chloe-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['I know every trail in these woods.\nStay on the path!'],
    });
    woodswoman.setTint(0x449944);
    this.npcs.add(woodswoman);

    const forester = new NPC(this, 340, 240, 'lumberjack-jack', {
      id: 'forester',
      name: 'Forester',
      idleAnim: 'npc-jack-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['We manage the forest with care.\nTake only what you need.'],
    });
    forester.setTint(0x338833);
    this.npcs.add(forester);
  }

  spawnDesertTownNPCs() {
    const scholar = new NPC(this, 240, 200, 'miner-mike', {
      id: 'sand_scholar',
      name: 'Sand Scholar',
      idleAnim: 'npc-mike-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['A rare arcane tome was lost\nin the desert crypts. I need it!'],
    });
    scholar.setTint(0xcc9944);
    this.npcs.add(scholar);

    const sage = new NPC(this, 180, 260, 'farmer-bob', {
      id: 'desert_sage',
      name: 'Desert Sage',
      idleAnim: 'npc-bob-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['The desert valley holds\nancient spiritual power.'],
    });
    sage.setTint(0xddaa66);
    this.npcs.add(sage);

    const merchant = new NPC(this, 320, 220, 'miner-mike', {
      id: 'desert_merchant',
      name: 'Desert Merchant',
      idleAnim: 'npc-mike-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['Finest desert goods!\nTrade routes run through these dunes.'],
    });
    merchant.setTint(0xbb8833);
    this.npcs.add(merchant);

    const dancer = new NPC(this, 160, 300, 'chef-chloe', {
      id: 'sand_dancer',
      name: 'Sand Dancer',
      idleAnim: 'npc-chloe-idle-down',
      wanders: true, speed: 8, wanderRadius: 30,
      dialogueLines: ['The desert wind carries\nthe rhythm of the sands!'],
    });
    dancer.setTint(0xeecc88);
    this.npcs.add(dancer);
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

  _openBoatMenu() {
    this.showDialogueWithChoice(
      ["Ferry Captain:\nWhere would you like to sail?"],
      [
        { text: 'Coral Beach', callback: () => this._sailTo('beach') },
        { text: 'Wizard Isle', callback: () => this._sailTo('wizard_island') },
      ],
      'Ferry Captain',
      null
    );
  }

  _sailTo(mapName) {
    const targetMap = MAPS[mapName];
    if (!targetMap) return;
    this._irisWipeOut(() => {
      this.scene.stop('UI');
      this.scene.restart({
        mapData: targetMap,
        questState: this.questManager.saveState(),
        playerHealth: this.player.health,
        gold: this.gold,
        xp: this.xp,
        level: this.level,
        inventory: this.inventory?.saveState?.() || null,
        dayTime: this.dayTime,
        equipment: this.equipment?.saveState?.() || null,
        paulRescued: this.paulRescued,
        openedChests: this._getOpenedChests(),
        trackedQuestId: this.trackedQuestId,
        bestiary: this.bestiary || {},
        unlockedTeleports: this.unlockedTeleports || [],
        materials: this.materials || {},
        darkSeals: this.darkSeals || 0,
        petAffection: this.petAffection || 0,
        visitedChunks: this.visitedChunks || {},
        lichTowerUnlocked: this._lichTowerUnlocked || false,
        achievements: this.achievements || {},
        weather: this._currentWeather || 'clear',
        _regenBonus: this._regenBonus || 0,
        npcAffection: this.npcAffection || {},
        storyChoices: this.storyChoices || {},
        npcGiftGiven: this._npcGiftGiven || {},
        fishLuckBonus: this._fishLuckBonus || false,
        jackTreeChoice: this._jackTreeChoice || null,
        equippedOutfit: this.equippedOutfit || null,
        unlockedWardrobe: this.unlockedWardrobe || null,
        petType: this.petType || null,
        playerAttackBonus: this.playerAttackBonus || 0,
        starFragments: this.starFragments || 0,
        isNewGamePlus: this.isNewGamePlus || false,
        farmAnimals:  this.farmAnimals  || { sheep: false, cow: false, horse: false },
        farmProduces: this.farmProduces || { wool: 0, milk: 0 },
        farmFed:      this.farmFed      || { sheep: false, cow: false },
        petName:      this.petName       || null,
        storyMode:    this.storyMode    || false,
        farmAnimalNames:   this.farmAnimalNames   || { sheep: null, cow: null, horse: null },
        hasNet:            this.hasNet             || false,
        caughtButterflies: this.caughtButterflies  || {},
        hasWateringCan:    this.hasWateringCan     || false,
        seeds:             this.seeds              || {},
        gardenFlowers:     this.gardenFlowers      || {},
        flowerGiftsGiven:  this.flowerGiftsGiven   || {},
        treasureMapsFound: this.treasureMapsFound  || [],
        digSpotsDug:       this.digSpotsDug        || [],
        stargazerComplete: this.stargazerComplete   || false,
        rainbowCrystals:   this.rainbowCrystals    || [],
        bearerLetters: this.bearerLetters || [],
        thankYouGiven: this.thankYouGiven || [],
        houseCandles:  this.houseCandles  || false,
        caughtFishSpecies: this.caughtFishSpecies || {},
        dreamsHad:         this.dreamsHad         || 0,
        seasonTokens:      this.seasonTokens      || [],
        seasonIndex:       this.seasonIndex       || 0,
        houseDecor:  this.houseDecor  || {},
        houseTheme:  this.houseTheme  || null,
        musicMelody: this.musicMelody || 0,
        festivalComplete: this.festivalComplete || false,
        festivalStalls:   this.festivalStalls   || [],
        wishesGranted:    this.wishesGranted    || 0,
        firefliesCaught:  this.firefliesCaught  || 0,
        timedQuestId:   this._timedQuestId   || null,
        timedRemaining: this._timedRemaining || 0,
        tutorialShown:  this.tutorialShown   || false,
        escortActive:   this._escortActive   || false,
        escortNpcId:    this._escortNPC ? this._escortNPC.npcId : null,
        _craftCount:        this._craftCount        || 0,
        _fishCount:         this._fishCount         || 0,
        _totalGoldEarned:   this._totalGoldEarned   || 0,
        _totalKills:        this._totalKills         || 0,
        _visitedMaps:       Array.from(this._visitedMaps || []),
      });
    });
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
    } else if (res.type === 'maxHP') {
      this.player.maxHealth += res.amount;
      this.player.health = Math.min(this.player.health + res.amount, this.player.maxHealth);
      this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
      this.showNotification(`+${res.amount} Max HP!`);
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

  // Phase 15 — Mirror → WardrobeOverlay
  _handleMirrorInteract() {
    if (!this._mirrorZones) return false;
    for (const mZone of this._mirrorZones) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, mZone.x, mZone.y);
      if (d < 30) {
        this.sfx.play('select');
        // Mirror sparkle burst
        const _sparkColors = [0xffffff, 0xffccee, 0xccddff, 0xffeecc, 0xeeffcc];
        for (let _si = 0; _si < 10; _si++) {
          const _angle = (_si / 10) * Math.PI * 2;
          const _sp = this.add.circle(mZone.x, mZone.y, 2, _sparkColors[_si % _sparkColors.length], 0.9);
          _sp.setDepth(9999);
          this.tweens.add({
            targets: _sp,
            x: mZone.x + Math.cos(_angle) * 20,
            y: mZone.y + Math.sin(_angle) * 20,
            alpha: 0, scaleX: 0.3, scaleY: 0.3,
            duration: 350,
            onComplete: () => _sp.destroy(),
          });
        }
        this.wardrobeOverlay.open(
          this.equippedOutfit,
          this.unlockedWardrobe,
          (outfit) => {
            this.equippedOutfit = outfit;
            this.player.setOutfit(outfit);
            this.sfx.play('select');
            this.time.delayedCall(100, () => SaveManager.save(this));
          }
        );
        return true;
      }
    }
    return false;
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
        case 'butterfly_collector': {
          const allBfTypes = ['yellow', 'green', 'blue', 'orange'];
          earned = allBfTypes.every(t => (this.caughtButterflies[t] || 0) >= 1);
          break;
        }
        case 'beloved_friend':
          earned = Object.keys(this.flowerGiftsGiven || {}).length >= 5;
          break;
        case 'stargazer':
          earned = this.stargazerComplete === true;
          break;
        case 'treasure_hunter':
          earned = (this.treasureMapsFound || []).length >= 3 &&
                   (this.digSpotsDug || []).length >= 3;
          break;
        case 'rainbow_chaser':
          earned = (this.rainbowCrystals || []).length >= 7;
          break;
        case 'lord_dire_vanquished':
          earned = !!this.achievements['lord_dire_vanquished'];
          break;
        case 'loremaster':
          earned = (this.bearerLetters || []).length >= 7;
          break;
        case 'master_angler':
          earned = Object.keys(this.caughtFishSpecies || {}).length >= 8;
          break;
        case 'all_seasons':
          earned = (this.seasonTokens || []).length >= 4;
          break;
        case 'decorate_home':
          earned = Object.keys(this.houseDecor || {}).length >= 3;
          break;
        case 'grand_festival':
          earned = this.festivalComplete === true;
          break;
        case 'firefly_friend':
          earned = (this.firefliesCaught || 0) >= 5;
          break;
        case 'bestiary_expert':
          earned = Object.keys(this.bestiary || {}).length >= 21;
          break;
      }

      if (earned) {
        this.achievements[ach.id] = Date.now();
        this.showNotification(`Achievement: ${ach.label}!`);
        this.sfx.play('levelUp');

        // Phase 15 — wardrobe unlocks tied to achievements
        if (ach.id === 'boss_slayer') {
          this.time.delayedCall(800, () => this._unlockWardrobeItem('outfit-fairy', 'Fairy Dress'));
        }
        // Phase 30 — festival dress unlocks with grand_festival achievement
        if (ach.id === 'grand_festival') {
          this.time.delayedCall(800, () => this._unlockWardrobeItem('outfit-festival', 'Festival Dress'));
        }
        // Phase 28 — rainbow sash unlocks with all_seasons achievement
        if (ach.id === 'all_seasons') {
          this.time.delayedCall(800, () => this._unlockWardrobeItem('acc-rainbow-sash', 'Rainbow Sash'));
        }
        // Phase 31 — firefly lantern unlocks with firefly_friend achievement
        if (ach.id === 'firefly_friend') {
          this.time.delayedCall(800, () => this._unlockWardrobeItem('acc-firefly-lantern', 'Firefly Lantern'));
        }
      }
    }

    // Phase 15 — Wizard Robe after 5 quests completed (checked separately, not tied to an achievement)
    if (!this.unlockedWardrobe['outfit-wizard']) {
      const completedCount = Object.values(this.questManager.quests || {})
        .filter(q => q.state === 'completed').length;
      if (completedCount >= 5) {
        this._unlockWardrobeItem('outfit-wizard', 'Wizard Robe');
      }
    }
    // Phase 31 — Chef's Apron unlocks when edna_feast quest is completed
    if (!this.unlockedWardrobe['acc-apron']) {
      const ednaFeast = this.questManager.getQuest('edna_feast');
      if (ednaFeast && ednaFeast.state === 'completed') {
        this._unlockWardrobeItem('acc-apron', "Chef's Apron");
      }
    }
  }

  _unlockAchievement(id, label) {
    if (this.achievements[id]) return;
    this.achievements[id] = Date.now();
    this._showAchievementToast(label);
    if (this.sfx) this.sfx.play('levelUp');
  }

  _showAchievementToast(label) {
    const ui = this.scene.get('UI') || this;
    const w = 320;
    const cx = w / 2;
    const y = 56;

    // Gold star burst
    for (let _i = 0; _i < 8; _i++) {
      const _ang = (_i / 8) * Math.PI * 2;
      const _dot = ui.add.circle(cx + Math.cos(_ang) * 70, y, 3, 0xffdd00, 0.9)
        .setScrollFactor(0).setDepth(10200);
      ui.tweens.add({
        targets: _dot, x: cx, y,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 400,
        onComplete: () => _dot.destroy(),
      });
    }

    const pill = ui.add.rectangle(cx, y, 200, 26, 0x443300, 0.92)
      .setStrokeStyle(1, 0xffdd44).setOrigin(0.5).setScrollFactor(0).setDepth(10198);
    const header = ui.add.text(cx, y - 6, '\u2726 Achievement!', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10200);
    const body = ui.add.text(cx, y + 6, label, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10200);

    ui.tweens.add({
      targets: [pill, header, body],
      alpha: 0, y: `-=${14}`,
      duration: 4000,
      ease: 'Power1',
      onComplete: () => { pill.destroy(); header.destroy(); body.destroy(); },
    });
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
    this._merchantTalkTimer = false; // allow future spawns to start their own 60s despawn
  }

  _openWanderingMerchantShop() {
    const MERCHANT_POOL = [
      { id: 'star_potion',     name: 'Star Potion',    price: 75,  color: '#ffdd88', type: 'star_potion',  desc: 'Restore all mana' },
      { id: 'rune_stone',      name: 'Rune Stone',     price: 120, color: '#8844ff', type: 'rune',         desc: '+1 max mana' },
      { id: 'magic_seed',      name: 'Magic Seed',     price: 90,  color: '#44ee44', type: 'magic_seed',   desc: '+1 HP regen/5s' },
      { id: 'ancient_map',     name: 'Ancient Map',    price: 60,  color: '#ccbb77', type: 'ancient_map',  desc: 'Reveal current map' },
      { id: 'elemental_arrow', name: 'Fire Arrows x5', price: 50,  color: '#ff6622', type: 'arrow',        desc: 'Fire damage' },
      { id: 'speed_crystal',   name: 'Speed Crystal',  price: 80,  color: '#aaddff', type: 'speed_crystal',desc: '+10% speed perm' },
      // Phase 15 — wardrobe item (only if not yet unlocked)
      ...(!this.unlockedWardrobe['acc-wand']
        ? [{ id: 'acc-wand', name: 'Magic Wand', price: 80, color: '#dd88ff', type: 'wardrobe', desc: 'Wardrobe accessory' }]
        : []),
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
    const rowH = 12;
    const boxW = w - 8;
    const boxH = 22 + itemCount * rowH + 12;
    const boxX = w / 2;
    const boxY = h - boxH / 2 - 4;

    this.shopContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(10000);

    // Simple dark background
    const bg = this.add.rectangle(boxX, boxY, boxW, boxH, 0x111133, 0.95);
    this.shopContainer.add(bg);
    const border = this.add.rectangle(boxX, boxY - boxH / 2, boxW, 1, 0x4455aa);
    this.shopContainer.add(border);

    const title = this.add.text(boxX, boxY - boxH / 2 + 4, `Wandering Merchant  \u2014  ${this.gold}g`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#aabbff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.shopContainer.add(title);

    shopItems.forEach((item, i) => {
      const y = boxY - boxH / 2 + 18 + i * rowH;
      const label = this.add.text(8, y, `${i + 1}: ${item.name} (${item.desc})`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: this.gold >= item.price ? '#ddddff' : '#666677',
      }).setScrollFactor(0);
      const price = this.add.text(w - 8, y, `${item.price}g`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: this.gold >= item.price ? '#ffdd88' : '#555566',
      }).setOrigin(1, 0).setScrollFactor(0);
      this.shopContainer.add(label);
      this.shopContainer.add(price);
    });

    const hint = this.add.text(boxX, boxY + boxH / 2 - 2, 'ESC to close', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#8899aa',
      stroke: '#000000', strokeThickness: 2,
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

  // --- Rainbow After Rain ─────────────────────────────────────────────────────
  _spawnRainbow() {
    // Clean up any old rainbow
    if (this._rainbowGfx) { this._rainbowGfx.destroy(); this._rainbowGfx = null; }
    if (this._rainbowPot) { this._rainbowPot.destroy(); this._rainbowPot = null; }
    if (this._rainbowPotLabel) { this._rainbowPotLabel.destroy(); this._rainbowPotLabel = null; }

    // Rainbow arc (screen-fixed, drawn in the sky above HUD)
    const gfx = this.add.graphics().setDepth(50).setScrollFactor(0);
    const arcColors = [0xff4444, 0xff8844, 0xffdd44, 0x44cc44, 0x4488ff, 0x9944ff];
    arcColors.forEach((c, i) => {
      const r = 110 - i * 10;
      gfx.lineStyle(5, c, 0.55);
      gfx.beginPath();
      gfx.arc(160, 200, r, Math.PI, 0, false);
      gfx.strokePath();
    });
    gfx.setAlpha(0);
    this.tweens.add({ targets: gfx, alpha: 1, duration: 1400, ease: 'Sine.easeIn' });
    this._rainbowGfx = gfx;

    // Pot of gold — golden circle at a fixed world position
    const potX = 500, potY = 300;
    const pot = this.add.circle(potX, potY, 7, 0xffd700).setDepth(600).setStrokeStyle(2, 0xcc7700);
    this.tweens.add({ targets: pot, scale: { from: 0.7, to: 1.3 }, alpha: { from: 0.7, to: 1 }, duration: 700, yoyo: true, repeat: -1 });
    this._rainbowPot = pot;
    this._rainbowPotLabel = this.add.text(potX, potY - 13, '★ Pot of Gold', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000000', strokeThickness: 2
    }).setDepth(601).setOrigin(0.5, 1);

    this.showNotification('✦ A rainbow appeared!');
    if (this.sfx) this.sfx.play('levelUp');

    // Auto-despawn after 60 seconds
    this.time.delayedCall(60000, () => {
      if (this._rainbowGfx) {
        this.tweens.add({ targets: this._rainbowGfx, alpha: 0, duration: 1200, onComplete: () => { if (this._rainbowGfx) { this._rainbowGfx.destroy(); this._rainbowGfx = null; } } });
      }
      if (this._rainbowPot) { this._rainbowPot.destroy(); this._rainbowPot = null; }
      if (this._rainbowPotLabel) { this._rainbowPotLabel.destroy(); this._rainbowPotLabel = null; }
    });
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
    // Reset per-NPC weather comment flag so NPCs can comment on the new weather
    this._weatherNpcShown = new Set();

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
      // Rainbow after rain on world map
      if (wasWeather === 'rain' && this.mapData?.name === 'world') {
        this.time.delayedCall(900, () => this._spawnRainbow());
      }
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

  _getWeatherNpcComment(npcId, weather) {
    const COMMENTS = {
      rain: {
        bob:       '"Ugh, so much rain!\nMy turnips will drown..."',
        mike:      '"Raining again. At least\nthe cave stays nice and dry."',
        fin:       '"Rain makes the fish run deep.\nGood luck out there!"',
        jack:      '"The forest loves this rain,\nbut my boots really don\'t."',
        reed:      '"My bowstring goes limp in rain.\nA ranger\'s nemesis."',
        rolf:      '"A warm rain in the mountains!\nRather refreshing, I say."',
        innkeeper: '"Business slows in the rain...\nCare for some warm soup?"',
        _default:  '"What dreadful rain!\nDon\'t forget your umbrella!"',
      },
      snow: {
        bob:       '"Snow on my crops!\nWinter came early this year."',
        mike:      '"Snow makes the cave entrance\nslippery — be careful!"',
        fin:       '"The harbor\'s icing over.\nFishing is on hold today."',
        jack:      '"Snow is the forest\'s blanket.\nBeautiful in its own way."',
        reed:      '"Tracking in snow is easy.\nEnemies leave clear prints."',
        rolf:      '"Ha! This is nothing.\nMountain snow is far fiercer!"',
        innkeeper: '"Warm up inside anytime!\nHot cider\'s on the house!"',
        _default:  '"Brrr! Bundle up out there,\nlittle one!"',
      },
      fog: {
        bob:       '"Thick fog today — I can\'t\nsee my fence from here!"',
        mike:      '"Fog in the cave is\nspooky even for old miners."',
        fin:       '"Fog means the big fish\nare hiding. Strange waters."',
        jack:      '"The forest in the fog looks\nalmost magical, doesn\'t it?"',
        reed:      '"Hard to spot anything\nin this fog. Stay on the paths."',
        rolf:      '"Fog rolls in from the peaks.\nIt\'ll clear by noon."',
        innkeeper: '"Fog always brings odd\ntravellers to my inn."',
        _default:  '"Such thick fog!\nDon\'t get lost out there!"',
      },
    };
    const pool = COMMENTS[weather];
    if (!pool) return null;
    return pool[npcId] || pool['_default'];
  }

  _getTimeNpcComment(npcId, timeLabel) {
    const GREET = {
      Morning: {
        bob:       '"Good morning, Lizzy!\nThe dew is fresh on the turnips."',
        mike:      '"Morning! The cave sounds different\nat dawn — mysterious echoes."',
        fin:       '"Morning catch is always best!\nThe fish are lively at sunrise."',
        jack:      '"Good morning! The forest birds\nare singing beautifully today."',
        reed:      '"Dawn patrol done.\nLove the quiet morning air."',
        rolf:      '"Ah, a bright morning!\nThe mountain tops are golden."',
        innkeeper: '"Good morning! Breakfast is\nwarm and ready inside."',
      },
      Evening: {
        bob:       '"Evening, Lizzy. Just finished\nmy chores — a long day!"',
        mike:      '"Evenings in the cave are eerie.\nThe torches flicker strangely."',
        fin:       '"Sun\'s going down — one last\ncast before dark, I reckon."',
        jack:      '"The forest gets magical at dusk.\nYou can hear the owls stir."',
        reed:      '"Evening rounds. The shadows\nget longer, but so do mine."',
        rolf:      '"Evening! Time to brew some\nmountain herb tea. Care for some?"',
        innkeeper: '"Evening! We light the hearth\nat sundown. Come in and rest."',
      },
      Night: {
        bob:       '"Still awake, Lizzy? The moon\nis bright over the fields tonight."',
        mike:      '"Night shift in the mines.\nThe crystals glow beautifully."',
        fin:       '"Fishing by moonlight has\na special kind of magic."',
        jack:      '"The forest at night is alive\nwith a hundred little sounds."',
        innkeeper: '"Up late? The inn is always\nopen — we keep a warm light."',
      },
    };
    const pool = GREET[timeLabel];
    if (!pool) return null;
    return pool[npcId] || null;
  }

  _getSeasonNpcComment(npcId, seasonName) {
    const SEASON = {
      Spring: {
        bob:       '"Spring at last! My turnips\nare sprouting — isn\'t it lovely?"',
        mike:      '"Spring rains fill the underground\nstreams. The cave smells fresh."',
        fin:       '"Spring! The fish are leaping!\nThis is my favourite time."',
        jack:      '"The forest is waking up!\nBlossom on every branch."',
        reed:      '"Spring tracking — the mud holds\nfootprints perfectly. Handy!"',
        rolf:      '"Snow melts in spring. The\nmountain reveals its secrets."',
        innkeeper: '"Spring flowers on every table!\nCome in and celebrate!"',
        _default:  '"Spring is here! Everything\nfeels fresh and new!"',
      },
      Summer: {
        bob:       '"Hot summer sun — my turnips\nneed extra water today."',
        mike:      '"The cave stays cool in summer.\nIt\'s the best season for miners!"',
        fin:       '"Summer fishing — long sunny days\nand big catches! Wonderful!"',
        jack:      '"The forest is lush and green.\nListen to the cicadas!"',
        reed:      '"Hot days, cool shade. The\nforest canopy is a ranger\'s friend."',
        rolf:      '"Even mountains warm in summer.\nI almost feel tropical!"',
        innkeeper: '"Lemonade and cool shade —\nthat\'s a summer afternoon!"',
        _default:  '"What a glorious summer!\nDon\'t forget to stay cool!"',
      },
      Autumn: {
        bob:       '"Harvest time! Look at these\ngolden fields — my best year!"',
        mike:      '"The cave crystals shine warmer\nin autumn. Strange but lovely."',
        fin:       '"Autumn fish are fat and ready.\nBig harvest before winter!"',
        jack:      '"The forest is painted in gold!\nAutumn is the forest\'s crown."',
        reed:      '"Fallen leaves make silent\ntracking harder. I miss summer."',
        rolf:      '"First frost on the peaks.\nThe mountain puts on its coat."',
        innkeeper: '"Pumpkin soup is on the menu!\nPerfect autumn warmth."',
        _default:  '"Autumn colours everywhere!\nSo cozy and beautiful!"',
      },
      Winter: {
        bob:       '"Winter rest — the fields are\ncovered. Time for hot cocoa!"',
        mike:      '"Ice crystals form in the cave.\nBeautiful and treacherous."',
        fin:       '"Fishing through ice — a true\nchallenge. Only for the brave!"',
        jack:      '"The forest sleeps under snow.\nI love its quiet white peace."',
        reed:      '"Snow tracks are a gift.\nEven ghosts leave prints now."',
        rolf:      '"Finally! Proper mountain weather.\nThis is living!"',
        innkeeper: '"Hot stew and a warm fire!\nPerfect winter evening."',
        _default:  '"Brrr! Winter is here!\nStay warm, dear adventurer!"',
      },
    };
    const pool = SEASON[seasonName];
    if (!pool) return null;
    return pool[npcId] || pool['_default'];
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

  // --- Phase 16: Pet choice system ---
  _showPetChoice(source) {
    const intro = source === 'first'
      ? ["A magical creature approaches!\nChoose your companion —\nBrock in town can help you swap later."]
      : ["Brock: Which companion suits you?\n50g to swap."];
    this.showDialogueWithChoice(intro, [
      { text: 'Slime \u2014 stuns nearby enemies',  callback: () => this._setPetType('slime') },
      { text: 'Bat \u2014 reveals enemies in dark',  callback: () => this._setPetType('bat') },
      { text: 'Mushroom \u2014 heals with spores',   callback: () => this._setPetType('mushroom') },
      { text: 'Fairy \u2014 attracts gold and luck', callback: () => this._setPetType('fairy') },
    ], source === 'first' ? 'Magic' : 'Brock', null);
  }

  _setPetType(type) {
    if (this._kennelCost) {
      this.gold = Math.max(0, this.gold - this._kennelCost);
      this.events.emit('gold-changed', this.gold);
      this._kennelCost = 0;
    }
    this.petType = type;
    if (this.pet) {
      if (this.pet._destroyVisuals) this.pet._destroyVisuals();
      this.pet.destroy();
      this.pet = null;
    }
    this.pet = new Pet(this, this.player.x + 16, this.player.y, type);
    this.sfx.play('questAccept');
    this._showPetNamePicker(type);
  }

  _showPetNamePicker(type) {
    const presets = {
      slime:    ['Blobby', 'Pudding', 'Gloop',   'Wiggles'],
      bat:      ['Dusk',   'Echo',    'Flutter',  'Pip'],
      mushroom: ['Mossy',  'Toffy',   'Dewdrop',  'Caps'],
      fairy:    ['Sparkle','Luna',    'Petal',    'Glow'],
    };
    const names = presets[type] || ['Buddy', 'Pal', 'Star', 'Sprout'];
    const d = 9990;
    const elems = [];
    const e = (obj) => { elems.push(obj); return obj; };

    e(this.add.rectangle(160, 101, 212, 88, 0xcc88ff).setScrollFactor(0).setDepth(d));
    e(this.add.rectangle(160, 101, 208, 84, 0x1a0a2e).setScrollFactor(0).setDepth(d + 1));
    e(this.add.text(160, 66, 'Name your companion!', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'normal',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));

    const cols = [110, 210];
    const rows = [84, 104];
    names.forEach((name, i) => {
      e(this.add.text(cols[i % 2], rows[Math.floor(i / 2)], `[${i + 1}] ${name}`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ffdd88', fontStyle: 'normal',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));
    });

    this.inDialogue = true;
    let chosen = false;
    const pick = (idx) => {
      if (chosen) return;
      chosen = true;
      elems.forEach(el => el.destroy());
      this.inDialogue = false;
      this._confirmPetName(names[idx]);
    };
    this.input.keyboard.once('keydown-ONE',   () => pick(0));
    this.input.keyboard.once('keydown-TWO',   () => pick(1));
    this.input.keyboard.once('keydown-THREE', () => pick(2));
    this.input.keyboard.once('keydown-FOUR',  () => pick(3));
  }

  _confirmPetName(name) {
    this.petName = name;
    this.showNotification(`Your companion's name is ${name}!`);
    this._celebrationBurst('unlock');
    this.time.delayedCall(200, () => SaveManager.save(this));
  }

  // --- Phase 16: Footstep SFX helper ---
  _getFootstepSfx() {
    const n = this.mapData.name;
    if (this.mapData.farmMap) return 'footstep_grass';
    if (this.isOverworld || this.isForest) return 'footstep_grass';
    if (this.isMountain)                   return 'footstep_snow';
    if (this.isTemple)                     return 'footstep_sand';
    if (n.includes('interior') || n.includes('inn') || n.includes('shop') || this.isHarbor) return 'footstep_wood';
    return 'footstep_stone'; // cave, ruins, boss_room, lich_tower
  }

  // --- Phase 16: Ambient audio scheduling ---
  _scheduleAmbientSfx() {
    const sfxMap = {
      cave: 'ambient_drip', mountain_cave: 'ambient_drip',
      overworld: 'ambient_bird', forest: 'ambient_bird', forest_boss: 'ambient_bird',
      harbor: 'ambient_wave', sea_cave: 'ambient_wave',
      mountain: 'ambient_wind', lich_tower: 'ambient_wind',
      ruins: 'ambient_ruins', ruins_dungeon: 'ambient_ruins',
      farm: 'ambient_farm',
    };
    const sfxId = sfxMap[this.mapData.name];
    if (sfxId) {
      const fire = () => {
        if (this.sfx && !this.inDialogue && !this.overlayOpen) this.sfx.play(sfxId);
        this._ambientSfxEvent = this.time.delayedCall(3000 + Math.random() * 7000, fire);
      };
      this._ambientSfxEvent = this.time.delayedCall(2000 + Math.random() * 4000, fire);
    }

    // Animal sounds on farm map
    if (this.mapData.farmMap) {
      const animalFire = () => {
        if (this.sfx && !this.inDialogue && !this.overlayOpen) {
          if (Math.random() < 0.5 && this.farmAnimals?.sheep) this.sfx.play('baa');
          else if (this.farmAnimals?.cow) this.sfx.play('moo');
        }
        this._animalSfxEvent = this.time.delayedCall(8000 + Math.random() * 7000, animalFire);
      };
      this._animalSfxEvent = this.time.delayedCall(5000 + Math.random() * 5000, animalFire);
    }
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
    if (this.gameMenu.visible) {
      // ESC closes the menu reliably via JustDown (the on('keydown') listener can miss it)
      if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.gameMenu.close();
        if (this.sfx) this.sfx.play('menuCancel');
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this._shopActive) {
        this.closeShop();
        return;
      }
      if (this._inChoiceMode && this._currentChoices) {
        // ESC during choice = default to choice 0, but do NOT open the game menu
        const choices = this._currentChoices;
        if (this._cleanupChoiceListeners) this._cleanupChoiceListeners();
        if (this.dialogueArrow) this.dialogueArrow.setVisible(true);
        this._inChoiceMode = false;
        this._currentChoices = null;
        choices[0].callback();
        this.closeDialogue();
        return;
      }
      if (!this.inDialogue && !this.overlayOpen) {
        this.sfx.play('select');
        this.gameMenu.open(0); // Stats tab
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.petAbilityKey) && !this.inDialogue && !this._shopActive && !this.overlayOpen) {
      if (this.pet) {
        this.pet.useAbility(this);
      } else {
        this.sfx.play('select');
        this.gameMenu.open(1); // Quests tab
      }
      return;
    }

    // Dance emote (Z)
    if (Phaser.Input.Keyboard.JustDown(this.danceKey) && !this.inDialogue && !this._shopActive && !this.overlayOpen && !this._gameMenuOpen) {
      this._doDance();
      return;
    }

    // Adventure Journal (J)
    if (Phaser.Input.Keyboard.JustDown(this.journalKey) && !this.inDialogue && !this._shopActive && !this.overlayOpen && !this._gameMenuOpen) {
      this._openAdventureJournal();
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

    // Boat dock interaction
    if (this._boatDockZone && !this.inDialogue && !this.overlayOpen &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y,
          this._boatDockZone.x, this._boatDockZone.y) < 48 &&
        Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this._openBoatMenu();
    }

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
        // Skip spells above player level (guard prevents infinite loop if all are locked)
        let guard = 0;
        while (this.level < this.spells[this.currentSpellIndex].minLevel) {
          this.currentSpellIndex = (this.currentSpellIndex + 1) % this.spells.length;
          if (++guard >= this.spells.length) break;
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

    // NPC interaction / chest / fishing / farm
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      // Farm horse mount/dismount (highest priority on farm map)
      if (this.mapData.farmMap && this._farmHorse) {
        if (this._ridingHorse) {
          this._dismountHorse();
          return;
        }
        if (Phaser.Math.Distance.Between(
            this.player.x, this.player.y, this._farmHorse.x, this._farmHorse.y) < 36) {
          this._mountHorse();
          return;
        }
      }

      // Priority: NPC > Arena Crystal > Chest > Farm > Fishing
      let npcNearby = false;
      this.npcs.getChildren().forEach((n) => { if (n.canInteract) npcNearby = true; });
      if (npcNearby) {
        this.handleNPCInteraction();
      } else if (this._arenaCrystal && !this.inDialogue) {
        this._checkArenaCrystalInteract();
      } else if (this.handleChestOpen()) {
        // Chest was opened
      } else if (this._handleMirrorInteract()) {
        // Wardrobe mirror opened
      } else if (this._handleCorkboardInteract()) {
        // Butterfly display board
      } else if (this._handleTelescopeInteract()) {
        // Stargazing telescope
      } else if (this._handleDigSpotInteract()) {
        // Treasure dig spot
      } else if (this._handleBedRest()) {
        // Bed rest interaction
      } else if (this._handleBookshelf()) {
        // Bookshelf was read
      } else if (this._nearCauldron && this.mapData.farmMap) {
        this._openCookingMenu();
      } else if (this._nearHayBale && this.mapData.farmMap) {
        this._feedAnimals();
      } else if (this.mapData.farmMap) {
        this._handleFarmAnimalHarvest();
      } else if (this._handleGardenInteract()) {
        // Garden patch planted/watered/collected
      } else if (this.hasNet && this._critters.some(c => c.isBf)) {
        this._tryCatchButterfly();
      } else if (this._nearPet && this._petPettingCooldown <= 0) {
        this._petThePet();
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

    // NPC quest indicators — ! (available) or ✓ (ready) above heads, throttled every 2s
    if (!this._npcIndicatorTimer) this._npcIndicatorTimer = 0;
    this._npcIndicatorTimer -= delta;
    if (this._npcIndicatorTimer <= 0 && this.questManager && this.npcs) {
      this._npcIndicatorTimer = 2000;
      if (!this._npcQuestIndicators) this._npcQuestIndicators = {};
      // npcId → quest ids they manage
      const NPC_QUESTS = {
        farmer_bob:       ['skeleton_hunt', 'delivery', 'deed', 'invest'],
        farmer_buba:      ['chicken_roundup'],
        chef_chloe:       ['escort_chloe'],
        fisherman_fin:    ['fish_quest', 'sea_essence', 'deep_cast'],
        miner_mike:       ['clear_cave', 'temple_journal', 'family_locket'],
        ranger_reed:      ['clear_forest'],
        hermit_rolf:      ['clear_mountain'],
        harbor_captain:   ['clear_harbor'],
        gravekeeper_mort: ['clear_ruins'],
        innkeeper:        ['timed_delivery'],
        jack_woodsman:    ['lost_axe', 'tree_invest', 'tree_mats'],
        alchemist_vera:   ['crafting_quest'],
        brock_beastmaster:['pet_quest'],
        rosa_farm:        ['farm_wool', 'farm_dairy'],
        cook_edna:        ['edna_feast'],
        clara_crafter:    ['decorate_home'],
        ferry_captain:    ['wizard_menace'],
      };
      this.npcs.getChildren().forEach(npc => {
        if (!npc.active || !npc.npcId) return;
        const qIds = NPC_QUESTS[npc.npcId] || (npc.questId ? [npc.questId] : []);
        let indicator = '';
        for (const qId of qIds) {
          const q = this.questManager.getQuest(qId);
          if (!q) continue;
          if (q.state === 'ready') { indicator = '✓'; break; }
          if (q.state === 'available') { indicator = '!'; break; }
        }
        const key = npc.npcId;
        if (indicator) {
          const col = indicator === '✓' ? '#44ff88' : '#ffdd00';
          if (!this._npcQuestIndicators[key] || !this._npcQuestIndicators[key].active) {
            this._npcQuestIndicators[key] = this.add.text(npc.x, npc.y - 24, indicator, {
              fontSize: '10px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
              color: col, stroke: '#000000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(npc.depth + 10);
            this.tweens.add({ targets: this._npcQuestIndicators[key], y: npc.y - 28, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          } else {
            this._npcQuestIndicators[key]
              .setText(indicator).setStyle({ color: col })
              .setPosition(npc.x, npc.y - 24).setDepth(npc.depth + 10).setVisible(true);
          }
        } else {
          if (this._npcQuestIndicators[key] && this._npcQuestIndicators[key].active) {
            this._npcQuestIndicators[key].setVisible(false);
          }
        }
      });
    }

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

    // Update farm animals
    if (this.mapData.farmMap) {
      if (this._farmSheep?.active) this._farmSheep.update(time, delta, this.player);
      if (this._farmCow?.active)   this._farmCow.update(time, delta, this.player);
      if (this._farmHorse?.active) this._farmHorse.update(time, delta, this.player);
      // Horse [E] ride prompt — updates each frame near horse
      if (this._farmHorse?.active && !this._ridingHorse && this.player) {
        const horseDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this._farmHorse.x, this._farmHorse.y);
        const nearHorse = horseDist < 36;
        if (nearHorse) {
          if (!this._horsePrompt || !this._horsePrompt.active) {
            const horseName = this.farmAnimalNames?.horse || 'Horse';
            this._horsePrompt = this.add.text(this._farmHorse.x, this._farmHorse.y - 26,
              `[E] Ride ${horseName}`, {
              fontSize: '8px', fontFamily: 'Arial, sans-serif',
              color: '#ffffff', stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0.5).setDepth(this._farmHorse.y + 100);
          } else {
            const horseName = this.farmAnimalNames?.horse || 'Horse';
            this._horsePrompt.setText(`[E] Ride ${horseName}`)
              .setPosition(this._farmHorse.x, this._farmHorse.y - 26)
              .setVisible(true);
          }
        } else if (this._horsePrompt?.active) {
          this._horsePrompt.setVisible(false);
        }
      } else if (this._horsePrompt?.active) {
        this._horsePrompt.setVisible(false);
      }
      // Update animal name label positions to follow animals
      const _namedAnimals = [
        { type: 'sheep', animal: this._farmSheep },
        { type: 'cow',   animal: this._farmCow   },
        { type: 'horse', animal: this._farmHorse  },
      ];
      for (const { animal } of _namedAnimals) {
        if (animal?.active && animal._nameLabel?.active) {
          animal._nameLabel.setPosition(animal.x, animal.y - 18);
        }
      }
      // Animal mood icons (♥=fed, ★=produce ready, ·=hungry)
      const _moodAnimals = [
        { animal: this._farmSheep, key: '_sheepMood' },
        { animal: this._farmCow,   key: '_cowMood'   },
      ];
      for (const { animal, key } of _moodAnimals) {
        if (!animal?.active) continue;
        const hasProduce = animal.hasWool || animal.hasMilk;
        const mood = hasProduce ? '★' : (animal.isFed ? '♥' : '·');
        const col  = hasProduce ? '#ffdd44' : (animal.isFed ? '#ff88aa' : '#aaaaaa');
        if (!this[key] || !this[key].active) {
          this[key] = this.add.text(animal.x, animal.y - 22, mood, {
            fontSize: '9px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
            color: col, stroke: '#000000', strokeThickness: 2,
          }).setDepth(animal.y + 50).setOrigin(0.5);
        } else {
          this[key].setText(mood).setStyle({ color: col })
            .setPosition(animal.x, animal.y - 22).setDepth(animal.y + 50);
        }
      }
      // Animal name labels — show given name above each animal
      const _animalNameEntries = [
        { animal: this._farmSheep, nameKey: 'sheep',  labelKey: '_sheepNameLabel' },
        { animal: this._farmCow,   nameKey: 'cow',    labelKey: '_cowNameLabel'   },
        { animal: this._farmHorse, nameKey: 'horse',  labelKey: '_horseNameLabel' },
      ];
      for (const { animal, nameKey, labelKey } of _animalNameEntries) {
        const _aName = this.farmAnimalNames?.[nameKey];
        if (!animal?.active || !_aName) { if (this[labelKey]) { this[labelKey].setVisible(false); } continue; }
        if (!this[labelKey] || !this[labelKey].active) {
          this[labelKey] = this.add.text(animal.x, animal.y - 30, _aName, {
            fontSize: '8px', fontFamily: 'Arial, sans-serif',
            color: '#ffe8a0', stroke: '#000000', strokeThickness: 2,
          }).setDepth(animal.y + 51).setOrigin(0.5);
        } else {
          this[labelKey].setPosition(animal.x, animal.y - 30).setDepth(animal.y + 51).setVisible(true);
        }
      }

      // Cauldron proximity
      this._nearCauldron = false;
      if (this._cauldronZone) {
        const cd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this._cauldronZone.x, this._cauldronZone.y);
        this._nearCauldron = cd < 28;
        if (this._cauldronLabel) this._cauldronLabel.setAlpha(this._nearCauldron ? 1 : 0);
        // Bubbling smoke particles above cauldron
        this._cauldronBubbleTimer = (this._cauldronBubbleTimer || 0) - delta;
        if (this._cauldronBubbleTimer <= 0) {
          this._cauldronBubbleTimer = 600 + Math.random() * 500;
          const bx = this._cauldronZone.x + (Math.random() - 0.5) * 8;
          const bubColors = [0x44ff88, 0x88ffcc, 0xaaffaa];
          const bub = this.add.circle(bx, this._cauldronZone.y - 4, 2 + Math.random() * 2, bubColors[Math.floor(Math.random() * 3)], 0.7)
            .setDepth(this._cauldronZone.y + 2);
          this.tweens.add({ targets: bub, y: bub.y - 14, alpha: 0, scale: 0.3, duration: 700 + Math.random() * 300, onComplete: () => bub.destroy() });
        }
      }
      if (this._hayBaleZone) {
        const hd = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, this._hayBaleZone.x, this._hayBaleZone.y);
        this._nearHayBale = hd < 28;
        if (this._hayBaleLabel) {
          this._hayBaleLabel.setAlpha(this._nearHayBale ? 1 : 0);
        }
      }
    }

    // Update pet
    if (this.pet) {
      this.pet.update(time, delta, this.player);
      this.pet.collectNearbyLoot(this);

      // Pet proximity detection & hearts label
      const _petDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.pet.x, this.pet.y);
      this._nearPet = _petDist < 26 && !this.inDialogue && !this._shopActive && !this.overlayOpen;
      this._petPettingCooldown = Math.max(0, (this._petPettingCooldown || 0) - delta);
      const _petAff = this.petAffection || 0;
      const _heartsStr = _petAff >= 50 ? '♥♥♥' : _petAff >= 25 ? '♥♥' : _petAff >= 10 ? '♥' : '';
      if (!this._petHeartsLabel) {
        this._petHeartsLabel = this.add.text(0, 0, '', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
          color: '#ff88aa', stroke: '#000000', strokeThickness: 2
        }).setDepth(10000).setOrigin(0.5, 1);
      }
      this._petHeartsLabel.setText(_heartsStr).setPosition(this.pet.x, this.pet.y - 13).setVisible(!!_heartsStr);

      // Floating name tag above pet
      if (!this._petNameLabel) {
        this._petNameLabel = this.add.text(0, 0, '', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#aaeeff', stroke: '#000000', strokeThickness: 2,
        }).setDepth(10001).setOrigin(0.5, 1);
      }
      const _pnDisplay = this.petName || { slime: 'Slimey', bat: 'Batty', mushroom: 'Spore', fairy: 'Glimmer' }[this.petType] || '';
      this._petNameLabel.setText(_pnDisplay).setPosition(this.pet.x, this.pet.y - (_heartsStr ? 22 : 22));

      if (!this._petInteractLabel) {
        this._petInteractLabel = this.add.text(0, 0, '[E] Pet', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setDepth(10000).setOrigin(0.5, 1);
      }
      this._petInteractLabel.setVisible(this._nearPet && this._petPettingCooldown <= 0)
        .setPosition(this.pet.x, this.pet.y - (_heartsStr ? 22 : 13));

      // Pet ability cooldown ring
      if (!this._petCooldownGfx) {
        this._petCooldownGfx = this.add.graphics().setDepth(9997);
      }
      const _pcd = this.pet._abilityCooldown || 0;
      const _pcdDur = this.pet._abilityCooldownDuration || 8000;
      const _pcdGfx = this._petCooldownGfx;
      _pcdGfx.clear();
      if (_pcd > 0) {
        // Grey background ring
        _pcdGfx.lineStyle(1.5, 0x444444, 0.5);
        _pcdGfx.strokeCircle(this.pet.x, this.pet.y, 9);
        // Coloured fill arc showing time recharged
        const _pct = 1 - (_pcd / _pcdDur);
        if (_pct > 0) {
          _pcdGfx.lineStyle(1.5, 0x88ffcc, 0.9);
          _pcdGfx.beginPath();
          _pcdGfx.arc(this.pet.x, this.pet.y, 9, -Math.PI / 2, -Math.PI / 2 + _pct * Math.PI * 2, false);
          _pcdGfx.strokePath();
        }
      } else {
        // Ready: bright green ring pulse
        _pcdGfx.lineStyle(1.5, 0x44ff88, 0.7);
        _pcdGfx.strokeCircle(this.pet.x, this.pet.y, 9);
      }

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
    // Chest ambient sparkle — closed chests occasionally emit a gold glint
    this._chestGlintTimer = (this._chestGlintTimer || 0) - delta;
    if (this._chestGlintTimer <= 0) {
      this._chestGlintTimer = 1800 + Math.random() * 2500;
      const closedChests = this.chests.getChildren().filter(c => !c.opened && c.active);
      if (closedChests.length > 0) {
        const c = closedChests[Math.floor(Math.random() * closedChests.length)];
        const sp = this.add.circle(c.x + (Math.random() - 0.5) * 6, c.y - 4, 2, 0xffdd44, 0.9).setDepth(c.depth + 1);
        this.tweens.add({ targets: sp, y: sp.y - 10, alpha: 0, scale: 0.3, duration: 500, onComplete: () => sp.destroy() });
      }
    }

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
      // [E] Fish prompt near pond
      if (!this._pondFishLabel) {
        this._pondFishLabel = this.add.text(pondCX, pondCY - 18, '[E] Fish', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#88ddff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(9000).setAlpha(0);
      }
      this._pondFishLabel.setAlpha(this._nearPond && !this.fishingGame.active && !this.inDialogue && !this.overlayOpen ? 1 : 0);
    }
    // Harbor fishing spot
    if (this.isHarbor && this.mapData.hasFishingSpot) {
      const distDock = Phaser.Math.Distance.Between(this.player.x, this.player.y, 320, 60);
      this._nearHarborDock = distDock < 40;
      // [E] Fish prompt near harbor dock
      if (!this._harborFishLabel) {
        this._harborFishLabel = this.add.text(320, 44, '[E] Harbor Fish', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#88ddff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(9000).setAlpha(0);
      }
      this._harborFishLabel.setAlpha(this._nearHarborDock && !this.fishingGame.active && !this.inDialogue ? 1 : 0);
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

      if (this.isOverworld && !this.isNight) {
        // Daytime birds: dark ellipses flying right across screen
        this._ambientTimer = 8000;
        const count = Math.random() < 0.5 ? 1 : 2;
        for (let bi = 0; bi < count; bi++) {
          const bx = cam.scrollX - 10;
          const by = cam.scrollY + 10 + Math.random() * (cam.height - 20);
          const bird = this.add.ellipse(bx, by, 5, 2, 0x664433, 0.8);
          bird.setDepth(9990);
          const baseY = by;
          const critter = { obj: bird, spawnX: bx, spawnY: by };
          this._critters.push(critter);
          this.tweens.add({
            targets: bird,
            x: bx + cam.width + 30,
            y: baseY + Math.sin(Math.random() * Math.PI) * 8,
            duration: 4500,
            ease: 'Linear',
            onComplete: () => {
              const idx = this._critters.indexOf(critter);
              if (idx !== -1) this._critters.splice(idx, 1);
              if (bird.active) bird.destroy();
            },
          });
        }
      } else if (this.isOverworld && this.isNight) {
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
      } else if (this.isForest) {
        // Forest butterflies: pastel circles in lazy figure-8
        this._ambientTimer = 7000;
        const pastels = [0xffaacc, 0xaaccff, 0xaaffaa];
        const bfx = cx + (Math.random() - 0.5) * cam.width * 0.6;
        const bfy = cy + (Math.random() - 0.5) * cam.height * 0.6;
        const bf = this.add.circle(bfx, bfy, 3, pastels[Math.floor(Math.random() * pastels.length)], 0.8);
        bf.setDepth(9990);
        const bfCritter = { obj: bf, spawnX: bfx, spawnY: bfy, isBf: true, bfType: 'green' };
        this._critters.push(bfCritter);
        this.tweens.chain({
          targets: bf,
          tweens: [
            { y: bfy - 18, duration: 1200, ease: 'Sine.easeInOut' },
            { y: bfy + 18, duration: 1200, ease: 'Sine.easeInOut' },
            { y: bfy - 18, duration: 1200, ease: 'Sine.easeInOut' },
            { y: bfy + 18, duration: 1200, ease: 'Sine.easeInOut' },
            { alpha: 0, duration: 400 },
          ],
          onComplete: () => {
            const idx = this._critters.indexOf(bfCritter);
            if (idx !== -1) this._critters.splice(idx, 1);
            if (bf.active) bf.destroy();
          },
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

    // Phase 23 — Butterfly spawn timer (when player has net)
    if (this.hasNet && !this.inDialogue && !this.overlayOpen) {
      this._butterflySpawnTimer = (this._butterflySpawnTimer || 0) - delta;
      if (this._butterflySpawnTimer <= 0) {
        this._butterflySpawnTimer = 10000 + Math.random() * 5000;
        this._spawnCatchableButterfly();
      }
    }

    // Critter scatter check (birds + butterflies)
    if (this._critters && this._critters.length > 0 && this.player) {
      for (let ci = this._critters.length - 1; ci >= 0; ci--) {
        const critter = this._critters[ci];
        if (!critter.obj || !critter.obj.active) {
          this._critters.splice(ci, 1);
          continue;
        }
        const cd = Phaser.Math.Distance.Between(this.player.x, this.player.y, critter.obj.x, critter.obj.y);
        if (cd < 40) {
          // Catchable butterflies don't scatter — player must press E to catch
          if (critter.isBf && this.hasNet) continue;
          this.tweens.add({
            targets: critter.obj,
            x: critter.obj.x + 30,
            y: critter.obj.y - 20,
            alpha: 0,
            duration: 300,
            onComplete: () => { if (critter.obj.active) critter.obj.destroy(); },
          });
          this._critters.splice(ci, 1);
        }
      }
    }

    // Phase 26 — Dire portal glow update (world map)
    if (this._direPortalGfx && this.player) {
      this._updateDirePortal();
    }

    // Phase 25 — Pet glow circle sync + max-bond trigger
    if (this._petGlowCircle && this.pet) {
      this._petGlowCircle.setPosition(this.pet.x, this.pet.y);
      this._petGlowCircle.setDepth(this.pet.depth - 1);
    }
    // Firefly Lantern glow — warm halo around player when acc-firefly-lantern is equipped at night
    if (this.player && this.equippedOutfit) {
      const _wearingLantern = this.equippedOutfit.acc === 'acc-firefly-lantern';
      const _isNightNow = (this.dayTime || 0) >= 0.75 || (this.dayTime || 0) < 0.12;
      if (_wearingLantern && _isNightNow) {
        if (!this._fireflyLanternGlow) {
          this._fireflyLanternGlow = this.add.circle(this.player.x, this.player.y, 22, 0xffee55, 0.13).setDepth(this.player.depth - 1);
          this._fireflyLanternGlow2 = this.add.circle(this.player.x, this.player.y, 12, 0xffdd22, 0.22).setDepth(this.player.depth - 1);
          this.tweens.add({ targets: this._fireflyLanternGlow, radius: 26, alpha: 0.08, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          this.tweens.add({ targets: this._fireflyLanternGlow2, radius: 14, alpha: 0.28, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });
        }
        this._fireflyLanternGlow.setPosition(this.player.x, this.player.y).setVisible(true);
        this._fireflyLanternGlow2.setPosition(this.player.x, this.player.y).setVisible(true);
      } else {
        if (this._fireflyLanternGlow) {
          this._fireflyLanternGlow.setVisible(false);
          this._fireflyLanternGlow2.setVisible(false);
        }
      }
    }

    // Phase 27 — Hero title floats above player on world map
    if (this._heroTitle && this.player) {
      this._heroTitle.setPosition(this.player.x, this.player.y - 28).setDepth(this.player.depth + 5);
    }
    if (this.pet && !this._petMaxBondShown && (this.petAffection || 0) >= 50) {
      this._triggerPetMaxBond();
    }
    // Pet bond milestones at 10 and 25 affection
    if (this.pet) {
      const _paff = this.petAffection || 0;
      if (_paff >= 10 && !this._petMilestone10) {
        this._petMilestone10 = true;
        this._showPetMilestone('Best friends!', 0xffcc44);
      }
      if (_paff >= 25 && !this._petMilestone25) {
        this._petMilestone25 = true;
        this._showPetMilestone('Soul bond ★', 0xff88ff);
      }
    }
    // Phase 28 — Season timer (world map only)
    if (this._seasonOverlay && this.mapData?.name === 'world') {
      this._updateSeasonTimer(delta);
    }
    // Night stars visibility (world map — show when dayTime >= 0.75 or < 0.12)
    if (this._nightStars && this._nightStars.length > 0) {
      const isNight = (this.dayTime || 0) >= 0.75 || (this.dayTime || 0) < 0.12;
      this._nightStars.forEach(s => { if (s && s.active) s.setVisible(isNight); });

      // Festival lanterns — show at night when festival is complete
      if (this._festivalLanterns) {
        const showLanterns = isNight && this.festivalComplete;
        this._festivalLanterns.forEach(l => {
          if (l.body  && l.body.active)  l.body.setVisible(showLanterns);
          if (l.glow  && l.glow.active)  l.glow.setVisible(showLanterns);
          if (l.string && l.string.active) l.string.setVisible(showLanterns);
        });
      }

      // Shooting star — occasional across-screen streak at night on world map
      if (isNight && this.isOverworld) {
        this._shootingStarTimer = (this._shootingStarTimer || 0) - delta;
        if (this._shootingStarTimer <= 0) {
          this._shootingStarTimer = 8000 + Math.random() * 14000; // every 8-22s
          const cam = this.cameras.main;
          const _ssx = Math.random() * cam.width * 0.6;
          const _ssy = 20 + Math.random() * 60;
          const _len = 40 + Math.random() * 30;
          // Trail of 5 dots fading out
          for (let _si = 0; _si < 5; _si++) {
            const _dot = this.add.circle(_ssx - _si * 6, _ssy + _si * 3, 1.2 - _si * 0.2, 0xffffff, 1 - _si * 0.18)
              .setScrollFactor(0).setDepth(9995);
            this.tweens.add({
              targets: _dot,
              x: _dot.x + _len,
              y: _dot.y + _len * 0.5,
              alpha: 0,
              duration: 500 + _si * 40,
              delay: _si * 20,
              onComplete: () => _dot.destroy(),
            });
          }
        }
      }
    }
    // Phase 28 — Bed [E] Rest label visibility (house_interior only)
    if (this._bedZone && this._bedLabel && this.player && !this.overlayOpen && !this.inDialogue) {
      const bx = this._bedZone.x, by = this._bedZone.y;
      const near = Math.abs(this.player.x - bx) < 24 && Math.abs(this.player.y - by) < 30;
      this._bedLabel.setAlpha(near ? 1 : 0);
      if (near && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this._openDreamSequence();
      }
      // Zzz particles when night (dayTime >= 0.7 or < 0.15) and not interacting
      const _isNight = (this.dayTime || 0) >= 0.7 || (this.dayTime || 0) < 0.15;
      if (_isNight && !this.inDialogue && !this.overlayOpen) {
        this._zzzTimer = (this._zzzTimer || 0) - delta;
        if (this._zzzTimer <= 0) {
          this._zzzTimer = 2200 + Math.random() * 1000;
          const zx = bx + (Math.random() - 0.5) * 10;
          const zz = this.add.text(zx, by - 8, 'z', {
            fontSize: '9px', fontFamily: 'Arial, sans-serif', fontStyle: 'italic',
            color: '#aaccff', stroke: '#000033', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(by + 150).setAlpha(0.9);
          this.tweens.add({ targets: zz, y: by - 28, alpha: 0, scale: 0.5, duration: 1800, ease: 'Sine.easeOut', onComplete: () => zz.destroy() });
        }
      }
    }
    // Phase 29 — Music box [E] label visibility
    if (this._musicBoxZone && this._musicBoxLabel && this.player && !this.overlayOpen && !this.inDialogue) {
      const mx = this._musicBoxZone.x, my = this._musicBoxZone.y;
      const near = Math.abs(this.player.x - mx) < 22 && Math.abs(this.player.y - my) < 22;
      this._musicBoxLabel.setAlpha(near ? 1 : 0);
      if (near && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this._openMusicBox();
      }
    }
    // Phase 29 — Cozy buff timer
    if (this._cozyBuffTimer > 0) {
      this._cozyBuffTimer -= delta;
      // Periodic heart particles while buff is active (every 4s)
      this._cozyHeartTimer = (this._cozyHeartTimer || 0) - delta;
      if (this._cozyHeartTimer <= 0 && this.player && !this.overlayOpen) {
        this._cozyHeartTimer = 4000;
        const _hx = this.player.x + (Math.random() - 0.5) * 16;
        const _hy = this.player.y - 8;
        const _ht = this.add.text(_hx, _hy, '♥', { fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ffaabb' }).setDepth(1500);
        this.tweens.add({ targets: _ht, alpha: 0, y: _hy - 14, duration: 700, onComplete: () => _ht.destroy() });
      }
      if (this._cozyBuffTimer <= 0) {
        this._cozyBuffTimer = 0;
        if (this._cozyBuffApplied && this.player) {
          this._cozyBuffApplied = false;
          // Restore original speed
          if (this._cozyBuffOrigSpeed) {
            this.player.speed = this._cozyBuffOrigSpeed;
            this._cozyBuffOrigSpeed = null;
          }
          this.showNotification('Cozy feeling faded...');
        }
      }
    }
    // Phase 30 — Festival cake buff (HP regen every 6s while active)
    if (this._festivalCakeBuff > 0 && this.player) {
      this._festivalCakeBuff -= delta;
      this._festivalCakeRegenTimer = (this._festivalCakeRegenTimer || 0) + delta;
      if (this._festivalCakeRegenTimer >= 6000) {
        this._festivalCakeRegenTimer = 0;
        if (this.player.health < this.player.maxHealth) {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
        }
      }
    }
    // Phase 30 — Festival stall labels (show [E] prompts near stalls)
    if (this._festivalStallLabels.length > 0 && this.player && !this.overlayOpen && !this.inDialogue) {
      for (const sl of this._festivalStallLabels) {
        const near = Math.abs(this.player.x - sl.x) < 24 && Math.abs(this.player.y - sl.y) < 24;
        sl.label.setAlpha(near ? 1 : 0);
        if (near && Phaser.Input.Keyboard.JustDown(this.interactKey) && !sl.done) {
          sl.onInteract();
        }
      }
    }
    // Phase 30 — Dance stage: Z key near stage triggers group dance + quest
    if (this._festivalDanceZone && this.player && !this.overlayOpen && !this.inDialogue) {
      const dz = this._festivalDanceZone;
      const nearStage = Math.abs(this.player.x - dz.x) < 28 && Math.abs(this.player.y - dz.y) < 28;
      if (nearStage && Phaser.Input.Keyboard.JustDown(this.danceKey)) {
        this._doGroupDance();
        if (!this.festivalStalls.includes('dance')) {
          this.festivalStalls.push('dance');
          this.questManager.trackEvent?.('festival_dance', {});
          this.updateQuestTracker();
          this._checkFestivalStalls();
        }
      }
    }

    // Phase 31 — Lucky star orb orbit + countdown label
    if (this._luckyStarOrb && this.player) {
      const t31 = this.time.now / 500;
      const _orbX = this.player.x + Math.cos(t31) * 14;
      const _orbY = this.player.y - 8 + Math.sin(t31) * 8;
      this._luckyStarOrb.setPosition(_orbX, _orbY);
      // Countdown label below the orb
      if (!this._luckyStarCountLabel) {
        this._luckyStarCountLabel = this.add.text(_orbX, _orbY + 10, '', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#ffee44',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(1601);
      }
      const _secsLeft = Math.max(0, Math.ceil(this._luckyStarTimer / 1000));
      const _mm = Math.floor(_secsLeft / 60);
      const _ss = String(_secsLeft % 60).padStart(2, '0');
      this._luckyStarCountLabel.setText(`${_mm}:${_ss}`).setPosition(_orbX, _orbY + 10);
    } else if (this._luckyStarCountLabel) {
      this._luckyStarCountLabel.destroy();
      this._luckyStarCountLabel = null;
    }
    // Phase 31 — Lucky star timer countdown
    if (this._luckyStarActive) {
      this._luckyStarTimer -= delta;
      if (this._luckyStarTimer <= 0) {
        this._luckyStarActive = false;
        if (this._luckyStarOrb) { this._luckyStarOrb.destroy(); this._luckyStarOrb = null; }
        if (this._luckyStarCountLabel) { this._luckyStarCountLabel.destroy(); this._luckyStarCountLabel = null; }
        this.showNotification('Lucky Star faded away...');
      }
    }
    // Phase 31 — Firefly catch: E near firefly
    if (this._fireflies && this._fireflies.length > 0 && this.player && !this.overlayOpen && !this.inDialogue) {
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this._tryCatchFirefly();
      }
    }
    // Phase 31 — Wishing well proximity label
    if (this._wishingWellZone && this._wishingWellLabel && this.player && !this.overlayOpen && !this.inDialogue) {
      const ww = this._wishingWellZone;
      const nearWell = Math.abs(this.player.x - ww.x) < 22 && Math.abs(this.player.y - ww.y) < 22;
      this._wishingWellLabel.setAlpha(nearWell ? 1 : 0);
      if (nearWell && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this._openWishMenu();
      }
    }

    // Rainbow pot of gold collection
    if (this._rainbowPot && this._rainbowPot.active && this.player) {
      const rpd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this._rainbowPot.x, this._rainbowPot.y);
      if (rpd < 20) {
        this._rainbowPot.destroy(); this._rainbowPot = null;
        if (this._rainbowPotLabel) { this._rainbowPotLabel.destroy(); this._rainbowPotLabel = null; }
        if (this._rainbowGfx) {
          this.tweens.add({ targets: this._rainbowGfx, alpha: 0, duration: 1500, onComplete: () => { if (this._rainbowGfx) { this._rainbowGfx.destroy(); this._rainbowGfx = null; } } });
        }
        this.addGold(50);
        // Gold shower burst
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 / 8) * i;
          const dot = this.add.circle(this.player.x + Math.cos(ang) * 10, this.player.y + Math.sin(ang) * 10, 3, 0xffd700, 1).setDepth(9999);
          this.tweens.add({ targets: dot, x: dot.x + Math.cos(ang) * 20, y: dot.y + Math.sin(ang) * 20 - 10, alpha: 0, duration: 500, onComplete: () => dot.destroy() });
        }
        this.showNotification('★ Found the Pot of Gold! +50g');
        if (this.sfx) this.sfx.play('coinPickup');
      }
    }

    // Footstep SFX
    if (!this.overlayOpen && !this.inDialogue && this.player) {
      this._footstepTimer = (this._footstepTimer || 0) - delta;
      const vel = this.player.body;
      if (this._footstepTimer <= 0 && vel && (Math.abs(vel.velocity.x) > 5 || Math.abs(vel.velocity.y) > 5)) {
        this._footstepTimer = 380;
        const sfxId = this._getFootstepSfx();
        if (sfxId && this.sfx) this.sfx.play(sfxId);

        // Mountain snow footprint — faint white ellipse mark each step
        const _isMountainMap = ['mountain', 'mountain_cave'].includes(this.mapData?.name);
        if (_isMountainMap && !this._ridingHorse) {
          const _snow = this.add.ellipse(this.player.x, this.player.y + 6, 6, 3, 0xddeeff, 0.4);
          _snow.setDepth(this.player.y - 2);
          this.tweens.add({
            targets: _snow, alpha: 0, duration: 1800,
            onComplete: () => _snow.destroy(),
          });
        }

        // Forest petal trail — emit a tiny flower petal every 2nd step
        // Desert sand puff — tiny tan ellipse kicks up each step
        const _isDesertMap = ['desert_temple', 'desert_valley', 'desert_town', 'desert_inn', 'desert_shop', 'pharaoh_chamber'].includes(this.mapData?.name);
        if (_isDesertMap && !this._ridingHorse) {
          const _sx = this.player.x + (Math.random() - 0.5) * 8;
          const _sy = this.player.y + 6;
          const _sand = this.add.ellipse(_sx, _sy, 7, 3, 0xddbb88, 0.55);
          _sand.setDepth(this.player.y - 2);
          this.tweens.add({
            targets: _sand,
            x: _sx + (Math.random() - 0.5) * 8,
            y: _sy - 5,
            alpha: 0,
            duration: 450,
            onComplete: () => _sand.destroy(),
          });
        }

        const _isForestMap = ['forest', 'forest_boss', 'forest_town', 'forest_inn', 'forest_shop'].includes(this.mapData?.name);
        if (_isForestMap && !this._ridingHorse) {
          this._petalStepCount = (this._petalStepCount || 0) + 1;
          if (this._petalStepCount % 2 === 0) {
            const _petalColors = [0xff99bb, 0xffbbdd, 0xddaaee, 0xffddee];
            const _pc = _petalColors[Math.floor(Math.random() * _petalColors.length)];
            const _px = this.player.x + (Math.random() - 0.5) * 6;
            const _py = this.player.y + 4;
            const _petal = this.add.ellipse(_px, _py, 4, 3, _pc, 0.85);
            _petal.setDepth(this.player.y - 1);
            _petal.setAngle(Math.random() * 360);
            this.tweens.add({
              targets: _petal,
              x: _px + (Math.random() - 0.5) * 10,
              y: _py + 8 + Math.random() * 6,
              alpha: 0,
              angle: _petal.angle + 90,
              duration: 700 + Math.random() * 300,
              onComplete: () => _petal.destroy(),
            });
          }
        }

        // Outfit sparkle trails — active per equipped wardrobe piece
        const _outfit = this.equippedOutfit;
        if (_outfit) {
          // Fairy Dress → tiny star sparkles float upward
          if (_outfit.dress === 'outfit-fairy') {
            const _sc = [0xffeeaa, 0xffccee, 0xaaddff, 0xffffff][Math.floor(Math.random() * 4)];
            const _sx = this.player.x + (Math.random() - 0.5) * 10;
            const _sy = this.player.y + 2;
            const _spark = this.add.text(_sx, _sy, '✦', {
              fontSize: '7px', fontFamily: 'Arial', color: `#${_sc.toString(16).padStart(6, '0')}`,
              stroke: '#000000', strokeThickness: 1,
            }).setOrigin(0.5).setDepth(this.player.y + 1);
            this.tweens.add({ targets: _spark, y: _sy - 14, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => _spark.destroy() });
          }
          // Rainbow Sash → tiny rainbow dot trail
          if (_outfit.acc === 'acc-rainbow-sash') {
            const _rbColors = [0xff4444, 0xff8800, 0xffee00, 0x44cc44, 0x4488ff, 0xcc44ff];
            const _rc = _rbColors[Math.floor(Math.random() * _rbColors.length)];
            const _rdot = this.add.circle(this.player.x + (Math.random() - 0.5) * 8, this.player.y + 4, 2, _rc, 0.8).setDepth(this.player.y - 1);
            this.tweens.add({ targets: _rdot, alpha: 0, scaleX: 0, scaleY: 0, duration: 500, onComplete: () => _rdot.destroy() });
          }
          // Festival Dress → confetti fleck
          if (_outfit.dress === 'outfit-festival') {
            const _fc = [0xff88cc, 0xffcc44, 0x88ddff, 0xaaffaa][Math.floor(Math.random() * 4)];
            const _fx2 = this.player.x + (Math.random() - 0.5) * 12;
            const _fy2 = this.player.y + (Math.random() - 0.5) * 6;
            const _fleck = this.add.rectangle(_fx2, _fy2, 3, 2, _fc, 0.75).setDepth(this.player.y - 1).setAngle(Math.random() * 360);
            this.tweens.add({ targets: _fleck, y: _fy2 + 10, alpha: 0, duration: 600, onComplete: () => _fleck.destroy() });
          }
        }
      }
    }

    // Horse hoofstep SFX while riding
    if (this._ridingHorse && this.player && this.sfx) {
      if (this._lastRideX === undefined) { this._lastRideX = this.player.x; this._lastRideY = this.player.y; }
      const rideDx = Math.abs(this.player.x - this._lastRideX);
      const rideDy = Math.abs(this.player.y - this._lastRideY);
      if (rideDx + rideDy > 2) {
        this._lastRideX = this.player.x; this._lastRideY = this.player.y;
        if (!this._hoofTimer || this._hoofTimer <= 0) {
          this.sfx.play('hoofstep_dirt');
          this._hoofTimer = 300;
          // Dust puff behind horse on each hoofstep
          for (let _di = 0; _di < 3; _di++) {
            const _dx = this.player.x + (Math.random() - 0.5) * 10;
            const _dy = this.player.y + 6 + Math.random() * 4;
            const _dust = this.add.ellipse(_dx, _dy, 5 + Math.random() * 4, 3 + Math.random() * 2, 0xddccaa, 0.55).setDepth(this.player.y - 2);
            this.tweens.add({
              targets: _dust,
              x: _dx + (Math.random() - 0.5) * 14,
              y: _dy - 8 - Math.random() * 6,
              alpha: 0,
              scaleX: 1.8, scaleY: 1.8,
              duration: 380 + Math.random() * 200,
              onComplete: () => _dust.destroy(),
            });
          }
        }
      }
      if (this._hoofTimer > 0) this._hoofTimer -= delta;
    }

    // Boss HP bar UI events
    if (this.boss && this.boss.active) {
      this._bossUiShown = true;
      this.events.emit('boss-ui-update', {
        name: this._bossDisplayName || 'Boss',
        hp: this.boss.health,
        maxHp: this.boss.maxHealth,
      });
    } else if (this._bossUiShown) {
      this._bossUiShown = false;
      this.events.emit('boss-ui-hide');
    }

    // Depth sort
    this.player.setDepth(this.player.y);
    this.enemies.getChildren().forEach((e) => e.setDepth(e.y));
  }

  // ---- Phase 20: Farm Methods ----

  _spawnFarmNPC() {
    const rosa = new NPC(this, 200, 80, 'farmer-buba', {
      id: 'farm_manager',
      name: 'Rosa',
      idleAnim: 'npc-buba-idle-down',
      wanders: true,
      speed: 8,
      wanderRadius: 30,
      wanderAnims: { down: 'npc-buba-walk-down', right: 'npc-buba-walk-right', up: 'npc-buba-walk-up' },
      dialogueLines: [
        'Welcome to Sunridge Farm!\nI manage the animals here.',
        'Talk to me to buy animals\nor sell your farm produce!',
      ],
    });
    rosa.setTint(0x99cc66);
    this.npcs.add(rosa);
  }

  _spawnHayBale() {
    const bx = 90, by = 100;
    // Draw hay bale visuals
    const base = this.add.rectangle(bx, by + 2, 22, 14, 0xccaa33).setDepth(by);
    const top  = this.add.rectangle(bx, by - 5, 20, 10, 0xddbb44).setDepth(by + 0.1);
    // Rope stripe
    const rope1 = this.add.rectangle(bx - 5, by, 2, 18, 0x886622).setDepth(by + 0.2);
    const rope2 = this.add.rectangle(bx + 5, by, 2, 18, 0x886622).setDepth(by + 0.2);
    // E prompt label
    const label = this.add.text(bx, by - 16, '[E] Feed', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999).setAlpha(0);
    this._hayBaleLabel = label;

    // Store as collision zone object for distance checks
    this._hayBaleZone = { x: bx, y: by, label };

    // Add a small static obstacle so NPCs don't walk through it
    const zone = this.add.zone(bx, by, 22, 14);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
  }

  spawnFarmAnimals() {
    if (this.farmAnimals.sheep) {
      this._farmSheep = new Sheep(this, 80, 160);
      if (this.farmFed.sheep) this._farmSheep.feed();
      if (this.farmAnimalNames?.sheep) this.time.delayedCall(120, () => this._placeAnimalNameLabel('sheep'));
    }
    if (this.farmAnimals.cow) {
      this._farmCow = new Cow(this, 140, 200);
      if (this.farmFed.cow) this._farmCow.feed();
      if (this.farmAnimalNames?.cow) this.time.delayedCall(120, () => this._placeAnimalNameLabel('cow'));
    }
    if (this.farmAnimals.horse) {
      this._farmHorse = new Horse(this, 370, 80);
      if (this.farmAnimalNames?.horse) this.time.delayedCall(120, () => this._placeAnimalNameLabel('horse'));
    }
  }

  _feedAnimals() {
    let fedAny = false;
    let firstUnnamed = null;
    if (this._farmSheep?.active && !this._farmSheep.isFed) {
      this._farmSheep.feed();
      this.farmFed.sheep = true;
      fedAny = true;
      if (!this.farmAnimalNames.sheep) firstUnnamed = 'sheep';
    }
    if (this._farmCow?.active && !this._farmCow.isFed) {
      this._farmCow.feed();
      this.farmFed.cow = true;
      fedAny = true;
      if (!this.farmAnimalNames.cow && !firstUnnamed) firstUnnamed = 'cow';
    }
    if (fedAny) {
      if (this.sfx) this.sfx.play('select');
      if (firstUnnamed) {
        this._showAnimalNamePicker(firstUnnamed);
      } else {
        this.showNotification('Animals fed!\nCheck back in a moment.');
      }
    } else {
      this.showNotification('Animals are already fed\nor you have no animals.');
    }
  }

  _handleFarmAnimalHarvest() {
    // Sheep wool
    if (this._farmSheep?.active) {
      const sd = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this._farmSheep.x, this._farmSheep.y);
      if (sd < 32 && this._farmSheep.hasWool) {
        this._farmSheep.harvest();
        this.farmFed.sheep = false;
        this.materials.wool = (this.materials.wool || 0) + 1;
        this.questManager.trackEvent('collect_material', { materialId: 'wool' });
        this.updateQuestTracker();
        const ft = this.add.text(this._farmSheep.x, this._farmSheep.y - 16, '+1 Wool', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#eeeedd', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999);
        this.tweens.add({ targets: ft, y: ft.y - 20, alpha: 0, duration: 1200, onComplete: () => ft.destroy() });
        if (this.sfx) this.sfx.play('levelUp');
        return;
      }
    }
    // Cow milk
    if (this._farmCow?.active) {
      const cd = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this._farmCow.x, this._farmCow.y);
      if (cd < 32 && this._farmCow.hasMilk) {
        this._farmCow.harvest();
        this.farmFed.cow = false;
        this.materials.milk = (this.materials.milk || 0) + 1;
        this.questManager.trackEvent('collect_material', { materialId: 'milk' });
        this.updateQuestTracker();
        const ft = this.add.text(this._farmCow.x, this._farmCow.y - 18, '+1 Milk', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#ffffff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999);
        this.tweens.add({ targets: ft, y: ft.y - 20, alpha: 0, duration: 1200, onComplete: () => ft.destroy() });
        if (this.sfx) this.sfx.play('levelUp');
      }
    }
  }

  _mountHorse() {
    this._preRideSpeed = this.player.speed;
    this.player.speed = 200;
    this._ridingHorse = true;
    this._farmHorse.mount();
    if (this.sfx) this.sfx.play('select');
    this.showNotification('Riding! [E] to dismount.\nCannot attack while riding.');
  }

  _dismountHorse() {
    this.player.speed = this._preRideSpeed;
    this._ridingHorse = false;
    this._farmHorse.dismount(this.player.x, this.player.y);
    if (this.sfx) this.sfx.play('menuCancel');
  }

  // ─── Phase 24: Flower Gifting ──────────────────────────────────────────────

  _tryGiveFlower(npc, name, portrait) {
    const flowerType = this._hasFlowerToGive;
    const NPC_FAVORITES = {
      farmer_bob: 'sunflower', miner_mike: 'violet', fisherman_fin: 'rose',
      jack: 'violet', ranger_reed: 'sunflower', hermit_rolf: 'rose',
      chloe: 'rose', buba: 'sunflower',
    };
    const fav = NPC_FAVORITES[npc.npcId];
    const isMatch = fav === flowerType;
    const affAmount = isMatch ? 25 : 10;
    const FLOWER_NAMES = { rose: 'rose', sunflower: 'sunflower', violet: 'violet' };
    const fn = FLOWER_NAMES[flowerType] || flowerType;

    const reactionMatch = [
      `${name}: A ${fn}! My favourite!`,
      `${name}: This is perfect —\nthank you so much!`,
    ];
    const reactionOther = [
      `${name}: Oh, a ${fn}!\nHow thoughtful of you!`,
      `${name}: A gift for me?\nYou're so kind!`,
    ];
    const lines = isMatch ? reactionMatch : reactionOther;

    this._hasFlowerToGive = null;
    this.flowerGiftsGiven[npc.npcId] = (this.flowerGiftsGiven[npc.npcId] || 0) + 1;
    this._giveAffection(npc.npcId, affAmount);

    if (isMatch) {
      // Favourite flower — big heart burst from NPC position
      const _nx = npc.x, _ny = npc.y;
      for (let _hi = 0; _hi < 8; _hi++) {
        const _ang = (_hi / 8) * Math.PI * 2;
        const _ht = this.add.text(_nx + Math.cos(_ang) * 10, _ny + Math.sin(_ang) * 10 - 8, '♥', {
          fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ff66aa',
        }).setDepth(9999).setOrigin(0.5);
        this.tweens.add({
          targets: _ht,
          x: _nx + Math.cos(_ang) * 26,
          y: _ny + Math.sin(_ang) * 26 - 16,
          alpha: 0, scaleX: 1.4, scaleY: 1.4,
          duration: 700 + _hi * 50,
          onComplete: () => _ht.destroy(),
        });
      }
      // Golden ring
      const _ring = this.add.circle(_nx, _ny, 6, 0xffdd44, 0.3).setDepth(9998);
      this.tweens.add({ targets: _ring, scaleX: 8, scaleY: 8, alpha: 0, duration: 500, onComplete: () => _ring.destroy() });
      if (this.sfx) this.sfx.play('levelUp');
    } else {
      this._celebrationBurst('unlock');
    }

    this.showDialogue(lines, null, name, portrait);

    const hearts = isMatch ? '+25 Bond!' : '+10 Bond!';
    this.time.delayedCall(500, () => this.showNotification(`${name} loved it!\n${hearts}`));

    // Achievement check
    const uniqueRecipients = Object.keys(this.flowerGiftsGiven).length;
    if (uniqueRecipients >= 5) this._unlockAchievement('beloved_friend', 'Beloved Friend');
  }

  // ─── Phase 24: Butterfly Display Board ────────────────────────────────────

  _handleCorkboardInteract() {
    if (!this._corkboardZone) return false;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this._corkboardZone.x, this._corkboardZone.y);
    if (dist > 26) return false;
    this._openButterflyBoard();
    return true;
  }

  _openButterflyBoard() {
    if (this.inDialogue) return;
    this.inDialogue = true;
    this.player.setVelocity(0, 0);
    const cx = 160, cy = 101;
    const bf = this.caughtButterflies || {};
    const panel = this.add.container(0, 0).setDepth(9200).setScrollFactor(0);
    panel.add(this.add.rectangle(cx, cy, 200, 120, 0x000000, 0.8).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 196, 116, 0xcc8844, 0.6).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 192, 112, 0xddaa66).setScrollFactor(0));
    panel.add(this.add.text(cx, cy - 48, '~ Butterfly Board ~', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#553311',
    }).setOrigin(0.5).setScrollFactor(0));

    const TYPES = [
      { id: 'yellow', col: 0xffee44, name: 'Sunbeam (Overworld)' },
      { id: 'green',  col: 0x88ee88, name: 'Leaf Wing (Forest)' },
      { id: 'blue',   col: 0x88aaff, name: 'Frost Wing (Mountain)' },
      { id: 'orange', col: 0xff8844, name: 'Desert Flame (Beach)' },
    ];
    TYPES.forEach((t, i) => {
      const count = bf[t.id] || 0;
      const yPos = cy - 26 + i * 18;
      const dotCol = count > 0 ? t.col : 0x888888;
      panel.add(this.add.circle(cx - 80, yPos, 4, dotCol).setScrollFactor(0));
      const label = count > 0 ? `${t.name}  x${count}` : `${t.name}  (not found)`;
      panel.add(this.add.text(cx - 68, yPos, label, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: count > 0 ? '#553311' : '#888866',
      }).setOrigin(0, 0.5).setScrollFactor(0));
    });

    const total = Object.values(bf).reduce((a, b) => a + b, 0);
    panel.add(this.add.text(cx, cy + 42, `Total caught: ${total}`, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#664422',
    }).setOrigin(0.5).setScrollFactor(0));
    panel.add(this.add.text(cx, cy + 52, '[E] Close', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#888866',
    }).setOrigin(0.5).setScrollFactor(0));

    const close = () => { panel.destroy(); this.inDialogue = false; };
    this.input.keyboard.once('keydown-E', close);
    this.input.keyboard.once('keydown-ESC', close);

    // Unlock butterfly crown if all 4 caught
    const allTypes = ['yellow', 'green', 'blue', 'orange'];
    if (allTypes.every(t => (bf[t] || 0) >= 1)) {
      this._unlockWardrobeItem('hat-butterfly-crown', 'Butterfly Crown');
    }
  }

  // ─── Phase 24: Stargazing Telescope ────────────────────────────────────────

  _handleTelescopeInteract() {
    if (!this._telescopeZone) return false;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this._telescopeZone.x, this._telescopeZone.y);
    if (dist > 26) return false;
    this._openStargazing();
    return true;
  }

  _openStargazing() {
    if (this.inDialogue) return;
    const CONSTELLATIONS = [
      { name: 'Orion the Hunter', desc: 'Three bright stars in a row\nmark his famous belt.', color: '#aaccff' },
      { name: 'Cassiopeia the Queen', desc: 'Five stars form a "W" shape —\na queen upon her throne!', color: '#ffccaa' },
      { name: 'Ursa Major (Big Dipper)', desc: 'Seven stars make a great ladle.\nIt always points to the North Star!', color: '#ccffaa' },
    ];
    let step = 0;
    this.inDialogue = true;
    this.player.setVelocity(0, 0);
    const cx = 160, cy = 101;

    const showStep = () => {
      if (step >= CONSTELLATIONS.length) {
        // All shown — achievement!
        if (!this.stargazerComplete) {
          this.stargazerComplete = true;
          this._unlockAchievement('stargazer', 'Stargazer');
          this._celebrationBurst('boss');
        }
        this.inDialogue = false;
        this.showNotification('Wonderful! You know\nall the constellations!');
        return;
      }
      const c = CONSTELLATIONS[step];
      const panel = this.add.container(0, 0).setDepth(9200).setScrollFactor(0);
      panel.add(this.add.rectangle(cx, cy, 210, 110, 0x000011, 0.92).setScrollFactor(0));
      panel.add(this.add.rectangle(cx, cy, 206, 106, 0x111133, 0.9).setScrollFactor(0));
      // Star sparkles
      for (let i = 0; i < 12; i++) {
        const sx = cx - 90 + Math.random() * 180;
        const sy = cy - 48 + Math.random() * 40;
        panel.add(this.add.circle(sx, sy, Math.random() < 0.3 ? 1.5 : 0.8, 0xffffff, 0.4 + Math.random() * 0.5).setScrollFactor(0));
      }
      panel.add(this.add.text(cx, cy - 40, `Star ${step + 1} of 3`, {
        fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#888899',
      }).setOrigin(0.5).setScrollFactor(0));
      panel.add(this.add.text(cx, cy - 26, c.name, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: c.color,
      }).setOrigin(0.5).setScrollFactor(0));
      panel.add(this.add.text(cx, cy + 2, c.desc, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#aaaacc', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0));
      panel.add(this.add.text(cx, cy + 38, step < 2 ? '[SPACE] Next Star' : '[SPACE] Finish', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#666688',
      }).setOrigin(0.5).setScrollFactor(0));

      this.input.keyboard.once('keydown-SPACE', () => {
        panel.destroy();
        step++;
        showStep();
      });
    };
    showStep();
  }

  // ─── Phase 24: Treasure Hunt ────────────────────────────────────────────────

  _initDigSpots() {
    this._digSpots = [];
    const DIG_SPOTS = [
      { id: 'dig_alpha', x: 480, y: 240, mapId: 'map_alpha', reward: 'gold', amount: 120, label: 'Forest Clearing' },
      { id: 'dig_beta',  x: 800, y: 400, mapId: 'map_beta',  reward: 'gold', amount: 150, label: 'Harbor Cove' },
      { id: 'dig_gamma', x: 320, y: 480, mapId: 'map_gamma', reward: 'wardrobe', wItem: 'hat-explorer-scarf', wName: 'Explorer Scarf', label: 'Ancient Ruins' },
    ];
    for (const ds of DIG_SPOTS) {
      if (this.digSpotsDug.includes(ds.id)) continue;
      if (!this.treasureMapsFound.includes(ds.mapId)) continue;
      // Spawn sparkle marker at dig spot
      const sparkle = this.add.circle(ds.x, ds.y, 5, 0xffdd44, 0.8).setDepth(9990);
      this.tweens.add({ targets: sparkle, alpha: 0.2, scaleX: 1.5, scaleY: 1.5, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(ds.x, ds.y - 14, 'X marks the spot!', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9991);
      this._digSpots.push({ ...ds, sparkle });
    }
  }

  _handleDigSpotInteract() {
    if (!this.isOverworld || !this._digSpots?.length) return false;
    for (let i = this._digSpots.length - 1; i >= 0; i--) {
      const ds = this._digSpots[i];
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ds.x, ds.y);
      if (dist > 24) continue;
      // Dig!
      ds.sparkle.destroy();
      this._digSpots.splice(i, 1);
      this.digSpotsDug.push(ds.id);
      this._digTreasure(ds);
      return true;
    }
    return false;
  }

  _digTreasure(ds) {
    this._celebrationBurst('boss');
    if (ds.reward === 'gold') {
      this.addGold(ds.amount);
      this.showNotification(`You dug up treasure!\n+${ds.amount} gold!`);
    } else if (ds.reward === 'wardrobe') {
      this._unlockWardrobeItem(ds.wItem, ds.wName);
      this.showNotification(`You dug up treasure!\nFound the ${ds.wName}!`);
    }
    if (this.sfx) this.sfx.play('chestOpen');
    // Particle burst at dig site
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const coin = this.add.circle(ds.x, ds.y, 3, 0xffdd00).setDepth(9999);
      this.tweens.add({
        targets: coin,
        x: ds.x + Math.cos(angle) * 30,
        y: ds.y + Math.sin(angle) * 30 - 20,
        alpha: 0, duration: 700,
        onComplete: () => coin.destroy(),
      });
    }
    // Check treasure_hunter achievement
    if (this.digSpotsDug.length >= 3) {
      this._unlockAchievement('treasure_hunter', 'Treasure Hunter');
    }
  }

  _onTreasureMapFound(id) {
    this.treasureMapsFound.push(id);
    const MAP_NAMES = { map_alpha: 'Forest Map', map_beta: 'Coastal Map', map_gamma: 'Ruins Map' };
    this.showNotification(`Found a ${MAP_NAMES[id] || 'Treasure Map'}!\nLook for the X on your travels!`);
    if (this.sfx) this.sfx.play('itemPickup');
    this._celebrationBurst('unlock');
    // If on overworld, re-init dig spots to show newly unlocked one
    if (this.isOverworld) this._initDigSpots();
    // First map found — notification hint
    if (this.treasureMapsFound.length === 1) {
      this.time.delayedCall(2000, () =>
        this.showNotification('Tip: Look for a sparkle\non the world map!'));
    }
  }

  // ─── Phase 25: Outfit Reactions ────────────────────────────────────────────

  _getOutfitReaction(npcId, name) {
    const outfit = this.equippedOutfit || {};
    const hat   = outfit.hat   || null;
    const dress = outfit.dress || null;
    const acc   = outfit.acc   || null;

    // Specific outfit combos first
    if (dress === 'outfit-princess') {
      const lines = {
        farmer_bob:     `${name}: My goodness, you look\nlike royalty today, Lizzy!`,
        miner_mike:     `${name}: A princess in the mines?\nNow I've seen everything!`,
        fisherman_fin:  `${name}: Even the sea can't match\nyour sparkle today!`,
        buba:           `${name}: Oh, Lizzy! You look so\npretty in that dress! ♥`,
        chloe:          `${name}: Wow! Can I try that on\nlater? Pretty please?`,
        ranger_reed:    `${name}: Ha! Adventuring in a\nprincess dress? Love it!`,
      };
      return lines[npcId] || null;
    }
    if (dress === 'outfit-wizard') {
      const lines = {
        farmer_bob:     `${name}: Are you going to turn\nmy crops magic, Lizzy?`,
        miner_mike:     `${name}: A wizard! Hope you can\nfind my lost pickaxe too.`,
        fisherman_fin:  `${name}: A fishing wizard? Best\ncatch big ones today!`,
        chloe:          `${name}: Oooh, you look just like\na real wizard! So cool!`,
      };
      return lines[npcId] || null;
    }
    if (dress === 'outfit-pirate') {
      const lines = {
        farmer_bob:     `${name}: Ahoy there, landlubber!\nYarr, nice boots!`,
        fisherman_fin:  `${name}: A fellow seafarer! You\nhad me fooled for a moment.`,
        ranger_reed:    `${name}: The seas AND the forest?\nYou're everywhere, Lizzy!`,
      };
      return lines[npcId] || null;
    }
    if (dress === 'outfit-bunny') {
      const lines = {
        farmer_bob:     `${name}: Haha, don't scare the\nchickens dressed like that!`,
        buba:           `${name}: Bunny Lizzy!! So fluffy!\nCan I pet your ears? ♥`,
        chloe:          `${name}: BUNNY LIZZY! You're the\ncutest adventurer EVER!`,
      };
      return lines[npcId] || null;
    }
    if (dress === 'outfit-fairy') {
      const lines = {
        farmer_bob:     `${name}: A real fairy! I knew the\nforest had magic in it.`,
        miner_mike:     `${name}: Fairy Lizzy! Maybe you\ncan find ore with magic?`,
        buba:           `${name}: Ohhh, you're glowing!\nYou're SO beautiful! ♥♥`,
        chloe:          `${name}: Real fairies are real!\nI KNEW IT! Tell everyone!`,
      };
      return lines[npcId] || null;
    }
    if (hat === 'hat-butterfly-crown') {
      const lines = {
        farmer_bob:  `${name}: That crown of butterflies\nis the prettiest thing I've seen!`,
        buba:        `${name}: Butterflies on your head!\nThey like you so much! ♥`,
        ranger_reed: `${name}: Nature chose you, Lizzy.\nThat crown suits you perfectly.`,
      };
      return lines[npcId] || null;
    }
    if (hat === 'hat-explorer-scarf') {
      const lines = {
        farmer_bob:  `${name}: Off on another adventure?\nThat scarf suits you!`,
        miner_mike:  `${name}: An explorer's scarf! You\nfound something special, eh?`,
        ranger_reed: `${name}: A true treasure hunter!\nWhat did you dig up?`,
      };
      return lines[npcId] || null;
    }
    if (hat === 'hat-crown') {
      return npcId === 'buba' ? `Buba: A real gold crown!\nAre you a princess? ♥` : null;
    }
    if (acc === 'acc-wand') {
      return npcId === 'chloe'
        ? `${name}: WHOA! A magic wand! Do\na spell! Do a spell!`
        : null;
    }
    return null;
  }

  // ─── Phase 26: Light Shards & Shadow Citadel ───────────────────────────────

  _dropCrystal(bx, by, color, crystalId) {
    if ((this.rainbowCrystals || []).includes(crystalId)) return; // already collected

    const LORE = {
      crystal_red:    'The Flame Shard — sealed by a warrior long ago.',
      crystal_orange: 'The Sand Shard — hidden beneath ancient ruins.',
      crystal_yellow: 'The Forest Shard — grown from the world tree.',
      crystal_green:  'The Frost Shard — preserved in eternal ice.',
      crystal_blue:   'The Sea Shard — resting in the deep.',
      crystal_purple: 'The Shadow Shard — guarded by the undying.',
      crystal_pink:   'The Void Shard — the last light before darkness.',
    };

    // Diamond gem visual
    const g = this.add.graphics();
    g.fillStyle(color, 0.9);
    g.fillTriangle(bx, by - 8, bx - 6, by, bx + 6, by);   // top half
    g.fillTriangle(bx, by + 8, bx - 6, by, bx + 6, by);   // bottom half
    g.fillStyle(0xffffff, 0.35);
    g.fillTriangle(bx - 1, by - 6, bx - 5, by, bx - 1, by); // highlight
    g.setDepth(500);

    this.tweens.add({
      targets: g, alpha: { from: 0.6, to: 1 },
      duration: 600, yoyo: true, repeat: -1,
    });

    // Pickup zone (walk-over)
    const zone = this.add.zone(bx, by, 20, 20);
    this.physics.add.existing(zone, true);
    const ov = this.physics.add.overlap(this.player, zone, () => {
      if ((this.rainbowCrystals || []).includes(crystalId)) return;
      this.physics.world.removeCollider(ov);
      g.destroy(); zone.destroy();
      this.rainbowCrystals.push(crystalId);

      if (this.sfx) this.sfx.play('crystalCollect');

      // Sparkle burst
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = this.add.circle(bx, by, 2, color, 0.9).setDepth(9999);
        this.tweens.add({
          targets: p, x: bx + Math.cos(a) * 22, y: by + Math.sin(a) * 22,
          alpha: 0, scale: 0.3, duration: 400, onComplete: () => p.destroy(),
        });
      }

      const count = this.rainbowCrystals.length;
      const name = crystalId.replace('crystal_', '').toUpperCase();
      this.showNotification(`✨ ${name} SHARD (${count}/7)\n${LORE[crystalId]}`);

      this._checkShadowCitadelUnlock();
      this._checkAchievements();
    });
  }

  _checkShadowCitadelUnlock() {
    if ((this.rainbowCrystals || []).length < 7) return;
    const lichDone = this.questManager.getQuest('defeat_lich')?.state === 'completed';
    if (!lichDone) {
      this.showNotification('6 shards gathered! Defeat the Lich King to unseal the last.');
      return;
    }
    // All 7 + lich dead
    if (this.sfx) this.sfx.play('levelUp');
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const COLORS = [0xff4444, 0xff9922, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc];
    COLORS.forEach((c, i) => {
      this.time.delayedCall(i * 70, () => {
        const bar = this.add.rectangle(W / 2, H / 2, W, H, c, 0.15).setScrollFactor(0).setDepth(19000);
        this.tweens.add({ targets: bar, alpha: 0, duration: 350, onComplete: () => bar.destroy() });
      });
    });
    this.time.delayedCall(600, () => {
      this.showNotification('All 7 Light Shards gathered!\nThe Shadow Citadel gate is unsealed!');
    });
  }

  _triggerDireVictory() {
    this._unlockAchievement('lord_dire_vanquished', 'Light Bringer');
    this._celebrationBurst('boss');
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
          trueEnding: (this.starFragments || 0) >= 3,
          lichEnding: true,
          direEnding: true,
          achievements: this.achievements,
          petType: this.petType || null,
          petAffection: this.petAffection || 0,
          petName: this.petName || null,
        });
      });
    });
  }

  _spawnDirePortal() {
    const px = 256, py = 768;
    this._direPortalGfx = this.add.graphics();
    this._direPortalGfx.setDepth(490);
    this._direPortalAngle = 0;
    this._direPortalPulse = 0;
    this._updateDirePortal(); // initial draw

    // "Sealed" label
    this._direPortalLabel = this.add.text(px, py - 22, 'Shadow Citadel', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#aa44cc', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(491);
  }

  _updateDirePortal() {
    if (!this._direPortalGfx || !this._direPortalGfx.active) return;
    this._direPortalAngle = ((this._direPortalAngle || 0) + 0.03);
    this._direPortalPulse = ((this._direPortalPulse || 0) + 0.05);
    const px = 256, py = 768;
    const unlocked = (this.rainbowCrystals || []).length >= 7 &&
                     this.questManager.getQuest('defeat_lich')?.state === 'completed';

    const g = this._direPortalGfx;
    g.clear();

    if (unlocked) {
      // Rainbow rotating ring
      const COLORS = [0xff4444, 0xff9922, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc];
      for (let i = 0; i < 7; i++) {
        const a = this._direPortalAngle + (i / 7) * Math.PI * 2;
        const r = 18;
        g.fillStyle(COLORS[i], 0.9);
        g.fillCircle(px + Math.cos(a) * r, py + Math.sin(a) * r, 3);
      }
      // Bright core
      const pulse = 0.6 + Math.sin(this._direPortalPulse) * 0.3;
      g.fillStyle(0xffffff, pulse);
      g.fillCircle(px, py, 7);
      g.fillStyle(0xcc44ff, 0.8);
      g.fillCircle(px, py, 5);
      if (this._direPortalLabel) this._direPortalLabel.setColor('#ff88cc');
    } else {
      // Sealed: dark swirl
      for (let i = 0; i < 6; i++) {
        const a = this._direPortalAngle + (i / 6) * Math.PI * 2;
        g.fillStyle(0x330044, 0.7);
        g.fillCircle(px + Math.cos(a) * 12, py + Math.sin(a) * 12, 2);
      }
      const pulse = 0.3 + Math.sin(this._direPortalPulse) * 0.1;
      g.fillStyle(0x220033, pulse);
      g.fillCircle(px, py, 7);
    }
  }

  _showDireIntroLore() {
    const KEY = 'lizzy-dire-intro';
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, '1');

    // Delay so world finishes loading first
    this.time.delayedCall(1500, () => {
      if (!this || !this.scene?.isActive?.('Game')) return;
      this.showDialogue([
        'Long ago, Lord Dire was sealed away',
        'by seven heroes wielding Crystals of Light.',
        '',
        'His servants — the dungeon bosses — guard',
        'the shards. Defeat them. Collect the crystals.',
        'Only then can his Shadow Citadel be entered.',
      ], null, 'Ancient Legend');
    });
  }

  // ─── Phase 27: A Hero's Welcome ────────────────────────────────────────────

  _checkParade() {
    const KEY = 'lizzy-parade-shown';
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, '1');

    this.time.delayedCall(2500, () => {
      if (!this || !this.scene?.isActive?.('Game')) return;
      // Rainbow confetti cascade around the player
      const colors = [0xff4444, 0xff9922, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc];
      for (let i = 0; i < 32; i++) {
        const ox = (Math.random() - 0.5) * 220;
        const oy = (Math.random() - 0.5) * 140;
        const c = this.add.circle(this.player.x + ox, this.player.y + oy, 2 + Math.random() * 2, colors[i % 7], 0.9);
        c.setDepth(8000);
        this.tweens.add({
          targets: c,
          y: c.y - 50 - Math.random() * 50,
          alpha: 0,
          duration: 1400 + Math.random() * 800,
          delay: Math.random() * 600,
          onComplete: () => c.destroy(),
        });
      }
      this.showNotification('★ The whole world cheers for you! Light Bringer! ★');
      if (this.sfx) this.sfx.play('questComplete');
    });
  }

  _spawnBearerScroll() {
    const MAP_TO_CRYSTAL = {
      boss_room:       'crystal_red',
      pharaoh_chamber: 'crystal_orange',
      forest_boss:     'crystal_yellow',
      mountain_cave:   'crystal_green',
      sea_cave:        'crystal_blue',
      ruins_dungeon:   'crystal_purple',
      lich_tower:      'crystal_pink',
    };
    const crystalId = MAP_TO_CRYSTAL[this.mapData.name];
    if (!crystalId) return;
    // Only show if crystal collected (boss defeated) but letter not yet read
    if (!this.rainbowCrystals?.includes(crystalId)) return;
    if (this.bearerLetters?.includes(this.mapData.name)) return;

    const sx = (this.mapData.playerSpawn?.x || 96) + 44;
    const sy = (this.mapData.playerSpawn?.y || 200) - 36;

    const g = this.add.rectangle(sx, sy, 10, 14, 0xeecc88);
    g.setDepth(500);
    const label = this.add.text(sx, sy - 12, '📜 Letter', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffeeaa', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(501);
    this.tweens.add({ targets: [g, label], y: '-=3', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const zone = this.add.zone(sx, sy, 18, 18);
    this.physics.add.existing(zone, true);
    const ov = this.physics.add.overlap(this.player, zone, () => {
      this.physics.world.removeCollider(ov);
      g.destroy(); label.destroy(); zone.destroy();
      if (!this.bearerLetters) this.bearerLetters = [];
      this.bearerLetters.push(this.mapData.name);
      if (this.sfx) this.sfx.play('paperRustle');
      this._showBearerLetter(this.mapData.name);
      if (this.bearerLetters.length >= 7) {
        this._unlockAchievement('loremaster', 'Loremaster');
      }
    });
  }

  _showBearerLetter(mapName) {
    const LETTERS = {
      boss_room:       { name: 'Flame Shard Letter',  lines: ['"I, Sera the Warrior, sealed this shard', 'deep in the cave.', 'May it never burn again."', '— Sera the Warrior'] },
      pharaoh_chamber: { name: 'Sand Shard Letter',   lines: ['"By my hand this shard rests', 'beneath the desert sands.', 'Seek it wisely."', '— Amara the Sage'] },
      forest_boss:     { name: 'Forest Shard Letter', lines: ['"The great tree holds this light safe.', 'Guard it well, wanderer."', '— Kael the Ranger'] },
      mountain_cave:   { name: 'Frost Shard Letter',  lines: ['"In eternal ice I place this shard.', 'Only true courage can thaw it."', '— Rina the Brave'] },
      sea_cave:        { name: 'Sea Shard Letter',    lines: ['"The depths shall keep it hidden.', 'May the tides protect it."', '— Finn of the Sea'] },
      ruins_dungeon:   { name: 'Shadow Shard Letter', lines: ['"I bind this shard in the ruins.', 'Darkness shall not return."', '— Mord the Knight'] },
      lich_tower:      { name: 'Void Shard Letter',   lines: ['"Last shard, last hope. I seal it here.', 'Find it, hero, when the time comes."', '— Aria the Last'] },
    };
    const letter = LETTERS[mapName];
    if (!letter) return;
    const count = this.bearerLetters?.length || 1;
    this.showDialogue([
      `📜 ${letter.name}`,
      ...letter.lines,
      `(${count}/7 letters found)`,
    ], null, 'Ancient Hero');
  }

  _drawJournalLetters(con, cx, cy) {
    const LETTERS = [
      { id: 'boss_room',       color: 0xff4444, name: 'Flame Shard Letter',  hero: 'Sera the Warrior' },
      { id: 'pharaoh_chamber', color: 0xff9922, name: 'Sand Shard Letter',   hero: 'Amara the Sage' },
      { id: 'forest_boss',     color: 0xffee00, name: 'Forest Shard Letter', hero: 'Kael the Ranger' },
      { id: 'mountain_cave',   color: 0x44ee44, name: 'Frost Shard Letter',  hero: 'Rina the Brave' },
      { id: 'sea_cave',        color: 0x44aaff, name: 'Sea Shard Letter',    hero: 'Finn of the Sea' },
      { id: 'ruins_dungeon',   color: 0xcc44ff, name: 'Shadow Shard Letter', hero: 'Mord the Knight' },
      { id: 'lich_tower',      color: 0xff88cc, name: 'Void Shard Letter',   hero: 'Aria the Last' },
    ];
    const count = this.bearerLetters?.length || 0;
    con.add(this.add.text(cx, 46, `Crystal Bearer Letters  ${count}/7`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#553311',
    }).setOrigin(0.5));
    con.add(this.add.text(cx, 58, 'Collect them by revisiting boss rooms', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#886644',
    }).setOrigin(0.5));

    LETTERS.forEach((letter, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const lx = 18 + col * 152;
      const ly = 72 + row * 38;
      const collected = this.bearerLetters?.includes(letter.id);
      // Scroll icon
      con.add(this.add.rectangle(lx + 6, ly + 7, 10, 13, collected ? 0xeecc88 : 0x998877).setOrigin(0.5));
      // Color dot on collected scrolls
      if (collected) {
        con.add(this.add.circle(lx + 6, ly + 7, 3, letter.color));
      }
      // Name
      con.add(this.add.text(lx + 14, ly, collected ? letter.name : '???', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: collected ? '#553311' : '#999977',
      }));
      // Hero attribution
      if (collected) {
        con.add(this.add.text(lx + 14, ly + 11, `— ${letter.hero}`, {
          fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#886644',
        }));
      }
    });
  }

  // ─── Phase 28: Fish Tales & Cozy Seasons ──────────────────────────────────

  _recordFishCatch(mapName, fishName) {
    // 5% chance of legendary Starfish on any catch
    if (Math.random() < 0.05 && !(this.caughtFishSpecies?.['Starfish'] > 0)) {
      this.caughtFishSpecies = this.caughtFishSpecies || {};
      this.caughtFishSpecies['Starfish'] = (this.caughtFishSpecies['Starfish'] || 0) + 1;
      this.showNotification('✨ Legendary: Starfish!\nSo rare — even Fin would be amazed!');
      this._checkAchievements();
      return;
    }
    // Map existing fish names to species IDs
    const NAME_MAP = {
      'Minnow': 'Minnow', 'Trout': 'Trout', 'Bass': 'Bass',
      'Golden Carp': 'Golden Carp', 'Mackerel': 'Mackerel',
      'Swordfish': 'Swordfish', 'Pearl Oyster': 'Pearl Oyster',
    };
    const id = NAME_MAP[fishName];
    if (!id) return;
    this.caughtFishSpecies = this.caughtFishSpecies || {};
    const isNew = !(this.caughtFishSpecies[id] > 0);
    this.caughtFishSpecies[id] = (this.caughtFishSpecies[id] || 0) + 1;
    if (isNew) {
      this.showNotification(`📖 New species: ${id}!\nRecorded in your Fish Tales journal.`);
      this._checkAchievements();
    }
  }

  _openDreamSequence() {
    if (this.overlayOpen || this.inDialogue) return;
    this.overlayOpen = true;
    this.dreamsHad = (this.dreamsHad || 0) + 1;
    if (this.sfx) this.sfx.play('spellHeal');

    let dreamIdx = 0;
    if (this.achievements?.lord_dire_vanquished)      dreamIdx = 3;
    else if ((this.rainbowCrystals?.length || 0) >= 7) dreamIdx = 2;
    else if (this._lichTowerUnlocked)                  dreamIdx = 1;

    const DREAMS = [
      { title: 'A Starlit Dream',
        lines: ['Stars whisper of adventures\nyet to come...', 'You feel rested and full of hope.', '(HP +1 until you leave this map)'] },
      { title: "A Hero's Dream",
        lines: ['In the dream, shadows rise\nand fall...', 'But Lizzy stands tall, sword in hand.', '(HP +1 until you leave this map)'] },
      { title: 'A Crystal Dream',
        lines: ['Seven lights orbit you\nin the dream...', 'Each one a memory of courage.', '(HP +1 until you leave this map)'] },
      { title: "Light Bringer's Dream",
        lines: ['Lord Dire fades like\nmorning mist...', 'The world breathes free once more.', '(HP +1 until you leave this map)'] },
    ];
    const dream = DREAMS[dreamIdx];
    const W = 320, H = 202;
    const cx = W / 2, cy = H / 2;
    const con = this.add.container(0, 38).setScrollFactor(0).setDepth(17000);

    con.add(this.add.rectangle(cx, cy, W, H, 0x000011, 0.88));
    for (let i = 0; i < 18; i++) {
      const sx = Math.random() * W, sy = Math.random() * H;
      const star = this.add.circle(sx, sy, Math.random() < 0.3 ? 1.5 : 0.8, 0xffffff, 0.4 + Math.random() * 0.5);
      this.tweens.add({ targets: star, alpha: { from: star.alpha, to: 0.1 },
        duration: 800 + Math.random() * 1200, yoyo: true, repeat: -1 });
      con.add(star);
    }
    con.add(this.add.text(cx, 24, '~ Zzz ~', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#8888cc',
    }).setOrigin(0.5));
    con.add(this.add.text(cx, 40, dream.title, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5));

    let lineIdx = 0;
    const lineText = this.add.text(cx, cy, dream.lines[0], {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ddddff',
      wordWrap: { width: 260 }, align: 'center',
      stroke: '#000011', strokeThickness: 2,
    }).setOrigin(0.5);
    con.add(lineText);

    const advText = this.add.text(cx, H - 18, '[SPACE] Continue', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#8888aa',
      stroke: '#000011', strokeThickness: 2,
    }).setOrigin(0.5);
    con.add(advText);
    this.tweens.add({ targets: advText, alpha: { from: 1, to: 0.2 }, duration: 600, yoyo: true, repeat: -1 });

    const advance = () => {
      lineIdx++;
      if (lineIdx >= dream.lines.length) {
        if (!this._dreamBonusApplied && this.player) {
          this._dreamBonusApplied = true;
          this.player.maxHealth += 1;
          this.player.health = Math.min(this.player.health + 1, this.player.maxHealth);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          // Floating hearts in dream overlay
          for (let _hi = 0; _hi < 7; _hi++) {
            const _ht = this.add.text(
              cx + (Math.random() - 0.5) * 80, cy + 10,
              '♥', { fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ff88aa' }
            ).setScrollFactor(0).setDepth(17001).setOrigin(0.5);
            this.tweens.add({
              targets: _ht,
              y: _ht.y - 40 - Math.random() * 20,
              alpha: 0,
              duration: 900 + Math.random() * 400,
              delay: _hi * 80,
              onComplete: () => _ht.destroy(),
            });
          }
        }
        this.input.keyboard.off('keydown-SPACE', advance);
        this.time.delayedCall(400, () => { con.destroy(); this.overlayOpen = false; });
      } else {
        lineText.setText(dream.lines[lineIdx]);
      }
    };
    this.input.keyboard.on('keydown-SPACE', advance);
  }

  _drawJournalFishTales(con, cx, cy) {
    const SPECIES = ['Minnow', 'Trout', 'Bass', 'Golden Carp', 'Mackerel', 'Swordfish', 'Pearl Oyster', 'Starfish'];
    const COLORS  = [0xaabbcc,  0x88aa66, 0x558844, 0xffcc00,     0x88aacc,   0x4477aa,   0xeeddff,       0xffaacc];
    const RARITY  = ['Common',  'Common', 'Common', 'Uncommon',   'Uncommon', 'Rare',     'Rare',         'Legendary'];
    const SIZE_W  = [10, 12, 14, 13, 13, 16, 12, 10]; // body widths per species

    const caught = Object.keys(this.caughtFishSpecies || {}).length;
    con.add(this.add.text(cx, 46, `Fish Tales  ${caught}/8 species`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#224466', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));
    con.add(this.add.text(cx, 58, `Dreams rested: ${this.dreamsHad || 0}`, {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#557788', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    SPECIES.forEach((sp, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const fx = 14 + col * 152;
      const fy = 70 + row * 30;
      const count = this.caughtFishSpecies?.[sp] || 0;
      const caughtSp = count > 0;
      const bodyColor = caughtSp ? COLORS[i] : 0x888888;
      const alpha = caughtSp ? 0.9 : 0.25;
      const bw = SIZE_W[i];

      // Draw fish or starfish silhouette
      const g = this.add.graphics();
      g.fillStyle(bodyColor, alpha);
      if (sp === 'Starfish') {
        // 5-point star
        g.fillStar(fx + 8, fy + 7, 5, 3, 7);
      } else if (sp === 'Pearl Oyster') {
        // Shell (semicircle + hinge)
        g.fillEllipse(fx + 8, fy + 8, 14, 10);
        g.fillStyle(0xeeddff, alpha * 0.6);
        g.fillCircle(fx + 8, fy + 8, 3);
      } else {
        // Fish body (ellipse) + tail (triangle)
        g.fillEllipse(fx + 8, fy + 7, bw, 8);
        g.fillTriangle(fx, fy + 3, fx, fy + 11, fx - 5, fy + 7); // tail fin
        // Eye dot
        if (caughtSp) {
          g.fillStyle(0xffffff, 0.8);
          g.fillCircle(fx + 10, fy + 5, 1.5);
          g.fillStyle(0x111111, 0.9);
          g.fillCircle(fx + 10, fy + 5, 0.8);
        }
      }
      con.add(g);

      const nameColor = caughtSp ? '#224466' : '#888888';
      con.add(this.add.text(fx + 18, fy, caughtSp ? sp : '???', {
        fontSize: '8px', fontFamily: 'Arial, sans-serif', fontStyle: caughtSp ? 'bold' : 'normal',
        color: nameColor, stroke: '#000000', strokeThickness: 2,
      }));
      const rarityColor = i >= 6 ? '#cc4488' : i >= 4 ? '#4466bb' : '#668866';
      con.add(this.add.text(fx + 18, fy + 10, caughtSp ? `${RARITY[i]}  ×${count}` : RARITY[i], {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: caughtSp ? rarityColor : '#999999',
        stroke: '#000000', strokeThickness: 2,
      }));
    });
  }

  _initSeasons() {
    if (this.mapData?.name !== 'world') return;
    const COLORS = [0xeeffee, 0xffeecc, 0xffddaa, 0xddeeff];
    const idx = this.seasonIndex % 4;
    this._seasonOverlay = this.add.rectangle(160, 101, 320, 202, COLORS[idx], 0.07)
      .setDepth(-5).setScrollFactor(0);
    this._seasonTimer = 0;

    // Night-sky stars — screen-fixed, hidden until night (dayTime >= 0.75 or < 0.12)
    const STAR_POSITIONS = [
      { x: 28, y: 50 }, { x: 72, y: 44 }, { x: 140, y: 52 }, { x: 210, y: 41 },
      { x: 270, y: 56 }, { x: 55, y: 65 }, { x: 185, y: 60 }, { x: 300, y: 48 },
    ];
    this._nightStars = STAR_POSITIONS.map(({ x, y }) => {
      const r = Math.random() < 0.4 ? 1.5 : 1;
      const star = this.add.circle(x, y, r, 0xffffff, 0.85)
        .setDepth(10).setScrollFactor(0).setVisible(false);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.25, to: 0.95 },
        duration: 800 + Math.random() * 1200,
        yoyo: true, repeat: -1,
        delay: Math.random() * 1000,
      });
      return star;
    });
  }

  _updateSeasonTimer(delta) {
    const SEASON_DURATION = 240000; // 4 minutes per season
    this._seasonTimer = (this._seasonTimer || 0) + delta;
    if (this._seasonTimer >= SEASON_DURATION) {
      this._seasonTimer -= SEASON_DURATION;
      this.seasonIndex = (this.seasonIndex + 1) % 4;
      this._changeSeasonTo(this.seasonIndex);
    }
  }

  _changeSeasonTo(idx) {
    const SEASONS = [
      { name: 'Spring', color: 0xeeffee, sparklePos: { x: 450, y: 200 } },
      { name: 'Summer', color: 0xffeecc, sparklePos: { x: 640, y: 350 } },
      { name: 'Autumn', color: 0xffddaa, sparklePos: { x: 320, y: 450 } },
      { name: 'Winter', color: 0xddeeff, sparklePos: { x: 720, y: 160 } },
    ];
    const s = SEASONS[idx];
    if (this._seasonOverlay) {
      this._seasonOverlay.setFillStyle(s.color, 0.07);
    }
    this.showNotification(`The season changes to ${s.name}!`);
    // Reset season NPC shown flags so NPCs comment again next season
    if (this._seasonNpcShown) {
      Object.keys(this._seasonNpcShown).forEach(k => { if (!k.endsWith(`_${s.name}`)) delete this._seasonNpcShown[k]; });
    }
    this._spawnSeasonalSparkle(idx, s);
  }

  _spawnSeasonalSparkle(idx, season) {
    const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const name  = season?.name || SEASON_NAMES[idx % 4];
    const pos   = season?.sparklePos || { x: 400, y: 300 };
    const COLORS = [0xff88bb, 0xffdd22, 0xff7722, 0x88ccff];
    const color  = COLORS[idx % 4];
    if (this.mapData?.name !== 'world') return;
    if (this.seasonTokens?.includes(name)) return;

    // Draw season-specific icon shape
    const g = this.add.graphics().setPosition(pos.x, pos.y).setDepth(500);
    const _drawSeasonShape = () => {
      g.clear();
      g.fillStyle(color, 0.95);
      if (idx % 4 === 0) {
        // Spring: 4-petal flower
        for (let p = 0; p < 4; p++) {
          const a = (p / 4) * Math.PI * 2;
          g.fillCircle(Math.cos(a) * 4, Math.sin(a) * 4, 3);
        }
        g.fillStyle(0xffeeaa, 0.95);
        g.fillCircle(0, 0, 2.5); // center
      } else if (idx % 4 === 1) {
        // Summer: sun circle + 6 short rays
        g.fillCircle(0, 0, 4);
        g.fillStyle(0xffee44, 0.8);
        for (let r = 0; r < 6; r++) {
          const a = (r / 6) * Math.PI * 2;
          g.fillRect(Math.cos(a) * 5 - 1, Math.sin(a) * 5 - 1, 2, 4);
        }
      } else if (idx % 4 === 2) {
        // Autumn: leaf (rounded diamond)
        g.fillTriangle(0, -7, -5, 1, 5, 1);
        g.fillTriangle(0, 7, -5, 1, 5, 1);
        g.fillStyle(0xcc4400, 0.7);
        g.fillRect(-0.5, 2, 1, 5); // stem
      } else {
        // Winter: snowflake (6 lines via thin rects)
        for (let f = 0; f < 6; f++) {
          const a = (f / 6) * Math.PI * 2;
          g.fillRect(Math.cos(a) * 1 - 0.5, Math.sin(a) * 1 - 0.5,
            Math.cos(a) * 6 + 1, Math.sin(a) * 6 + 1);
        }
        g.fillStyle(0xeeeeff, 0.95);
        g.fillCircle(0, 0, 2);
      }
    };
    _drawSeasonShape();
    this.tweens.add({ targets: g, alpha: { from: 0.6, to: 1 }, scaleX: { from: 0.9, to: 1.15 }, scaleY: { from: 0.9, to: 1.15 }, duration: 600, yoyo: true, repeat: -1 });

    const label = this.add.text(pos.x, pos.y - 13, `✦ ${name} Token`, {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(501);

    const zone = this.add.zone(pos.x, pos.y, 20, 20);
    this.physics.add.existing(zone, true);
    const ov = this.physics.add.overlap(this.player, zone, () => {
      if (this.seasonTokens?.includes(name)) return;
      this.physics.world.removeCollider(ov);
      g.destroy(); label.destroy(); zone.destroy();
      this.seasonTokens = this.seasonTokens || [];
      this.seasonTokens.push(name);
      // Burst of season-coloured particles
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dot = this.add.circle(pos.x + Math.cos(a) * 6, pos.y + Math.sin(a) * 6, 2, color, 0.9).setDepth(9999);
        this.tweens.add({ targets: dot, x: dot.x + Math.cos(a) * 18, y: dot.y + Math.sin(a) * 18, alpha: 0, duration: 500, onComplete: () => dot.destroy() });
      }
      if (this.sfx) this.sfx.play('crystalCollect');
      this.showNotification(`✦ ${name} Token! (${this.seasonTokens.length}/4)`);
      this._checkAchievements();
    });
  }

  // ─── Phase 29: Cozy Corners ────────────────────────────────────────────────

  _openDecorShop() {
    if (this.overlayOpen || this.inDialogue) return;
    this.overlayOpen = true;

    const ITEMS = [
      { id: 'flower_vase',  name: 'Flower Vase',   price: 15, desc: 'A pretty vase for the windowsill' },
      { id: 'fancy_rug',    name: 'Fancy Rug',      price: 25, desc: 'A cozy rug for the floor' },
      { id: 'potted_plant', name: 'Potted Plant',   price: 20, desc: 'A leafy green corner plant' },
      { id: 'wall_painting',name: 'Wall Painting',  price: 40, desc: 'A lovely landscape painting' },
      { id: 'pet_bed',      name: 'Pet Bed',        price: 25, desc: 'A cozy bed for your companion',
        requires: () => !!this.petType },
      { id: 'music_box',    name: 'Music Box',      price: 60, desc: 'Plays magical melodies at home' },
      // House themes
      { id: 'theme_cozy',   name: 'Cozy Theme',     price: 10, desc: 'Warm amber walls', isTheme: true },
      { id: 'theme_nature', name: 'Nature Theme',   price: 10, desc: 'Soft sage green walls', isTheme: true },
      { id: 'theme_royal',  name: 'Royal Theme',    price: 10, desc: 'Lavender purple walls', isTheme: true },
    ];

    const W = 320, H = 202, cx = W / 2, cy = H / 2;
    const con = this.add.container(0, 38).setScrollFactor(0).setDepth(17000);
    con.add(this.add.rectangle(cx, cy, W, H, 0x000000, 0.75));
    con.add(this.add.rectangle(cx, cy, 220, 180, 0x3a1a0a));
    con.add(this.add.rectangle(cx, cy, 216, 176, 0x1a0a00));
    con.add(this.add.text(cx, 12, "Clara's Craft Shop", {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffdd88',
      stroke: '#221100', strokeThickness: 3,
    }).setOrigin(0.5));

    const visibleItems = ITEMS.filter(it => !it.requires || it.requires());
    let selIdx = 0;
    let itemTexts = [];

    const render = () => {
      itemTexts.forEach(t => t.destroy());
      itemTexts = [];
      visibleItems.forEach((item, i) => {
        const iy = 30 + i * 16;
        const owned = item.isTheme
          ? (this.houseTheme === item.id.replace('theme_', ''))
          : !!this.houseDecor?.[item.id];
        const canAfford = this.gold >= item.price;
        const color = i === selIdx ? '#ffdd44' : (owned ? '#88cc88' : (canAfford ? '#ddccaa' : '#887766'));
        const prefix = i === selIdx ? '▶ ' : '  ';
        const suffix = owned ? ' ✓' : ` ${item.price}g`;
        const t = this.add.text(cx - 96, iy, `${prefix}${item.name}${suffix}`, {
          fontSize: '9px', fontFamily: 'Arial, sans-serif', color,
          stroke: '#000000', strokeThickness: 2,
        });
        itemTexts.push(t);
        con.add(t);
      });
      // Description
      const sel = visibleItems[selIdx];
      if (sel) {
        const desc = this.add.text(cx, 170, sel.desc, {
          fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ccbb99',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        itemTexts.push(desc);
        con.add(desc);
      }
      // Gold display
      const goldT = this.add.text(cx + 96, 170, `Gold: ${this.gold}g`, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ffdd44',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0.5);
      itemTexts.push(goldT);
      con.add(goldT);
    };

    render();
    con.add(this.add.text(cx, 185, '[↑↓] Browse  [SPACE] Buy  [ESC] Close', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#99bb88', fontStyle: 'normal',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    const onKey = (e) => {
      const sel = visibleItems[selIdx];
      if (e.keyCode === 38) { selIdx = (selIdx - 1 + visibleItems.length) % visibleItems.length; render(); }
      else if (e.keyCode === 40) { selIdx = (selIdx + 1) % visibleItems.length; render(); }
      else if (e.keyCode === 32 && sel) {
        // Buy
        const owned = sel.isTheme
          ? (this.houseTheme === sel.id.replace('theme_', ''))
          : !!this.houseDecor?.[sel.id];
        if (owned) { this.showNotification('Already owned!'); return; }
        if (this.gold < sel.price) { this.showNotification("Not enough gold!"); return; }
        this.addGold(-sel.price);
        this.sfx.play('select');
        if (sel.isTheme) {
          this.houseTheme = sel.id.replace('theme_', '');
        } else {
          this.houseDecor = this.houseDecor || {};
          this.houseDecor[sel.id] = true;
          // Quest tracking
          const ownedCount = Object.keys(this.houseDecor).length;
          this.questManager.trackEvent?.('decor_buy', { target: 'any' });
          this.updateQuestTracker();
          this._checkAchievements();
        }
        this.showNotification(`Bought: ${sel.name}!`);
        render();
      } else if (e.keyCode === 27) {
        this.input.keyboard.off('keydown', onKey);
        con.destroy();
        this.overlayOpen = false;
      }
    };
    this.input.keyboard.on('keydown', onKey);
  }

  _openMusicBox() {
    if (this.overlayOpen || this.inDialogue) return;
    this.overlayOpen = true;
    if (this.sfx) this.sfx.play('candleLight');

    const MELODIES = [
      { name: "Lizzy's Lullaby", sfx: 'melodyLullaby',  unlock: () => true },
      { name: 'Forest Song',     sfx: 'melodyForest',   unlock: () => this.questManager.getQuest('clear_forest')?.state === 'completed' },
      { name: 'Crystal Chime',   sfx: 'melodyCrystal',  unlock: () => (this.rainbowCrystals?.length || 0) >= 1 },
      { name: 'Victory Bells',   sfx: 'melodyVictory',  unlock: () => !!this.achievements?.lord_dire_vanquished },
    ];

    const W = 320, H = 202, cx = W / 2, cy = H / 2;
    const con = this.add.container(0, 38).setScrollFactor(0).setDepth(17000);
    con.add(this.add.rectangle(cx, cy, W, H, 0x000011, 0.8));
    con.add(this.add.rectangle(cx, cy, 180, 120, 0x2a1500));
    con.add(this.add.rectangle(cx, cy, 176, 116, 0x1a0e00));
    con.add(this.add.text(cx, 56, '♪ Music Box ♪', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffdd88',
    }).setOrigin(0.5));

    let selIdx = this.musicMelody || 0;
    let melTexts = [];

    const render = () => {
      melTexts.forEach(t => t.destroy());
      melTexts = [];
      MELODIES.forEach((mel, i) => {
        const my = 80 + i * 16;
        const unlocked = mel.unlock();
        const isSel = i === selIdx;
        const color = !unlocked ? '#665544' : isSel ? '#ffdd44' : '#ddccaa';
        const prefix = isSel ? '▶ ' : '  ';
        const lock = unlocked ? '' : ' 🔒';
        const t = this.add.text(cx - 76, my, `${prefix}${mel.name}${lock}`, {
          fontSize: '9px', fontFamily: 'Arial, sans-serif', color,
        });
        melTexts.push(t); con.add(t);
      });
    };
    render();
    con.add(this.add.text(cx, 152, '[↑↓] Choose  [SPACE] Play  [ESC] Close', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#665533', fontStyle: 'normal',
    }).setOrigin(0.5));

    const onKey = (e) => {
      if (e.keyCode === 38) { selIdx = (selIdx - 1 + 4) % 4; render(); }
      else if (e.keyCode === 40) { selIdx = (selIdx + 1) % 4; render(); }
      else if (e.keyCode === 32) {
        const mel = MELODIES[selIdx];
        if (!mel.unlock()) { this.showNotification('Not yet unlocked!'); return; }
        this.musicMelody = selIdx;
        this.sfx.play(mel.sfx);
        this.showNotification(`♪ Playing: ${mel.name}!`);
        // Cozy buff — +10% speed + heart particles for 60s
        this._cozyBuffTimer = 60000;
        if (!this._cozyBuffApplied && this.player) {
          this._cozyBuffApplied = true;
          this._cozyBuffOrigSpeed = this.player.speed;
          this.player.speed = Math.round(this.player.speed * 1.1);
          for (let _ci = 0; _ci < 10; _ci++) {
            this.time.delayedCall(_ci * 100, () => {
              if (!this.player) return;
              const _px = this.player.x + (Math.random() - 0.5) * 28;
              const _py = this.player.y + (Math.random() - 0.5) * 20;
              if (_ci % 3 === 0) {
                const _ht = this.add.text(_px, _py, '♥', { fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ff88cc' }).setDepth(1501);
                this.tweens.add({ targets: _ht, alpha: 0, y: _py - 18, duration: 900, onComplete: () => _ht.destroy() });
              } else {
                const _sp = this.add.circle(_px, _py, 2, 0xffdd88, 0.9).setDepth(1500);
                this.tweens.add({ targets: _sp, alpha: 0, y: _py - 14, duration: 700, onComplete: () => _sp.destroy() });
              }
            });
          }
        }
      } else if (e.keyCode === 27) {
        this.input.keyboard.off('keydown', onKey);
        con.destroy();
        this.overlayOpen = false;
      }
    };
    this.input.keyboard.on('keydown', onKey);
  }

  _applyHouseTheme() {
    const THEMES = {
      cozy:   '#fff3e0',
      nature: '#e8f5e0',
      royal:  '#f3e0ff',
    };
    if (this.houseTheme && THEMES[this.houseTheme]) {
      this.cameras.main.setBackgroundColor(THEMES[this.houseTheme]);
    }
  }

  _calcCozyScore() {
    let score = 0;
    const d = this.houseDecor || {};
    // Each furniture item = 1 point (max 6)
    score += Object.keys(d).length;
    // Garden flowers = 1 point
    if (Object.keys(this.gardenFlowers || {}).length > 0) score += 1;
    // House candles = 1 point
    if (this.houseCandles) score += 1;
    // Pet = 1 point
    if (this.petType) score += 1;
    // House theme = 1 point
    if (this.houseTheme) score += 1;
    return Math.min(5, Math.floor(score / 2));
  }

  // ─── Phase 30: Grand Festival ──────────────────────────────────────────────

  _spawnFestivalZone() {
    // Festival area centred at (752, 210) on the world map
    const fx = 752, fy = 210;

    // Give flower garland hat on first ever festival visit
    const garlandKey = 'lizzy-festival-garland';
    if (!localStorage.getItem(garlandKey)) {
      localStorage.setItem(garlandKey, '1');
      this.time.delayedCall(600, () => {
        this._unlockWardrobeItem('hat-flower-garland', 'Flower Garland');
        this.showNotification('Welcome to the Grand Festival! ♥');
      });
    }

    // Banner pole + sign
    this.add.rectangle(fx, fy - 18, 4, 28, 0x885522).setDepth(50);
    this.add.rectangle(fx, fy - 30, 40, 10, 0xff6699).setDepth(51);
    this.add.text(fx, fy - 30, 'FESTIVAL!', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#440022', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(52);

    // Bunting string (coloured dots)
    const buntingColors = [0xff4466, 0xffcc00, 0x44dd88, 0x4488ff, 0xcc44ff];
    for (let i = 0; i < 7; i++) {
      this.add.circle(fx - 30 + i * 10, fy - 22 + Math.sin(i) * 3, 3,
        buntingColors[i % buntingColors.length], 0.85).setDepth(51);
    }

    // Balloons
    const balloonData = [
      { x: fx - 20, y: fy - 36, color: 0xff6699 },
      { x: fx + 22, y: fy - 34, color: 0xffcc44 },
      { x: fx + 10, y: fy - 38, color: 0x88ddff },
    ];
    for (const b of balloonData) {
      const balloon = this.add.ellipse(b.x, b.y, 10, 12, b.color, 0.9).setDepth(52);
      this.add.line(0, 0, b.x, b.y + 6, b.x - 2, b.y + 14, 0x888888, 0.6).setDepth(51);
      this.tweens.add({ targets: balloon, y: b.y - 3, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Flower Stall (E key, no NPC needed) ──
    const flowerX = fx - 22, flowerY = fy + 8;
    this.add.rectangle(flowerX, flowerY, 20, 14, 0x88cc44).setDepth(50);
    this.add.text(flowerX, flowerY - 10, '✿ Flowers', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#ffeeaa', stroke: '#331100', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(51);
    const flowerLabel = this.add.text(flowerX, flowerY - 18, '[E] Donate flower',
      { fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(9999).setAlpha(0);
    this._festivalFlowerZone = { x: flowerX, y: flowerY };
    this._festivalStallLabels.push({
      x: flowerX, y: flowerY, label: flowerLabel,
      get done() { return false; }, // checked inline
      onInteract: () => {
        if (this.festivalStalls.includes('flowers')) {
          this.showNotification('You already donated a flower here!');
          return;
        }
        if (!this._hasFlowerToGive) {
          this.showNotification('You need a flower to donate.\nPick one from your garden!');
          return;
        }
        this._hasFlowerToGive = false;
        this.festivalStalls.push('flowers');
        this.sfx.play('rainbowBurst');
        this.showNotification('✿ Flower donated! The stall looks beautiful!');
        this._checkFestivalStalls();
      },
    });

    // ── Dance Stage ──
    const danceX = fx + 8, danceY = fy + 20;
    this.add.rectangle(danceX, danceY, 30, 18, 0x6644aa, 0.6).setDepth(49);
    const danceLabel = this.add.text(danceX, danceY - 14, '[Z] Dance!',
      { fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ffddff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(9999).setAlpha(0);
    this._festivalDanceZone = { x: danceX, y: danceY, label: danceLabel };
    // show dance label via update() check
    this._festivalStallLabels.push({
      x: danceX, y: danceY, label: danceLabel,
      get done() { return false; },
      onInteract: () => {}, // handled via danceKey in update()
    });

    // Twinkle stars around the zone
    for (let i = 0; i < 5; i++) {
      const sx = fx - 35 + Math.random() * 90;
      const sy = fy - 10 + Math.random() * 40;
      const star = this.add.circle(sx, sy, 1.5, 0xffffff, 0.6).setDepth(52);
      this.tweens.add({ targets: star, alpha: { from: 0.1, to: 0.9 }, duration: 600 + Math.random() * 800, yoyo: true, repeat: -1, delay: Math.random() * 600 });
    }

    // ── Festival Lanterns (visible at night when festival complete) ──
    const lanternPositions = [
      { x: fx - 38, y: fy - 8 }, { x: fx + 42, y: fy - 6 },
      { x: fx - 22, y: fy - 22 }, { x: fx + 26, y: fy - 20 },
      { x: fx,      y: fy - 30 }, { x: fx - 46, y: fy + 10 },
    ];
    const lanternColors = [0xff6644, 0xffcc22, 0xff88cc, 0x88ddff, 0xaaff88, 0xffaa44];
    this._festivalLanterns = lanternPositions.map(({ x, y }, i) => {
      const col = lanternColors[i % lanternColors.length];
      // Lantern body
      const body = this.add.rectangle(x, y, 6, 8, col, 0.9).setDepth(55).setVisible(false);
      // Glow halo
      const glow = this.add.circle(x, y, 9, col, 0.18).setDepth(54).setVisible(false);
      // String
      const string = this.add.rectangle(x, y - 7, 1, 6, 0xdddddd, 0.5).setDepth(54).setVisible(false);
      // Gentle float tween
      this.tweens.add({ targets: [body, glow, string], y: `+=${2 + Math.random() * 2}`, duration: 1200 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 800 });
      return { body, glow, string };
    });
  }

  _doGroupDance() {
    this._doDance();
    // Make nearby festival NPCs hop too
    if (!this.npcs) return;
    this.npcs.getChildren().forEach(npc => {
      if (!['cook_edna', 'bard_pip'].includes(npc.npcId)) return;
      this.tweens.add({
        targets: npc,
        y: npc.y - 6,
        duration: 120,
        yoyo: true,
        repeat: 3,
        ease: 'Power2',
      });
      npc.setTint(0xffffff);
      this.time.delayedCall(700, () => {
        npc.setTint(npc.npcId === 'cook_edna' ? 0xffcc88 : 0xaaddff);
      });
    });
    // Rainbow sparkle burst at player position
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const col = [0xff4466, 0xffaa00, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc, 0xffffff][i];
      const spark = this.add.circle(this.player.x, this.player.y, 3, col, 0.9).setDepth(1500);
      this.tweens.add({
        targets: spark,
        x: this.player.x + Math.cos(angle) * 32,
        y: this.player.y + Math.sin(angle) * 32,
        alpha: 0, duration: 600, ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  _checkFestivalStalls() {
    const allDone = ['flowers', 'cake', 'dance'].every(s => this.festivalStalls.includes(s));
    if (allDone && !this.festivalComplete) {
      this.festivalComplete = true;
      this.time.delayedCall(500, () => this._triggerFestivalFireworks());
    }
  }

  _triggerFestivalFireworks() {
    if (this.sfx) this.sfx.play('festivalFanfare');
    this.showNotification('★ Grand Festival Complete! ★\nThank you, Light Bringer!');

    const COLORS = [0xff4466, 0xffcc00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc, 0xffee88, 0xffffff];
    const cx = this.cameras.main.scrollX + 160;
    const baseY = this.cameras.main.scrollY + 200;

    for (let r = 0; r < 8; r++) {
      this.time.delayedCall(r * 700, () => {
        if (this.sfx) this.sfx.play('fireworkBang');
        const launchX = cx + (Math.random() - 0.5) * 120;
        const peakY = baseY - 80 - Math.random() * 60;
        const burstColor = COLORS[r % COLORS.length];

        // Rocket trail going up
        const rocket = this.add.circle(launchX, baseY, 2, 0xffffff, 0.9).setDepth(2000);
        this.tweens.add({
          targets: rocket, y: peakY, duration: 350, ease: 'Power2',
          onComplete: () => {
            rocket.destroy();
            // Burst: 10 particles radiate outward
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2;
              const p = this.add.circle(launchX, peakY, 2.5, burstColor, 0.9).setDepth(2000);
              this.tweens.add({
                targets: p,
                x: launchX + Math.cos(angle) * (30 + Math.random() * 20),
                y: peakY + Math.sin(angle) * (30 + Math.random() * 20),
                alpha: 0, duration: 600, ease: 'Power1',
                onComplete: () => p.destroy(),
              });
            }
          },
        });
      });
    }

    // Award achievement + dress after fireworks
    this.time.delayedCall(6000, () => {
      this._checkAchievements();
      this._unlockWardrobeItem('outfit-festival', 'Festival Dress');
    });
  }

  // ─── Phase 31: Wishes & Wonders ────────────────────────────────────────────

  _spawnWishingWell() {
    // Wishing well at (660, 232) on the world map
    const wx = 660, wy = 232;

    // Well structure: stone rim + wooden beam + bucket
    const rim = this.add.circle(wx, wy + 2, 10, 0x888888, 1).setDepth(60);
    const rimInner = this.add.circle(wx, wy + 2, 7, 0x222244, 1).setDepth(61);
    const postL = this.add.rectangle(wx - 8, wy - 8, 2, 12, 0x885533).setDepth(62);
    const postR = this.add.rectangle(wx + 8, wy - 8, 2, 12, 0x885533).setDepth(62);
    const beam  = this.add.rectangle(wx, wy - 14, 18, 2, 0x664422).setDepth(63);
    const bucket = this.add.rectangle(wx, wy - 9, 4, 5, 0x886644).setDepth(64);

    // Shimmer particles around the well
    this.tweens.add({ targets: [rim, rimInner], alpha: { from: 0.8, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });

    // Interaction zone
    this._wishingWellZone = { x: wx, y: wy };

    // [E] label
    this._wishingWellLabel = this.add.text(wx, wy - 24, '[E] Make a Wish', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif',
      color: '#aaccff', stroke: '#000033', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000).setAlpha(0);

    // Occasional coin sparkle rising from the well
    this.time.addEvent({ delay: 2500, loop: true, callback: () => {
      if (!this.player || this.mapData?.name !== 'world') return;
      const sparkle = this.add.circle(wx + (Math.random() - 0.5) * 8, wy, 1.5, 0xffee44, 0.8).setDepth(65);
      this.tweens.add({
        targets: sparkle, y: wy - 18, alpha: 0, duration: 1000,
        onComplete: () => sparkle.destroy(),
      });
    }});
  }

  _openWishMenu() {
    if (this.inDialogue || this.overlayOpen) return;
    if (this.gold < 5) {
      this.showDialogue(['The wishing well shimmers\nwith ancient magic...',
        'You need at least 5g\nto make a wish!'], null, null, null);
      return;
    }

    this.showDialogueWithChoice(
      ['The wishing well shimmers!\nToss a coin and make a wish... (5g)'],
      [
        { text: 'Gold Shower — +50g!',       callback: () => this._grantWish('gold') },
        { text: "Heart's Wish — Full HP!",   callback: () => this._grantWish('heal') },
        { text: 'Lucky Star — 2× gold 5min', callback: () => this._grantWish('lucky') },
      ],
      'Wishing Well', null
    );
  }

  _grantWish(type) {
    // Deduct wish cost directly (bypass lucky star doubling for wish costs)
    this.gold -= 5;
    this.events.emit('gold-changed', this.gold);
    if (this.sfx) this.sfx.play('coinPlunk');
    this.wishesGranted = (this.wishesGranted || 0) + 1;

    // Coin-splash visual at the well
    if (this._wishingWellZone) {
      const _wx = this._wishingWellZone.x;
      const _wy = this._wishingWellZone.y;
      // Ripple rings expanding outward
      for (let _ri = 0; _ri < 3; _ri++) {
        this.time.delayedCall(_ri * 120, () => {
          const _ring = this.add.circle(_wx, _wy, 4, 0x66aaff, 0.45).setDepth(66);
          this.tweens.add({ targets: _ring, scaleX: 6, scaleY: 2, alpha: 0, duration: 500 + _ri * 80, onComplete: () => _ring.destroy() });
        });
      }
      // Gold coin arcs flying up from well
      const _wishColors = { gold: 0xffee22, heal: 0xff88aa, lucky: 0xffdd44 };
      const _coinCol = _wishColors[type] || 0xffee22;
      for (let _ci = 0; _ci < 7; _ci++) {
        const _angle = -Math.PI * 0.8 + (Math.PI * 0.6 / 6) * _ci;
        const _dist = 18 + Math.random() * 16;
        const _coin = this.add.circle(_wx, _wy, 2.5, _coinCol, 0.9).setDepth(67);
        this.tweens.add({
          targets: _coin,
          x: _wx + Math.cos(_angle) * _dist,
          y: _wy + Math.sin(_angle) * _dist - 12,
          alpha: 0, scaleX: 0, scaleY: 0,
          duration: 550 + Math.random() * 200,
          ease: 'Power2',
          onComplete: () => _coin.destroy(),
        });
      }
    }

    this.time.delayedCall(400, () => {
      if (this.sfx) this.sfx.play('wishSpark');
      if (type === 'gold') {
        // Gold wish grants 50g directly (bypass lucky star for wish rewards)
        this.gold += 50;
        this.events.emit('gold-changed', this.gold);
        this._totalGoldEarned = (this._totalGoldEarned || 0) + 50;
        this.showNotification('✨ Gold Shower! +50g!');
      } else if (type === 'heal') {
        this.player.health = this.player.maxHealth;
        this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
        this.showNotification("✨ Heart's Wish! Full HP!");
      } else if (type === 'lucky') {
        this._luckyStarActive = true;
        this._luckyStarTimer  = 5 * 60 * 1000; // 5 minutes
        // Create orbiting star
        if (this._luckyStarOrb) this._luckyStarOrb.destroy();
        this._luckyStarOrb = this.add.text(
          this.player.x, this.player.y - 12, '★',
          { fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ffee44', stroke: '#884400', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(1600);
        this.tweens.add({ targets: this._luckyStarOrb, alpha: { from: 0.6, to: 1 }, duration: 700, yoyo: true, repeat: -1 });
        this.showNotification('✨ Lucky Star! 2× gold for 5 minutes!');
      }

      // Celebratory sparkles at the well
      if (this._wishingWellZone) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const sp = this.add.circle(
            this._wishingWellZone.x + Math.cos(angle) * 12,
            this._wishingWellZone.y + Math.sin(angle) * 8,
            2, 0xffee44, 0.9
          ).setDepth(500);
          this.tweens.add({
            targets: sp, y: sp.y - 20, alpha: 0, duration: 700,
            onComplete: () => sp.destroy(),
          });
        }
      }
    });
  }

  _scheduleFireflySpawns() {
    this._fireflySpawnEvent = this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => {
        if (this.mapData?.name !== 'world') return;
        if ((this._fireflies || []).length < 4) {
          this._spawnFirefly();
        }
      },
    });
    // Spawn one immediately to welcome the player
    this.time.delayedCall(3000, () => this._spawnFirefly());
  }

  _spawnFirefly() {
    if (!this.player || this.mapData?.name !== 'world') return;
    // Spawn near the player but offset randomly
    const px = this.player.x + (Math.random() - 0.5) * 200;
    const py = this.player.y + (Math.random() - 0.5) * 150;

    const glow = this.add.circle(px, py, 3, 0xffff88, 0.8).setDepth(400);
    const twinkle = this.add.circle(px, py, 1.5, 0xffffff, 0.9).setDepth(401);

    // Gentle bob
    this.tweens.add({ targets: glow, y: py - 8, alpha: { from: 0.5, to: 0.95 }, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: twinkle, y: py - 8, alpha: { from: 0.3, to: 1 }, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, delay: 200 });

    const ff = { x: px, y: py, glow, twinkle };
    this._fireflies.push(ff);

    // Auto-despawn after 30s if not caught
    this.time.delayedCall(30000, () => {
      if (!ff.caught) {
        ff.glow?.destroy();
        ff.twinkle?.destroy();
        this._fireflies = this._fireflies.filter(f => f !== ff);
      }
    });
  }

  _tryCatchFirefly() {
    if (!this.player || !this._fireflies || this._fireflies.length === 0) return;
    const catchRadius = 28;
    for (const ff of this._fireflies) {
      if (ff.caught) continue;
      const dx = this.player.x - ff.x;
      const dy = this.player.y - ff.y;
      if (Math.sqrt(dx * dx + dy * dy) <= catchRadius) {
        ff.caught = true;
        ff.glow?.destroy();
        ff.twinkle?.destroy();
        this._fireflies = this._fireflies.filter(f => f !== ff);

        this.firefliesCaught = (this.firefliesCaught || 0) + 1;
        if (this.sfx) this.sfx.play('butterflyCatch');
        this.showNotification(`✨ Firefly caught! (${this.firefliesCaught}/5)`);

        // Sparkle burst at catch point
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const sp = this.add.circle(ff.x + Math.cos(angle) * 8, ff.y + Math.sin(angle) * 8, 2, 0xffff88, 0.9).setDepth(500);
          this.tweens.add({ targets: sp, y: sp.y - 12, alpha: 0, duration: 500, onComplete: () => sp.destroy() });
        }

        this._checkAchievements();
        return; // Only catch one at a time
      }
    }
  }

  // ─── Pet Bond Milestones ─────────────────────────────────────────────────────

  _showPetMilestone(msg, color) {
    if (!this.pet) return;
    // Speech-bubble style text above pet
    const bubble = this.add.text(this.pet.x, this.pet.y - 28, msg, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      backgroundColor: `#${color.toString(16).padStart(6, '0')}cc`,
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(10010);
    // Star burst
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dot = this.add.circle(this.pet.x + Math.cos(a) * 8, this.pet.y + Math.sin(a) * 8, 3, color, 0.9).setDepth(10009);
      this.tweens.add({ targets: dot, x: dot.x + Math.cos(a) * 16, y: dot.y + Math.sin(a) * 16, alpha: 0, duration: 700, onComplete: () => dot.destroy() });
    }
    this.tweens.add({ targets: bubble, y: bubble.y - 12, alpha: 0, duration: 2000, delay: 800, onComplete: () => bubble.destroy() });
    if (this.sfx) this.sfx.play('levelUp');
  }

  // ─── Pet Petting Interaction ────────────────────────────────────────────────

  _petThePet() {
    this.petAffection = Math.min(50, (this.petAffection || 0) + 3);
    this._petPettingCooldown = 45000;
    if (!this.pet) return;
    // Heart burst particles
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 70, () => {
        if (!this.pet) return;
        const angle = (Math.PI * 2 / 5) * i;
        const hx = this.pet.x + Math.cos(angle) * 9;
        const hy = this.pet.y + Math.sin(angle) * 9 - 6;
        const h = this.add.text(hx, hy, '♥', {
          fontSize: '10px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
          color: '#ff44aa', stroke: '#000000', strokeThickness: 2
        }).setDepth(10001).setOrigin(0.5);
        this.tweens.add({ targets: h, y: hy - 16, alpha: 0, duration: 650, onComplete: () => h.destroy() });
      });
    }
    // Happy bounce-wiggle on the pet sprite
    if (this.pet) {
      this.tweens.add({
        targets: this.pet,
        scaleX: 1.35, scaleY: 0.75,
        duration: 80, yoyo: true, repeat: 3, ease: 'Power2',
        onComplete: () => {
          if (this.pet) { this.pet.scaleX = 1; this.pet.scaleY = 1; }
        },
      });
      // Brief rainbow tint flash
      const _tintPet = () => {
        const _tints = [0xff88cc, 0xffdd44, 0x88ffcc, 0xaaddff, 0xffffff];
        let _ti = 0;
        const _nextTint = () => {
          if (!this.pet || _ti >= _tints.length) { if (this.pet) this.pet.clearTint(); return; }
          this.pet.setTint(_tints[_ti++]);
          this.time.delayedCall(80, _nextTint);
        };
        _nextTint();
      };
      _tintPet();
    }
    const petLabel = this.petName || 'your pet';
    this.showNotification(`♥ ${petLabel} loves you!`);
    if (this.sfx) this.sfx.play('levelUp');
  }

  // ─── Phase 25: Pet Max-Bond Glow ───────────────────────────────────────────

  _triggerPetMaxBond() {
    this._petMaxBondShown = true;
    if (this.sfx) this.sfx.play('rainbowBurst');

    const petName = this.petName || { slime: 'Slimey', bat: 'Batty', mushroom: 'Spore', fairy: 'Glimmer' }[this.petType] || 'your pet';

    // Add persistent golden glow circle on pet
    if (this.pet && this.pet.body1) {
      const glow = this.add.circle(this.pet.x, this.pet.y, 10, 0xffdd44, 0.3);
      glow.setDepth(this.pet.depth - 1);
      this._petGlowCircle = glow;
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.15, to: 0.45 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Rainbow burst particles around pet
    if (this.pet) {
      const COLORS = [0xff4444, 0xff9922, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc];
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const p = this.add.circle(this.pet.x, this.pet.y, 2, COLORS[i % 7], 0.9);
        p.setDepth(9999);
        this.tweens.add({
          targets: p,
          x: this.pet.x + Math.cos(angle) * 28,
          y: this.pet.y + Math.sin(angle) * 28,
          alpha: 0,
          duration: 600,
          delay: i * 30,
          onComplete: () => p.destroy(),
        });
      }
    }

    this.time.delayedCall(300, () => {
      this.showDialogue([
        `✨ ${petName} glows with rainbow light!`,
        `A bond stronger than magic...\nTrue friendship!`,
      ], null, petName, null);
    });
  }

  // ─── Phase 25: Adventure Journal ───────────────────────────────────────────

  _openAdventureJournal() {
    if (this.overlayOpen || this.inDialogue) return;
    if (this.sfx) this.sfx.play('journalOpen');

    this.overlayOpen = true;
    const scene = this;

    // Constants
    const W = 320, H = 202;
    const cx = W / 2, cy = H / 2;
    const PAGES = ['Adventure', 'Nature', 'Friends', 'Farm', 'Achievements', 'Letters', 'Fish Tales'];
    let pageIdx = 0;

    // ── Container
    const con = this.add.container(0, 38).setScrollFactor(0).setDepth(17000);
    const bg    = this.add.rectangle(cx, cy, W, H, 0xf5e6c8, 0.97);
    const border = this.add.rectangle(cx, cy, W, H).setStrokeStyle(3, 0x886644);
    con.add([bg, border]);

    // Spine line
    con.add(this.add.rectangle(cx, cy, 2, H, 0xcc9955));

    // Title bar
    const titleBar = this.add.rectangle(cx, 12, W, 24, 0x664422);
    const titleTxt = this.add.text(cx, 12, '📖 Adventure Journal', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffeecc',
      stroke: '#331100', strokeThickness: 3,
    }).setOrigin(0.5);
    con.add([titleBar, titleTxt]);

    // Page indicator
    const pageDots = this.add.text(cx, H - 8, '', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#664422',
    }).setOrigin(0.5, 1);
    const hint = this.add.text(cx, H - 0, '◄ ► change page   ESC close', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#aa8855',
      stroke: '#110800', strokeThickness: 2,
    }).setOrigin(0.5, 1);
    con.add([pageDots, hint]);

    // Content container (swapped on page change)
    let contentCon = this.add.container(0, 0);
    con.add(contentCon);

    const drawPage = (idx) => {
      contentCon.destroy();
      contentCon = this.add.container(0, 0);
      con.add(contentCon);

      pageDots.setText(PAGES.map((_, i) => i === idx ? '●' : '○').join(' '));

      const pageTitle = this.add.text(cx, 30, PAGES[idx], {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#553311', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      contentCon.add(pageTitle);

      switch (idx) {
        case 0: this._drawJournalAdventure(contentCon, cx, cy); break;
        case 1: this._drawJournalNature(contentCon, cx, cy);    break;
        case 2: this._drawJournalFriends(contentCon, cx, cy);   break;
        case 3: this._drawJournalFarm(contentCon, cx, cy);      break;
        case 4: this._drawJournalAchievements(contentCon, cx, cy); break;
        case 5: this._drawJournalLetters(contentCon, cx, cy);       break;
        case 6: this._drawJournalFishTales(contentCon, cx, cy);    break;
      }
    };

    drawPage(0);

    const onKey = (e) => {
      if (e.keyCode === 39 || e.keyCode === 68) { // RIGHT
        pageIdx = (pageIdx + 1) % PAGES.length;
        drawPage(pageIdx);
      } else if (e.keyCode === 37 || e.keyCode === 65) { // LEFT
        pageIdx = (pageIdx - 1 + PAGES.length) % PAGES.length;
        drawPage(pageIdx);
      } else if (e.keyCode === 27) { // ESC
        this.input.keyboard.off('keydown', onKey);
        con.destroy();
        scene.overlayOpen = false;
      }
    };
    this.input.keyboard.on('keydown', onKey);
  }

  _drawJournalAdventure(con, cx, cy) {
    const level   = this.level || 1;
    const gold    = this.gold  || 0;
    const kills   = Object.values(this.bestiary || {}).reduce((a, b) => a + b, 0);
    const quests  = Object.values(this.questManager?.quests || {}).filter(q => q.state === 'completed').length;

    // Drawn sword icon
    const g = this.add.graphics();
    g.fillStyle(0x888888, 1);
    g.fillRect(cx - 70, 50, 3, 18);
    g.fillStyle(0xddbb44, 1);
    g.fillRect(cx - 76, 50, 15, 3);
    g.fillStyle(0x886633, 1);
    g.fillRect(cx - 70, 68, 3, 8);
    con.add(g);

    const direDone = !!(this.achievements && this.achievements['lord_dire_vanquished']);
    const lines = [
      `Level: ${level}`,
      `Gold: ${gold}g`,
      `Enemies defeated: ${kills}`,
      `Quests done: ${quests}`,
      `Star Fragments: ${this.starFragments || 0}/3`,
      `Maps visited: ${Object.keys(this.visitedChunks || {}).length}`,
      `Lord Dire: ${direDone ? 'VANQUISHED ✓' : 'at large...'}`,
    ];
    lines.forEach((line, i) => {
      con.add(this.add.text(cx - 60, 50 + i * 16, line, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#332211',
      }));
    });
  }

  _drawJournalNature(con, cx, cy) {
    const bf = this.caughtButterflies || {};
    const BF_COLORS = { yellow: '#ddbb00', green: '#44bb44', blue: '#4488ff', orange: '#ff8833' };
    let by = 50;

    con.add(this.add.text(cx - 80, by, '🦋 Butterfly Journal:', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#336633',
    }));
    by += 14;

    Object.entries(BF_COLORS).forEach(([type, color]) => {
      const count = bf[type] || 0;
      const dot = this.add.circle(cx - 74, by + 4, 4);
      dot.fillColor = parseInt(color.replace('#', '0x'));
      dot.fillAlpha = count > 0 ? 1 : 0.25;
      con.add(dot);
      con.add(this.add.text(cx - 65, by, `${type}: ${count > 0 ? `${count} caught ✓` : 'not found yet'}`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif', color: count > 0 ? color : '#aaaaaa',
      }));
      by += 14;
    });

    by += 6;
    const planted = Object.values(this.gardenFlowers || {}).filter(f => f && f.stage >= 0).length;
    con.add(this.add.text(cx - 80, by, `🌸 Garden flowers: ${planted} planted`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#aa4488',
    }));
    by += 14;
    const SHARD_DEFS = [
      { id: 'crystal_red', label: 'Flame', hex: '#ff4444' },
      { id: 'crystal_orange', label: 'Sand', hex: '#ff9922' },
      { id: 'crystal_yellow', label: 'Forest', hex: '#cccc00' },
      { id: 'crystal_green', label: 'Frost', hex: '#44aa44' },
      { id: 'crystal_blue', label: 'Sea', hex: '#44aaff' },
      { id: 'crystal_purple', label: 'Shadow', hex: '#cc44ff' },
      { id: 'crystal_pink', label: 'Void', hex: '#ff88cc' },
    ];
    const rc = this.rainbowCrystals || [];
    con.add(this.add.text(cx - 80, by, `💎 Light Shards: ${rc.length}/7`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#8844cc',
    }));
    by += 12;
    SHARD_DEFS.forEach((sd, i) => {
      const col = i < 4 ? 0 : 1;
      const row = i % 4;
      const sx = cx - 80 + col * 82;
      const sy = by + row * 11;
      const have = rc.includes(sd.id);
      con.add(this.add.text(sx, sy, `${have ? '✓' : '○'} ${sd.label}`, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: have ? sd.hex : '#666666',
      }));
    });

    // Phase 31 — Fireflies & Wishes
    by += 48;
    const ff = this.firefliesCaught || 0;
    con.add(this.add.text(cx - 80, by, `✨ Fireflies: ${ff}/5${ff >= 5 ? ' ✓' : ''}`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: ff >= 5 ? '#ffee66' : '#aaaaaa',
    }));
    by += 14;
    const wg = this.wishesGranted || 0;
    con.add(this.add.text(cx - 80, by, `🌙 Wishes made: ${wg}`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: wg > 0 ? '#aaccff' : '#aaaaaa',
    }));
  }

  _drawJournalFriends(con, cx, cy) {
    const aff = this.npcAffection || {};
    const NPC_NAMES = {
      farmer_bob: 'Bob', miner_mike: 'Mike', fisherman_fin: 'Fin',
      lumberjack_jack: 'Jack', ranger_reed: 'Reed', hermit_rolf: 'Rolf',
      chloe: 'Chloe', farmer_buba: 'Buba',
    };

    let by = 50;
    con.add(this.add.text(cx - 80, by, '💝 Friend Affection:', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#882244',
    }));
    by += 14;

    Object.entries(NPC_NAMES).forEach(([id, name]) => {
      const level = Math.min(100, aff[id] || 0);
      const hearts = Math.floor(level / 20);
      const empty  = 5 - hearts;
      const hStr   = '♥'.repeat(hearts) + '♡'.repeat(empty);
      con.add(this.add.text(cx - 78, by, `${name}: ${hStr}`, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#993355',
      }));
      by += 12;
    });

    const gifted = Object.keys(this.flowerGiftsGiven || {}).length;
    by += 4;
    con.add(this.add.text(cx - 78, by, `Flowers given: ${gifted}`, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#886644',
    }));
  }

  _drawJournalFarm(con, cx, cy) {
    const animals = this.farmAnimals || { sheep: false, cow: false, horse: false };
    const names   = this.farmAnimalNames || {};
    const produces = this.farmProduces || { wool: 0, milk: 0 };

    let by = 50;
    con.add(this.add.text(cx - 80, by, '🐾 Farm Animals:', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#664422',
    }));
    by += 14;

    const animalList = [
      { key: 'sheep', icon: '🐑', produce: `wool collected: ${produces.wool || 0}` },
      { key: 'cow',   icon: '🐄', produce: `milk collected: ${produces.milk || 0}` },
      { key: 'horse', icon: '🐴', produce: 'rideable companion' },
    ];
    animalList.forEach(({ key, icon, produce }) => {
      const owned = animals[key];
      const name  = names[key] || '---';
      con.add(this.add.text(cx - 78, by, `${icon} ${owned ? name : '(not yet)'} — ${owned ? produce : 'buy from Rosa'}`, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: owned ? '#553311' : '#aaaaaa',
      }));
      by += 12;
    });

    by += 6;
    const petLine = this.petType ? `${this.petName || this.petType} (${this.petType})` : 'none';
    const petAff  = this.petAffection || 0;
    const hearts  = '♥'.repeat(Math.min(5, Math.floor(petAff / 10)));
    con.add(this.add.text(cx - 80, by, `✨ Pet: ${petLine}`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#226688',
    }));
    by += 12;
    con.add(this.add.text(cx - 80, by, `   Bond: ${hearts || '♡♡♡♡♡'} (${petAff}/50)`, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#4488aa',
    }));
  }

  _drawJournalAchievements(con, cx, cy) {
    const earned = this.achievements || {};
    const earnedCount = Object.keys(earned).filter(k => earned[k]).length;
    const total = ACHIEVEMENTS.length;

    let by = 46;
    con.add(this.add.text(cx - 80, by, `\uD83C\uDFC5 ${earnedCount}/${total} earned`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#664400', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }));
    by += 14;

    // Show two columns: left 11, right 10 (21 total)
    const half = Math.ceil(ACHIEVEMENTS.length / 2);
    ACHIEVEMENTS.forEach((ach, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      const ax = cx - 80 + col * 84;
      const ay = by + row * 11;
      const done = !!earned[ach.id];
      if (ay > 195) return; // overflow guard
      con.add(this.add.text(ax, ay, `${done ? '\u2713' : '\u25cb'} ${ach.label}`, {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: done ? '#886600' : '#aaaaaa',
        stroke: '#000000', strokeThickness: 2,
      }));
    });
  }

  // ─── Phase 23: Animal Naming ───────────────────────────────────────────────

  _showAnimalNamePicker(type) {
    const NAMES = {
      sheep: ['Fluffy', 'Cotton', 'Snowball', 'Clover'],
      cow:   ['Bessie', 'Daisy', 'Moomoo', 'Buttercup'],
      horse: ['Star', 'Sunny', 'Stormy', 'Cinnamon'],
    };
    const names = NAMES[type] || ['Luna', 'Nova', 'Pip', 'Star'];
    this.inDialogue = true;
    const cx = 160, cy = 101;
    const d = 9100;
    const panel = this.add.container(0, 0).setDepth(d).setScrollFactor(0);
    panel.add(this.add.rectangle(cx, cy, 186, 86, 0x000000, 0.75).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 182, 82, 0xcc88ff).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 178, 78, 0x1a0a2e).setScrollFactor(0));
    panel.add(this.add.text(cx, cy - 30, `What will you name your ${type}?`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0));
    names.forEach((name, i) => {
      panel.add(this.add.text(cx, cy - 8 + i * 13, `[${i + 1}] ${name}`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#ffdd88',
      }).setOrigin(0.5).setScrollFactor(0));
    });
    const KEYS = ['keydown-ONE', 'keydown-TWO', 'keydown-THREE', 'keydown-FOUR'];
    const choose = (idx) => {
      this.farmAnimalNames[type] = names[idx];
      panel.destroy();
      this.inDialogue = false;
      this._placeAnimalNameLabel(type);
      this._celebrationBurst('unlock');
      this.showNotification(`Your ${type} is named ${names[idx]}!\nAnimals fed! Check back soon.`);
    };
    KEYS.forEach((k, i) => this.input.keyboard.once(k, () => choose(i)));
  }

  _placeAnimalNameLabel(type) {
    const animal = type === 'sheep' ? this._farmSheep : type === 'cow' ? this._farmCow : this._farmHorse;
    if (!animal?.active) return;
    if (animal._nameLabel?.active) animal._nameLabel.destroy();
    const name = this.farmAnimalNames[type];
    if (!name) return;
    animal._nameLabel = this.add.text(animal.x, animal.y - 18, name, {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  // ─── Phase 23: Butterfly Catching ──────────────────────────────────────────

  _spawnCatchableButterfly() {
    const BF_MAPS = {
      world: 'yellow', overworld: 'yellow',
      forest: 'green', forest_boss: 'green', forest_town: 'green',
      mountain: 'blue', mountain_cave: 'blue',
      beach: 'orange', desert_valley: 'orange', desert_town: 'orange',
    };
    const bfType = BF_MAPS[this.mapData.name];
    if (!bfType) return;
    const COLORS = { yellow: 0xffee44, green: 0x88ee88, blue: 0x88aaff, orange: 0xff8844 };
    const cam = this.cameras.main;
    const bfx = this.player.x + (Math.random() - 0.5) * cam.width * 0.55;
    const bfy = this.player.y + (Math.random() - 0.5) * cam.height * 0.55;
    const col = COLORS[bfType];
    const bf = this.add.circle(bfx, bfy, 3, col, 0.9).setDepth(9991);
    const bfCritter = { obj: bf, spawnX: bfx, spawnY: bfy, isBf: true, bfType };
    this._critters.push(bfCritter);
    this.tweens.chain({
      targets: bf,
      tweens: [
        { x: bfx + 18, y: bfy - 16, duration: 1400, ease: 'Sine.easeInOut' },
        { x: bfx - 10, y: bfy + 12, duration: 1400, ease: 'Sine.easeInOut' },
        { x: bfx + 8,  y: bfy - 10, duration: 1400, ease: 'Sine.easeInOut' },
        { alpha: 0, duration: 600 },
      ],
      onComplete: () => {
        const idx = this._critters.indexOf(bfCritter);
        if (idx !== -1) this._critters.splice(idx, 1);
        if (bf.active) bf.destroy();
      },
    });
  }

  _tryCatchButterfly() {
    for (let i = this._critters.length - 1; i >= 0; i--) {
      const cr = this._critters[i];
      if (!cr.isBf || !cr.obj?.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cr.obj.x, cr.obj.y);
      if (dist > 36) continue;
      // Caught!
      const type = cr.bfType;
      this.caughtButterflies[type] = (this.caughtButterflies[type] || 0) + 1;
      const total = Object.values(this.caughtButterflies).reduce((s, v) => s + v, 0);
      if (cr.obj.active) cr.obj.destroy();
      this._critters.splice(i, 1);
      if (this.sfx) this.sfx.play('butterflyCatch');
      this._celebrationBurst('unlock');
      this.showNotification(`Caught a ${type} butterfly!\n${total} caught total`);
      // Achievement: catch all 4 colors
      const allTypes = ['yellow', 'green', 'blue', 'orange'];
      if (allTypes.every(t => (this.caughtButterflies[t] || 0) >= 1)) {
        this._unlockAchievement('butterfly_collector', 'Nature Lover');
      }
      return;
    }
    this.showNotification('No butterfly nearby!\nLook for colorful dots.');
  }

  // ─── Phase 23: Flower Garden ────────────────────────────────────────────────

  _initGardenPatches() {
    this._gardenPatches = [];
    // 3 soil patches east of the house entrance (house door at ~600,160)
    const PATCH_COORDS = [
      { id: 'patch0', x: 646, y: 186 },
      { id: 'patch1', x: 662, y: 186 },
      { id: 'patch2', x: 678, y: 186 },
    ];
    for (const p of PATCH_COORDS) {
      const saved = this.gardenFlowers[p.id] || null;
      const patch = this._createGardenPatch(p.id, p.x, p.y, saved);
      this._gardenPatches.push(patch);
    }
  }

  _createGardenPatch(id, x, y, saved) {
    const soil = this.add.rectangle(x, y, 12, 10, 0x8b5e3c).setDepth(y);
    const patch = { id, x, y, soil, state: null, flowerType: null, stem: null, bloom: null, bloomTween: null };
    if (saved) {
      patch.state = saved.state;
      patch.flowerType = saved.flowerType;
    }
    this._updateGardenPatchVisual(patch);
    return patch;
  }

  _updateGardenPatchVisual(patch) {
    if (patch.stem?.active) { patch.stem.destroy(); patch.stem = null; }
    if (patch.bloom?.active) { patch.bloom.destroy(); patch.bloom = null; }
    if (patch.bloomTween) { patch.bloomTween.stop(); patch.bloomTween = null; }
    if (!patch.state) {
      patch.soil.setFillStyle(0x8b5e3c);
    } else if (patch.state === 'seeded') {
      patch.soil.setFillStyle(0x6b4e2c);
      patch.bloom = this.add.circle(patch.x, patch.y - 6, 2, 0x88cc44).setDepth(patch.y + 1);
    } else if (patch.state === 'watered') {
      patch.soil.setFillStyle(0x4a2e0c);
      patch.bloom = this.add.circle(patch.x, patch.y - 8, 3, 0x88ffaa).setDepth(patch.y + 1);
    } else if (patch.state === 'ready') {
      patch.soil.setFillStyle(0x4a7a2c);
      const FLOWER_COLORS = { rose: 0xff6688, sunflower: 0xffdd00, violet: 0xcc88ff };
      const col = FLOWER_COLORS[patch.flowerType] || 0xffaadd;
      patch.stem = this.add.rectangle(patch.x, patch.y - 5, 2, 10, 0x44aa44).setDepth(patch.y + 1);
      patch.bloom = this.add.circle(patch.x, patch.y - 12, 4, col).setDepth(patch.y + 2);
      patch.bloomTween = this.tweens.add({ targets: patch.bloom, y: patch.y - 14, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  _handleGardenInteract() {
    if (!this.isOverworld || !this._gardenPatches?.length) return false;
    for (const patch of this._gardenPatches) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, patch.x, patch.y);
      if (dist > 22) continue;
      if (!patch.state) {
        // Plant a seed — assign a distinct flower species randomly
        const seedTypes = Object.entries(this.seeds || {}).filter(([, n]) => n > 0);
        if (!seedTypes.length) {
          this.showNotification('No seeds! Buy seeds\nfrom the shop first.');
          return true;
        }
        const [seedKey] = seedTypes[0];
        this.seeds[seedKey]--;
        // Map patch position to a different species so all 3 patches differ
        const SPECIES = ['rose', 'sunflower', 'violet'];
        const patchIdx = this._gardenPatches.indexOf(patch);
        const USED = this._gardenPatches.map(p => p.flowerType).filter(Boolean);
        let species = SPECIES.find(s => !USED.includes(s)) || SPECIES[patchIdx % 3];
        patch.state = 'seeded';
        patch.flowerType = species;
        this.gardenFlowers[patch.id] = { state: 'seeded', flowerType: species };
        this._updateGardenPatchVisual(patch);
        if (this.sfx) this.sfx.play('pickup');
        this.showNotification(`Planted a ${species} seed!\nNow water it with [E].`);
        return true;
      }
      if (patch.state === 'seeded') {
        if (!this.hasWateringCan) {
          this.showNotification('You need a watering can!\nBuy one at the shop.');
          return true;
        }
        patch.state = 'watered';
        this.gardenFlowers[patch.id] = { state: 'watered', flowerType: patch.flowerType };
        this._updateGardenPatchVisual(patch);
        if (this.sfx) this.sfx.play('waterPlant');
        this.showNotification('Watered! Come back\nin a little while...');
        this.time.delayedCall(45000, () => {
          if (patch.state === 'watered') {
            patch.state = 'ready';
            this.gardenFlowers[patch.id] = { state: 'ready', flowerType: patch.flowerType };
            this._updateGardenPatchVisual(patch);
            this.showNotification(`Your ${patch.flowerType} bloomed!\nPress [E] to pick it!`);
          }
        });
        return true;
      }
      if (patch.state === 'ready') {
        const type = patch.flowerType;
        if (patch.stem?.active) patch.stem.destroy();
        patch.stem = null;
        patch.state = null;
        patch.flowerType = null;
        this.gardenFlowers[patch.id] = null;
        this._updateGardenPatchVisual(patch);
        this._hasFlowerToGive = type;
        if (this.sfx) this.sfx.play('butterflyCatch');
        this._celebrationBurst('unlock');
        // Flower type bonus on picking
        const _FLOWER_BONUS = {
          sunflower: () => { this.addGold(5); return '+5g sunshine bonus!'; },
          rose:      () => { if (this.player) { this.player.health = Math.min(this.player.maxHealth, this.player.health + 1); this.events.emit('health-changed', this.player.health, this.player.maxHealth); } return '+1 HP from rose petals!'; },
          violet:    () => { this.addXP(5); return '+5 XP from violet magic!'; },
        };
        const bonusFn = _FLOWER_BONUS[type];
        const bonusText = bonusFn ? bonusFn() : '';
        this.showNotification(`Picked a ${type}!\n${bonusText}\nGive it to a friend with [E]!`);
        return true;
      }
    }
    return false;
  }

  // ─── Phase 23: Cooking Cauldron ─────────────────────────────────────────────

  _openCookingMenu() {
    if (this.inDialogue) return;
    const RECIPES = [
      { name: 'Milk Pudding',   needs: { milk: 2 },                desc: 'Restores 3 HP',          effect: 'heal3' },
      { name: 'Woolly Broth',   needs: { wool: 1, milk: 1 },       desc: 'Restores 2 HP + warmth', effect: 'heal2w' },
      { name: 'Hearty Stew',    needs: { wool: 2, milk: 1 },       desc: 'Restores 4 HP!',         effect: 'heal4' },
      { name: 'Rainbow Bowl',   needs: { wool: 2, milk: 2 },       desc: 'Restores 5 HP + full mana! ★', effect: 'feast' },
    ];
    const canMake = (r) => Object.entries(r.needs).every(([k, v]) => (this.materials[k] || 0) >= v);

    this.inDialogue = true;
    this.player.setVelocity(0, 0);
    const cx = 160, cy = 101;
    const panel = this.add.container(0, 0).setDepth(9200).setScrollFactor(0);
    panel.add(this.add.rectangle(cx, cy, 200, 110, 0x000000, 0.8).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 196, 106, 0x44ff88, 0.4).setScrollFactor(0));
    panel.add(this.add.rectangle(cx, cy, 192, 102, 0x0a1a0a).setScrollFactor(0));
    panel.add(this.add.text(cx, cy - 42, '~ Cooking Cauldron ~', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#44ff88',
      stroke: '#001a00', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0));

    const matLine = `Wool: ${this.materials.wool || 0}  Milk: ${this.materials.milk || 0}`;
    panel.add(this.add.text(cx, cy - 28, matLine, {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#ccddcc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0));

    RECIPES.forEach((r, i) => {
      const canDo = canMake(r);
      const needsStr = Object.entries(r.needs).map(([k, v]) => `${v} ${k}`).join('+');
      const col = canDo ? '#ffdd88' : '#666655';
      panel.add(this.add.text(cx, cy - 12 + i * 20, `[${i + 1}] ${r.name}  (${needsStr})`, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: col,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0));
      panel.add(this.add.text(cx, cy - 2 + i * 20, r.desc, {
        fontSize: '9px', fontFamily: 'Arial, sans-serif', color: canDo ? '#aaddaa' : '#556655',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0));
    });

    panel.add(this.add.text(cx, cy + 46, '[ESC] Close', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#889988',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0));

    const close = () => { panel.destroy(); this.inDialogue = false; };

    const KEYS = ['keydown-ONE', 'keydown-TWO', 'keydown-THREE', 'keydown-FOUR'];
    KEYS.forEach((k, i) => {
      this.input.keyboard.once(k, () => {
        const recipe = RECIPES[i];
        if (!canMake(recipe)) {
          this.showNotification(`Not enough ingredients!\nNeed: ${Object.entries(recipe.needs).map(([k, v]) => `${v} ${k}`).join(', ')}`);
          close();
          return;
        }
        Object.entries(recipe.needs).forEach(([mat, amt]) => { this.materials[mat] -= amt; });
        close();
        if (this.sfx) this.sfx.play('cookDone');
        this._celebrationBurst('quest');
        // Phase 31 — track cooking for edna_feast quest
        const cooked = this.questManager.trackEvent('edna_cook', {});
        if (cooked) this._checkAchievements();
        if (recipe.effect === 'heal3') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 3);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          this.showNotification('Yummy! Restored 3 HP!');
        } else if (recipe.effect === 'heal2w') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          this._regenBonus = (this._regenBonus || 0) + 1;
          if (!this._regenTimer) {
            this._regenTimer = this.time.addEvent({ delay: 5000, callback: () => {
              if (this._regenBonus > 0 && this.player.health < this.player.maxHealth) {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
                this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
              }
            }, repeat: -1 });
          }
          this.showNotification('Cozy warmth! +2 HP &\nregen bonus!');
        } else if (recipe.effect === 'heal4') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          this.showNotification('Delicious! Restored 4 HP!');
        } else if (recipe.effect === 'feast') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
          this.events.emit('player-health-changed', this.player.health, this.player.maxHealth);
          if (this.player.maxMana !== undefined) {
            this.player.mana = this.player.maxMana;
            this.events.emit('mana-changed', this.player.mana, this.player.maxMana);
          }
          // Rainbow particle burst
          for (let rb = 0; rb < 10; rb++) {
            const rc = [0xff4444, 0xff8844, 0xffdd44, 0x44cc44, 0x4488ff, 0xcc44ff][rb % 6];
            const a = (rb / 10) * Math.PI * 2;
            const dot = this.add.circle(this.player.x + Math.cos(a) * 10, this.player.y + Math.sin(a) * 10, 3, rc).setDepth(9999);
            this.tweens.add({ targets: dot, x: dot.x + Math.cos(a) * 22, y: dot.y + Math.sin(a) * 22 - 8, alpha: 0, duration: 600, onComplete: () => dot.destroy() });
          }
          this.showNotification('★ Rainbow Bowl! Restored 5 HP\n& full mana!');
        }
      });
    });
    this.input.keyboard.once('keydown-ESC', close);
  }

  _handleFarmManager(nearestNPC, name, portrait) {
    // If player has produce to sell, offer that first
    const woolCount = this.materials.wool || 0;
    const milkCount = this.materials.milk || 0;
    const hasAnimals = this.farmAnimals.sheep || this.farmAnimals.cow || this.farmAnimals.horse;

    // Check quest state (farm_wool / farm_dairy)
    if (woolCount > 0 || milkCount > 0) {
      const sellLines = ['Rosa: You have produce!'];
      if (woolCount > 0) sellLines.push(`Wool: ${woolCount} × 15g = ${woolCount * 15}g`);
      if (milkCount > 0) sellLines.push(`Milk: ${milkCount} × 12g = ${milkCount * 12}g`);
      sellLines.push('Sell all? (1) Yes  (2) No');
      this.showDialogueWithChoice(
        sellLines,
        [
          { text: 'Sell All', callback: () => {
            this._sellFarmProduce('wool');
            this._sellFarmProduce('milk');
          }},
          { text: 'Not now', callback: () => {} },
        ],
        name, portrait
      );
      return;
    }

    // Quest handling (chain)
    const woolQuest = this.questManager.getQuest('farm_wool');
    const dairyQuest = this.questManager.getQuest('farm_dairy');
    const firstIncomplete = [woolQuest, dairyQuest].find(q => q && q.state !== 'completed');
    if (firstIncomplete) {
      this._handleChainedQuests(nearestNPC, ['farm_wool', 'farm_dairy'], name, portrait);
      return;
    }

    // No produce, all quests done — offer buying animals
    if (!hasAnimals) {
      this._openFarmShop(name, portrait);
      return;
    }

    // Generic ongoing dialogue
    this.showDialogue([
      'Rosa: The animals are doing\nwell! Keep them fed.',
      'Come back when you have\nproduce to sell.',
    ], null, name, portrait);
  }

  _openFarmShop(name, portrait) {
    const choices = [];
    if (!this.farmAnimals.sheep)
      choices.push({ text: 'Sheep (50g)', callback: () => this._buyFarmAnimal('sheep', 50) });
    if (!this.farmAnimals.cow)
      choices.push({ text: 'Cow (80g)',   callback: () => this._buyFarmAnimal('cow', 80) });
    if (!this.farmAnimals.horse)
      choices.push({ text: 'Horse (120g)', callback: () => this._buyFarmAnimal('horse', 120) });
    if (choices.length === 0) {
      this.showDialogue(['Rosa: You already own\nall available animals!'], null, name, portrait);
      return;
    }
    choices.push({ text: 'Not now', callback: () => {} });
    this.showDialogueWithChoice(
      [`Rosa: Buy a farm animal?\nYou have ${this.gold}g.`],
      choices.slice(0, 4),
      name, portrait
    );
  }

  _buyFarmAnimal(type, cost) {
    if (this.gold < cost) {
      this.showNotification(`Need ${cost}g to buy ${type}!`);
      return;
    }
    this.gold -= cost;
    this.events.emit('gold-changed', this.gold);
    this.farmAnimals[type] = true;
    this.showNotification(`Bought a ${type}!`);
    if (this.sfx) this.sfx.play('questComplete');
    // Spawn immediately if on the farm map
    if (this.mapData.farmMap) {
      if (type === 'sheep' && !this._farmSheep) {
        this._farmSheep = new Sheep(this, 80, 160);
      } else if (type === 'cow' && !this._farmCow) {
        this._farmCow = new Cow(this, 140, 200);
      } else if (type === 'horse' && !this._farmHorse) {
        this._farmHorse = new Horse(this, 370, 80);
      }
    }
  }

  _sellFarmProduce(type) {
    const count = this.materials[type] || 0;
    if (count <= 0) return;
    const price = type === 'wool' ? 15 : 12;
    const earned = count * price;
    this.materials[type] = 0;
    this.addGold(earned);
    this.showNotification(`Sold ${count} ${type} for ${earned}g!`);
  }
}
