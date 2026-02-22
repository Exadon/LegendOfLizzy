import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const barW = 200;
    const barH = 12;
    const barY = height / 2;

    const bg = this.add.rectangle(width / 2, barY, barW, barH, 0x333333);
    const bar = this.add.rectangle((width - barW) / 2 + 2, barY, 0, barH - 4, 0x88cc44);
    bar.setOrigin(0, 0.5);

    const label = this.add.text(width / 2, barY - 16, 'Loading...', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = (barW - 4) * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
      label.destroy();
    });

    // --- Lizzy (pre-composited 64x64 frames, 9 cols x 9 rows) ---
    this.load.spritesheet('lizzy', 'assets/lizzy.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // --- NPCs (64x64 frames, 6 cols) ---
    this.load.spritesheet('farmer-bob', 'assets/Cute_Fantasy/NPCs (Premade)/Farmer_Bob.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('farmer-buba', 'assets/Cute_Fantasy/NPCs (Premade)/Farmer_Buba.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('chef-chloe', 'assets/Cute_Fantasy/NPCs (Premade)/Chef_Chloe.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('fisherman-fin', 'assets/Cute_Fantasy/NPCs (Premade)/Fisherman_Fin.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('lumberjack-jack', 'assets/Cute_Fantasy/NPCs (Premade)/Lumberjack_Jack.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('miner-mike', 'assets/Cute_Fantasy/NPCs (Premade)/Miner_Mike.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // --- Animals ---
    this.load.spritesheet('chicken', 'assets/Cute_Fantasy/Animals/Chicken/Chicken_01.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // --- Enemies ---
    this.load.spritesheet('skeleton', 'assets/Cute_Fantasy/Enemies/Skeleton/Skeleton.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('slime-green', 'assets/Cute_Fantasy/Enemies/Slime/Slime_Medium/Slime_Medium_Green.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // --- Tiles ---
    this.load.image('grass-middle', 'assets/Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png');
    this.load.image('grass-tiles', 'assets/Cute_Fantasy/Tiles/Grass/Grass_Tiles_1.png');
    this.load.image('water-tiles', 'assets/Cute_Fantasy/Tiles/Water/Water_Tile_1.png');
    this.load.image('water-middle', 'assets/Cute_Fantasy/Tiles/Water/Water_Middle.png');
    this.load.image('path-middle', 'assets/Cute_Fantasy/Tiles/Grass/Path_Middle.png');
    this.load.image('cliff-tiles', 'assets/Cute_Fantasy/Tiles/Cliff/Stone_Cliff_1_Tile.png');

    // --- Interior tiles ---
    this.load.spritesheet('wood-floor', 'assets/Cute_Fantasy/Buildings/Houses_Interiors/Wood_Floor_Tiles.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image('wood-wall', 'assets/Cute_Fantasy/Buildings/Houses_Interiors/Wood_Wall_Fillers.png');

    // --- Furniture ---
    this.load.image('furniture-beds', 'assets/Cute_Fantasy/Buildings/House_Decor/Beds.png');
    this.load.image('furniture-tables', 'assets/Cute_Fantasy/Buildings/House_Decor/Tables.png');

    // --- Animals (new) ---
    this.load.spritesheet('horse', 'assets/Cute_Fantasy/Animals/Horse/Horse_01.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('butterfly', 'assets/Cute_Fantasy/Animals/Butterfly/Butterfly.png', {
      frameWidth: 8,
      frameHeight: 8,
    });

    // --- Cave tiles ---
    this.load.image('cave-floor', 'assets/Cute_Fantasy/Tiles/Cave/Cave_Floor_Middle.png');
    this.load.image('cave-walls', 'assets/Cute_Fantasy/Tiles/Cave/Cave_Walls.png');
    this.load.image('cave-doorway', 'assets/Cute_Fantasy/Tiles/Cave/Cave_Doorway_1.png');

    // --- Outdoor decorations ---
    this.load.image('oak-tree', 'assets/Cute_Fantasy_Free/Outdoor decoration/Oak_Tree.png');
    this.load.image('oak-tree-small', 'assets/Cute_Fantasy_Free/Outdoor decoration/Oak_Tree_Small.png');
    this.load.image('chest', 'assets/Cute_Fantasy_Free/Outdoor decoration/Chest.png');
    this.load.image('fences', 'assets/Cute_Fantasy_Free/Outdoor decoration/Fences.png');
    this.load.image('outdoor-decor', 'assets/Cute_Fantasy_Free/Outdoor decoration/Outdoor_Decor_Free.png');

    // --- Buildings ---
    this.load.image('house-wood', 'assets/Cute_Fantasy_Free/Outdoor decoration/House_1_Wood_Base_Blue.png');

    // --- UI Assets (Cute Fantasy UI Pack) ---
    this.load.image('book-ui', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/Book_UI.png');
    this.load.image('ui-bars', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/UI_Bars.png');
    this.load.image('ui-frames', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/UI_Frames.png');
    this.load.spritesheet('ui-icons', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/UI_Icons.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image('ui-pop-up', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/UI_Pop_Up.png');
    this.load.image('ui-ribbons', 'assets/Cute_Fantasy_UI/Cute_Fantasy_UI/UI/UI_Ribbons.png');

    // --- Desert Assets ---
    this.load.spritesheet('desert-person-1', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/NPC/Desert_Person_1.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.spritesheet('pharaoh', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/NPC/Pharaoh.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.image('desert-temple', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Temple/Desert_Temple.png');
    this.load.image('desert-obelisk-1', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Temple/Desert_Obelisk_1.png');
    this.load.image('palm-tree-1', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Props/Palm_Tree_1.png');
    this.load.image('cactus', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Props/Cactus.png');
    this.load.image('desert-rocks', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Props/Desert_Rocks.png');
    this.load.image('desert-beach-1', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Tiles/Desert_Beach_Tiles_1.png');
    this.load.image('desert-cliff-1', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Tiles/Desert_Cliff_Tiles_1.png');
    this.load.image('desert-grass', 'assets/Cute_Fantasy_Desert/Cute_Fantasy_Desert/Tiles/Desert_Grass.png');

    // --- Dungeon Assets ---
    this.load.image('dungeon-1-tiles', 'assets/Cute_Fantasy_Dungeons/Cute_Fantasy_Dungeons/Dungeon_1/Dungeon_1.png');
    this.load.image('dungeon-2-tiles', 'assets/Cute_Fantasy_Dungeons/Cute_Fantasy_Dungeons/Dungeon_2/Dungeon_2.png');
    this.load.image('dungeon-objects', 'assets/Cute_Fantasy_Dungeons/Cute_Fantasy_Dungeons/Objects/Dungeon_Objects.png');
    this.load.spritesheet('chest-anim', 'assets/Cute_Fantasy_Dungeons/Cute_Fantasy_Dungeons/Objects/Chest_anim.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.image('gold-piles', 'assets/Cute_Fantasy_Dungeons/Cute_Fantasy_Dungeons/Objects/Gold_Piles.png');

    // --- Character Assets ---
    this.load.spritesheet('swordman', 'assets/Cute_Fantasy_Characters/Cute_Fantasy_Characters/Knights/Swordman.png', {
      frameWidth: 48, frameHeight: 48,
    });
    this.load.spritesheet('goblin-thief', 'assets/Cute_Fantasy_Characters/Cute_Fantasy_Characters/Goblins/Goblin_Thief.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.spritesheet('orc-grunt', 'assets/Cute_Fantasy_Characters/Cute_Fantasy_Characters/Orcs/Orc_Grunt.png', {
      frameWidth: 32, frameHeight: 32,
    });
  }

  create() {
    // Recolor Lizzy's hair from orange to black
    this._recolorHair();

    // Apply NEAREST (pixel-art) filtering to all game textures
    const pixelTextures = [
      'lizzy', 'farmer-bob', 'farmer-buba', 'chef-chloe',
      'fisherman-fin', 'lumberjack-jack', 'miner-mike',
      'chicken', 'skeleton', 'slime-green', 'horse', 'butterfly',
      'grass-middle', 'grass-tiles', 'water-tiles', 'water-middle',
      'path-middle', 'cliff-tiles', 'wood-floor', 'wood-wall',
      'furniture-beds', 'furniture-tables',
      'cave-floor', 'cave-walls', 'cave-doorway',
      'oak-tree', 'oak-tree-small', 'chest', 'fences',
      'outdoor-decor', 'house-wood',
      'book-ui', 'ui-bars', 'ui-frames', 'ui-icons', 'ui-pop-up', 'ui-ribbons',
      'desert-person-1', 'pharaoh',
      'desert-temple', 'desert-obelisk-1', 'palm-tree-1', 'cactus', 'desert-rocks',
      'desert-beach-1', 'desert-cliff-1', 'desert-grass',
      'dungeon-1-tiles', 'dungeon-2-tiles', 'dungeon-objects', 'chest-anim', 'gold-piles',
      'swordman', 'goblin-thief', 'orc-grunt',
    ];
    for (const key of pixelTextures) {
      const tex = this.textures.get(key);
      if (tex && tex.key !== '__MISSING') {
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    this._defineUIFrames();
    this._generateTorchLight();
    this._generatePortraits();
    this.createAnimations();
    this.scene.start('Title');
  }

  createAnimations() {
    // Lizzy spritesheet: 9 cols x 9 rows at 64x64
    const COLS = 9;

    // Idle
    this.anims.create({
      key: 'lizzy-idle-down',
      frames: this.anims.generateFrameNumbers('lizzy', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'lizzy-idle-right',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS, end: COLS + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'lizzy-idle-up',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 2, end: COLS * 2 + 5 }),
      frameRate: 8,
      repeat: -1,
    });

    // Walk
    this.anims.create({
      key: 'lizzy-walk-down',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 3, end: COLS * 3 + 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'lizzy-walk-right',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 4, end: COLS * 4 + 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'lizzy-walk-up',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 5, end: COLS * 5 + 5 }),
      frameRate: 10,
      repeat: -1,
    });

    // Attack
    this.anims.create({
      key: 'lizzy-attack-down',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 6, end: COLS * 6 + 3 }),
      frameRate: 14,
      repeat: 0,
    });
    this.anims.create({
      key: 'lizzy-attack-right',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 7, end: COLS * 7 + 3 }),
      frameRate: 14,
      repeat: 0,
    });
    this.anims.create({
      key: 'lizzy-attack-up',
      frames: this.anims.generateFrameNumbers('lizzy', { start: COLS * 8, end: COLS * 8 + 3 }),
      frameRate: 14,
      repeat: 0,
    });

    // --- Skeleton animations (32x32, 6 cols x 10 rows) ---
    this.anims.create({
      key: 'skeleton-idle-down',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'skeleton-walk-down',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 18, end: 23 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'skeleton-walk-right',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 24, end: 29 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'skeleton-walk-up',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 30, end: 35 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Slime animations (32x32) ---
    this.anims.create({
      key: 'slime-idle',
      frames: this.anims.generateFrameNumbers('slime-green', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    // --- NPC animations (64x64, 6 cols) ---
    // All NPC sheets share the same layout:
    // Row 0: idle down, Row 1: idle right, Row 2: idle up
    // Row 3: walk down, Row 4: walk right, Row 5: walk up
    const NPC_COLS = 6;
    const npcSheets = [
      { key: 'farmer-bob', prefix: 'npc-bob' },
      { key: 'farmer-buba', prefix: 'npc-buba' },
      { key: 'chef-chloe', prefix: 'npc-chloe' },
      { key: 'fisherman-fin', prefix: 'npc-fin' },
      { key: 'lumberjack-jack', prefix: 'npc-jack' },
      { key: 'miner-mike', prefix: 'npc-mike' },
    ];

    for (const sheet of npcSheets) {
      // Idle animations
      this.anims.create({
        key: `${sheet.prefix}-idle-down`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `${sheet.prefix}-idle-right`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: NPC_COLS, end: NPC_COLS + 5 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `${sheet.prefix}-idle-up`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: NPC_COLS * 2, end: NPC_COLS * 2 + 5 }),
        frameRate: 6,
        repeat: -1,
      });

      // Walk animations
      this.anims.create({
        key: `${sheet.prefix}-walk-down`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: NPC_COLS * 3, end: NPC_COLS * 3 + 5 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${sheet.prefix}-walk-right`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: NPC_COLS * 4, end: NPC_COLS * 4 + 5 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${sheet.prefix}-walk-up`,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: NPC_COLS * 5, end: NPC_COLS * 5 + 5 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // --- Chicken animation (32x32, 8 cols) ---
    // Row 0 only has 2 idle frames; row 1 (frames 8-13) has 6 walk frames
    this.anims.create({
      key: 'chicken-idle',
      frames: this.anims.generateFrameNumbers('chicken', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'chicken-walk',
      frames: this.anims.generateFrameNumbers('chicken', { start: 8, end: 13 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Horse/Unicorn animations (32x32, 8 cols x 15 rows) ---
    const HORSE_COLS = 8;
    this.anims.create({
      key: 'horse-idle-down',
      frames: this.anims.generateFrameNumbers('horse', { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'horse-idle-right',
      frames: this.anims.generateFrameNumbers('horse', { start: HORSE_COLS, end: HORSE_COLS + 1 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'horse-idle-up',
      frames: this.anims.generateFrameNumbers('horse', { start: HORSE_COLS * 2, end: HORSE_COLS * 2 + 1 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'horse-walk-down',
      frames: this.anims.generateFrameNumbers('horse', { start: HORSE_COLS * 4, end: HORSE_COLS * 4 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'horse-walk-right',
      frames: this.anims.generateFrameNumbers('horse', { start: HORSE_COLS * 5, end: HORSE_COLS * 5 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'horse-walk-up',
      frames: this.anims.generateFrameNumbers('horse', { start: HORSE_COLS * 6, end: HORSE_COLS * 6 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    // --- Pharaoh animations (32x32, 8 cols x 10 rows) ---
    const PHARAOH_COLS = 8;
    this.anims.create({
      key: 'pharaoh-idle-down',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'pharaoh-idle-right',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: PHARAOH_COLS, end: PHARAOH_COLS + 5 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'pharaoh-idle-up',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: PHARAOH_COLS * 2, end: PHARAOH_COLS * 2 + 5 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'pharaoh-walk-down',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: PHARAOH_COLS * 3, end: PHARAOH_COLS * 3 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'pharaoh-walk-right',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: PHARAOH_COLS * 4, end: PHARAOH_COLS * 4 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'pharaoh-walk-up',
      frames: this.anims.generateFrameNumbers('pharaoh', { start: PHARAOH_COLS * 5, end: PHARAOH_COLS * 5 + 5 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Goblin animations (32x32, 6 cols x 10 rows) ---
    const GOB_COLS = 6;
    this.anims.create({
      key: 'goblin-idle-down',
      frames: this.anims.generateFrameNumbers('goblin-thief', { start: 0, end: 5 }),
      frameRate: 6, repeat: -1,
    });
    this.anims.create({
      key: 'goblin-walk-down',
      frames: this.anims.generateFrameNumbers('goblin-thief', { start: GOB_COLS * 3, end: GOB_COLS * 3 + 5 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'goblin-walk-right',
      frames: this.anims.generateFrameNumbers('goblin-thief', { start: GOB_COLS * 4, end: GOB_COLS * 4 + 5 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'goblin-walk-up',
      frames: this.anims.generateFrameNumbers('goblin-thief', { start: GOB_COLS * 5, end: GOB_COLS * 5 + 5 }),
      frameRate: 8, repeat: -1,
    });

    // --- Orc animations (32x32, 16 cols x 16 rows — 512x512 sheet) ---
    // Row 0: idle-down (4 frames), Row 1: idle-right (4), Row 2: idle-up (4)
    // Row 5: walk-down (8), Row 6: walk-right (8), Row 7: walk-up (8)
    const ORC_COLS = 16;
    this.anims.create({
      key: 'orc-idle-down',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: 0, end: 3 }),
      frameRate: 6, repeat: -1,
    });
    this.anims.create({
      key: 'orc-idle-right',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: ORC_COLS, end: ORC_COLS + 3 }),
      frameRate: 6, repeat: -1,
    });
    this.anims.create({
      key: 'orc-idle-up',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: ORC_COLS * 2, end: ORC_COLS * 2 + 3 }),
      frameRate: 6, repeat: -1,
    });
    this.anims.create({
      key: 'orc-walk-down',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: ORC_COLS * 5, end: ORC_COLS * 5 + 7 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'orc-walk-right',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: ORC_COLS * 6, end: ORC_COLS * 6 + 7 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'orc-walk-up',
      frames: this.anims.generateFrameNumbers('orc-grunt', { start: ORC_COLS * 7, end: ORC_COLS * 7 + 7 }),
      frameRate: 8, repeat: -1,
    });

    // --- Butterfly animations (8x8, 2 cols x 8 rows = 16 frames) ---
    // Row pairs per color: rows 0-1 = blue, rows 2-3 = green, rows 4-5 = red, rows 6-7 = yellow
    this.anims.create({
      key: 'butterfly-blue',
      frames: this.anims.generateFrameNumbers('butterfly', { frames: [0, 2] }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'butterfly-green',
      frames: this.anims.generateFrameNumbers('butterfly', { frames: [4, 6] }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'butterfly-red',
      frames: this.anims.generateFrameNumbers('butterfly', { frames: [8, 10] }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'butterfly-yellow',
      frames: this.anims.generateFrameNumbers('butterfly', { frames: [12, 14] }),
      frameRate: 6,
      repeat: -1,
    });
  }

  _defineUIFrames() {
    // UI_Frames: 1296x336, 7 rows of 48px each (orange, gray, green, blue, yellow, red, purple)
    const framesTex = this.textures.get('ui-frames');
    if (framesTex && framesTex.key !== '__MISSING') {
      framesTex.add('panel-orange', 0, 0, 0, 48, 48);
      framesTex.add('panel-gray', 0, 0, 48, 48, 48);
      framesTex.add('panel-green', 0, 0, 96, 48, 48);
      framesTex.add('panel-blue', 0, 0, 144, 48, 48);
      framesTex.add('panel-yellow', 0, 0, 192, 48, 48);
      framesTex.add('panel-red', 0, 0, 240, 48, 48);
      framesTex.add('panel-purple', 0, 0, 288, 48, 48);

      // Individual panel sprites (28x31 each, on 48px grid starting at 10,10)
      framesTex.add('tab-orange', 0, 10, 10, 28, 31);
      framesTex.add('tab-gray', 0, 10, 58, 28, 31);
    }

    // Book_UI: extract the open tan book (top-left, ~240x144)
    const bookTex = this.textures.get('book-ui');
    if (bookTex && bookTex.key !== '__MISSING') {
      bookTex.add('book-open-tan', 0, 0, 0, 240, 144);
      bookTex.add('book-open-gray', 0, 240, 0, 240, 144);
    }
  }

  _generateTorchLight() {
    // White radial gradient circle for cave fog-of-war erase
    const size = 160; // diameter
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    this.textures.addCanvas('torch-light', canvas);
  }

  _generatePortraits() {
    // Crop top 24x24 of each NPC's first frame for dialogue portraits
    const npcTextures = [
      'farmer-bob', 'farmer-buba', 'chef-chloe',
      'fisherman-fin', 'lumberjack-jack', 'miner-mike',
    ];
    for (const key of npcTextures) {
      const tex = this.textures.get(key);
      if (!tex || tex.key === '__MISSING') continue;
      const source = tex.getSourceImage();
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      // Crop center-top 24x24 from 64x64 first frame
      ctx.drawImage(source, 20, 4, 24, 24, 0, 0, 24, 24);
      this.textures.addCanvas(`portrait-${key}`, canvas);
    }
  }

  _recolorHair() {
    const tex = this.textures.get('lizzy');
    if (!tex || tex.key === '__MISSING') return;

    const source = tex.getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) continue;

      // Detect orange/ginger hair pixels: high red, moderate green, low blue
      // Hair is the bright orange blob: R > 180, G in 80-200, B < 80, strong red dominance
      const isOrange = r > 150 && g > 60 && g < 200 && b < 100 && (r - b) > 100;
      if (isOrange) {
        // Calculate relative brightness of original pixel
        const lum = (r * 0.299 + g * 0.587 + b * 0.114);
        // Map to brown hair (preserve shading detail)
        const t = lum / 255;
        data[i] = Math.floor(60 + t * 80);      // R: 60-140
        data[i + 1] = Math.floor(30 + t * 50);   // G: 30-80
        data[i + 2] = Math.floor(10 + t * 25);   // B: 10-35
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Replace the texture with the modified version
    this.textures.remove('lizzy');
    const newTex = this.textures.addSpriteSheet('lizzy', canvas, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }
}
