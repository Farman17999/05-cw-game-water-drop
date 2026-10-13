// ========================================================
// charity: water - Water Drop Game
// ========================================================

// Game State Variables
let score = 0;                     // Current player score
let timeLeft = 30;                 // Seconds remaining in the round
let gameRunning = false;           // Tracks if game is currently active
let dropMaker = null;              // Interval timer for spawning drops
let gameTimer = null;              // Interval timer for countdown clock
let soundEnabled = true;           // Tracks if sound effects are enabled
let highScore = 0;                 // Best score achieved in this browser

// DOM Element References
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const highScoreElement = document.getElementById("high-score");
const gameContainer = document.getElementById("game-container");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");

// Modal and Overlay References
const welcomeOverlay = document.getElementById("welcome-overlay");
const overlayStartBtn = document.getElementById("overlay-start-btn");
const gameOverModal = document.getElementById("game-over-modal");
const modalTitle = document.getElementById("modal-title");
const modalIcon = document.getElementById("modal-icon");
const modalMessage = document.getElementById("modal-message");
const finalScoreElement = document.getElementById("final-score");
const playAgainBtn = document.getElementById("play-again-btn");
const modalResetBtn = document.getElementById("modal-reset-btn");
const confettiContainer = document.getElementById("confetti-container");

// ========================================================
// Game Messages (Winning & Losing Arrays)
// ========================================================

// Array of inspiring winning messages when score >= 20
const winningMessages = [
  "Incredible job! You collected 20+ drops and helped bring clean water to communities in need!",
  "Water Champion! Every drop counts — clean water transforms health, education, and futures!",
  "Victory! You filled the jerry can! $40 can provide one person with clean water for life.",
  "Outstanding effort! You conquered the challenge and protected the clean water supply!",
  "Pure success! Your quick taps brought safe, clean drinking water to families!"
];

// Array of motivating try-again messages when score < 20
const losingMessages = [
  "So close! 703 million people still lack access to clean water — give it another shot!",
  "Don't give up! Every single drop matters. Tap faster and watch out for murky drops!",
  "Almost reached 20! Keep your eyes peeled for yellow jerry cans for +5 bonus points!",
  "Good try! Clean water takes perseverance. Reset and aim for 20+ points!",
  "Keep splashing! Practice makes perfect — hit 'Play Again' to beat the 20-drop goal!"
];

// ========================================================
// Web Audio API Synthesizer (No external sound files required)
// ========================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Plays synthetic sound effects for feedback
function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === "drop") {
      // Pleasant water droplet pop (frequency sweep up)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "can") {
      // Bonus Jerry Can chime (two quick pleasant tones)
      [659.25, 880].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.07);

        gain.gain.setValueAtTime(0.25, now + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.18);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 0.2);
      });
    } else if (type === "bad") {
      // Bad drop warning buzz (sawtooth buzz down)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "win") {
      // Victory fanfare chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.1);

        gain.gain.setValueAtTime(0.2, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.45);
      });
    }
  } catch (err) {
    // Graceful fallback if Web Audio is restricted
    console.warn("Audio play prevented:", err);
  }
}

// ========================================================
// High Score Management
// ========================================================
function loadHighScore() {
  const savedScore = localStorage.getItem("cw_water_drop_highscore");
  if (savedScore !== null) {
    highScore = parseInt(savedScore, 10) || 0;
  }
  highScoreElement.textContent = `${highScore}`;
}

function updateHighScore(newScore) {
  if (newScore > highScore) {
    highScore = newScore;
    localStorage.setItem("cw_water_drop_highscore", `${highScore}`);
    highScoreElement.textContent = `${highScore}`;
  }
}

// ========================================================
// Game Initialization & Event Listeners
// ========================================================

// Attach click listeners to game controls
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
overlayStartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
modalResetBtn.addEventListener("click", resetGame);

// Toggle sound button
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  soundBtn.setAttribute("title", soundEnabled ? "Mute Sound" : "Unmute Sound");
});

// Load high score on boot
loadHighScore();

// ========================================================
// Core Game Functions
// ========================================================

// Starts or restarts a 30-second round
function startGame() {
  initAudio();

  // Reset any active intervals first
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  // Clear existing falling items and overlays
  clearFallingItems();
  welcomeOverlay.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  clearConfetti();

  // Reset scores and timers for fresh round
  score = 0;
  timeLeft = 30;
  gameRunning = true;

  // Update UI displays
  updateScoreDisplay(0);
  timeElement.textContent = `${timeLeft}`;
  timeElement.parentElement.classList.remove("time-warning");
  startBtn.disabled = true;
  startBtn.textContent = "Playing...";

  // Start spawning drops regularly (every 750 milliseconds)
  dropMaker = setInterval(spawnItem, 750);

  // Start 30-second countdown clock (every 1000 milliseconds)
  gameTimer = setInterval(updateTimer, 1000);
}

