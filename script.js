// ========================================================
// charity: water - Water Drop Game
// Enhanced with Difficulty Modes, Milestones, DOM Interactions,
// and Audio Sound Library
// ========================================================

// Difficulty Modes Configuration
const DIFFICULTY_CONFIG = {
  easy: {
    key: "easy",
    name: "Easy",
    targetScore: 15,
    timeLimit: 35,
    spawnInterval: 850,
    minSpeed: 3.5,
    maxSpeed: 4.8,
    odds: { clean: 0.72, bad: 0.12, can: 0.16 },
    description: "15 pts in 35s"
  },
  normal: {
    key: "normal",
    name: "Normal",
    targetScore: 20,
    timeLimit: 30,
    spawnInterval: 700,
    minSpeed: 2.7,
    maxSpeed: 3.8,
    odds: { clean: 0.65, bad: 0.20, can: 0.15 },
    description: "20 pts in 30s"
  },
  hard: {
    key: "hard",
    name: "Hard",
    targetScore: 30,
    timeLimit: 25,
    spawnInterval: 520,
    minSpeed: 1.8,
    maxSpeed: 2.8,
    odds: { clean: 0.58, bad: 0.28, can: 0.14 },
    description: "30 pts in 25s"
  }
};

// Current Game State
let currentDifficulty = "normal";
let score = 0;
let timeLeft = DIFFICULTY_CONFIG.normal.timeLimit;
let gameRunning = false;
let dropMaker = null;
let gameTimer = null;
let soundEnabled = true;
let milestoneTimeout = null;

// Track milestones hit in the current round
const achievedMilestones = new Set();
const roundAchievedMilestoneDetails = [];

// High scores tracked per difficulty
const highScores = {
  easy: 0,
  normal: 0,
  hard: 0
};

// DOM References
const scoreElement = document.getElementById("score");
const targetSubElement = document.getElementById("target-sub");
const timeElement = document.getElementById("time");
const highScoreElement = document.getElementById("high-score");
const nextMilestoneLabel = document.getElementById("next-milestone-label");
const legendGoalText = document.getElementById("legend-goal-text");
const gameContainer = document.getElementById("game-container");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");

// Reservoir Gauge Elements
const reservoirFill = document.getElementById("reservoir-fill");
const reservoirLevelTag = document.getElementById("reservoir-level-tag");

// Milestone Banner Elements
const milestoneBanner = document.getElementById("milestone-banner");
const milestoneHeading = document.getElementById("milestone-heading");
const milestoneMessage = document.getElementById("milestone-message");
const milestoneIcon = document.getElementById("milestone-icon");

// Overlay & Modal References
const welcomeOverlay = document.getElementById("welcome-overlay");
const overlayStartBtn = document.getElementById("overlay-start-btn");
const gameOverModal = document.getElementById("game-over-modal");
const modalTitle = document.getElementById("modal-title");
const modalIcon = document.getElementById("modal-icon");
const modalMessage = document.getElementById("modal-message");
const finalScoreElement = document.getElementById("final-score");
const finalDifficultyElement = document.getElementById("final-difficulty");
const finalTargetElement = document.getElementById("final-target");
const recapTags = document.getElementById("recap-tags");
const playAgainBtn = document.getElementById("play-again-btn");
const modalResetBtn = document.getElementById("modal-reset-btn");
const confettiContainer = document.getElementById("confetti-container");

// Difficulty UI Buttons
const diffButtons = document.querySelectorAll(".diff-btn");
const diffCards = document.querySelectorAll(".diff-card");

