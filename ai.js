// ============================================================
// AI.JS — Gemini API Integration
// Bounce Tales: Gravity Shift — Smart 3D AI Edition
// ============================================================

// API endpoint routes through Vercel serverless function
// (API key is securely stored in environment variables)
const GEMINI_ENDPOINT = '/api/generateContent';

// ── Fallback Data ─────────────────────────────────────────
// 10 hand-crafted levels with progressive difficulty & gravity zones.

const FALLBACK_LEVELS = [
    // Level 1: First Steps (Easy)
    {
        name: "First Steps",
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
    // Level 2: The Climb (Easy)
    {
        name: "The Climb",
        difficulty: "easy",
        platforms: [
            { x: 30, y: 540, w: 180, h: 20, type: "static" },
            { x: 250, y: 460, w: 150, h: 20, type: "static" },
            { x: 100, y: 380, w: 160, h: 20, type: "static" },
            { x: 320, y: 300, w: 180, h: 20, type: "static" },
            { x: 150, y: 220, w: 160, h: 20, type: "static" },
            { x: 400, y: 150, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 310, y: 440, w: 18, h: 18, type: "spike" },
            { x: 180, y: 360, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 460, y: 110, w: 40, h: 40 },
        gravityZones: []
    },
    // Level 3: Gravity Intro (Easy)
    {
        name: "Gravity Intro",
        difficulty: "easy",
        platforms: [
            { x: 20, y: 540, w: 200, h: 20, type: "static" },
            { x: 300, y: 480, w: 160, h: 20, type: "static" },
            { x: 520, y: 400, w: 180, h: 20, type: "static" },
            { x: 300, y: 300, w: 160, h: 20, type: "static" },
            { x: 100, y: 220, w: 200, h: 20, type: "static" },
            { x: 400, y: 140, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 380, y: 460, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 450, y: 100, w: 40, h: 40 },
        gravityZones: [
            { x: 280, y: 260, w: 100, h: 80, type: "zero" }
        ]
    },
    // Level 4: Moving Bridges (Medium)
    {
        name: "Moving Bridges",
        difficulty: "medium",
        platforms: [
            { x: 20, y: 540, w: 160, h: 20, type: "static" },
            { x: 260, y: 470, w: 140, h: 20, type: "moving", moveX: 60, speed: 1.2 },
            { x: 480, y: 400, w: 150, h: 20, type: "static" },
            { x: 280, y: 320, w: 140, h: 20, type: "moving", moveY: 40, speed: 0.8 },
            { x: 100, y: 250, w: 160, h: 20, type: "static" },
            { x: 400, y: 170, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 540, y: 380, w: 18, h: 18, type: "spike" },
            { x: 160, y: 230, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 460, y: 130, w: 40, h: 40 },
        gravityZones: []
    },
    // Level 5: Reverse World (Medium)
    {
        name: "Reverse World",
        difficulty: "medium",
        platforms: [
            { x: 20, y: 540, w: 180, h: 20, type: "static" },
            { x: 280, y: 460, w: 160, h: 20, type: "static" },
            { x: 500, y: 380, w: 150, h: 20, type: "static" },
            { x: 300, y: 280, w: 180, h: 20, type: "static" },
            { x: 80, y: 200, w: 160, h: 20, type: "static" },
            { x: 350, y: 120, w: 180, h: 20, type: "static" },
            { x: 600, y: 520, w: 100, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 360, y: 440, w: 18, h: 18, type: "spike" },
            { x: 560, y: 360, w: 18, h: 18, type: "spike" },
            { x: 140, y: 180, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 400, y: 80, w: 40, h: 40 },
        gravityZones: [
            { x: 450, y: 320, w: 120, h: 100, type: "reverse" },
            { x: 60, y: 140, w: 100, h: 80, type: "zero" }
        ]
    },
    // Level 6: Lateral Shift (Medium)
    {
        name: "Lateral Shift",
        difficulty: "medium",
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
            { x: 420, y: 330, w: 18, h: 18, type: "spike" },
            { x: 180, y: 260, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 640, y: 90, w: 40, h: 40 },
        gravityZones: [
            { x: 300, y: 300, w: 100, h: 80, type: "left" }
        ]
    },
    // Level 7: Pulse Canyon (Hard)
    {
        name: "Pulse Canyon",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 140, h: 20, type: "static" },
            { x: 220, y: 480, w: 120, h: 20, type: "moving", moveX: 50, speed: 1.5 },
            { x: 420, y: 420, w: 130, h: 20, type: "static" },
            { x: 600, y: 350, w: 120, h: 20, type: "moving", moveY: 40, speed: 1.0 },
            { x: 380, y: 280, w: 140, h: 20, type: "static" },
            { x: 150, y: 210, w: 130, h: 20, type: "moving", moveX: 60, speed: 1.3 },
            { x: 400, y: 140, w: 160, h: 20, type: "static" },
            { x: 620, y: 80, w: 140, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 480, y: 400, w: 18, h: 18, type: "spike" },
            { x: 660, y: 330, w: 18, h: 18, type: "spike" },
            { x: 210, y: 190, w: 18, h: 18, type: "spike" },
            { x: 500, y: 120, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 660, y: 40, w: 40, h: 40 },
        gravityZones: [
            { x: 350, y: 230, w: 100, h: 80, type: "pulse" },
            { x: 560, y: 300, w: 100, h: 80, type: "reverse" }
        ]
    },
    // Level 8: Zero Zone (Hard)
    {
        name: "Zero Zone",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 140, h: 20, type: "static" },
            { x: 240, y: 500, w: 110, h: 20, type: "moving", moveY: 30, speed: 1.2 },
            { x: 420, y: 440, w: 120, h: 20, type: "static" },
            { x: 600, y: 380, w: 110, h: 20, type: "moving", moveX: 40, speed: 1.0 },
            { x: 350, y: 300, w: 130, h: 20, type: "static" },
            { x: 100, y: 230, w: 120, h: 20, type: "moving", moveX: 50, speed: 1.5 },
            { x: 300, y: 160, w: 140, h: 20, type: "static" },
            { x: 550, y: 100, w: 150, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 480, y: 420, w: 18, h: 18, type: "spike" },
            { x: 150, y: 210, w: 18, h: 18, type: "spike" },
            { x: 380, y: 140, w: 18, h: 18, type: "spike" },
            { x: 620, y: 80, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 590, y: 60, w: 40, h: 40 },
        gravityZones: [
            { x: 300, y: 250, w: 120, h: 80, type: "zero" },
            { x: 80, y: 180, w: 100, h: 80, type: "reverse" },
            { x: 500, y: 340, w: 100, h: 70, type: "pulse" }
        ]
    },
    // Level 9: Chaos Corridor (Hard)
    {
        name: "Chaos Corridor",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 130, h: 20, type: "static" },
            { x: 200, y: 490, w: 100, h: 20, type: "moving", moveX: 60, speed: 1.8 },
            { x: 400, y: 440, w: 110, h: 20, type: "static" },
            { x: 580, y: 390, w: 100, h: 20, type: "moving", moveY: 50, speed: 1.2 },
            { x: 380, y: 320, w: 120, h: 20, type: "moving", moveX: 40, speed: 1.5 },
            { x: 150, y: 250, w: 110, h: 20, type: "static" },
            { x: 350, y: 180, w: 130, h: 20, type: "moving", moveY: 30, speed: 1.0 },
            { x: 550, y: 120, w: 100, h: 20, type: "static" },
            { x: 680, y: 60, w: 100, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 450, y: 420, w: 18, h: 18, type: "spike" },
            { x: 630, y: 370, w: 18, h: 18, type: "spike" },
            { x: 200, y: 230, w: 18, h: 18, type: "spike" },
            { x: 400, y: 160, w: 18, h: 18, type: "spike" },
            { x: 600, y: 100, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 700, y: 20, w: 40, h: 40 },
        gravityZones: [
            { x: 340, y: 270, w: 100, h: 80, type: "right" },
            { x: 120, y: 200, w: 80, h: 80, type: "zero" },
            { x: 500, y: 80, w: 100, h: 70, type: "reverse" }
        ]
    },
    // Level 10: The Final Ascent (Hard)
    {
        name: "The Final Ascent",
        difficulty: "hard",
        platforms: [
            { x: 20, y: 540, w: 120, h: 20, type: "static" },
            { x: 200, y: 500, w: 100, h: 20, type: "moving", moveX: 70, speed: 2.0 },
            { x: 420, y: 450, w: 100, h: 20, type: "moving", moveY: 40, speed: 1.5 },
            { x: 600, y: 400, w: 100, h: 20, type: "static" },
            { x: 400, y: 340, w: 110, h: 20, type: "moving", moveX: 50, speed: 1.8 },
            { x: 180, y: 280, w: 100, h: 20, type: "moving", moveY: 35, speed: 1.2 },
            { x: 350, y: 220, w: 120, h: 20, type: "static" },
            { x: 550, y: 160, w: 100, h: 20, type: "moving", moveX: 40, speed: 1.5 },
            { x: 350, y: 100, w: 130, h: 20, type: "static" },
            { x: 600, y: 50, w: 120, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 650, y: 380, w: 18, h: 18, type: "spike" },
            { x: 450, y: 320, w: 18, h: 18, type: "spike" },
            { x: 230, y: 260, w: 18, h: 18, type: "spike" },
            { x: 400, y: 200, w: 18, h: 18, type: "spike" },
            { x: 600, y: 140, w: 18, h: 18, type: "spike" },
            { x: 400, y: 80, w: 18, h: 18, type: "spike" }
        ],
        goal: { x: 630, y: 10, w: 40, h: 40 },
        gravityZones: [
            { x: 350, y: 280, w: 100, h: 80, type: "pulse" },
            { x: 150, y: 230, w: 80, h: 80, type: "reverse" },
            { x: 500, y: 110, w: 100, h: 80, type: "zero" },
            { x: 340, y: 50, w: 80, h: 60, type: "right" }
        ]
    }
];

const FALLBACK_STORIES = [
    "In a world where physics has fractured, a small ball awakens on the edge of nothing. It remembers falling once—now it must learn to rise.",
    "The physics engines have failed. Reality bends and twists. One sphere, one chance—defy the pull or be consumed by the void.",
    "They said the rules were constant. They were wrong. Now everything floats, falls, and fractures. Only the brave dare to bounce.",
    "Beneath a sky that forgets which way is down, a lone sphere defies the chaos. Each bounce is a heartbeat. Each platform, a prayer.",
    "The world inverted overnight. Floors became ceilings, and hope became weight. But one small ball refuses to stop bouncing.",
    "Somewhere between falling and flying, the sphere finds a path. The platforms shimmer—real or illusion? There is only one way to know.",
    "The corridors grow narrow and the platforms shift like restless thoughts. Timing is everything now. Hesitate and the void claims you.",
    "A fortress of stone and light hangs above an endless drop. The ball must climb higher than ever before—and never look down.",
    "Chaos reigns in the canyon below, where moving blocks patrol ancient paths. The sphere must dance with danger to survive.",
    "This is the final ascent. Every platform earned, every spike dodged, has led to this moment. The last portal pulses with promise."
];

const FALLBACK_NARRATIONS = {
    gravity_shift: [
        "The forces bend to a new will.",
        "Gravity remembers a different direction.",
        "The world tilts—hold on.",
        "Physics rewrites itself.",
        "The pull changes. Adapt or fall."
    ],
    near_death: [
        "The void almost claimed another.",
        "So close to the end—but not yours.",
        "Death whispered. The ball refused.",
        "A narrow escape from oblivion.",
        "The shadows reached out—and missed."
    ],
    level_complete: [
        "Another world conquered by courage.",
        "The platform beckons forward.",
        "Victory echoes through broken physics.",
        "One more fracture sealed by resolve.",
        "The gravity bends to the champion."
    ],
    physics_shift: [
        "The rules rewrite themselves.",
        "Nothing stays constant here.",
        "Reality is just a suggestion."
    ]
};

const FALLBACK_ENDINGS = [
    "The gravity releases its grip.\nThe sphere ascends, free at last.\nA new physics is born from courage.",
    "Through broken worlds and shattered rules,\nOne small sphere defied them all.\nThe void grows quiet—the journey ends.",
    "Every fall was a lesson.\nEvery bounce, a rebellion.\nThe universe bows to the one who persisted."
];

const FALLBACK_HINTS = [
    ['Try jumping diagonally toward the nearest platform.', 'Watch the moving platform\'s rhythm before jumping.', '1. Head right, then up.\n2. Time the moving platform.\n3. Leap to the glowing goal.'],
    ['Momentum is your friend in tight spots.', 'The red spike near the third platform requires precise timing.', '1. Clear the first gap quickly.\n2. Wait for the moving block to pass.\n3. Sprint to the goal platform.'],
    ['Look up — the path continues higher.', 'A gravity zone halfway up changes everything.', '1. Climb the left staircase.\n2. Use the gravity zone to your advantage.\n3. Jump to the goal at the top.']
];

// ── API Call ──────────────────────────────────────────────
async function callGemini(prompt, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                console.warn(`Gemini API ${response.status} (attempt ${attempt + 1})`);
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    continue;
                }
                return null;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || null;
        } catch (e) {
            console.warn(`Gemini API error (attempt ${attempt + 1}):`, e.message);
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
    return null;
}

// ── Level Generation (with Adaptive Difficulty) ────────────
async function generateLevel(levelNumber) {
    const difficulties = ['easy','easy','easy','medium','medium','medium','hard','hard','hard','hard'];
    const diff = difficulties[Math.min(levelNumber - 1, 9)];

    let adaptiveInfo = { adjustment: 'maintain', detail: '' };
    if (window.PlayerStats) {
        adaptiveInfo = window.PlayerStats.calculateAdaptiveDifficulty(3);
    }

    let prompt = `Generate a Bounce-style 2.5D level in JSON format for a canvas game (800x580 play area).
Level number: ${levelNumber}, Difficulty: ${diff}

Include:
- "name": creative level name string
- "platforms": array of {x, y, w, h, type} where type is "static" or "moving". Moving platforms also have moveX or moveY (pixels) and speed. All platforms: y between 30-550, x between 0-660. Widths 80-250, height always 20.
- "obstacles": array of {x, y, w, h, type} where type is "spike" or "moving_block". Moving blocks have moveX/moveY and speed.
- "gravityZones": array of {x, y, w, h, type} where type is one of: "normal", "reverse", "left", "right", "zero", "pulse". These are areas that change gravity when the ball enters.
- "difficulty": "${diff}"
- "goal": {x, y, w: 40, h: 40} — the level endpoint placed on a platform

Include 6-9 platforms, 3-6 obstacles, and 1-3 gravity zones. First platform at bottom-left for spawn.

Return ONLY valid JSON, no markdown, no code fences, no explanation.`;

    if (window.PlayerStats) {
        prompt = window.PlayerStats.adjustLevelPrompt(prompt, adaptiveInfo.adjustment);
    }

    const response = await callGemini(prompt);
    if (response) {
        try {
            let jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const level = JSON.parse(jsonStr);
            if (level.platforms && level.platforms.length > 0 && level.goal) {
                level.difficulty = level.difficulty || diff;
                level.name = level.name || `Level ${levelNumber}`;
                level.gravityZones = level.gravityZones || [];
                level._adaptive = adaptiveInfo.adjustment;
                return level;
            }
        } catch (e) {
            console.warn('Failed to parse AI level JSON:', e.message);
        }
    }

    const fallback = FALLBACK_LEVELS[(levelNumber - 1) % FALLBACK_LEVELS.length];
    return { ...fallback, name: fallback.name || `Level ${levelNumber}`, _adaptive: adaptiveInfo.adjustment };
}

// ── Story Generation ──────────────────────────────────────
async function generateStory(levelNumber) {
    const prompt = `Write a 2-3 sentence cinematic story about a ball navigating a broken gravity world. This is level ${levelNumber}. Make it emotional and immersive. The ball faces shifting gravity, floating platforms, and reality fractures. Return only the story text.`;

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 10 && clean.length < 500) return clean;
    }
    return FALLBACK_STORIES[(levelNumber - 1) % FALLBACK_STORIES.length];
}

