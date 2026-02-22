export const QuestState = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  READY_TO_TURN_IN: 'ready',
  COMPLETED: 'completed',
};

export class QuestManager {
  constructor() {
    this.quests = {};
    this.trackers = {};
  }

  addQuest(quest) {
    this.quests[quest.id] = {
      ...quest,
      state: QuestState.AVAILABLE,
      progress: 0,
    };
  }

  getQuest(id) {
    return this.quests[id];
  }

  acceptQuest(id) {
    const quest = this.quests[id];
    if (!quest || quest.state !== QuestState.AVAILABLE) return false;
    quest.state = QuestState.ACTIVE;
    quest.progress = 0;
    return true;
  }

  completeQuest(id) {
    const quest = this.quests[id];
    if (!quest || quest.state !== QuestState.READY_TO_TURN_IN) return false;
    quest.state = QuestState.COMPLETED;
    return true;
  }

  trackEvent(eventType, data) {
    for (const quest of Object.values(this.quests)) {
      if (quest.state !== QuestState.ACTIVE) continue;
      if (quest.objective.type === eventType && quest.objective.target === data.target) {
        quest.progress = Math.min(quest.progress + 1, quest.objective.count);
        if (quest.progress >= quest.objective.count) {
          quest.state = QuestState.READY_TO_TURN_IN;
        }
        return quest;
      }
      // collect_material: matches on materialId field
      if (eventType === 'collect_material' && quest.objective.type === 'collect_material' &&
          quest.objective.materialId === data.materialId) {
        quest.progress = Math.min(quest.progress + 1, quest.objective.count);
        if (quest.progress >= quest.objective.count) {
          quest.state = QuestState.READY_TO_TURN_IN;
        }
        return quest;
      }
      // craft: any crafting action
      if (eventType === 'craft' && quest.objective.type === 'craft') {
        quest.progress = Math.min(quest.progress + 1, quest.objective.count);
        if (quest.progress >= quest.objective.count) {
          quest.state = QuestState.READY_TO_TURN_IN;
        }
        return quest;
      }
    }
    return null;
  }

  getActiveQuests() {
    return Object.values(this.quests).filter(
      (q) => q.state === QuestState.ACTIVE || q.state === QuestState.READY_TO_TURN_IN
    );
  }

  getAllQuests() {
    return Object.values(this.quests);
  }

  saveState() {
    const state = {};
    for (const [id, quest] of Object.entries(this.quests)) {
      state[id] = {
        state: quest.state,
        progress: quest.progress,
      };
    }
    return state;
  }

  restoreState(state) {
    if (!state) return;
    for (const [id, saved] of Object.entries(state)) {
      if (this.quests[id]) {
        this.quests[id].state = saved.state;
        this.quests[id].progress = saved.progress;
      }
    }
  }
}

