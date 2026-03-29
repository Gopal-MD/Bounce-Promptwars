// ============================================================
// AI.JS — Offline AI Engine (No External API calls)
// Bounce Tales: Gravity Shift — Smart 3D AI Edition
// ============================================================

const OFFLINE_MODE = true;

// ── Predefined Levels ──────────────────────────────────────
const PREDEFINED_LEVELS = [
    {
        name: "Awakening",
        difficulty: "easy",
        platforms: [
            { x: 20, y: 540, w: 200, h: 20, type: "static" },
            { x: 280, y: 480, w: 180, h: 20, type: "static" },
            { x: 520, y: 420, w: 160, h: 20, type: "static" },
            { x: 350, y: 350, w: 180, h: 20, type: "static" },
            { x: 550, y: 280, w: 200, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 360, y: 460, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 620, y: 240, w: 40, h: 40 },
        gravityZones: []
    },
    {
        name: "Zero Point",
        difficulty: "medium",
        platforms: [
            { x: 20, y: 540, w: 160, h: 20, type: "static" },
            { x: 260, y: 470, w: 140, h: 20, type: "moving", moveX: 60, speed: 1.2 },
            { x: 480, y: 400, w: 150, h: 20, type: "static" },
            { x: 280, y: 320, w: 140, h: 20, type: "moving", moveY: 40, speed: 1.0 },
            { x: 100, y: 250, w: 160, h: 20, type: "static" },
            { x: 400, y: 170, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 540, y: 380, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 460, y: 130, w: 40, h: 40 },
        gravityZones: [
            { x: 280, y: 260, w: 100, h: 80, type: "zero" }
        ]
    },
    {
        name: "Inversion",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 180, h: 20, type: "static" },
            { x: 280, y: 460, w: 160, h: 20, type: "static" },
            { x: 500, y: 380, w: 150, h: 20, type: "static" },
            { x: 300, y: 280, w: 180, h: 20, type: "static" },
            { x: 80, y: 200, w: 160, h: 20, type: "static" },
            { x: 350, y: 120, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 360, y: 440, w: 18, h: 18, type: "spike" },
            { x: 140, y: 180, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 400, y: 80, w: 40, h: 40 },
        gravityZones: [
            { x: 450, y: 320, w: 120, h: 100, type: "reverse" }
        ]
    },
    {
        name: "Lateral Shift",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 160, h: 20, type: "static" },
            { x: 300, y: 500, w: 120, h: 20, type: "moving", moveX: 80, speed: 1.0 },
            { x: 550, y: 440, w: 150, h: 20, type: "static" },
            { x: 350, y: 350, w: 140, h: 20, type: "static" },
            { x: 100, y: 280, w: 180, h: 20, type: "static" },
            { x: 400, y: 200, w: 160, h: 20, type: "moving", moveY: 50, speed: 1.2 },
            { x: 600, y: 130, w: 140, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 610, y: 420, w: 18, h: 18, type: "spike" },
            { x: 180, y: 260, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 640, y: 90, w: 40, h: 40 },
        gravityZones: [
            { x: 300, y: 300, w: 100, h: 80, type: "left" }
        ]
    },
    {
        name: "Chaos Canyon",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 140, h: 20, type: "static" },
            { x: 240, y: 500, w: 110, h: 20, type: "moving", moveY: 40, speed: 1.3 },
            { x: 420, y: 440, w: 120, h: 20, type: "static" },
            { x: 600, y: 380, w: 110, h: 20, type: "moving", moveX: 50, speed: 1.0 },
            { x: 350, y: 300, w: 130, h: 20, type: "static" },
            { x: 100, y: 230, w: 120, h: 20, type: "moving", moveX: 60, speed: 1.5 },
            { x: 300, y: 160, w: 140, h: 20, type: "static" },
            { x: 550, y: 100, w: 150, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 480, y: 420, w: 18, h: 18, type: "spike" },
            { x: 150, y: 210, w: 18, h: 18, type: "spike" },
            { x: 380, y: 140, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 590, y: 60, w: 40, h: 40 },
        gravityZones: [
            { x: 300, y: 250, w: 120, h: 80, type: "zero" },
            { x: 500, y: 340, w: 100, h: 70, type: "pulse" },
            { x: 80, y: 180, w: 100, h: 80, type: "reverse" }
        ]
    }
];

