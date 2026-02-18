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
