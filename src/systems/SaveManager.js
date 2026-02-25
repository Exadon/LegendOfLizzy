const SAVE_KEY = 'legendoflizzy_save';

export class SaveManager {
  static save(gameScene) {
    const data = {
      questState: gameScene.questManager.saveState(),
      playerHealth: gameScene.player.health,
      gold: gameScene.gold,
      xp: gameScene.xp,
      level: gameScene.level,
      mapName: gameScene.mapData.name,
      playerX: Math.round(gameScene.player.x),
      playerY: Math.round(gameScene.player.y),
      inventory: gameScene.inventory ? gameScene.inventory.saveState() : null,
      dayTime: gameScene.dayTime ?? 0.35,
      equipment: gameScene.equipment ? gameScene.equipment.saveState() : null,
      openedChests: gameScene._getOpenedChests ? gameScene._getOpenedChests() : [],
      trackedQuestId: gameScene.trackedQuestId || null,
      bestiary: gameScene.bestiary || {},
      timedQuestId: gameScene._timedQuestId || null,
      timedRemaining: gameScene._timedRemaining || 0,
      tutorialShown: gameScene.tutorialShown || false,
      playerAttackBonus: gameScene.playerAttackBonus || 0,
      unlockedTeleports: gameScene.unlockedTeleports || [],
      starFragments: gameScene.starFragments || 0,
      isNewGamePlus: gameScene.isNewGamePlus || false,
      materials: gameScene.materials || {},
      darkSeals: gameScene.darkSeals || 0,
      petAffection: gameScene.petAffection || 0,
      visitedChunks: gameScene.visitedChunks || {},
      lichTowerUnlocked: gameScene._lichTowerUnlocked || false,
      achievements: gameScene.achievements || {},
      _craftCount: gameScene._craftCount || 0,
      _fishCount: gameScene._fishCount || 0,
      _totalGoldEarned: gameScene._totalGoldEarned || 0,
      _totalKills: gameScene._totalKills || 0,
      _visitedMaps: Array.from(gameScene._visitedMaps || []),
      weather: gameScene._currentWeather || 'clear',
      _regenBonus: gameScene._regenBonus || 0,
      npcAffection: gameScene.npcAffection || {},
      storyChoices: gameScene.storyChoices || {},
      npcGiftGiven: gameScene._npcGiftGiven || {},
      fishLuckBonus: gameScene._fishLuckBonus || false,
      jackTreeChoice: gameScene._jackTreeChoice || null,
      // Phase 15 — Wardrobe
      equippedOutfit:   gameScene.equippedOutfit   || { hat: null, dress: null, acc: null },
      unlockedWardrobe: gameScene.unlockedWardrobe  || {},
      petType:          gameScene.petType            || null,
      // Phase 20 — Farm
      farmAnimals:  gameScene.farmAnimals  || { sheep: false, cow: false, horse: false },
      farmProduces: gameScene.farmProduces || { wool: 0, milk: 0 },
      farmFed:      gameScene.farmFed      || { sheep: false, cow: false },
      // Phase 22 — Story Mode + Pet Name
      storyMode: gameScene.storyMode || false,
      petName:   gameScene.petName   || null,
      // Phase 24 — Friends & Flowers
      flowerGiftsGiven:  gameScene.flowerGiftsGiven  || {},
      rainbowCrystals:   gameScene.rainbowCrystals   || [],
      treasureMapsFound: gameScene.treasureMapsFound || [],
      digSpotsDug:       gameScene.digSpotsDug       || [],
      stargazerComplete: gameScene.stargazerComplete  || false,
      // Phase 23 — Gather, Cook & Grow
      farmAnimalNames:   gameScene.farmAnimalNames   || { sheep: null, cow: null, horse: null },
      hasNet:            gameScene.hasNet             || false,
      caughtButterflies: gameScene.caughtButterflies  || {},
      hasWateringCan:    gameScene.hasWateringCan     || false,
      seeds:             gameScene.seeds              || {},
      gardenFlowers:     gameScene.gardenFlowers      || {},
      // Phase 27 — A Hero's Welcome
      bearerLetters: gameScene.bearerLetters || [],
      thankYouGiven: gameScene.thankYouGiven || [],
      houseCandles:  gameScene.houseCandles  || false,
      // Phase 28 — Fish Tales & Cozy Seasons
      caughtFishSpecies: gameScene.caughtFishSpecies || {},
      dreamsHad:         gameScene.dreamsHad         || 0,
      seasonTokens:      gameScene.seasonTokens      || [],
      seasonIndex:       gameScene.seasonIndex       || 0,
      // Phase 29 — Cozy Corners
      houseDecor:  gameScene.houseDecor  || {},
      houseTheme:  gameScene.houseTheme  || null,
      musicMelody: gameScene.musicMelody || 0,
      // Phase 30 — Grand Festival
      festivalComplete: gameScene.festivalComplete || false,
      festivalStalls:   gameScene.festivalStalls   || [],
      // Phase 31 — Wishes & Wonders
      wishesGranted:    gameScene.wishesGranted    || 0,
      firefliesCaught:  gameScene.firefliesCaught  || 0,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }
}