// Handles the 1-second countdown clock
function updateTimer() {
  if (!gameRunning) return;

  timeLeft -= 1;
  timeElement.textContent = `${timeLeft}`;

  // Add urgency visual pulse when 5 seconds or less remain
  if (timeLeft <= 5) {
    timeElement.parentElement.classList.add("time-warning");
  }

  // When timer reaches 0, the game ends
  if (timeLeft <= 0) {
    endGame();
  }
}

// Spawns either a clean drop, a bonus jerry can, or a bad drop
function spawnItem() {
  if (!gameRunning) return;

  // Generate random number to pick item type
  const roll = Math.random();

  if (roll < 0.65) {
    // 65% chance: Clean Water Drop (+1 point)
    createGoodDrop();
  } else if (roll < 0.85) {
    // 20% chance: Contaminated Sludge Drop (-2 points)
    createBadDrop();
  } else {
    // 15% chance: Bonus Yellow Jerry Can (+5 points)
    createBonusCan();
  }
}

// Creates a Clean Water Drop (+1 pt)
function createGoodDrop() {
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Vary size for visual depth (between 45px and 65px)
  const baseSize = 55;
  const sizeMultiplier = Math.random() * 0.4 + 0.8;
  const size = Math.round(baseSize * sizeMultiplier);
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;

  // Random horizontal position within game container
  const containerWidth = gameContainer.offsetWidth || 800;
  const xPosition = Math.max(10, Math.random() * (containerWidth - size - 20));
  drop.style.left = `${xPosition}px`;

  // Random fall speed (between 3.2s and 4.2s)
  const speed = (Math.random() * 1.0 + 3.2).toFixed(2);
  drop.style.animationDuration = `${speed}s`;

  // Handle interaction when player catches the drop
  drop.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleGoodDropClick(drop, event);
  });

  // Append to container and clean up when it reaches the bottom
  gameContainer.appendChild(drop);
  drop.addEventListener("animationend", () => drop.remove());
}

// Creates an Obstacle / Contaminated Bad Drop (-2 pts)
function createBadDrop() {
  const badDrop = document.createElement("div");
  badDrop.className = "water-drop bad-drop";

  const size = 52;
  badDrop.style.width = `${size}px`;
  badDrop.style.height = `${size}px`;

  const containerWidth = gameContainer.offsetWidth || 800;
  const xPosition = Math.max(10, Math.random() * (containerWidth - size - 20));
  badDrop.style.left = `${xPosition}px`;

  // Bad drops fall slightly faster (2.8s to 3.6s)
  const speed = (Math.random() * 0.8 + 2.8).toFixed(2);
  badDrop.style.animationDuration = `${speed}s`;

  // Handle penalty interaction when player clicks bad drop
  badDrop.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleBadDropClick(badDrop, event);
  });

  gameContainer.appendChild(badDrop);
  badDrop.addEventListener("animationend", () => badDrop.remove());
}

// Creates a Bonus Yellow Jerry Can (+5 pts)
function createBonusCan() {
  const can = document.createElement("div");
  can.className = "water-can-item";

  const size = 60;
  can.style.width = `${size}px`;
  can.style.height = `${size}px`;

  const canImg = document.createElement("img");
  canImg.src = "img/water-can-transparent.png";
  canImg.alt = "charity: water jerry can";
  can.appendChild(canImg);

  const containerWidth = gameContainer.offsetWidth || 800;
  const xPosition = Math.max(10, Math.random() * (containerWidth - size - 20));
  can.style.left = `${xPosition}px`;

  // Jerry cans fall steadily (3.4s to 4.4s)
  const speed = (Math.random() * 1.0 + 3.4).toFixed(2);
  can.style.animationDuration = `${speed}s`;

  // Handle bonus interaction when player clicks jerry can
  can.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    handleBonusCanClick(can, event);
  });

  gameContainer.appendChild(can);
  can.addEventListener("animationend", () => can.remove());
}

// ========================================================
// Interaction & Real-Time Feedback Handlers
// ========================================================

// Player collects a clean drop (+1 point)
function handleGoodDropClick(dropElement, event) {
  if (!gameRunning) return;

  // Add 1 point
  score += 1;
  updateScoreDisplay(1);

  // Play water droplet sound
  playSound("drop");

  // Show floating score feedback at click location
  showScorePopup(event, "+1", "plus-one");

  // Visual popping feedback on the drop itself
  dropElement.classList.add("popping");
  setTimeout(() => dropElement.remove(), 150);
}

// Player collects a bonus jerry can (+5 points)
function handleBonusCanClick(canElement, event) {
  if (!gameRunning) return;

  // Add 5 points
  score += 5;
  updateScoreDisplay(5);

  // Play pleasant chime
  playSound("can");

  // Show golden floating score feedback
  showScorePopup(event, "+5", "plus-five");

  // Visual popping feedback
  canElement.classList.add("popping");
  setTimeout(() => canElement.remove(), 150);
}

// Player accidentally clicks an obstacle (-2 points)
function handleBadDropClick(badDropElement, event) {
  if (!gameRunning) return;

  // Deduct 2 points (cannot drop below 0)
  score = Math.max(0, score - 2);
  updateScoreDisplay(-2);

  // Play warning buzz
  playSound("bad");

  // Show red floating penalty popup
  showScorePopup(event, "-2", "minus-two");

  // Trigger game screen shake feedback
  triggerScreenShake();

  // Visual popping feedback
  badDropElement.classList.add("popping");
  setTimeout(() => badDropElement.remove(), 150);
}