// ========================================================
// Milestone Definitions Array
// ========================================================
const milestoneList = [
  {
    id: "first_drop",
    icon: "💧",
    heading: "First Drop Saved!",
    getThreshold: () => 1,
    getMessage: () => "First drop secured! Clean water starts here!",
    tag: "💧 1st Drop"
  },
  {
    id: "quarter_way",
    icon: "🌊",
    heading: "Quarter Way!",
    getThreshold: (target) => Math.max(2, Math.floor(target * 0.25)),
    getMessage: (target, s) => `25% to your goal! (${s}/${target} pts)`,
    tag: "🌊 25% Goal"
  },
  {
    id: "halfway",
    icon: "🚰",
    heading: "Halfway There!",
    getThreshold: (target) => Math.floor(target * 0.5),
    getMessage: (target, s) => `Halfway there! ${s} points collected! Keep going!`,
    tag: "🚰 Halfway There"
  },
  {
    id: "three_quarters",
    icon: "⚡",
    heading: "Almost There!",
    getThreshold: (target) => Math.floor(target * 0.75),
    getMessage: (target, s) => `75% completed! (${s}/${target} pts) Finish strong!`,
    tag: "⚡ 75% Goal"
  },
  {
    id: "goal_reached",
    icon: "🏆",
    heading: "Goal Achieved!",
    getThreshold: (target) => target,
    getMessage: (target, s) => `Target reached! (${s} pts) You won this level!`,
    tag: "🏆 Level Won!"
  },
  {
    id: "bonus_10",
    icon: "🌟",
    heading: "Super Hydrator!",
    getThreshold: (target) => target + 10,
    getMessage: (target, s) => `Unstoppable! +10 points above the goal!`,
    tag: "🌟 Super Hydrator"
  },
  {
    id: "bonus_20",
    icon: "🌍",
    heading: "Clean Water Hero!",
    getThreshold: (target) => target + 20,
    getMessage: (target, s) => `Village Champion! A community gets clean water!`,
    tag: "🌍 Village Champion"
  }
];

// Winning and Encouraging Messages
const winningMessages = [
  "Incredible job! You hit the target and helped bring clean, safe water to families in need!",
  "Water Champion! Every drop counts — clean water transforms health, education, and futures!",
  "Victory! You filled the jerry can! $40 can provide one person with clean water for life.",
  "Outstanding effort! You conquered the challenge and protected the clean water reservoir!",
  "Pure success! Your quick reflexes brought safe drinking water to communities!"
];

const losingMessages = [
  "So close! 703 million people lack clean water — give it another shot!",
  "Don't give up! Every single drop matters. Tap faster and watch out for murky drops!",
  "Almost reached the goal! Keep your eyes peeled for yellow jerry cans for +5 bonus points!",
  "Good effort! Clean water takes perseverance. Reset and take on the challenge!",
  "Keep splashing! Practice makes perfect — hit 'Play Again' to hit your target!"
];

// ========================================================
// Sound Library & Audio Engine (Web Audio + Sound Files)
// ========================================================
const soundCache = {};
const SOUND_FILES = {
  collect: "sounds/collect.wav",
  can: "sounds/can.wav",
  miss: "sounds/miss.wav",
  button: "sounds/button.wav",
  milestone: "sounds/milestone.wav",
  win: "sounds/win.wav"
};

// Preload sound files
function preloadSounds() {
  Object.entries(SOUND_FILES).forEach(([key, src]) => {
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      soundCache[key] = audio;
    } catch (e) {
      console.warn("Audio preload skipped:", e);
    }
  });
}

// Web Audio API Synthesizer Fallback
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;

  // Try playing from preloaded audio files first
  try {
    const cachedAudio = soundCache[type];
    if (cachedAudio) {
      const soundClone = cachedAudio.cloneNode();
      soundClone.volume = type === "button" ? 0.4 : 0.65;
      const playPromise = soundClone.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Audio if blocked or failing
          playSynthSound(type);
        });
        return;
      }
    }
  } catch (err) {
    // If Audio object failed, fallback to Web Audio
  }

  playSynthSound(type);
}

// Resilient Web Audio synthesizer fallback
function playSynthSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "collect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === "can") {
      [659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.22, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } else if (type === "miss") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "button") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "milestone") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.28);
      });
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    }
  } catch (e) {
    // Audio context fallback suppression
  }
}

// ========================================================
// Difficulty Management
// ========================================================
function setDifficulty(diffKey, triggerSound = true) {
  if (!DIFFICULTY_CONFIG[diffKey]) return;
  currentDifficulty = diffKey;
  const config = DIFFICULTY_CONFIG[diffKey];

  // If sound requested, play button click
  if (triggerSound) {
    playSound("button");
  }

  // Update Difficulty bar buttons active state
  diffButtons.forEach((btn) => {
    const isCurrent = btn.dataset.diff === diffKey;
    btn.classList.toggle("active", isCurrent);
    btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
  });

  // Update Welcome overlay cards active state
  diffCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.diff === diffKey);
  });

  // Update HUD displays
  targetSubElement.textContent = `/ ${config.targetScore}`;
  legendGoalText.textContent = `${config.targetScore}+ pts in ${config.timeLimit}s`;

  if (!gameRunning) {
    timeLeft = config.timeLimit;
    timeElement.textContent = `${timeLeft}`;
  }

  // Update high score display for this difficulty
  highScoreElement.textContent = `${highScores[diffKey] || 0}`;

  // Update next milestone display
  updateNextMilestoneDisplay();
}

