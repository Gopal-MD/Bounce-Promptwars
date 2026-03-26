// ============================================================
// GAME.JS — Physics Engine, Gravity System & Core Gameplay
// Bounce Tales: Gravity Shift — Smart 3D AI Edition
// ============================================================

// ── Canvas Setup ───────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const W = 800, H = 580;

// ── Game States ────────────────────────────────────────────
const GameState = {
    LOADING: 'loading', STORY: 'story', PLAYING: 'playing',
    DEATH: 'death', LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over', ENDING: 'ending'
};

// ── Input ──────────────────────────────────────────────────
const keys = {};
const touchState = { left: false, right: false, jump: false };

window.addEventListener('keydown', e => { keys[e.key] = true; if (['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function setupTouchControls() {
    const wire = (id, prop) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', e => { e.preventDefault(); touchState[prop] = true; });
        el.addEventListener('touchend', e => { touchState[prop] = false; });
    };
    wire('btn-left', 'left');
    wire('btn-right', 'right');
    wire('btn-jump', 'jump');
}

// ── Game Variables ─────────────────────────────────────────
let state = GameState.LOADING;
let currentLevel = 1;
const MAX_LEVEL = 10;
let lives = 5;
let score = 0;
let deathCount = 0;
let levelData = null;
let storyText = '';
let narrationText = '';
let narrationTimer = 0;
let narrationCooldown = 0;
let endingText = '';
let runStartedAt = Date.now();

// Input feel helpers
let coyoteTimer = 0;
let jumpBufferTimer = 0;

// AI Coach Hint state
let hintTier = 0;
let hintCooldown = 0;
const HINT_COOLDOWN_FRAMES = 15 * 60;
let levelStartFrame = 0;
let gameFrameCount = 0;

// ── Gravity System ─────────────────────────────────────────
// Types: normal, reverse, left, right, zero, pulse
const GravityTypes = {
    NORMAL:  'normal',
    REVERSE: 'reverse',
    LEFT:    'left',
    RIGHT:   'right',
    ZERO:    'zero',
    PULSE:   'pulse'
};

let currentGravity = GravityTypes.NORMAL;
let gravityTransitionTimer = 0;
const GRAVITY_STRENGTH = 0.45;

function getGravityVector() {
    switch (currentGravity) {
        case GravityTypes.NORMAL:  return { gx: 0, gy: GRAVITY_STRENGTH };
        case GravityTypes.REVERSE: return { gx: 0, gy: -GRAVITY_STRENGTH };
        case GravityTypes.LEFT:   return { gx: -GRAVITY_STRENGTH, gy: 0.10 };
        case GravityTypes.RIGHT:  return { gx: GRAVITY_STRENGTH, gy: 0.10 };
        case GravityTypes.ZERO:   return { gx: 0, gy: 0.02 }; // tiny drift
        case GravityTypes.PULSE:
            const burst = Math.sin(Date.now() / 300) * GRAVITY_STRENGTH * 1.5;
            return { gx: 0, gy: burst };
        default: return { gx: 0, gy: GRAVITY_STRENGTH };
    }
}

function switchGravity(type) {
    if (currentGravity === type) return;
    currentGravity = type;
    gravityTransitionTimer = 30;
    triggerNarration('gravity_shift');
    UI.updateGravityIndicator(type);
}

// ── Tension System ─────────────────────────────────────────
let tension = 0;
const TENSION_MAX = 100;

function updateTension() {
    // Increase near obstacles
    let nearObstacle = false;
    obstacles.forEach(o => {
        const dx = ball.x - (o.x + o.w / 2);
        const dy = ball.y - (o.y + o.h / 2);
        if (Math.hypot(dx, dy) < 80) nearObstacle = true;
    });
    if (nearObstacle) tension = Math.min(TENSION_MAX, tension + 0.4);

    // Increase near goal
    if (goal) {
        const dx = ball.x - (goal.x + goal.w / 2);
        const dy = ball.y - (goal.y + goal.h / 2);
        if (Math.hypot(dx, dy) < 120) tension = Math.min(TENSION_MAX, tension + 0.3);
    }

    // Decay
    tension = Math.max(0, tension - 0.15);

    // Death spike
    if (state === GameState.DEATH) tension = Math.min(TENSION_MAX, tension + 5);

    // Tension affects movement speed multiplier
    ball.speedMultiplier = 1 + (tension / TENSION_MAX) * 0.3;
}

// ── Ball ───────────────────────────────────────────────────
const ball = {
    x: 50, y: H - 50,
    vx: 0, vy: 0,
    radius: 12,
    jumpForce: -9.5,
    moveSpeed: 3.5,
    maxVx: 5,
    maxVy: 14,
    friction: 0.88,
    onGround: false,
    trail: [],
    glowIntensity: 0,
    squash: 1,
    speedMultiplier: 1,
    alive: true
};

// ── Level Data ─────────────────────────────────────────────
let platforms = [];
let obstacles = [];
let goal = null;
let gravityZones = [];

// ── Fixed Timestep ─────────────────────────────────────────
const FIXED_DT = 1000 / 60;
let accumulator = 0;
let lastTime = null;

const COYOTE_FRAMES = 6;
const JUMP_BUFFER_FRAMES = 6;

// ── Load Level ─────────────────────────────────────────────
function loadLevel(data) {
    levelData = data;
    platforms = (data.platforms || []).map(p => ({
        x: p.x, y: p.y, w: p.w, h: p.h || 20,
        type: p.type || 'static',
        moveX: p.moveX || 0, moveY: p.moveY || 0,
        speed: p.speed || 1,
        _origX: p.x, _origY: p.y,
        _phase: Math.random() * Math.PI * 2
    }));

    obstacles = (data.obstacles || []).map(o => ({
        x: o.x, y: o.y, w: o.w || 20, h: o.h || 20,
        type: o.type || 'spike',
        moveX: o.moveX || 0, moveY: o.moveY || 0,
        speed: o.speed || 1,
        _origX: o.x, _origY: o.y,
        _phase: Math.random() * Math.PI * 2
    }));

    goal = data.goal ? { ...data.goal } : null;

    // Gravity zones
    gravityZones = (data.gravityZones || []).map(gz => ({
        x: gz.x, y: gz.y, w: gz.w || 80, h: gz.h || 80,
        type: gz.type || 'normal'
    }));

    // Reset ball
    const spawnPlatform = platforms[0];
    if (spawnPlatform) {
        ball.x = spawnPlatform.x + spawnPlatform.w / 2;
        ball.y = spawnPlatform.y - ball.radius - 2;
    } else {
        ball.x = 50;
        ball.y = H - 50;
    }
    ball.vx = 0;
    ball.vy = 0;
    ball.alive = true;
    ball.trail = [];
    ball.squash = 1;

    // Reset gravity & tension
    currentGravity = GravityTypes.NORMAL;
    tension = 0;
    deathCount = 0;
    narrationCooldown = 0;

    // Build 3D scene
    if (window.Renderer3D) {
        Renderer3D.buildLevel(platforms, obstacles, goal);
    }
}

// ── Update Moving Platforms/Obstacles ───────────────────────
function updatePlatforms() {
    const t = Date.now() / 1000;
    platforms.forEach(p => {
        if (p.type === 'moving') {
            if (p.moveX) p.x = p._origX + Math.sin(t * p.speed + p._phase) * p.moveX;
            if (p.moveY) p.y = p._origY + Math.sin(t * p.speed + p._phase) * p.moveY;
        }
    });
    obstacles.forEach(o => {
        if (o.type === 'moving_block') {
            if (o.moveX) o.x = o._origX + Math.sin(t * o.speed + o._phase) * o.moveX;
            if (o.moveY) o.y = o._origY + Math.sin(t * o.speed + o._phase) * o.moveY;
        }
    });
}

// ── Physics ────────────────────────────────────────────────
function updateBall() {
    if (!ball.alive) return;

    // Input
    const moveLeft = keys['ArrowLeft'] || keys['a'] || touchState.left;
    const moveRight = keys['ArrowRight'] || keys['d'] || touchState.right;
    const jumpPressed = keys['ArrowUp'] || keys['w'] || keys[' '] || touchState.jump;

    // Horizontal movement (tension-boosted)
    const speed = ball.moveSpeed * ball.speedMultiplier;
    if (moveLeft) ball.vx -= speed * 0.3;
    if (moveRight) ball.vx += speed * 0.3;
    ball.vx *= ball.friction;
    ball.vx = Math.max(-ball.maxVx, Math.min(ball.maxVx, ball.vx));

    // Coyote time
    if (ball.onGround) coyoteTimer = COYOTE_FRAMES;
    else coyoteTimer = Math.max(0, coyoteTimer - 1);

    // Jump buffer
    if (jumpPressed) jumpBufferTimer = JUMP_BUFFER_FRAMES;
    else jumpBufferTimer = Math.max(0, jumpBufferTimer - 1);

    // Jump
    if (jumpBufferTimer > 0 && coyoteTimer > 0) {
        ball.vy = ball.jumpForce;
        ball.onGround = false;
        coyoteTimer = 0;
        jumpBufferTimer = 0;
        ball.squash = 1.25;
    }

    // Gravity
    const grav = getGravityVector();
    ball.vx += grav.gx;
    ball.vy += grav.gy;

    // Gravity transition smoothing
    if (gravityTransitionTimer > 0) {
        ball.vy *= 0.92;
        gravityTransitionTimer--;
    }

    ball.vy = Math.max(-ball.maxVy, Math.min(ball.maxVy, ball.vy));

    // Position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Walls
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -0.5; }
    if (ball.x + ball.radius > W) { ball.x = W - ball.radius; ball.vx *= -0.5; }

    // Floor / ceiling
    if (ball.y + ball.radius > H) { killBall(); return; }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= -0.5; }

    // Platform collision
    const wasInAir = !ball.onGround;
    ball.onGround = false;
    platforms.forEach(p => {
        if (rectCircleCollision(ball, p)) {
            resolveCollision(ball, p);
        }
    });

    // Landing squash
    if (ball.onGround && wasInAir) {
        ball.squash = 0.6;
    }

    // Obstacle collision
    obstacles.forEach(o => {
        if (rectCircleCollision(ball, o)) {
            if (window.PlayerStats) window.PlayerStats.recordObstacleHit();
            killBall();
        }
    });

    // Goal collision
    if (goal && rectCircleCollision(ball, goal)) {
        completeLevel();
        return;
    }

    // Gravity zone detection
    gravityZones.forEach(gz => {
        if (ball.x > gz.x && ball.x < gz.x + gz.w &&
            ball.y > gz.y && ball.y < gz.y + gz.h) {
            switchGravity(gz.type);
        }
    });

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ball.trail.length > 20) ball.trail.shift();
    ball.trail.forEach(t => t.alpha -= 0.05);

    // Glow
    const speed2 = Math.hypot(ball.vx, ball.vy);
    ball.glowIntensity = 0.3 + Math.min(speed2 / 15, 0.7);

    // Squash recovery
    ball.squash += (1 - ball.squash) * 0.15;
    if (Math.abs(ball.vy) > 6 && !ball.onGround) {
        ball.squash = 1 + Math.min(Math.abs(ball.vy) / 20, 0.3);
    }

    // Tension
    updateTension();
}

