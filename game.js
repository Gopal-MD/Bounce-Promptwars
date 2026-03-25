66// ============================================================
// GAME.JS — Physics Engine & Core Gameplay (tuned)
// ============================================================

// ── Canvas Setup ───────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(window.innerWidth - 40, 800);
    const ratio = 580 / 800;
    canvas.width = 800;
    canvas.height = 580;
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth * ratio) + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Game State ─────────────────────────────────────────────
const GameState = {
    LOADING: 'loading',
    STORY: 'story',
    PLAYING: 'playing',
    PAUSED: 'paused',
    DEATH: 'death',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    ENDING: 'ending'
};

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
let endingText = '';
// Input feel helpers (fixed-step frame counts).
let coyoteTimer = 0;
let jumpBufferTimer = 0;

// Visual FX state
let particles = [];        // generic particles (death, landing, goal)
let screenShake = 0;       // frames remaining

// AI Coach Hint state
let hintTier = 0;          // 0 = no hints used, 1-3 = tiers
let hintCooldown = 0;      // frames before hint button activates
const HINT_COOLDOWN_FRAMES = 15 * 60; // 15 seconds at 60fps
let levelStartFrame = 0;   // frame count when level began playing
let gameFrameCount = 0;    // running frame counter

// ── Ball ───────────────────────────────────────────────────
const ball = {
    x: 50,
    y: 500,
    radius: 12,
    vx: 0,
    vy: 0,
    speed: 4.5,
    // Canvas y grows downward, so negative is "jump up".
    jumpForce: -10,
    onGround: false,
    trail: [],
    glowIntensity: 0,
    squash: 1,              // vertical scale (< 1 = squash, > 1 = stretch)
    alive: true
};

// ── Classic Constant Gravity ─────────────────────────────
const GRAVITY_ACCEL_Y = 0.45;   // per fixed update step
const GRAVITY_COLOR  = '#4fc3f7';
const BALL_COLOR_ALT = '#80d8ff'; // lighter shade for FX variety

// ── Platforms & Obstacles ──────────────────────────────────
let platforms = [];
let obstacles = [];
let goal = null;
let platformTime = 0;

function loadLevel(data) {
    levelData = data;
    platforms = data.platforms.map(p => ({
        ...p,
        originX: p.x,
        originY: p.y,
        moveX: p.moveX || 0,
        moveY: p.moveY || 0,
        speed: p.speed || 1,
        // Used to "carry" the ball when the platform is moving.
        vx: 0,
        vy: 0,
        prevX: p.x,
        prevY: p.y
    }));
    obstacles = data.obstacles.map(o => ({
        ...o,
        originX: o.x,
        originY: o.y,
        moveX: o.moveX || 0,
        moveY: o.moveY || 0,
        speed: o.speed || 1,
        vx: 0,
        vy: 0,
        prevX: o.x,
        prevY: o.y
    }));
    goal = { ...data.goal };

    // Reset ball position 
    const spawnPlatform = platforms[0];
    ball.x = spawnPlatform.x + spawnPlatform.w / 2;
    ball.y = spawnPlatform.y - ball.radius - 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.onGround = false;
    ball.alive = true;
    ball.trail = [];

    platformTime = 0;
    deathCount = 0;
}

function updatePlatforms() {
    const dtSec = FIXED_DT / 1000;
    platformTime += dtSec;
    platforms.forEach(p => {
        if (p.type === 'moving') {
            const oldX = p.x;
            const oldY = p.y;
            if (p.moveX) p.x = p.originX + Math.sin(platformTime * p.speed) * p.moveX;
            if (p.moveY) p.y = p.originY + Math.sin(platformTime * p.speed) * p.moveY;
            p.vx = (p.x - oldX) / dtSec;
            p.vy = (p.y - oldY) / dtSec;
        }
    });
    obstacles.forEach(o => {
        if (o.type === 'moving_block') {
            const oldX = o.x;
            const oldY = o.y;
            if (o.moveX) o.x = o.originX + Math.sin(platformTime * o.speed) * o.moveX;
            if (o.moveY) o.y = o.originY + Math.sin(platformTime * o.speed) * o.moveY;
            o.vx = (o.x - oldX) / dtSec;
            o.vy = (o.y - oldY) / dtSec;
        }
    });
}