// ── Narration Generation ──────────────────────────────────
async function generateNarration(event) {
    const prompt = `In one dramatic sentence (max 12 words), narrate this game event: ${event}. The game is about a ball in a gravity-shifting world. Return only the sentence.`;

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 3 && clean.length < 100) return clean;
    }
    const fallbacks = FALLBACK_NARRATIONS[event] || FALLBACK_NARRATIONS.physics_shift;
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ── Ending Generation ─────────────────────────────────────
async function generateEnding() {
    const prompt = `Write a 3-line poetic ending about escaping a gravity-shifting world. Emotional and cinematic. Each line on a new line. No labels, no quotes.`;

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 20) return clean;
    }
    return FALLBACK_ENDINGS[Math.floor(Math.random() * FALLBACK_ENDINGS.length)];
}

// ── AI Coach Hint System ──────────────────────────────────
async function generateHint(levelNumber, hintTier) {
    let prompt;
    if (hintTier === 1) {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer with gravity zones. Give a VAGUE 1-sentence hint. Return ONLY the hint sentence.`;
    } else if (hintTier === 2) {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer with gravity zones. Give a TACTICAL 2-sentence hint mentioning a key obstacle or gravity zone. Return ONLY the hint sentences.`;
    } else {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer with gravity zones. Give STEP-BY-STEP guidance in 3 numbered lines. Keep each step to 1 sentence.`;
    }

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 5 && clean.length < 500) return clean;
    }

    const idx = (levelNumber - 1) % FALLBACK_HINTS.length;
    const tier = Math.min(hintTier, 3) - 1;
    return FALLBACK_HINTS[idx][tier];
}

// ── TTS (disabled) ────────────────────────────────────────
function speakText(text) { /* disabled */ }

// Export
if (typeof window !== 'undefined') {
    window.AI = {
        generateLevel,
        generateStory,
        generateNarration,
        generateEnding,
        generateHint,
        speakText,
        _callGemini: callGemini,
        FALLBACK_LEVELS,
        FALLBACK_STORIES
    };
}