// Updates score in HUD with bump animation
function updateScoreDisplay(changeAmount) {
  scoreElement.textContent = `${score}`;

  if (changeAmount > 0) {
    scoreElement.classList.add("score-bump");
    setTimeout(() => scoreElement.classList.remove("score-bump"), 200);
  } else if (changeAmount < 0) {
    scoreElement.classList.add("score-drop");
    setTimeout(() => scoreElement.classList.remove("score-drop"), 200);
  }
}

// Creates floating "+1", "+5", or "-2" visual indicator
function showScorePopup(event, text, className) {
  const popup = document.createElement("div");
  popup.className = `score-popup ${className}`;
  popup.textContent = text;

  // Compute position relative to the game container
  const containerRect = gameContainer.getBoundingClientRect();
  const clickX = (event.clientX || containerRect.left + 50) - containerRect.left;
  const clickY = (event.clientY || containerRect.top + 50) - containerRect.top;

  popup.style.left = `${clickX}px`;
  popup.style.top = `${clickY}px`;

  gameContainer.appendChild(popup);

  // Automatically remove popup after animation completes (650ms)
  setTimeout(() => popup.remove(), 650);
}

// Triggers a brief screen shake on the container
function triggerScreenShake() {
  gameContainer.classList.remove("container-shake");
  // Force browser reflow to restart CSS animation
  void gameContainer.offsetWidth;
  gameContainer.classList.add("container-shake");
  setTimeout(() => gameContainer.classList.remove("container-shake"), 350);
}

// ========================================================
// Game Over & Celebration Logic
// ========================================================

function endGame() {
  gameRunning = false;

  // Stop timers
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  // Clear remaining falling drops from view
  clearFallingItems();

  // Re-enable Start button
  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  timeElement.parentElement.classList.remove("time-warning");

  // Update high score
  updateHighScore(score);

  // Display final score in modal
  finalScoreElement.textContent = `${score}`;

  // Evaluate win condition: 20 or more points wins!
  if (score >= 20) {
    // Pick random winning message from array
    const randomIndex = Math.floor(Math.random() * winningMessages.length);
    const chosenMessage = winningMessages[randomIndex];

    modalTitle.textContent = "You Won!";
    modalIcon.textContent = "🏆";
    modalMessage.textContent = chosenMessage;

    // Celebrate with sounds and confetti!
    playSound("win");
    launchConfetti();
  } else {
    // Pick random losing / try-again message from array
    const randomIndex = Math.floor(Math.random() * losingMessages.length);
    const chosenMessage = losingMessages[randomIndex];

    modalTitle.textContent = "Good Effort!";
    modalIcon.textContent = "💧";
    modalMessage.textContent = chosenMessage;
  }

  // Reveal Game Over Modal
  gameOverModal.classList.remove("hidden");
}

// Resets game completely back to initial state
function resetGame() {
  gameRunning = false;

  // Clear all running intervals
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  // Clear drops, confetti, and overlays
  clearFallingItems();
  clearConfetti();
  gameOverModal.classList.add("hidden");
  welcomeOverlay.classList.remove("hidden");

  // Reset variables and HUD
  score = 0;
  timeLeft = 30;
  scoreElement.textContent = "0";
  timeElement.textContent = "30";
  timeElement.parentElement.classList.remove("time-warning");

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
}

// Cleans up all falling items currently in container
function clearFallingItems() {
  const drops = gameContainer.querySelectorAll(".water-drop, .water-can-item, .score-popup");
  drops.forEach((el) => el.remove());
}

// ========================================================
// Pure DOM Confetti Generator (Celebrates Wins)
// ========================================================

function launchConfetti() {
  clearConfetti();

  // charity: water celebratory color palette
  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#8BD1CB", "#FF902A", "#F16061"];
  const totalPieces = 60;
  const containerWidth = gameContainer.offsetWidth || 800;

  for (let i = 0; i < totalPieces; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    // Random charity: water color
    const color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.backgroundColor = color;

    // Random spawn position across width
    const leftPos = Math.random() * containerWidth;
    piece.style.left = `${leftPos}px`;
    piece.style.top = "-10px";

    // Random shape (circle or rectangle)
    if (Math.random() > 0.5) {
      piece.style.borderRadius = "50%";
      piece.style.width = "12px";
      piece.style.height = "12px";
    } else {
      piece.style.borderRadius = "2px";
      piece.style.width = "8px";
      piece.style.height = "14px";
    }

    // Varied animation duration and delay
    const duration = (Math.random() * 1.5 + 2.0).toFixed(2);
    const delay = (Math.random() * 0.8).toFixed(2);
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;

    confettiContainer.appendChild(piece);
  }

  // Remove confetti elements after 3.5 seconds
  setTimeout(clearConfetti, 3500);
}

function clearConfetti() {
  if (confettiContainer) {
    confettiContainer.innerHTML = "";
  }
}