// ── Input ──────────────────────────────────────────────────
const keys = {};
let jumpJustPressed = false;
window.addEventListener('keydown', e => {
    const wasDown = keys[e.key] === true;
    keys[e.key] = true;
    if (e.key === 'ArrowUp' || e.key === ' ') e.preventDefault();
    // Only treat as "just pressed" on rising edge (prevents repeated jump while holding).
    if (!wasDown && (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w')) jumpJustPressed = true;
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

// Touch controls
const touchState = { left: false, right: false, jump: false };
const touchJustPressed = { left: false, right: false, jump: false };

function setupTouchControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    if (!btnLeft) return;

    const addTouch = (el, key) => {
        el.addEventListener('touchstart', e => {
            e.preventDefault();
            touchState[key] = true;
            touchJustPressed[key] = true;
        });
        el.addEventListener('touchend', e => { e.preventDefault(); touchState[key] = false; });
        el.addEventListener('mousedown', e => { touchState[key] = true; });
        el.addEventListener('mouseup', e => { touchState[key] = false; });
    };

    addTouch(btnLeft, 'left');
    addTouch(btnRight, 'right');
    addTouch(btnJump, 'jump');
}

// ── Physics ────────────────────────────────────────────────
function updateBall() {
    if (!ball.alive) return;

    // Input
    const moveLeft = keys['ArrowLeft'] || keys['a'] || touchState.left;
    const moveRight = keys['ArrowRight'] || keys['d'] || touchState.right;

    // Jump buffering / coyote time (makes timing feel less "glitchy").
    // We use fixed-step frames, so keep these in frame counts.
    const COYOTE_FRAMES = 6; // ~100ms
    const JUMP_BUFFER_FRAMES = 6; // ~100ms
    if (ball.onGround) coyoteTimer = COYOTE_FRAMES;
    else coyoteTimer = Math.max(0, coyoteTimer - 1);

    const jumpPressed = jumpJustPressed || touchJustPressed.jump;
    jumpJustPressed = false;
    touchJustPressed.jump = false;
    if (jumpPressed) jumpBufferTimer = JUMP_BUFFER_FRAMES;
    else jumpBufferTimer = Math.max(0, jumpBufferTimer - 1);

    if (moveLeft) ball.vx = -ball.speed;
    else if (moveRight) ball.vx = ball.speed;
    else ball.vx *= 0.85;

    // Apply classic constant physics acceleration.
    ball.vy += GRAVITY_ACCEL_Y;

    // Jump
    if (jumpBufferTimer > 0 && coyoteTimer > 0) {
        jumpBufferTimer = 0;
        coyoteTimer = 0;
        ball.vy = ball.jumpForce;
        ball.onGround = false;
    }

    // Terminal velocity
    ball.vx = Math.max(-12, Math.min(12, ball.vx));
    ball.vy = Math.max(-12, Math.min(12, ball.vy));

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collision
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -0.5; }
    if (ball.x + ball.radius > canvas.width) { ball.x = canvas.width - ball.radius; ball.vx *= -0.5; }

    // Platform collision
    const wasInAir = !ball.onGround;
    ball.onGround = false;
    platforms.forEach(p => {
        if (rectCircleCollision(ball, p)) {
            resolveCollision(ball, p);
        }
    });

    // Landing squash + dust particles
    if (ball.onGround && wasInAir) {
        ball.squash = 0.6;
        spawnDust(ball.x, ball.y + ball.radius, 6);
    }
    // Obstacle collision
    obstacles.forEach(o => {
        if (rectCircleCollision(ball, o)) {
            if (window.PlayerStats) window.PlayerStats.recordObstacleHit();
            killBall();
        }
    });

    // Out of bounds
    if (ball.y - ball.radius > canvas.height + 50 || ball.y + ball.radius < -50) {
        killBall();
    }

    // Goal check
    if (goal && circleCircleCollision(ball, goal.x + goal.w / 2, goal.y + goal.h / 2, goal.w / 2)) {
        completeLevel();
    }

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ball.trail.length > 20) ball.trail.shift();
    ball.trail.forEach(t => t.alpha -= 0.05);

    // Dynamic glow based on speed
    const speed = Math.hypot(ball.vx, ball.vy);
    ball.glowIntensity = 0.3 + Math.min(speed / 15, 0.7);

    // Squash recovery (spring back toward 1)
    ball.squash += (1 - ball.squash) * 0.15;

    // Stretch when falling fast
    if (Math.abs(ball.vy) > 6 && !ball.onGround) {
        ball.squash = 1 + Math.min(Math.abs(ball.vy) / 20, 0.3);
    }
}

function rectCircleCollision(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    // Epsilon makes edge contacts less "sticky" at high speeds.
    const rr = circle.radius * circle.radius;
    return (dx * dx + dy * dy) <= rr + 0.01;
}

function circleCircleCollision(circle, cx, cy, r) {
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    const rr = circle.radius + r;
    return (dx * dx + dy * dy) <= (rr * rr);
}

function resolveCollision(circle, rect) {
    const midX = rect.x + rect.w / 2;
    const midY = rect.y + rect.h / 2;

    const dx = circle.x - midX;
    const dy = circle.y - midY;
    const halfW = rect.w / 2 + circle.radius;
    const halfH = rect.h / 2 + circle.radius;

    const overlapX = halfW - Math.abs(dx);
    const overlapY = halfH - Math.abs(dy);

    if (overlapX < overlapY) {
        // Horizontal collision
        circle.x += overlapX * Math.sign(dx);
        circle.vx = circle.vx * -0.3 + (rect.vx || 0) * 0.25;
        circle.onGround = false;
    } else {
        // Vertical collision
        circle.y += overlapY * Math.sign(dy);
        // When dy < 0, the ball is being pushed upward (meaning it landed on the top of the platform).
        circle.onGround = dy < 0;
        // If we landed on a moving platform, inherit a bit of its horizontal motion.
        if (circle.onGround) {
            circle.vx += (rect.vx || 0) * 0.5;
        }
        circle.vy = 0;
    }
}

function killBall() {
    if (!ball.alive) return;
    ball.alive = false;
    lives--;
    deathCount++;
    screenShake = 12;              // ~200ms shake

    // Track for adaptive difficulty
    if (window.PlayerStats) window.PlayerStats.recordDeath();

    // Death burst particles
    spawnBurst(ball.x, ball.y, '#ff5252', 20);
    spawnBurst(ball.x, ball.y, '#ffab40', 10);

    triggerNarration('near_death');

    setTimeout(() => {
        if (lives <= 0) {
            state = GameState.GAME_OVER;
            UI.showGameOver();
        } else {
            // Respawn
            const spawnPlatform = platforms[0];
            ball.x = spawnPlatform.x + spawnPlatform.w / 2;
            ball.y = spawnPlatform.y - ball.radius - 2;
            ball.vx = 0;
            ball.vy = 0;
            ball.alive = true;
            ball.trail = [];
            ball.squash = 1;
            state = GameState.PLAYING;
        }
    }, 1000);

    state = GameState.DEATH;
}

async function completeLevel() {
    state = GameState.LEVEL_COMPLETE;

    // Score: base 1000 + death bonus (fewer deaths = more points)
    const deathBonus = Math.max(0, 500 - deathCount * 100);
    score += 1000 + deathBonus;

    // Persist stats for adaptive difficulty
    if (window.PlayerStats) {
        window.PlayerStats.endLevel(true);
        window.PlayerStats.setHighScore(score);
    }

    // Victory particles at goal
    if (goal) {
        spawnBurst(goal.x + goal.w / 2, goal.y + goal.h / 2, '#4caf50', 25);
        spawnBurst(goal.x + goal.w / 2, goal.y + goal.h / 2, '#81c784', 15);
    }

    const narr = await window.AI.generateNarration('level_complete');
    narrationText = narr;
    narrationTimer = 180;

    UI.showLevelComplete(currentLevel, score);
}

// ── Narration ──────────────────────────────────────────────
let narrationCooldown = 0;

async function triggerNarration(event) {
    if (narrationCooldown > 0) return;
    narrationCooldown = 180; // 3 seconds cooldown

    const narr = await window.AI.generateNarration(event);
    narrationText = narr;
    narrationTimer = 150;

    // Optional TTS
    if (window.ttsEnabled) {
        window.AI.speakText(narr);
    }
}

// ── Particle Helpers ───────────────────────────────────────
function spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 1,
            life: 1,
            size: 2 + Math.random() * 3,
            color
        });
    }
}