// Quest definitions
export const QUESTS = {
  skeleton_hunt: {
    id: 'skeleton_hunt',
    name: 'Skeleton Scourge',
    giver: 'farmer_bob',
    dialogue: {
      available: [
        'Help! Skeletons have been\nterrorizing the town!',
        'Can you defeat 5 of them\nfor me? I\'ll reward you!',
      ],
      active: [
        'How\'s the skeleton hunting\ngoing? Keep at it!',
      ],
      ready: [
        'You did it! All 5 skeletons\nare defeated!',
        'Thank you so much, Lizzy!\nYou\'re our hero!',
      ],
      completed: [
        'Thanks again for saving\nus from those skeletons!',
      ],
    },
    reward: { gold: 50, xp: 75 },
    objective: {
      type: 'kill',
      target: 'skeleton',
      count: 5,
      description: 'Defeat 5 Skeletons',
    },
  },

  chicken_roundup: {
    id: 'chicken_roundup',
    name: 'Chicken Roundup',
    giver: 'farmer_buba',
    dialogue: {
      available: [
        'Oh no! My chickens have\nescaped their coop!',
        'Could you catch 4 of them\nfor me? Just walk over them!',
      ],
      active: [
        'Still chasing chickens?\nThey\'re quick little things!',
      ],
      ready: [
        'You caught them all!\nThank you so much!',
        'Here, take this as\na reward!',
      ],
      completed: [
        'The chickens are safe\nin their coop. Thanks!',
      ],
    },
    reward: { gold: 30, xp: 50 },
    objective: {
      type: 'collect',
      target: 'chicken',
      count: 4,
      description: 'Catch 4 Chickens',
    },
  },

  special_delivery: {
    id: 'special_delivery',
    name: 'Special Delivery',
    giver: 'farmer_bob',
    turnIn: 'chef_chloe',
    dialogue: {
      available: [
        'I need fresh veggies\ndelivered to Chef Chloe.',
        'She\'s usually near the\npond. Can you help?',
      ],
      active: [
        'Please bring the veggies\nto Chef Chloe by the pond!',
      ],
      ready: [
        'Did Chloe get the veggies?\nWonderful!',
      ],
      completed: [
        'Thanks for making that\ndelivery!',
      ],
    },
    turnInDialogue: [
      'Oh, veggies from Farmer Bob!\nThese are perfect!',
      'Tell him thanks for me!\nHere\'s something for you.',
    ],
    reward: { gold: 40, xp: 60 },
    objective: {
      type: 'deliver',
      target: 'veggies',
      count: 1,
      description: 'Deliver Veggies to Chloe',
    },
  },

  clear_cave: {
    id: 'clear_cave',
    name: 'Clear the Cave',
    giver: 'miner_mike',
    dialogue: {
      available: [
        'I tried exploring the cave\nto the northwest...',
        'But a terrifying Skeleton King\nlurks in the depths!',
        'Could you defeat it\nfor me? I\'ll pay well!',
      ],
      active: [
        'Be careful in that cave!\nThe Skeleton King is fierce!',
      ],
      ready: [
        'You defeated the\nSkeleton King?!',
        'You\'re incredible!\nHere, take this reward!',
      ],
      completed: [
        'The cave is safe now\nthanks to you!',
      ],
    },
    reward: { gold: 150, xp: 300 },
    objective: {
      type: 'kill',
      target: 'skeleton_king',
      count: 1,
      description: 'Defeat the Skeleton King',
    },
  },

  slime_cleanup: {
    id: 'slime_cleanup',
    name: 'Slime Cleanup',
    giver: 'lumberjack_jack',
    dialogue: {
      available: [
        'The forest is crawling\nwith slimes!',
        'Defeat 4 of them so I\ncan chop in peace!',
      ],
      active: [
        'Still squishy things\neverywhere! Keep at it!',
      ],
      ready: [
        'The forest is clear!\nThanks, adventurer!',
        'Here, you earned this!',
      ],
      completed: [
        'Peaceful chopping at last!\nThanks again!',
      ],
    },
    reward: { gold: 35, xp: 55 },
    objective: {
      type: 'kill',
      target: 'slime',
      count: 4,
      description: 'Defeat 4 Slimes',
    },
  },

  catch_fish: {
    id: 'catch_fish',
    name: 'Gone Fishing',
    giver: 'fisherman_fin',
    dialogue: {
      available: [
        'Want to try fishing?\nThe pond is full of fish!',
        'Catch 3 fish for me and\nI\'ll reward you handsomely!',
      ],
      active: [
        'Stand by the pond and\npress E to cast your line!',
      ],
      ready: [
        'Three fish! That\'s a\ngreat haul!',
        'You\'re a natural angler!\nHere\'s your reward!',
      ],
      completed: [
        'The fish are always biting\nat the old pond...',
      ],
    },
    reward: { gold: 60, xp: 80 },
    objective: {
      type: 'fish',
      target: 'any',
      count: 3,
      description: 'Catch 3 Fish',
    },
  },

  clear_temple: {
    id: 'clear_temple',
    name: 'Curse of the Pharaoh',
    giver: 'miner_mike',
    dialogue: {
      available: [
        'I found ancient ruins in\nthe eastern desert...',
        'A cursed Pharaoh guards\na treasure beyond imagining!',
        'Defeat the Pharaoh and\nlifting the curse!',
      ],
      active: [
        'The desert temple entrance\nis to the east. Be careful!',
      ],
      ready: [
        'The Pharaoh is defeated?!\nIncredible!',
        'You truly are the greatest\nwarrior in the land!',
      ],
      completed: [
        'The ancient curse has been\nlifted thanks to you!',
      ],
    },
    reward: { gold: 200, xp: 400 },
    objective: {
      type: 'kill',
      target: 'pharaoh',
      count: 1,
      description: 'Defeat the Pharaoh',
    },
  },

  scout_forest: {
    id: 'scout_forest',
    name: 'Forest Patrol',
    giver: 'ranger_reed',
    dialogue: {
      available: [
        'The forest is crawling with\ngoblins lately...',
        'Kill 3 goblins so I can\nassess the threat!',
      ],
      active: [
        'Keep hunting those goblins!\nI need to know how many there are.',
      ],
      ready: [
        'Three goblins down!\nGood work, ranger-in-training!',
        'But I fear something worse\nlurks deeper inside...',
      ],
      completed: [
        'Thanks for the scouting\nreport on the goblins!',
      ],
    },
    reward: { gold: 40, xp: 60 },
    objective: {
      type: 'kill',
      target: 'goblin',
      count: 3,
      description: 'Defeat 3 Goblins',
    },
  },

  clear_forest: {
    id: 'clear_forest',
    name: 'The Forest Menace',
    giver: 'ranger_reed',
    dialogue: {
      available: [
        'Goblins and orcs have\noverrun the old forest!',
        'Their chief lurks deep\ninside... defeat him!',
      ],
      active: [
        'The forest dungeon entrance\nis to the southwest. Good luck!',
      ],
      ready: [
        'The Orc Chief is defeated!\nYou\'re a true hero!',
        'The forest is safe again!\nHere is your reward!',
      ],
      completed: [
        'The forest is peaceful\nthanks to you!',
      ],
    },
    reward: { gold: 250, xp: 500 },
    objective: {
      type: 'kill',
      target: 'orc_chief',
      count: 1,
      description: 'Defeat the Orc Chief',
    },
  },

  escort_chloe: {
    id: 'escort_chloe',
    name: 'Chloe\'s Errand',
    giver: 'chef_chloe',
    dialogue: {
      available: [
        'I need to get to the inn\nbut the monsters scare me!',
        'Could you escort me there\nsafely? I\'ll pay you!',
      ],
      active: [
        'Lead the way to the inn!\nI\'ll follow you.',
      ],
      ready: [
        'We made it! Thank you\nso much for the escort!',
        'Here\'s your reward,\nbrave warrior!',
      ],
      completed: [
        'Thanks for getting me\nto the inn safely!',
      ],
    },
    reward: { gold: 75, xp: 100 },
    objective: {
      type: 'escort',
      target: 'chef_chloe',
      destination: { x: 712, y: 252 },
      count: 1,
      description: 'Escort Chloe to the Inn',
    },
  },

  urgent_medicine: {
    id: 'urgent_medicine',
    name: 'Urgent Medicine',
    giver: 'innkeeper',
    turnIn: 'farmer_buba',
    dialogue: {
      available: [
        'Farmer Buba is very ill!\nHe needs this medicine fast!',
        'Can you deliver it in\n90 seconds? Please hurry!',
      ],
      active: [
        'Hurry! Buba needs that\nmedicine quickly!',
      ],
      ready: [
        'You delivered it in time!\nThank goodness!',
      ],
      completed: [
        'Buba is feeling better\nthanks to you!',
      ],
    },
    turnInDialogue: [
      'Oh, medicine from the inn!\nJust in time...',
      'Thank you so much!\nI feel better already!',
    ],
    reward: { gold: 80, xp: 120 },
    timeLimit: 90,
    objective: {
      type: 'deliver',
      target: 'medicine',
      count: 1,
      description: 'Deliver Medicine to Buba',
    },
  },

  lost_axe: {
    id: 'lost_axe',
    name: 'The Lost Axe',
    giver: 'lumberjack_jack',
    dialogue: {
      available: [
        'I lost my favorite axe\nin the forest dungeon!',
        'Could you go find it?\nIt should be deep inside.',
      ],
      active: [
        'My axe is somewhere in\nthe forest dungeon...',
      ],
      ready: [
        'You found my axe!\nYou\'re a lifesaver!',
        'Here, take this reward!\nI owe you one!',
      ],
      completed: [
        'My axe is back where\nit belongs. Thanks!',
      ],
    },
    reward: { gold: 60, xp: 90 },
    objective: {
      type: 'fetch',
      target: 'golden_axe',
      fetchMap: 'forest',
      fetchX: 240,
      fetchY: 100,
      count: 1,
      description: 'Find Axe in Forest Dungeon',
    },
  },

  explore_pond: {
    id: 'explore_pond',
    name: 'The Old Pond',
    giver: 'fisherman_fin',
    dialogue: {
      available: [
        'Have you seen the pond\nto the south?',
        'Go check it out! It\'s\na peaceful spot.',
      ],
      active: [
        'Head south to find\nthe pond!',
      ],
      ready: [
        'You found it! Beautiful\nisn\'t it?',
        'The fish there are huge!\nThanks for exploring!',
      ],
      completed: [
        'The pond is lovely\nthis time of year...',
      ],
    },
    reward: { gold: 20, xp: 40 },
    objective: {
      type: 'visit',
      target: 'pond',
      count: 1,
      description: 'Visit the Pond',
    },
  },

  // ---- Phase 12: Mountain Quests ----
  yeti_hunt: {
    id: 'yeti_hunt',
    name: 'Yeti Hunter',
    giver: 'hermit_rolf',
    dialogue: {
      available: ['The mountain yetis have\nbeen terrorizing me!', 'Defeat 3 of them and\nI\'ll reward you well!'],
      active: ['Still hunting yetis?\nThey\'re nasty creatures!'],
      ready: ['Three yetis down!\nYou\'re braver than you look!', 'Here\'s your reward!'],
      completed: ['Thanks for clearing\nout those yetis!'],
    },
    reward: { gold: 60, xp: 80 },
    objective: { type: 'kill', target: 'yeti', count: 3, description: 'Defeat 3 Yetis' },
  },

  frozen_tome: {
    id: 'frozen_tome',
    name: 'The Frozen Tome',
    giver: 'hermit_rolf',
    dialogue: {
      available: ['There\'s an ancient tome\nlost in the mountain cave!', 'Retrieve it for me —\nit holds great knowledge!'],
      active: ['The tome is deep in\nthe mountain cave...'],
      ready: ['You found the Frozen\nTome! Incredible!', 'This knowledge will\nserve us well!'],
      completed: ['The tome\'s secrets are\nbeing studied now.'],
    },
    reward: { gold: 50, xp: 70 },
    objective: { type: 'fetch', target: 'frozen_tome', fetchItemId: 'frozen_tome', fetchMap: 'mountain_cave', fetchX: 176, fetchY: 40, count: 1, description: 'Find the Frozen Tome' },
  },

  clear_mountain: {
    id: 'clear_mountain',
    name: 'Mistress of Ice',
    giver: 'hermit_rolf',
    dialogue: {
      available: ['The Ice Witch has made\nher lair in the cave!', 'She controls the yetis!\nDefeat her and free the mountain!'],
      active: ['The Ice Witch lurks in\nthe mountain cave. Be careful!'],
      ready: ['The Ice Witch is slain!\nThe mountain is free!', 'You\'ve saved us all!\nTake this reward!'],
      completed: ['Peace returns to the\nmountain at last.'],
    },
    reward: { gold: 200, xp: 400 },
    objective: { type: 'kill', target: 'ice_witch', count: 1, description: 'Defeat the Ice Witch' },
  },

  // ---- Phase 12: Harbor Quests ----
  pirate_trouble: {
    id: 'pirate_trouble',
    name: 'Pirate Problem',
    giver: 'harbor_captain',
    dialogue: {
      available: ['Pirate ghosts have\nhaunted this harbor!', 'Drive away 4 of them\nand earn a reward!'],
      active: ['Those ghost pirates\nare still lurking about!'],
      ready: ['Four pirate ghosts gone!\nThe harbor is safer now!', 'Impressive work! Here\'s\nyour reward, adventurer!'],
      completed: ['The harbor is much\npeaceful now. Thank you!'],
    },
    reward: { gold: 70, xp: 90 },
    objective: { type: 'kill', target: 'pirate_ghost', count: 4, description: 'Defeat 4 Pirate Ghosts' },
  },

  lost_anchor: {
    id: 'lost_anchor',
    name: 'The Lost Anchor',
    giver: 'harbor_captain',
    dialogue: {
      available: ['My ship\'s anchor was\nstolen by sea creatures!', 'It\'s in the sea cave.\nCan you get it back?'],
      active: ['The lost anchor is\nsomewhere in the sea cave...'],
      ready: ['You found my anchor!\nNow I can sail again!', 'Here\'s a reward for\nyour trouble!'],
      completed: ['My ship is ready to\nsail again. Wonderful!'],
    },
    reward: { gold: 60, xp: 80 },
    objective: { type: 'fetch', target: 'lost_anchor', fetchItemId: 'lost_anchor', fetchMap: 'sea_cave', fetchX: 280, fetchY: 40, count: 1, description: 'Find the Lost Anchor' },
  },

  clear_harbor: {
    id: 'clear_harbor',
    name: 'Leviathan\'s End',
    giver: 'harbor_captain',
    dialogue: {
      available: ['A sea serpent lurks in\nthe cave beyond the harbor!', 'It\'s terrorizing all ships!\nWill you slay it?'],
      active: ['The sea serpent waits in\nthe sea cave. It\'s enormous!'],
      ready: ['You slew the sea serpent!\nLegend!', 'The seas are safe now.\nHere\'s your reward!'],
      completed: ['Trade flows freely now,\nthanks to you!'],
    },
    reward: { gold: 220, xp: 420 },
    objective: { type: 'kill', target: 'sea_serpent', count: 1, description: 'Defeat the Sea Serpent' },
  },

  // ---- Phase 12: Ruins Quests ----
  banish_undead: {
    id: 'banish_undead',
    name: 'Banish the Dead',
    giver: 'gravekeeper_mort',
    dialogue: {
      available: ['The ruins have become\na haven for the undead!', 'Destroy 5 zombies so\nthe dead may rest!'],
      active: ['Still zombies about!\nKeep fighting!'],
      ready: ['Five zombies banished!\nWell done, warrior!', 'The graves are\npeaceful again!'],
      completed: ['May the dead rest\nin peace now.'],
    },
    reward: { gold: 65, xp: 85 },
    objective: { type: 'kill', target: 'zombie', count: 5, description: 'Defeat 5 Zombies' },
  },

  sacred_relic: {
    id: 'sacred_relic',
    name: 'The Sacred Relic',
    giver: 'gravekeeper_mort',
    dialogue: {
      available: ['A holy relic was taken\ninto the ruins dungeon!', 'Without it the dead\ncannot rest. Retrieve it!'],
      active: ['The sacred relic is\nhidden in the ruins dungeon...'],
      ready: ['The Sacred Relic!\nBless you, warrior!', 'With this the dead\ncan finally rest!'],
      completed: ['Balance is restored\nto the ruins.'],
    },
    reward: { gold: 55, xp: 75 },
    objective: { type: 'fetch', target: 'sacred_relic', fetchItemId: 'sacred_relic', fetchMap: 'ruins_dungeon', fetchX: 176, fetchY: 40, count: 1, description: 'Find the Sacred Relic' },
  },

  clear_ruins: {
    id: 'clear_ruins',
    name: 'Knight of Death',
    giver: 'gravekeeper_mort',
    dialogue: {
      available: ['A Death Knight commands\nthe undead in the ruins!', 'He serves something\nterrible. Defeat him!'],
      active: ['The Death Knight holds\ncourt in the ruins dungeon!'],
      ready: ['The Death Knight falls!\nYou saved the ruins!', 'Take this — you\'ve\nearned it truly.'],
      completed: ['The ruins are at\npeace. For now.'],
    },
    reward: { gold: 240, xp: 450 },
    objective: { type: 'kill', target: 'death_knight', count: 1, description: 'Defeat the Death Knight' },
  },

  // ---- Phase 12: Lich Story ----
  lich_warning: {
    id: 'lich_warning',
    name: 'The Dark Tower',
    giver: 'auto',
    dialogue: {
      available: ['The Lich Tower glows\nwith dark energy...'],
      active: ['Six seals broken. The\nLich Tower awaits you.'],
      ready: ['The tower calls you\nto face the Lich King!'],
      completed: ['The Lich Tower stands\nopen before you.'],
    },
    reward: { gold: 0, xp: 0 },
    objective: { type: 'visit', target: 'lich_tower_door', count: 1, description: 'Defeat all 6 dungeon bosses' },
  },

  defeat_lich: {
    id: 'defeat_lich',
    name: 'End of Darkness',
    giver: 'auto',
    dialogue: {
      available: ['The Lich King, Magister\nVoleth, must be stopped!'],
      active: ['The Lich King awaits\nin his tower. End this!'],
      ready: ['The Lich King is defeated!\nDarkness is banished!'],
      completed: ['Legend of Lizzy,\nsavior of all!'],
    },
    reward: { gold: 500, xp: 1000 },
    objective: { type: 'kill', target: 'lich_king', count: 1, description: 'Defeat the Lich King' },
  },

  // ---- Phase 12: Crafting Quests ----
  gather_materials: {
    id: 'gather_materials',
    name: 'Alchemist\'s Request',
    giver: 'alchemist_vera',
    dialogue: {
      available: ['I need materials for\nmy experiments!', 'Bring me 3 Slime Goo\nand I\'ll teach you crafting!'],
      active: ['Kill slimes to get\nSlime Goo. Bring me 3!'],
      ready: ['Three Slime Goos!\nPerfect for brewing!', 'Let me show you\nhow to craft!'],
      completed: ['You\'ve learned the\nbasics of alchemy!'],
    },
    reward: { gold: 40, xp: 60 },
    objective: { type: 'collect_material', materialId: 'slime_goo', count: 3, description: 'Collect 3 Slime Goo' },
  },

  first_brew: {
    id: 'first_brew',
    name: 'First Brew',
    giver: 'alchemist_vera',
    dialogue: {
      available: ['Now try crafting\nsomething yourself!', 'Speak with me to open\nthe crafting menu!'],
      active: ['Craft anything once\nto complete this quest!'],
      ready: ['You crafted something!\nExcellent work!', 'You\'re a natural\nalchemist!'],
      completed: ['Keep crafting! There\'s\nmuch more to discover.'],
    },
    reward: { gold: 50, xp: 75 },
    objective: { type: 'craft', target: 'any', count: 1, description: 'Craft 1 Item' },
  },

  // ---- Phase 12: Side Quests ----
  harbor_fish: {
    id: 'harbor_fish',
    name: 'Harbor Haul',
    giver: 'harbor_captain',
    dialogue: {
      available: ['The harbor has amazing\nfishing spots!', 'Catch 3 fish here\nand I\'ll reward you!'],
      active: ['Stand at the harbor\ndock and press E to fish!'],
      ready: ['Three fish from\nthe harbor! Excellent!', 'Here\'s your reward,\ngood angler!'],
      completed: ['Best fishing spot\nin the whole coast!'],
    },
    reward: { gold: 80, xp: 100 },
    objective: { type: 'fish', target: 'any', count: 3, description: 'Catch 3 Fish at Harbor' },
  },

  mountain_rescue: {
    id: 'mountain_rescue',
    name: 'Lost on the Mountain',
    giver: 'hermit_rolf',
    dialogue: {
      available: ['A climber got lost\non the mountain!', 'Find and escort them\nback to the overworld!'],
      active: ['The lost climber needs\nto reach the overworld!'],
      ready: ['The climber is safe!\nThank you so much!', 'Here\'s your reward\nfor the rescue!'],
      completed: ['The climber has\nreturned home safely!'],
    },
    reward: { gold: 90, xp: 120 },
    objective: { type: 'escort', target: 'lost_climber', destination: { x: 520, y: 30 }, count: 1, description: 'Escort Climber to Overworld' },
  },

  // ---- Phase 14: NPC Story Arcs ----

  // Bob Arc
  bob_deed_recovery: {
    id: 'bob_deed_recovery',
    name: 'The Lost Deed',
    giver: 'farmer_bob',
    dialogue: {
      available: [
        'I can\'t find the deed to\nmy land anywhere.',
        'I think I dropped it in\nthat dark cave. Would you search for it?',
      ],
      active: ['My deed is somewhere in\nthe cave... please find it!'],
      ready: ['You found it! The deed\nto my farm!', 'Thank you so much,\nLizzy! Here\'s your reward!'],
      completed: ['The deed is safe now.\nThank goodness for you!'],
    },
    reward: { gold: 60, xp: 80 },
    objective: { type: 'fetch', target: 'deed_scroll', fetchItemId: 'deed_scroll', fetchMap: 'cave', count: 1, description: 'Find the Farm Deed in the Cave' },
  },

  bob_farm_investment: {
    id: 'bob_farm_investment',
    name: 'Farm\'s Future',
    giver: 'farmer_bob',
    dialogue: {
      available: [
        'Buba has been watching the\nfarm when I\'m away.',
        'I think she wants to help.\nCan you ask her for me?',
      ],
      active: ['Please ask Buba about\nhelping with the farm!'],
      ready: [
        'You got Buba\'s note!\nThis means everything to me.',
        'With her support I could expand...\nor keep it small and honest,\nthe way my father had it.',
      ],
      completed: ['My farm has a bright\nfuture ahead!'],
    },
    reward: { gold: 50, xp: 70 },
    objective: { type: 'collect', target: 'signed_note', count: 1, description: 'Get Buba\'s Note' },
  },

  // Mike Arc
  mike_journal_fragment: {
    id: 'mike_journal_fragment',
    name: 'A Brother\'s Memory',
    giver: 'miner_mike',
    dialogue: {
      available: [
        'My brother went into that\ncave years ago and never came back.',
        'Somewhere in there is his\njournal. Please... find it.',
      ],
      active: ['My brother\'s journal is\nsomewhere deep in the cave...'],
      ready: ['You found it... his\njournal. Thank you, Lizzy.', 'I didn\'t think I\'d ever\nsee this again.'],
      completed: ['Knowing he left something\nbehind... it helps.'],
    },
    reward: { gold: 50, xp: 70 },
    objective: { type: 'fetch', target: 'journal_fragment', fetchItemId: 'journal_fragment', fetchMap: 'cave', count: 1, description: 'Find the Journal in the Cave' },
  },

  mike_family_locket: {
    id: 'mike_family_locket',
    name: 'The Locket',
    giver: 'miner_mike',
    dialogue: {
      available: [
        'The journal says he hid a\nfamily locket in the desert temple.',
        'His children deserve to\nhave it. Can you find it?',
      ],
      active: ['The locket is hidden in\nthe pharaoh\'s chamber...'],
      ready: [
        '...the locket. He\'s really\ngone, isn\'t he?',
        'His children will ask what\nhappened. What should I tell them?',
      ],
      completed: ['Whatever you told them to say...\nI think it was the right choice.'],
    },
    reward: { gold: 80, xp: 100 },
    objective: { type: 'fetch', target: 'family_locket', fetchItemId: 'family_locket', fetchMap: 'pharaoh_chamber', count: 1, description: 'Find the Locket in the Desert Temple' },
  },

  // Fin Arc
  fin_sea_essence: {
    id: 'fin_sea_essence',
    name: 'Deep Sea Rig',
    giver: 'fisherman_fin',
    dialogue: {
      available: [
        'Old-timers speak of a fish\nthe size of a boat in these waters!',
        'I need sea essence for a\ndeep-sea rig. Could you gather some from the sea cave?',
      ],
      active: ['Gather 3 sea essence from\nsea creatures in the sea cave!'],
      ready: ['You got the sea essence!\nNow I can build the rig!', 'Here\'s your reward —\nyou\'re a true adventurer!'],
      completed: ['The rig is built!\nHistory awaits!'],
    },
    reward: { gold: 60, xp: 80 },
    objective: { type: 'collect_material', materialId: 'sea_essence', count: 3, description: 'Collect 3 Sea Essence' },
  },

  fin_deep_cast: {
    id: 'fin_deep_cast',
    name: 'The Legendary Cast',
    giver: 'fisherman_fin',
    dialogue: {
      available: [
        'The rig\'s built! Meet me\nat the harbor dock!',
        'We\'ll make history together!',
      ],
      active: ['Head to the harbor dock!\nI\'ll meet you there!'],
      ready: [
        'I caught it! The legendary\nsea bass of Greendale Bay!',
        'Biggest thing I\'ve ever\npulled from the water. What should we do with it, Lizzy?',
      ],
      completed: ['A day I\'ll never forget.\nThank you, Lizzy.'],
    },
    reward: { gold: 50, xp: 70 },
    objective: { type: 'visit', visitMap: 'harbor', target: 'harbor_dock', count: 1, description: 'Meet Fin at the Harbor' },
  },

  // Jack Arc
  jack_tree_investigation: {
    id: 'jack_tree_investigation',
    name: 'The Ancient Tree',
    giver: 'lumberjack_jack',
    dialogue: {
      available: [
        'There\'s a tree in the deep\nforest I\'ve never dared cut.',
        'It glows at night! Will you\ngo take a look?',
      ],
      active: ['Head into the forest and\nfind that glowing ancient tree!'],
      ready: ['You saw it! Something\ndark has gotten into the roots.', 'I\'ve seen trees like that\nin old woodcutter\'s tales...'],
      completed: ['That tree... it\'s something\nvery old.'],
    },
    reward: { gold: 40, xp: 60 },
    objective: { type: 'visit', visitMap: 'forest', target: 'ancient_tree', count: 1, description: 'Visit the Forest' },
  },

  jack_tree_materials: {
    id: 'jack_tree_materials',
    name: 'Purification',
    giver: 'lumberjack_jack',
    dialogue: {
      available: [
        'Something dark has gotten\ninto the roots.',
        'A purification recipe needs\n2 crystal shards. Can you find them?',
      ],
      active: ['Find 2 crystal shards\nto purify the ancient tree!'],
      ready: [
        'I\'ve got the shards.',
        'That tree is worth a fortune\nin lumber... but purification\ncould restore the whole forest.',
      ],
      completed: ['Whatever we chose...\nthe forest will remember.'],
    },
    reward: { gold: 60, xp: 80 },
    objective: { type: 'collect_material', materialId: 'crystal_shard', count: 2, description: 'Collect 2 Crystal Shards' },
  },

  // Original arena quest
  arena_challenge: {
    id: 'arena_challenge',
    name: 'Arena Champion',
    giver: 'arena_crystal',
    dialogue: {
      available: [
        'The Arena Crystal pulses\nwith ancient energy!',
        'Survive 3 waves of enemies\nto prove your worth!',
      ],
      active: [
        'Defeat the waves to\nclaim your glory!',
      ],
      ready: [
        'You survived all 3 waves!\nYou are the Arena Champion!',
      ],
      completed: [
        'The arena remembers\nyour victory!',
      ],
    },
    reward: { gold: 150, xp: 200 },
    objective: {
      type: 'kill',
      target: 'arena_wave',
      count: 3,
      description: 'Survive 3 Waves',
    },
  },
};