// ── Predefined Narrative Hooks ─────────────────────────────
const LOCAL_COMMENTS = [
    "Gravity destabilizing...",
    "The system is collapsing...",
    "Stay focused...",
    "You are losing control...",
    "Reality fracture detected.",
    "Momentum is shifting.",
    "The void is hungry.",
    "Do not look down."
];

let missionArc = null;

// ── Local AI Functions ────────────────────────────────────

function generateMissionArc(pilotName) {
    missionArc = {
        pilot: pilotName || "Unknown Pilot",
        world: "The Fractured Codebase",
        enemy: "The Void Core",
        goal: "Restore standard physics.",
        chapters: [
            "In a world where physics has fractured, a small ball awakens on the edge of nothing.",
            "The gravity engines have failed. Reality bends and twists wildly.",
            "They said the rules were constant. Now floors become ceilings.",
            "Somewhere between falling and flying, a new path is discovered.",
            "Chaos reigns in the canyon below. The ball must ascend.",
            "Timing is everything now. Hesitate and the void claims you.",
            "A fortress of light hangs above an endless drop.",
            "The corridors grow narrow and the platforms shift like restless thoughts.",
            "The void hums with static electricity. It is waiting.",
            "This is the final ascent. Defy gravity, and survive."
        ]
    };
    return missionArc;
}

function generateLevel(levelNumber) {
    const index = (levelNumber - 1) % PREDEFINED_LEVELS.length;
    // Return a deeply cloned copy of the predefined level so moving platform phases/positions don't bleed between runs
    const levelClone = JSON.parse(JSON.stringify(PREDEFINED_LEVELS[index]));
    
    // Append the adaptive tag exactly as expected by game.js
    let adaptiveInfo = 'maintain';
    if (window.PlayerStats) {
        adaptiveInfo = window.PlayerStats.calculateAdaptiveDifficulty(3).adjustment;
    }
    levelClone._adaptive = adaptiveInfo;
    
    return levelClone;
}

function generateStory(levelNumber) {
    if (!missionArc) generateMissionArc("Pilot");
    const index = (levelNumber - 1) % missionArc.chapters.length;
    return missionArc.chapters[index];
}

function generateNarration(event) {
    if (event === 'level_complete') return 'Sector secured. Proceeding to next zone.';
    return LOCAL_COMMENTS[Math.floor(Math.random() * LOCAL_COMMENTS.length)];
}

function generateMidLevelCommentary() {
    return LOCAL_COMMENTS[Math.floor(Math.random() * LOCAL_COMMENTS.length)];
}

function generateEnding(pilotName) {
    return `Mission accomplished, ${pilotName || 'Pilot'}.\nThe gravity anchors have been firmly secured.\nThe void is sealed forever.\nOffline Mode has kept you alive.`;
}

function generateEpilogue(level, score, deaths) {
    return `The journey ends at level ${level}.\nThe system disconnected.\nA score of ${score} will echo locally forever.`;
}

function generateHint(levelNum, hintTier) {
    const hints = [
        "Time your jumps carefully.",
        "Momentum is your best friend!",
        "Watch out for shifting gravity."
    ];
    return hints[hintTier % hints.length];
}

function seedLeaderboard() { /* No-op in offline mode */ }
function prefetchNextLevel() { /* No-op in offline mode */ }
function getPrefetchedLevel() { return null; }
function speakText() { /* No-op */ }

// Export to window
if (typeof window !== 'undefined') {
    window.AI = {
        generateLevel,
        generateStory,
        generateEnding,
        generateHint,
        generateMissionArc,
        generateMidLevelCommentary,
        generateNarration,
        generateEpilogue,
        seedLeaderboard,
        prefetchNextLevel,
        getPrefetchedLevel,
        speakText
    };
}

