// Procedural 8-bit background music using Web Audio API
// Uses lookahead scheduling for tight timing

const TRACKS = {
  overworld: {
    bpm: 120,
    // C major adventure feel: I-V-vi-IV progression
    chords: [
      [262, 330, 392],  // C major
      [196, 247, 294],  // G major
      [220, 262, 330],  // A minor
      [175, 220, 262],  // F major
    ],
    bass: [131, 98, 110, 87],  // Root notes one octave down
    melody: [
      523, 587, 659, 587, 523, 494, 523, 587,
      392, 440, 494, 523, 587, 523, 494, 440,
      440, 494, 523, 587, 659, 587, 523, 494,
      349, 392, 440, 392, 349, 330, 349, 392,
    ],
    arpSpeed: 2, // notes per beat
    melodySpeed: 2,
    wave: 'square',
    bassWave: 'triangle',
    melodyWave: 'square',
    volume: 0.04,
    bassVol: 0.06,
    melodyVol: 0.03,
  },
  interior: {
    bpm: 80,
    // Gentle pentatonic feel
    chords: [
      [262, 330, 392],  // C
      [220, 294, 349],  // Dm7-ish
      [262, 330, 392],  // C
      [247, 311, 370],  // B dim approx -> softer
    ],
    bass: [131, 110, 131, 123],
    melody: [
      523, 494, 440, 392, 440, 494, 523, 0,
      494, 440, 392, 349, 392, 440, 494, 0,
      523, 587, 523, 494, 440, 494, 523, 0,
      494, 440, 392, 440, 494, 523, 494, 0,
    ],
    arpSpeed: 1.5,
    melodySpeed: 1,
    wave: 'sine',
    bassWave: 'sine',
    melodyWave: 'sine',
    volume: 0.03,
    bassVol: 0.04,
    melodyVol: 0.025,
  },
  boss: {
    bpm: 160,
    // Am/Dm aggressive: i-iv progression, staccato
    chords: [
      [220, 262, 330],  // Am
      [147, 175, 220],  // Dm
      [220, 262, 330],  // Am
      [165, 196, 247],  // Em
    ],
    bass: [110, 73, 110, 82],
    melody: [
      660, 784, 880, 784, 660, 587, 523, 587,
      660, 784, 880, 1047, 880, 784, 660, 587,
      523, 587, 660, 784, 880, 784, 660, 523,
      587, 660, 523, 440, 523, 587, 660, 784,
    ],
    arpSpeed: 3,
    melodySpeed: 2,
    wave: 'square',
    bassWave: 'square',
    melodyWave: 'square',
    volume: 0.04,
    bassVol: 0.06,
    melodyVol: 0.035,
  },
  cave: {
    bpm: 70,
    // Sparse, deep drones with occasional high pings
    chords: [
      [82, 110, 165],   // deep fifth
      [73, 98, 147],    // lower drone
      [82, 110, 165],   // repeat
      [98, 131, 196],   // slightly higher
    ],
    bass: [41, 37, 41, 49],
    melody: [
      0, 0, 0, 1047, 0, 0, 0, 0,
      0, 0, 784, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1319, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 880, 0,
    ],
    arpSpeed: 1,
    melodySpeed: 0.5,
    wave: 'sine',
    bassWave: 'sine',
    melodyWave: 'triangle',
    volume: 0.03,
    bassVol: 0.05,
    melodyVol: 0.02,
  },
  desert: {
    bpm: 100,
    // Pentatonic open fifths, lighter feel
    chords: [
      [220, 330, 440],  // A open fifth
      [196, 294, 392],  // G open fifth
      [175, 262, 349],  // F open fifth
      [196, 294, 392],  // G open fifth
    ],
    bass: [110, 98, 87, 98],
    melody: [
      440, 494, 587, 659, 587, 494, 440, 0,
      392, 440, 494, 587, 494, 440, 392, 0,
      349, 440, 494, 587, 659, 587, 494, 440,
      392, 440, 587, 494, 440, 392, 349, 0,
    ],
    arpSpeed: 2,
    melodySpeed: 1.5,
    wave: 'triangle',
    bassWave: 'sine',
    melodyWave: 'sawtooth',
    volume: 0.03,
    bassVol: 0.04,
    melodyVol: 0.025,
  },
  victory: {
    bpm: 120,
    // C major bright celebratory: I-IV-V-I ascending
    chords: [
      [262, 330, 392],  // C major
      [175, 220, 262],  // F major
      [196, 247, 294],  // G major
      [262, 330, 392],  // C major (high)
    ],
    bass: [131, 87, 98, 131],
    melody: [
      523, 587, 659, 784, 880, 784, 659, 784,
      880, 1047, 880, 784, 659, 784, 880, 1047,
      784, 880, 1047, 1175, 1047, 880, 784, 880,
      1047, 1175, 1319, 1175, 1047, 880, 784, 1047,
    ],
    arpSpeed: 2,
    melodySpeed: 2,
    wave: 'triangle',
    bassWave: 'sine',
    melodyWave: 'sine',
    volume: 0.04,
    bassVol: 0.05,
    melodyVol: 0.035,
  },
};