// ========================================================
// High Score Management
// ========================================================
function loadHighScores() {
  ["easy", "normal", "hard"].forEach((diff) => {
    const saved = localStorage.getItem(`cw_high_score_${diff}`);
    if (saved !== null) {
      highScores[diff] = parseInt(saved, 10) || 0;
    }
  });
  highScoreElement.textContent = `${highScores[currentDifficulty] || 0}`;
}

function updateHighScore(diff, newScore) {
  if (newScore > (highScores[diff] || 0)) {
    highScores[diff] = newScore;
    localStorage.setItem(`cw_high_score_${diff}`, `${newScore}`);
    highScoreElement.textContent = `${newScore}`;
  }
}

// ========================================================
// Milestone Tracking & Conditional Triggering
// ========================================================
function checkMilestones() {
  const target = DIFFICULTY_CONFIG[currentDifficulty].targetScore;

  // Use array of milestone messages and conditionals to trigger them
  for (const m of milestoneList) {
    const threshold = m.getThreshold(target);
    // Condition: Player's score hits or exceeds threshold and hasn't fired yet this round
    if (score >= threshold && !achievedMilestones.has(m.id)) {
      achievedMilestones.add(m.id);
      roundAchievedMilestoneDetails.push(m);
      displayMilestoneNotification(m, target);
      break; // Show one at a time for maximum clarity
    }
  }

  updateNextMilestoneDisplay();
}

function displayMilestoneNotification(milestone, target) {
  if (milestoneTimeout) {
    clearTimeout(milestoneTimeout);
  }

  milestoneIcon.textContent = milestone.icon;
  milestoneHeading.textContent = milestone.heading;
  milestoneMessage.textContent = milestone.getMessage(target, score);

  milestoneBanner.classList.remove("hidden");

  // Play milestone fanfare sound
  if (milestone.id === "goal_reached") {
    playSound("win");
  } else {
    playSound("milestone");
  }

  // Spawn visual sparkle particles around milestone
  spawnSparklesAt(gameContainer.offsetWidth / 2, 60, 8);

  milestoneTimeout = setTimeout(() => {
    milestoneBanner.classList.add("hidden");
  }, 2200);
}

function updateNextMilestoneDisplay() {
  const target = DIFFICULTY_CONFIG[currentDifficulty].targetScore;
  let nextMilestone = null;

  for (const m of milestoneList) {
    const threshold = m.getThreshold(target);
    if (score < threshold) {
      nextMilestone = { threshold, label: m.tag };
      break;
    }
  }

  if (nextMilestone) {
    nextMilestoneLabel.textContent = `Next: ${nextMilestone.threshold} pts (${nextMilestone.label})`;
  } else {
    nextMilestoneLabel.textContent = "All Milestones Cleared! ⭐";
  }
}

// ========================================================
// DOM Element Creation & Removal (Drops, Cans, Particles)
// ========================================================

// Update reservoir level visual in DOM
function updateReservoirMeter() {
  const target = DIFFICULTY_CONFIG[currentDifficulty].targetScore;
  const pct = Math.min(100, Math.round((score / target) * 100));
  reservoirFill.style.height = `${pct}%`;
  reservoirLevelTag.textContent = `${pct}%`;
}

// Creates clean water drop (+1 pt)
function createGoodDrop() {
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Vary size
  const size = Math.round(52 + Math.random() * 14);
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;

  // Horizontal position
  const containerWidth = gameContainer.offsetWidth || 820;
  const xPosition = Math.max(16, Math.random() * (containerWidth - size - 40));
  drop.style.left = `${xPosition}px`;

  // Fall speed based on difficulty
  const speed = (Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed).toFixed(2);
  drop.style.animationDuration = `${speed}s`;

  // Player click interaction
  drop.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleGoodDropClick(drop, event);
  });

  gameContainer.appendChild(drop);

  // When drop reaches bottom unclicked -> Missed drop interaction in DOM
  drop.addEventListener("animationend", () => {
    handleDropMissed(drop, xPosition + size / 2);
  });
}

