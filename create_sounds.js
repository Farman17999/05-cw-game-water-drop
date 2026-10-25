import fs from 'fs';
import path from 'path';

const soundsDir = path.join(process.cwd(), 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

function createWavBuffer(sampleRate, durationSeconds, generateSample) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = generateSample(t, i, numSamples);
    // Clamp to -1.0 .. 1.0
    s = Math.max(-1.0, Math.min(1.0, s));
    const intSample = Math.floor(s * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;

// 1. Collect Water Drop (bubble pop with pitch sweep and decay)
const collectWav = createWavBuffer(sampleRate, 0.14, (t) => {
  const freq = 450 + 750 * (t / 0.14); // pitch sweep from 450 to 1200 Hz
  const env = Math.exp(-t * 30);
  return Math.sin(2 * Math.PI * freq * t) * env * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'collect.wav'), collectWav);

// 2. Bonus Jerry Can (melodic ascending double-bell chime)
const canWav = createWavBuffer(sampleRate, 0.35, (t) => {
  let s = 0;
  // Tone 1: E5 (659.25Hz)
  if (t < 0.25) {
    const env1 = Math.exp(-t * 18);
    s += Math.sin(2 * Math.PI * 659.25 * t) * env1 * 0.45;
    s += Math.sin(2 * Math.PI * 1318.5 * t) * env1 * 0.15; // overtone
  }
  // Tone 2: A5 (880Hz) starting at 0.08s
  if (t >= 0.08) {
    const t2 = t - 0.08;
    const env2 = Math.exp(-t2 * 14);
    s += Math.sin(2 * Math.PI * 880 * t2) * env2 * 0.55;
    s += Math.sin(2 * Math.PI * 1760 * t2) * env2 * 0.2; // overtone
  }
  return s;
});
fs.writeFileSync(path.join(soundsDir, 'can.wav'), canWav);

// 3. Miss / Obstacle (low buzzy thud warning)
const missWav = createWavBuffer(sampleRate, 0.22, (t) => {
  const env = Math.exp(-t * 16);
  const freq = 180 - 80 * (t / 0.22);
  // Sawtooth-like wave with low frequency
  const phase = (freq * t) % 1;
  const saw = (phase * 2 - 1);
  return saw * env * 0.45;
});
fs.writeFileSync(path.join(soundsDir, 'miss.wav'), missWav);

// 4. Button Click (crisp mechanical click)
const buttonWav = createWavBuffer(sampleRate, 0.06, (t) => {
  const env = Math.exp(-t * 70);
  const click = Math.sin(2 * Math.PI * 1200 * t);
  return click * env * 0.4;
});
fs.writeFileSync(path.join(soundsDir, 'button.wav'), buttonWav);

// 5. Milestone chime (sparkling arpeggio: C5 -> E5 -> G5 -> C6)
const milestoneWav = createWavBuffer(sampleRate, 0.55, (t) => {
  let s = 0;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const step = 0.08;
  notes.forEach((freq, idx) => {
    const start = idx * step;
    if (t >= start) {
      const tn = t - start;
      const env = Math.exp(-tn * 10);
      s += Math.sin(2 * Math.PI * freq * tn) * env * 0.35;
      s += Math.sin(2 * Math.PI * freq * 2 * tn) * env * 0.12;
    }
  });
  return s;
});
fs.writeFileSync(path.join(soundsDir, 'milestone.wav'), milestoneWav);

// 6. Win Fanfare (triumphant brass celebration)
const winWav = createWavBuffer(sampleRate, 0.85, (t) => {
  let s = 0;
  // C5 -> G5 -> C6 with sustained chord
  const notes = [
    { freq: 523.25, start: 0.0, dur: 0.18 },
    { freq: 659.25, start: 0.14, dur: 0.18 },
    { freq: 783.99, start: 0.28, dur: 0.20 },
    { freq: 1046.50, start: 0.44, dur: 0.40 },
    { freq: 1318.51, start: 0.48, dur: 0.36 }
  ];
  notes.forEach(({ freq, start }) => {
    if (t >= start) {
      const tn = t - start;
      const env = Math.exp(-tn * 5);
      s += Math.sin(2 * Math.PI * freq * tn) * env * 0.3;
    }
  });
  return s;
});
fs.writeFileSync(path.join(soundsDir, 'win.wav'), winWav);

console.log('All sound files generated successfully in /sounds directory!');
