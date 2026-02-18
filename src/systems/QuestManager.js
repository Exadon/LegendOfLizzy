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
};