function spawnDust(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 1.5),
            life: 1,
            size: 1.5 + Math.random() * 2,
            color: 'rgba(200,220,255,0.6)'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;   // micro-gravity on particles
        p.life -= 0.025;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ── Rendering ──────────────────────────────────────────────
const starField = [];
for (let i = 0; i < 100; i++) {
    starField.push({
        x: Math.random() * 800,
        y: Math.random() * 580,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        twinkle: Math.random() * Math.PI * 2
    });
}

function render() {
    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 1.2;
        shakeY = (Math.random() - 0.5) * screenShake * 1.2;
        screenShake--;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0e27');
    bgGrad.addColorStop(0.5, '#1a1040');
    bgGrad.addColorStop(1, '#0d1b2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

    // Stars
    starField.forEach(s => {
        s.twinkle += 0.02;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed;
        if (s.y > 580) s.y = 0;
        if (s.y < 0) s.y = 580;
    });

    // Platforms
    platforms.forEach(p => {
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        if (p.type === 'moving') {
            grad.addColorStop(0, '#ff6f61');
            grad.addColorStop(1, '#d32f2f');
        } else {
            grad.addColorStop(0, '#4dd0e1');
            grad.addColorStop(1, '#00838f');
        }
        ctx.fillStyle = grad;
        ctx.shadowColor = p.type === 'moving' ? '#ff6f61' : '#4dd0e1';
        ctx.shadowBlur = 8;
        roundRect(ctx, p.x, p.y, p.w, p.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Obstacles
    obstacles.forEach(o => {
        ctx.save();
        if (o.type === 'spike') {
            drawSpike(o);
        } else {
            ctx.fillStyle = '#ff1744';
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 12;
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    });

    // Goal
    if (goal) {
        const gx = goal.x + goal.w / 2;
        const gy = goal.y + goal.h / 2;
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        const rot = Date.now() / 800;  // spinning ring

        ctx.fillStyle = `rgba(76, 175, 80, ${pulse})`;
        ctx.shadowColor = '#4caf50';
        ctx.shadowBlur = 20 * pulse;
        ctx.beginPath();
        ctx.arc(gx, gy, goal.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Spinning inner ring
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(200, 255, 200, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, goal.w / 3, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();

        // Outer glow ring
        ctx.strokeStyle = `rgba(76, 175, 80, ${pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(gx, gy, goal.w / 2 + 6 + Math.sin(Date.now() / 400) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Ball trail
    ball.trail.forEach((t, i) => {
        if (t.alpha <= 0) return;
        ctx.fillStyle = GRAVITY_COLOR;
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * (t.alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ball
    if (ball.alive) {
        ctx.save();
        ctx.translate(ball.x, ball.y);
        // Squash & stretch
        const sx = 1 / ball.squash;  // inverse to keep volume constant
        const sy = ball.squash;
        ctx.scale(sx, sy);

        // Glow
        ctx.shadowColor = GRAVITY_COLOR;
        ctx.shadowBlur = 15 + ball.glowIntensity * 20;

        // Ball body gradient
        const ballGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, ball.radius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.4, GRAVITY_COLOR);
        ballGrad.addColorStop(1, shadeColor(GRAVITY_COLOR, -30));

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(-3, -4, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Particles (death bursts, dust, goal sparkles)
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Narration text overlay
    if (narrationTimer > 0) {
        narrationTimer--;
        const alpha = Math.min(1, narrationTimer / 30);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.font = 'italic 16px "Orbitron", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(narrationText, canvas.width / 2, 40);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }

    ctx.restore(); // end screen-shake transform
}

function drawSpike(o) {
    const pulse = 0.7 + Math.sin(Date.now() / 400 + o.x) * 0.3;
    ctx.fillStyle = `rgba(255, 82, 82, ${pulse})`;
    ctx.shadowColor = '#ff5252';
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h);
    ctx.lineTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    return `rgb(${r},${g},${b})`;
}

// ── Game Loop ──────────────────────────────────────────────
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1000 / 60;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    // Cap accumulator to prevent spiral-of-death after tab switch
    accumulator += Math.min(delta, 200);

    while (accumulator >= FIXED_DT) {
        if (state === GameState.PLAYING) {
            updateBall();
            updatePlatforms();
            if (narrationCooldown > 0) narrationCooldown--;
            gameFrameCount++;
        }
        updateParticles();
        accumulator -= FIXED_DT;
    }

    render();

    if (state === GameState.PLAYING || state === GameState.DEATH) {
        UI.updateHUD(lives, score, currentLevel, MAX_LEVEL);
    }

    requestAnimationFrame(gameLoop);
}

// ── Level Flow ─────────────────────────────────────────────
async function startLevel(levelNum) {
    state = GameState.LOADING;
    UI.showLoading(levelNum);

    // Reset hint state for new level
    hintTier = 0;
    hintCooldown = HINT_COOLDOWN_FRAMES;
    levelStartFrame = gameFrameCount;

    // Generate story and level in parallel
    const [story, level] = await Promise.all([
        window.AI.generateStory(levelNum),
        window.AI.generateLevel(levelNum)
    ]);

    storyText = story;
    loadLevel(level);

    // Tell PlayerStats a new level is starting
    if (window.PlayerStats) {
        window.PlayerStats.startLevel(levelNum, level.difficulty);
    }

    // Show adaptive difficulty notice
    const adaptiveTag = level._adaptive;
    let adaptiveMsg = '';
    if (adaptiveTag === 'ease')      adaptiveMsg = 'Difficulty adjusted: slightly easier.';
    if (adaptiveTag === 'challenge') adaptiveMsg = 'Difficulty adjusted: extra challenge!';

    // Show story
    state = GameState.STORY;
    UI.showStory(storyText, level.name || `Level ${levelNum}`, level.difficulty, () => {
        state = GameState.PLAYING;
        UI.showGameplay();
    }, adaptiveMsg);
}

async function nextLevel() {
    currentLevel++;
    if (currentLevel > MAX_LEVEL) {
        // Game ending
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
    startLevel(1);
}

// ── Hint Request Handler ────────────────────────────────
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
    console.log(`[Coach] Player used hint tier ${hintTier} on level ${currentLevel}`);
}

// ── Initialize ─────────────────────────────────────────────
window.ttsEnabled = false;

function initGame() {
    setupTouchControls();
    requestAnimationFrame(gameLoop);

    // Start button handler
    document.getElementById('btn-start')?.addEventListener('click', () => {
        startLevel(1);
    });
}

// Export game functions
window.Game = {
    nextLevel,
    restartGame,
    initGame,
    startLevel,
    requestHint,
    get state() { return state; },
    get currentLevel() { return currentLevel; },
    get score() { return score; }
};