// Creates bonus jerry can (+5 pts)
function createBonusCan() {
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const can = document.createElement("div");
  can.className = "water-can-item";

  const size = 62;
  can.style.width = `${size}px`;
  can.style.height = `${size}px`;

  const canImg = document.createElement("img");
  canImg.src = "img/water-can-transparent.png";
  canImg.alt = "charity: water jerry can";
  can.appendChild(canImg);

  const containerWidth = gameContainer.offsetWidth || 820;
  const xPosition = Math.max(16, Math.random() * (containerWidth - size - 40));
  can.style.left = `${xPosition}px`;

  const speed = (Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed + 0.3).toFixed(2);
  can.style.animationDuration = `${speed}s`;

  can.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleBonusCanClick(can, event);
  });

  gameContainer.appendChild(can);
  can.addEventListener("animationend", () => can.remove());
}

// Creates murky/contaminated drop (-2 pts)
function createBadDrop() {
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const badDrop = document.createElement("div");
  badDrop.className = "water-drop bad-drop";

  const size = 52;
  badDrop.style.width = `${size}px`;
  badDrop.style.height = `${size}px`;

  const containerWidth = gameContainer.offsetWidth || 820;
  const xPosition = Math.max(16, Math.random() * (containerWidth - size - 40));
  badDrop.style.left = `${xPosition}px`;

  // Murky drops fall slightly faster
  const speed = (Math.random() * (config.maxSpeed - config.minSpeed) * 0.9 + config.minSpeed * 0.9).toFixed(2);
  badDrop.style.animationDuration = `${speed}s`;

  badDrop.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleBadDropClick(badDrop, event);
  });

  gameContainer.appendChild(badDrop);
  badDrop.addEventListener("animationend", () => badDrop.remove());
}

// ========================================================
// Player Interaction Handlers (Elements Removed / Modified in DOM)
// ========================================================

// Player collects a clean drop (+1 pt)
function handleGoodDropClick(dropElement, event) {
  if (!gameRunning) return;

  score += 1;
  updateScoreDisplay(1);
  updateReservoirMeter();

  playSound("collect");
  showScorePopup(event, "+1", "plus-one");

  // Spawn DOM splash particles at drop location
  const rect = dropElement.getBoundingClientRect();
  const cRect = gameContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - cRect.left;
  const centerY = rect.top + rect.height / 2 - cRect.top;
  spawnWaterSplashParticles(centerX, centerY, 5);

  // Remove element from DOM after pop animation
  dropElement.classList.add("popping");
  setTimeout(() => dropElement.remove(), 130);

  checkMilestones();
}

// Player collects a bonus jerry can (+5 pts)
function handleBonusCanClick(canElement, event) {
  if (!gameRunning) return;

  score += 5;
  updateScoreDisplay(5);
  updateReservoirMeter();

  playSound("can");
  showScorePopup(event, "+5", "plus-five");

  // Spawn golden DOM sparkle particles
  const rect = canElement.getBoundingClientRect();
  const cRect = gameContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - cRect.left;
  const centerY = rect.top + rect.height / 2 - cRect.top;
  spawnSparklesAt(centerX, centerY, 7);

  // Remove jerry can from DOM
  canElement.classList.add("popping");
  setTimeout(() => canElement.remove(), 130);

  checkMilestones();
}

// Player accidentally clicks contaminated drop (-2 pts)
function handleBadDropClick(badDropElement, event) {
  if (!gameRunning) return;

  score = Math.max(0, score - 2);
  updateScoreDisplay(-2);
  updateReservoirMeter();

  playSound("miss");
  showScorePopup(event, "-2", "minus-two");
  triggerScreenShake();

  // Spawn dark sludge particle elements in DOM
  const rect = badDropElement.getBoundingClientRect();
  const cRect = gameContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - cRect.left;
  const centerY = rect.top + rect.height / 2 - cRect.top;
  spawnSludgeParticles(centerX, centerY, 5);

  badDropElement.classList.add("popping");
  setTimeout(() => badDropElement.remove(), 130);

  checkMilestones();
}

