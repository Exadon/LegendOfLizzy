// Procedural 8-bit sound effects using Web Audio API
export class SFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    const saved = localStorage.getItem('lizzy-sfx-vol');
    this.masterGain.gain.setValueAtTime(saved !== null ? saved / 10 : 0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(level) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.01);
    }
  }

  play(name) {
    if (this.muted) return;
    this.ensureContext();
    const fn = this['_' + name];
    if (fn) fn.call(this);
  }

  // Quick helper to create oscillator + gain
  _osc(type, freq, freqEnd, dur, vol = 0.12) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  // Sword swing - quick swoosh
  _swordSwing() {
    this._osc('sawtooth', 600, 150, 0.08, 0.1);
  }

  // Charged swing - heavier, deeper swoosh
  _chargedSwing() {
    this._osc('sawtooth', 400, 100, 0.12, 0.14);
    this._osc('square', 300, 80, 0.1, 0.06);
    this._osc('sine', 800, 300, 0.08, 0.05);
  }

  // Hit impact - noise burst + tone
  _hit() {
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    noise.start(t);
    this._osc('square', 200, 80, 0.06, 0.08);
  }

  // Enemy death - descending pop
  _enemyDeath() {
    this._osc('square', 400, 60, 0.2, 0.1);
    this._osc('sine', 800, 200, 0.15, 0.06);
  }

  // Player hurt - quick descending buzz
  _playerHurt() {
    this._osc('square', 300, 80, 0.15, 0.12);
  }

  // Pickup item - ascending chirp
  _pickup() {
    this._osc('sine', 500, 1200, 0.1, 0.1);
  }

  // Quest accept - three ascending tones
  _questAccept() {
    const t = this.ctx.currentTime;
    const notes = [440, 554, 659];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.1, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.1 + 0.15);
    });
  }

  // Quest complete - victory fanfare
  _questComplete() {
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.1, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.12 + 0.2);
    });
  }

  // Dialogue blip
  _dialogue() {
    this._osc('sine', 600 + Math.random() * 200, null, 0.03, 0.04);
  }

  // Door enter - whoosh up
  _doorEnter() {
    this._osc('sine', 200, 800, 0.2, 0.08);
  }

  // Menu select
  _select() {
    this._osc('square', 600, 800, 0.06, 0.06);
  }

  // Dodge roll - quick whoosh
  _dodge() {
    this._osc('sawtooth', 300, 600, 0.12, 0.06);
    this._osc('sine', 400, 100, 0.1, 0.04);
  }

  // Unicorn heal - magical ascending harp
  _unicornHeal() {
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.07, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  // Fairy buff - twinkling chime
  _fairyBuff() {
    const t = this.ctx.currentTime;
    const notes = [1047, 1319, 1568, 1319, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.06, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.06 + 0.15);
    });
  }

  // Coin spend - descending clink
  _coinSpend() {
    this._osc('sine', 1200, 600, 0.08, 0.08);
    this._osc('square', 800, 400, 0.06, 0.04);
  }

  // Potion use - bubbly ascending arpeggio
  _potionUse() {
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.08, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.06 + 0.12);
    });
  }

  // Wizard teleport - magical swirl
  _wizardTeleport() {
    const t = this.ctx.currentTime;
    const notes = [392, 523, 659, 784, 1047, 784, 659];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.08, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.07 + 0.18);
    });
  }

  // Fireball cast - whooshing flame
  _fireball() {
    this._osc('sawtooth', 200, 600, 0.15, 0.1);
    this._osc('square', 150, 400, 0.12, 0.06);
  }

  // Ice bolt cast - crystalline ping
  _icebolt() {
    this._osc('sine', 800, 1600, 0.12, 0.08);
    this._osc('triangle', 1200, 2000, 0.08, 0.05);
  }

  // Heal cast - warm ascending chime
  _heal() {
    const t = this.ctx.currentTime;
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.08, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  // Level up - ascending major arpeggio
  _levelUp() {
    const t = this.ctx.currentTime;
    const notes = [262, 330, 392, 523]; // C-E-G-C
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.12, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.1 + 0.18);
    });
  }

  // Boss slam - heavy impact
  _bossSlam() {
    this._osc('sine', 80, 40, 0.2, 0.15);
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    noise.start(t);
  }

  // Item pickup - bright ping
  _itemPickup() {
    this._osc('triangle', 800, 1200, 0.1, 0.1);
  }

  // Menu cancel - descending buzz
  _menuCancel() {
    this._osc('square', 400, 200, 0.12, 0.1);
  }

  // Chest open - wooden creak + ascending coin jingle
  _chestOpen() {
    // Wooden creak
    this._osc('sawtooth', 100, 60, 0.12, 0.08);
    // Ascending coin jingle
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + 0.08 + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.08, t + 0.08 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t + 0.08);
      osc.stop(t + 0.08 + i * 0.06 + 0.12);
    });
  }

  // Fish cast - whoosh + water plop
  _fishCast() {
    this._osc('sawtooth', 400, 150, 0.1, 0.06);
    // Water plop
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);
    gain.gain.setValueAtTime(0.1, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(t + 0.1);
    osc.stop(t + 0.25);
  }

  // Fish catch - bubbly ascending arpeggio
  _fishCatch() {
    const t = this.ctx.currentTime;
    const notes = [392, 494, 587, 698, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.09, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + i * 0.06 + 0.15);
    });
  }

  // Pet bark - short yappy burst
  _petBark() {
    this._osc('square', 500, 800, 0.06, 0.1);
    this._osc('sawtooth', 600, 300, 0.08, 0.06);
  }

  // Chicken collect - ascending chirp pair
  _chickenCollect() {
    this._osc('sine', 800, 1400, 0.08, 0.1);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.18);
    gain.gain.setValueAtTime(0.1, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(t + 0.1);
    osc.stop(t + 0.2);
  }
}