// ── Collision Detection ────────────────────────────────────
function rectCircleCollision(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

function resolveCollision(bll, rect) {
    const cx = Math.max(rect.x, Math.min(bll.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(bll.y, rect.y + rect.h));
    const dx = bll.x - cx;
    const dy = bll.y - cy;
    const dist = Math.hypot(dx, dy) || 1;

    const overlap = bll.radius - dist;
    if (overlap <= 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    bll.x += nx * overlap * 1.01;
    bll.y += ny * overlap * 1.01;

    if (Math.abs(ny) > Math.abs(nx)) {
        bll.vy = 0;
        if (ny < 0) bll.onGround = true;
    } else {
        bll.vx = 0;
    }
}

// ── Narration ──────────────────────────────────────────────
async function triggerNarration(event) {
    if (narrationCooldown > 0) return;
    narrationCooldown = 180;

    const narr = await window.AI.generateNarration(event);
    narrationText = narr;
    narrationTimer = 150;
    UI.showNarration(narr);
}

// ── Kill / Complete ────────────────────────────────────────
function killBall() {
    if (!ball.alive) return;
    ball.alive = false;
    lives--;
    deathCount++;
    tension = Math.min(TENSION_MAX, tension + 20);

    // Track for adaptive difficulty
    if (window.PlayerStats) window.PlayerStats.recordDeath();

    // 3D effects
    if (window.Renderer3D) {
        Renderer3D.shake(3);
        Renderer3D.burst(ball.x, ball.y, 0xff5252, 25);
        Renderer3D.burst(ball.x, ball.y, 0xffab40, 12);
    }

    triggerNarration('near_death');

    setTimeout(() => {
        if (lives <= 0) {
            persistLeaderboardResult();
            state = GameState.GAME_OVER;
            UI.showGameOver();
        } else {
            const spawnPlatform = platforms[0];
            ball.x = spawnPlatform.x + spawnPlatform.w / 2;
            ball.y = spawnPlatform.y - ball.radius - 2;
            ball.vx = 0;
            ball.vy = 0;
            ball.alive = true;
            ball.trail = [];
            ball.squash = 1;
            currentGravity = GravityTypes.NORMAL;
            state = GameState.PLAYING;
        }
    }, 1000);

    state = GameState.DEATH;
}

async function completeLevel() {
    state = GameState.LEVEL_COMPLETE;

    const deathBonus = Math.max(0, 500 - deathCount * 100);
    const tensionBonus = Math.round(tension * 2);
    score += 1000 + deathBonus + tensionBonus;

    if (window.PlayerStats) {
        window.PlayerStats.endLevel(true);
        window.PlayerStats.setHighScore(score);
    }

    // 3D victory effects
    if (goal && window.Renderer3D) {
        Renderer3D.burst(goal.x + goal.w / 2, goal.y + goal.h / 2, 0x4caf50, 30);
        Renderer3D.burst(goal.x + goal.w / 2, goal.y + goal.h / 2, 0x81c784, 20);
    }

    const narr = await window.AI.generateNarration('level_complete');
    narrationText = narr;
    narrationTimer = 180;

    UI.showLevelComplete(currentLevel, score);
}

// ── Gravity Zone Trigger (timed) ───────────────────────────
let gravityShiftTimer = 0;
function updateGravityShifts() {
    gravityShiftTimer++;
    // Every ~10 seconds, maybe trigger a gravity event based on tension
    if (gravityShiftTimer > 600) {
        gravityShiftTimer = 0;
        if (tension > 50 && gravityZones.length === 0) {
            // High tension → random gravity shift
            const types = Object.values(GravityTypes);
            const pick = types[Math.floor(Math.random() * types.length)];
            switchGravity(pick);
            // Revert after a few seconds
            setTimeout(() => switchGravity(GravityTypes.NORMAL), 4000);
        }
    }
}

// ── Game Loop ──────────────────────────────────────────────
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += Math.min(delta, 200);

    while (accumulator >= FIXED_DT) {
        if (state === GameState.PLAYING) {
            updateBall();
            updatePlatforms();
            updateGravityShifts();
            if (narrationCooldown > 0) narrationCooldown--;
            gameFrameCount++;
        }
        accumulator -= FIXED_DT;
    }

    // 3D Render
    if (state === GameState.PLAYING || state === GameState.DEATH) {
        if (window.Renderer3D) {
            Renderer3D.update(ball, platforms, obstacles, currentGravity, tension);
        }
        if (state === GameState.PLAYING) {
            UI.updateHUD(lives, score, currentLevel, MAX_LEVEL, tension);
        }
    }

    requestAnimationFrame(gameLoop);
}

// ── Level Flow ─────────────────────────────────────────────
async function startLevel(levelNum) {
    state = GameState.LOADING;
    UI.showLoading(levelNum);

    hintTier = 0;
    hintCooldown = HINT_COOLDOWN_FRAMES;
    levelStartFrame = gameFrameCount;

    const [story, level] = await Promise.all([
        window.AI.generateStory(levelNum),
        window.AI.generateLevel(levelNum)
    ]);

    storyText = story;
    loadLevel(level);

    if (window.PlayerStats) {
        window.PlayerStats.startLevel(levelNum, level.difficulty);
    }

    const adaptiveTag = level._adaptive;
    let adaptiveMsg = '';
    if (adaptiveTag === 'ease') adaptiveMsg = 'Difficulty adjusted: slightly easier.';
    if (adaptiveTag === 'challenge') adaptiveMsg = 'Difficulty adjusted: extra challenge!';

    state = GameState.STORY;
    UI.showStory(storyText, level.name || `Level ${levelNum}`, level.difficulty, () => {
        state = GameState.PLAYING;
        UI.showGameplay();
        // Initial 3D render
        if (window.Renderer3D) {
            Renderer3D.update(ball, platforms, obstacles, currentGravity, tension);
        }
    }, adaptiveMsg);
}

async function nextLevel() {
    currentLevel++;
    if (currentLevel > MAX_LEVEL) {
        persistLeaderboardResult();
        state = GameState.ENDING;
        const ending = await window.AI.generateEnding();
        UI.showEnding(ending, score);
    } else {
        await startLevel(currentLevel);
    }
}

function restartGame() {
    currentLevel = 1;
    lives = 5;
    score = 0;
    deathCount = 0;
    hintTier = 0;
    tension = 0;
    currentGravity = GravityTypes.NORMAL;
    runStartedAt = Date.now();
    startLevel(1);
}

// ── Hint Request Handler ───────────────────────────────────
async function requestHint() {
    if (state !== GameState.PLAYING) return;
    if ((gameFrameCount - levelStartFrame) < HINT_COOLDOWN_FRAMES) {
        UI.showHint('Hints available after 15 seconds...');
        return;
    }
    if (hintTier >= 3) {
        UI.showHint('No more hints available. You\'ve got this! 💪');
        return;
    }
    hintTier++;
    UI.showHint('💡 Thinking...');
    const hint = await window.AI.generateHint(currentLevel, hintTier);
    UI.showHint(hint);
}

function persistLeaderboardResult() {
    if (!window.PlayerStats?.submitScore) return;
    const name = window.PlayerStats.getPlayerName();
    const runSecs = Math.round((Date.now() - runStartedAt) / 1000);
    window.PlayerStats.submitScore({
        name,
        score,
        level: currentLevel,
        timeTaken: runSecs,
        timestamp: Date.now()
    });
    UI.refreshLeaderboards?.();
}

// ── Initialize ─────────────────────────────────────────────
function initGame() {
    // Init Three.js renderer
    if (window.Renderer3D) {
        Renderer3D.init(canvas);
        window.addEventListener('resize', () => Renderer3D.resize());
        Renderer3D.resize();
    }

    setupTouchControls();

    // Username handling
    const input = document.getElementById('username-input');
    const savedName = window.PlayerStats?.getPlayerName?.() || 'Pilot';
    UI.setPlayerName?.(savedName);
    if (input) {
        input.value = savedName;
        input.addEventListener('change', () => {
            const clean = window.PlayerStats?.setPlayerName?.(input.value) || 'Pilot';
            UI.setPlayerName?.(clean);
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const clean = window.PlayerStats?.setPlayerName?.(input.value) || 'Pilot';
                UI.setPlayerName?.(clean);
                document.getElementById('btn-start')?.focus();
            }
        });
    }

    UI.refreshLeaderboards?.();
    UI.showTitle?.();
    requestAnimationFrame(gameLoop);

    document.getElementById('btn-start')?.addEventListener('click', () => {
        const chosen = window.PlayerStats?.setPlayerName?.(input?.value || savedName) || savedName;
        UI.setPlayerName?.(chosen);
        runStartedAt = Date.now();
        startLevel(1);
    });
}

// Export
window.Game = {
    nextLevel,
    restartGame,
    initGame,
    startLevel,
    requestHint,
    get state() { return state; },
    get currentLevel() { return currentLevel; },
    get score() { return score; },
    get tension() { return tension; },
    get gravityMode() { return currentGravity; }
};