// Clean drop hits the bottom without being caught (Missed drop)
function handleDropMissed(dropElement, xPosition) {
  // Create ripple ring at bottom water line in DOM
  const ripple = document.createElement("div");
  ripple.className = "water-splash-ring";
  ripple.style.left = `${xPosition - 15}px`;
  gameContainer.appendChild(ripple);

  // Remove ripple element from DOM when animation completes
  setTimeout(() => ripple.remove(), 500);

  // Remove drop from DOM
  dropElement.remove();
}

// Spawn DOM water splash droplets
function spawnWaterSplashParticles(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "splash-particle";
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 25 + Math.random() * 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);

    gameContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 400);
  }
}

// Spawn DOM golden sparkles for jerry can & milestone
function spawnSparklesAt(x, y, count = 6) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "splash-particle sparkle";
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 35;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty("--tx", `${tx}px`);
    p.style.setProperty("--ty", `${ty}px`);

    gameContainer.appendChild(p);
    setTimeout(() => p.remove(), 450);
  }
}

// Spawn DOM sludge particles for murky drop
function spawnSludgeParticles(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "splash-particle sludge";
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 25;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty("--tx", `${tx}px`);
    p.style.setProperty("--ty", `${ty}px`);

    gameContainer.appendChild(p);
    setTimeout(() => p.remove(), 400);
  }
}

// Creates floating score popup in DOM
function showScorePopup(event, text, className) {
  const popup = document.createElement("div");
  popup.className = `score-popup ${className}`;
  popup.textContent = text;

  const containerRect = gameContainer.getBoundingClientRect();
  const clickX = (event.clientX || containerRect.left + 50) - containerRect.left;
  const clickY = (event.clientY || containerRect.top + 50) - containerRect.top;

  popup.style.left = `${clickX}px`;
  popup.style.top = `${clickY}px`;

  gameContainer.appendChild(popup);
  setTimeout(() => popup.remove(), 650);
}

// Updates HUD score with bounce
function updateScoreDisplay(delta) {
  scoreElement.textContent = `${score}`;

  if (delta > 0) {
    scoreElement.classList.add("score-bump");
    setTimeout(() => scoreElement.classList.remove("score-bump"), 180);
  } else if (delta < 0) {
    scoreElement.classList.add("score-drop");
    setTimeout(() => scoreElement.classList.remove("score-drop"), 180);
  }
}

// Screen shake effect on penalty
function triggerScreenShake() {
  gameContainer.classList.remove("container-shake");
  void gameContainer.offsetWidth; // Force reflow
  gameContainer.classList.add("container-shake");
  setTimeout(() => gameContainer.classList.remove("container-shake"), 350);
}

// Spawns items using difficulty probabilities
function spawnItem() {
  if (!gameRunning) return;

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const roll = Math.random();

  if (roll < config.odds.clean) {
    createGoodDrop();
  } else if (roll < config.odds.clean + config.odds.bad) {
    createBadDrop();
  } else {
    createBonusCan();
  }
}

