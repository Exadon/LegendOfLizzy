import Phaser from 'phaser';

export class QuestBook {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(15000)
      .setVisible(false);

    // Dark overlay
    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.container.add(overlay);

    // Book background using Book_UI sprite
    const bookX = w / 2;
    const bookY = h / 2;
    const bookW = 210;
    const bookH = 126;
    const bookLeft = bookX - bookW / 2;
    const bookTop = bookY - bookH / 2;

    // Page content areas (proportional to 240x144 source):
    // Left page usable: ~x 15 to 90, Right page: ~x 120 to 195
    const leftX = bookLeft + 15;
    const leftW = 75;
    const rightX = bookLeft + 120;
    const rightW = 75;
    const pageTop = bookTop + 10;

    const book = scene.add.image(bookX, bookY, 'book-ui', 'book-open-tan');
    book.setDisplaySize(bookW, bookH);
    this.container.add(book);

    // Title centered on left page
    const title = scene.add.text(leftX + leftW / 2, pageTop + 2, 'QUESTS', {
      fontSize: '9px',
      fontFamily: 'CuteFantasy',
      color: '#3d2510',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // Quest text on left page
    this.questTextLeft = scene.add.text(leftX, pageTop + 14, '', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#3d2510',
      lineSpacing: 2,
      wordWrap: { width: leftW },
    });
    this.container.add(this.questTextLeft);

    // Right page header
    const rightTitle = scene.add.text(rightX + rightW / 2, pageTop + 2, 'LOG', {
      fontSize: '9px',
      fontFamily: 'CuteFantasy',
      color: '#3d2510',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(rightTitle);

    // Quest text on right page
    this.questTextRight = scene.add.text(rightX, pageTop + 14, '', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#3d2510',
      lineSpacing: 2,
      wordWrap: { width: rightW },
    });
    this.container.add(this.questTextRight);

    // Hint below book
    const hint = scene.add.text(bookX, bookTop + bookH + 6, 'Press Q to close', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0);
    this.container.add(hint);
  }

  show(questManager) {
    this.visible = true;
    this.container.setVisible(true);
    this.updateContent(questManager);
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
  }

  toggle(questManager) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(questManager);
    }
    return this.visible;
  }

  updateContent(questManager) {
    if (!questManager) return;

    const allQuests = questManager.getAllQuests();
    let leftLines = [];
    let rightLines = [];

    // Active quests (left page)
    const active = allQuests.filter(q => q.state === 'active' || q.state === 'ready');
    if (active.length > 0) {
      leftLines.push('-- ACTIVE --');
      for (const q of active) {
        const status = q.state === 'ready' ? ' [DONE!]' : '';
        leftLines.push('');
        leftLines.push(`> ${q.name}${status}`);
        if (q.state === 'ready') {
          leftLines.push(`  Complete!`);
        } else {
          leftLines.push(`  ${q.progress}/${q.objective.count}`);
        }
      }
    }

    // Available quests (right page top)
    const available = allQuests.filter(q => q.state === 'available');
    if (available.length > 0) {
      rightLines.push('-- AVAILABLE --');
      for (const q of available) {
        rightLines.push(`  ! ${q.name}`);
      }
      rightLines.push('');
    }

    // Completed quests (right page bottom)
    const completed = allQuests.filter(q => q.state === 'completed');
    if (completed.length > 0) {
      rightLines.push('-- COMPLETED --');
      for (const q of completed) {
        rightLines.push(`  * ${q.name}`);
      }
    }

    if (leftLines.length === 0 && rightLines.length === 0) {
      leftLines.push('No quests yet.');
      leftLines.push('');
      leftLines.push('Talk to NPCs');
      leftLines.push('with a yellow !');
      leftLines.push('above them.');
    }

    this.questTextLeft.setText(leftLines.join('\n'));
    this.questTextRight.setText(rightLines.join('\n'));
  }
}
