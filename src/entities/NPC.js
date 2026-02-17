import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false); // dynamic body

    this.body.setSize(8, 8);
    this.body.setOffset(28, 44);
    this.setCollideWorldBounds(true);
    this.body.setImmovable(true);

    this.npcId = config.id || 'npc';
    this.npcName = config.name || 'NPC';
    this.questId = config.questId || null;
    this.idleAnim = config.idleAnim || null;
    this.dialogueLines = config.dialogueLines || null;

    // Wandering config
    this.wanders = config.wanders || false;
    this.wanderSpeed = config.speed || 12;
    this.wanderRadius = config.wanderRadius || 40;
    this.wanderAnims = config.wanderAnims || null;
    this.homeX = x;
    this.homeY = y;
    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };
    this.isWandering = false;

    // Schedule: array of { time, x, y } sorted by time (0-1 dayTime)
    // NPC walks to the scheduled position when dayTime passes
    this.schedule = config.schedule || null;
    this._scheduleTarget = null;

    // Interaction prompt
    this.prompt = scene.add.text(x, y - 40, '[E]', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setDepth(9999);

    // Quest indicator (! or ?)
    this.questIcon = scene.add.text(x, y - 48, '', {
      fontSize: '10px',
      fontFamily: 'CuteFantasy',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);

    this.canInteract = false;

    if (this.idleAnim) {
      this.play(this.idleAnim);
    }
  }

  update(time, delta, player, questManager, dayTime) {
    // Schedule-based home position update
    if (this.schedule && dayTime !== undefined) {
      this._updateSchedule(dayTime);
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.canInteract = dist < 40;
    this.prompt.setVisible(this.canInteract);

    if (this.canInteract) {
      // Stop wandering and face player
      this.setVelocity(0, 0);
      this.isWandering = false;
      this._scheduleTarget = null;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.setFlipX(dx < 0);
        if (this.idleAnim) {
          const baseAnim = this.idleAnim.replace(/-down$|-right$|-up$/, '');
          this.play(baseAnim + '-right', true);
          this.setFlipX(dx < 0);
        }
      } else if (dy < 0) {
        this.setFlipX(false);
        if (this.idleAnim) {
          const baseAnim = this.idleAnim.replace(/-down$|-right$|-up$/, '');
          this.play(baseAnim + '-up', true);
        }
      } else {
        this.setFlipX(false);
        if (this.idleAnim) this.play(this.idleAnim, true);
      }
    } else if (this._scheduleTarget) {
      // Walk toward schedule target
      this._walkToTarget(delta);
    } else if (this.wanders) {
      this.doWander(time, delta);
    } else {
      this.setVelocity(0, 0);
      if (this.idleAnim) this.play(this.idleAnim, true);
    }

    // Update quest icon
    this.updateQuestIcon(questManager);

    this.setDepth(this.y);
    this.prompt.setPosition(this.x, this.y - 40);
    this.questIcon.setPosition(this.x, this.y - 48);
  }

  doWander(time, delta) {
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      // Check if too far from home, leash back
      const distFromHome = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
      if (distFromHome > this.wanderRadius) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY);
        this.wanderDirection = { x: Math.cos(angle), y: Math.sin(angle) };
      } else if (Math.random() < 0.35) {
        this.wanderDirection = { x: 0, y: 0 };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDirection = { x: Math.cos(angle), y: Math.sin(angle) };
      }
      this.wanderTimer = 1500 + Math.random() * 2500;
    }

    const vx = this.wanderDirection.x * this.wanderSpeed;
    const vy = this.wanderDirection.y * this.wanderSpeed;
    this.setVelocity(vx, vy);

    if (vx === 0 && vy === 0) {
      if (this.idleAnim) this.play(this.idleAnim, true);
      this.isWandering = false;
    } else if (this.wanderAnims) {
      this.isWandering = true;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.play(this.wanderAnims.right, true);
        this.setFlipX(vx < 0);
      } else if (vy > 0) {
        this.play(this.wanderAnims.down, true);
        this.setFlipX(false);
      } else {
        this.play(this.wanderAnims.up, true);
        this.setFlipX(false);
      }
    }
  }

  updateQuestIcon(questManager) {
    if (!this.questId || !questManager) {
      this.questIcon.setVisible(false);
      return;
    }

    const quest = questManager.getQuest(this.questId);
    if (!quest) {
      this.questIcon.setVisible(false);
      return;
    }

    switch (quest.state) {
      case 'available':
        this.questIcon.setText('!');
        this.questIcon.setColor('#ffdd00');
        this.questIcon.setVisible(true);
        break;
      case 'active':
        this.questIcon.setText('?');
        this.questIcon.setColor('#aaaaaa');
        this.questIcon.setVisible(true);
        break;
      case 'ready':
        this.questIcon.setText('?');
        this.questIcon.setColor('#ffdd00');
        this.questIcon.setVisible(true);
        break;
      case 'completed':
        this.questIcon.setVisible(false);
        break;
    }
  }

  _updateSchedule(dayTime) {
    // Find current schedule entry (latest entry whose time <= dayTime)
    let current = this.schedule[0];
    for (const entry of this.schedule) {
      if (dayTime >= entry.time) current = entry;
    }
    // If home position changed, set a walk target
    if (current && (current.x !== this.homeX || current.y !== this.homeY)) {
      this.homeX = current.x;
      this.homeY = current.y;
      const distToHome = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
      if (distToHome > 8) {
        this._scheduleTarget = { x: this.homeX, y: this.homeY };
      }
    }
  }

  _walkToTarget() {
    const tx = this._scheduleTarget.x;
    const ty = this._scheduleTarget.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 6) {
      this._scheduleTarget = null;
      this.setVelocity(0, 0);
      if (this.idleAnim) this.play(this.idleAnim, true);
      return;
    }

    const spd = this.wanderSpeed * 1.5;
    const nx = dx / dist;
    const ny = dy / dist;
    this.setVelocity(nx * spd, ny * spd);

    if (this.wanderAnims) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.play(this.wanderAnims.right, true);
        this.setFlipX(dx < 0);
      } else if (dy > 0) {
        this.play(this.wanderAnims.down, true);
        this.setFlipX(false);
      } else {
        this.play(this.wanderAnims.up, true);
        this.setFlipX(false);
      }
    }
  }

  getDialogue(questManager, gameScene) {
    // Non-quest NPCs with custom dialogue lines
    if (this.dialogueLines && !this.questId) {
      // Add reputation-aware greetings
      if (gameScene) {
        const greeting = this._getReputationGreeting(gameScene);
        if (greeting) return [greeting, ...this.dialogueLines];
      }
      return this.dialogueLines;
    }

    if (!this.questId || !questManager) {
      if (gameScene) {
        const greeting = this._getReputationGreeting(gameScene);
        if (greeting) return [greeting];
      }
      return this.dialogueLines || ['Hello there, traveler!'];
    }

    const quest = questManager.getQuest(this.questId);
    if (!quest) return this.dialogueLines || ['Hello there!'];

    return quest.dialogue[quest.state] || ['...'];
  }

  _getReputationGreeting(gameScene) {
    const level = gameScene.level || 1;
    const bossKilled = gameScene.questManager?.getQuest('clear_cave')?.state === 'completed';
    const questsDone = gameScene.questManager ? gameScene.questManager.getAllQuests().filter(q => q.state === 'completed').length : 0;

    if (bossKilled) {
      const lines = [
        'Lizzy! The legendary warrior\nwho slew the Skeleton King!',
        'I can\'t believe THE Lizzy\nis talking to me!',
        'You\'re the hero who cleared\nthe cave! Amazing!',
        'Everyone talks about your\nbravery, Lizzy!',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }
    if (level >= 5 || questsDone >= 3) {
      const lines = [
        'Lizzy! I\'ve heard tales\nof your adventures!',
        'You\'re becoming quite the\nwarrior, Lizzy!',
        'The whole town talks about\nyour brave deeds!',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }
    if (level >= 3 || questsDone >= 1) {
      const lines = [
        'Oh, you\'re Lizzy!\nI\'ve heard good things!',
        'Welcome, Lizzy! Making\na name for yourself!',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }
    return null;
  }
}