// ========================================================
// Game Loop & Lifecycle (Start, Tick, End, Reset)
// ========================================================
function startGame() {
  playSound("button");
  getAudioContext();

  // Reset active timers
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  clearFallingItems();
  clearConfetti();
  welcomeOverlay.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  milestoneBanner.classList.add("hidden");

  // Reset round state
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  score = 0;
  timeLeft = config.timeLimit;
  gameRunning = true;
  achievedMilestones.clear();
  roundAchievedMilestoneDetails.length = 0;

  // Update UI displays
  updateScoreDisplay(0);
  updateReservoirMeter();
  timeElement.textContent = `${timeLeft}`;
  timeElement.parentElement.classList.remove("time-warning");
  startBtn.disabled = true;
  startBtn.textContent = "Playing...";
  updateNextMilestoneDisplay();

  // Start spawning drops based on difficulty interval
  dropMaker = setInterval(spawnItem, config.spawnInterval);

  // Start 1-second countdown
  gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!gameRunning) return;

  timeLeft -= 1;
  timeElement.textContent = `${timeLeft}`;

  if (timeLeft <= 5) {
    timeElement.parentElement.classList.add("time-warning");
  }

  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  gameRunning = false;

  clearInterval(dropMaker);
  clearInterval(gameTimer);
  clearFallingItems();

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  timeElement.parentElement.classList.remove("time-warning");

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  updateHighScore(currentDifficulty, score);

  // Fill Game Over Modal
  finalScoreElement.textContent = `${score}`;
  finalDifficultyElement.textContent = config.name;
  finalTargetElement.textContent = `${config.targetScore} pts`;

  // Render achieved milestones tags in modal DOM
  recapTags.innerHTML = "";
  if (roundAchievedMilestoneDetails.length > 0) {
    roundAchievedMilestoneDetails.forEach((m) => {
      const tag = document.createElement("span");
      tag.className = "recap-pill";
      tag.textContent = m.tag;
      recapTags.appendChild(tag);
    });
  } else {
    const noTag = document.createElement("span");
    noTag.className = "recap-pill";
    noTag.textContent = "Keep practicing to hit your first milestone!";
    recapTags.appendChild(noTag);
  }

  // Win condition: score >= difficulty's targetScore
  if (score >= config.targetScore) {
    const randomIndex = Math.floor(Math.random() * winningMessages.length);
    modalTitle.textContent = "You Won!";
    modalIcon.textContent = "🏆";
    modalMessage.textContent = winningMessages[randomIndex];

    playSound("win");
    launchConfetti();
  } else {
    const randomIndex = Math.floor(Math.random() * losingMessages.length);
    modalTitle.textContent = "Good Effort!";
    modalIcon.textContent = "💧";
    modalMessage.textContent = losingMessages[randomIndex];
    playSound("miss");
  }

  gameOverModal.classList.remove("hidden");
}

function resetGame() {
  playSound("button");
  gameRunning = false;

  clearInterval(dropMaker);
  clearInterval(gameTimer);

  clearFallingItems();
  clearConfetti();
  gameOverModal.classList.add("hidden");
  welcomeOverlay.classList.remove("hidden");
  milestoneBanner.classList.add("hidden");

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  score = 0;
  timeLeft = config.timeLimit;
  scoreElement.textContent = "0";
  timeElement.textContent = `${timeLeft}`;
  timeElement.parentElement.classList.remove("time-warning");
  updateReservoirMeter();

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  updateNextMilestoneDisplay();
}

function clearFallingItems() {
  const elements = gameContainer.querySelectorAll(".water-drop, .water-can-item, .score-popup, .splash-particle, .water-splash-ring");
  elements.forEach((el) => el.remove());
}

// Confetti Celebration
function launchConfetti() {
  clearConfetti();

  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#8BD1CB", "#FF902A", "#F16061"];
  const total = 65;
  const containerWidth = gameContainer.offsetWidth || 820;

  for (let i = 0; i < total; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * containerWidth}px`;
    piece.style.top = "-12px";

    if (Math.random() > 0.5) {
      piece.style.borderRadius = "50%";
      piece.style.width = "12px";
      piece.style.height = "12px";
    } else {
      piece.style.borderRadius = "2px";
      piece.style.width = "8px";
      piece.style.height = "14px";
    }

    piece.style.animationDuration = `${(Math.random() * 1.5 + 2.0).toFixed(2)}s`;
    piece.style.animationDelay = `${(Math.random() * 0.8).toFixed(2)}s`;

    confettiContainer.appendChild(piece);
  }

  setTimeout(clearConfetti, 3500);
}

function clearConfetti() {
  if (confettiContainer) {
    confettiContainer.innerHTML = "";
  }
}

// ========================================================
// Event Listeners Setup
// ========================================================

// Controls
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
overlayStartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
modalResetBtn.addEventListener("click", resetGame);

// Difficulty buttons in header
diffButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const diff = btn.dataset.diff;
    if (diff !== currentDifficulty) {
      if (gameRunning) {
        setDifficulty(diff, true);
        startGame(); // restart with new difficulty
      } else {
        setDifficulty(diff, true);
      }
    }
  });
});

// Difficulty cards in welcome overlay
diffCards.forEach((card) => {
  card.addEventListener("click", () => {
    const diff = card.dataset.diff;
    setDifficulty(diff, true);
  });
});

// Sound Toggle
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  playSound("button");
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  soundBtn.classList.toggle("muted", !soundEnabled);
  soundBtn.setAttribute("title", soundEnabled ? "Mute Sound" : "Unmute Sound");
});

// Initialize audio and high scores
preloadSounds();
loadHighScores();
setDifficulty("normal", false);