export class Music {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.playing = false;
    this.currentTrack = null;
    this.currentTrackName = null;
    this.scheduleId = null;
    this.nextNoteTime = 0;
    this.arpIndex = 0;
    this.bassIndex = 0;
    this.melodyIndex = 0;
    this.beatCount = 0;
    this.activeNodes = [];
  }

  init(audioCtx) {
    this.ctx = audioCtx;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext(sfx) {
    if (!this.ctx && sfx) {
      sfx.ensureContext();
      this.init(sfx.ctx);
    }
  }

  play(trackName, sfx) {
    this.ensureContext(sfx);
    if (!this.ctx) return;

    const track = TRACKS[trackName];
    if (!track) return;

    // If already playing this track, do nothing
    if (this.playing && this.currentTrackName === trackName) return;

    this.stop();
    this.currentTrack = track;
    this.currentTrackName = trackName;
    this.playing = true;
    this.arpIndex = 0;
    this.bassIndex = 0;
    this.melodyIndex = 0;
    this.beatCount = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;

    // Fade in
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1.0, this.ctx.currentTime + 1.5);

    this._schedule();
  }

  stop() {
    this.playing = false;
    if (this.scheduleId) {
      clearTimeout(this.scheduleId);
      this.scheduleId = null;
    }
    // Stop all active oscillators
    const now = this.ctx ? this.ctx.currentTime : 0;
    for (const node of this.activeNodes) {
      try {
        if (node.gain) {
          node.gain.gain.setValueAtTime(node.gain.gain.value, now);
          node.gain.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        node.osc.stop(now + 0.15);
      } catch {
        // Already stopped
      }
    }
    this.activeNodes = [];
    this.currentTrack = null;
    this.currentTrackName = null;
  }

  fadeOut(duration = 1.5) {
    if (!this.ctx || !this.playing) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
    setTimeout(() => this.stop(), duration * 1000 + 100);
  }

  _schedule() {
    if (!this.playing || !this.currentTrack) return;

    const track = this.currentTrack;
    const secondsPerBeat = 60.0 / track.bpm;
    const lookahead = 0.15; // seconds ahead to schedule

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this._playBeat(track, this.nextNoteTime, secondsPerBeat);
      this.beatCount++;
      this.nextNoteTime += secondsPerBeat / track.arpSpeed;
    }

    this.scheduleId = setTimeout(() => this._schedule(), 50);
  }

  _playBeat(track, time, secondsPerBeat) {
    const noteDur = secondsPerBeat / track.arpSpeed * 0.8;
    const chordIndex = Math.floor(this.beatCount / (track.arpSpeed * 4)) % track.chords.length;
    const chord = track.chords[chordIndex];

    // Arpeggio note
    const arpNote = chord[this.arpIndex % chord.length];
    this._playNote(track.wave, arpNote, time, noteDur, track.volume);
    this.arpIndex++;

    // Bass: play on beat 1 of each chord (every 4 * arpSpeed beats)
    if (this.beatCount % (track.arpSpeed * 4) === 0) {
      const bassNote = track.bass[chordIndex];
      this._playNote(track.bassWave, bassNote, time, secondsPerBeat * 3.5, track.bassVol);
    }

    // Melody: play at melody speed
    const melodyInterval = Math.round(track.arpSpeed / track.melodySpeed);
    if (this.beatCount % melodyInterval === 0) {
      const melodyNote = track.melody[this.melodyIndex % track.melody.length];
      if (melodyNote > 0) {
        this._playNote(track.melodyWave, melodyNote, time, noteDur * 1.2, track.melodyVol);
      }
      this.melodyIndex++;
    }
  }

  _playNote(type, freq, time, dur, vol) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Gentle envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.01);
    gain.gain.setValueAtTime(vol, time + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);

    const node = { osc, gain };
    this.activeNodes.push(node);

    // Clean up reference after note ends
    osc.onended = () => {
      const idx = this.activeNodes.indexOf(node);
      if (idx !== -1) this.activeNodes.splice(idx, 1);
    };
  }
}
