// ============================================================
// AI.JS — Gemini API Integration for Bounce Classic
// ============================================================

// API endpoint now routes through Vercel serverless function
// (API key is securely stored in environment variables)
const GEMINI_ENDPOINT = '/api/generateContent';

// ── Fallback Data ─────────────────────────────────────────────────────────────
// 10 hand-crafted levels with progressive difficulty.
// Physics constraints: jump height ≈110px, horizontal reach ≈180px.
// Canvas play area: 800 × 580.  Platform height is always 20.
const FALLBACK_LEVELS = [

    // ═══════════════════════════════════════════════════════════
    // LEVEL 1 — "First Steps"  (Easy)
    // Simple staircase going right then left.  No moving parts.
    // ═══════════════════════════════════════════════════════════
    {
        name: "First Steps",
        difficulty: "easy",
        platforms: [
            { x: 0,   y: 540, w: 260, h: 20, type: "static" },   // spawn
            { x: 220, y: 460, w: 180, h: 20, type: "static" },
            { x: 440, y: 390, w: 160, h: 20, type: "static" },
            { x: 300, y: 310, w: 160, h: 20, type: "static" },
            { x: 500, y: 240, w: 180, h: 20, type: "static" },
            { x: 350, y: 170, w: 180, h: 20, type: "static" }    // goal
        ],
        obstacles: [
            { x: 240, y: 520, w: 20, h: 20, type: "spike" },
            { x: 430, y: 370, w: 20, h: 20, type: "spike" }
        ],
        goal: { x: 410, y: 130, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 2 — "Stepping Stones"  (Easy)
    // Longer path, introduces first moving platform.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Stepping Stones",
        difficulty: "easy",
        platforms: [
            { x: 0,   y: 540, w: 200, h: 20, type: "static" },
            { x: 250, y: 480, w: 120, h: 20, type: "static" },
            { x: 420, y: 420, w: 120, h: 20, type: "static" },
            { x: 280, y: 350, w: 140, h: 20, type: "static" },
            { x: 480, y: 280, w: 140, h: 20, type: "static" },
            { x: 300, y: 200, w: 140, h: 20, type: "moving", moveX: 60, speed: 1.2 },
            { x: 550, y: 130, w: 180, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 360, y: 400, w: 20, h: 20, type: "spike" },
            { x: 460, y: 260, w: 20, h: 20, type: "spike" }
        ],
        goal: { x: 610, y: 90, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 3 — "Broken Bridge"  (Easy → Medium)
    // Gaps widen, first moving-block obstacle.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Broken Bridge",
        difficulty: "easy",
        platforms: [
            { x: 0,   y: 540, w: 180, h: 20, type: "static" },
            { x: 230, y: 490, w: 120, h: 20, type: "static" },
            { x: 400, y: 430, w: 120, h: 20, type: "moving", moveX: 50, speed: 1.3 },
            { x: 570, y: 370, w: 150, h: 20, type: "static" },
            { x: 380, y: 300, w: 130, h: 20, type: "static" },
            { x: 160, y: 230, w: 160, h: 20, type: "static" },
            { x: 380, y: 160, w: 140, h: 20, type: "static" },
            { x: 580, y: 90,  w: 160, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 160, y: 520, w: 20, h: 20, type: "spike" },
            { x: 550, y: 350, w: 20, h: 20, type: "spike" },
            { x: 310, y: 280, w: 25, h: 25, type: "moving_block", moveY: 40, speed: 1.0 }
        ],
        goal: { x: 630, y: 50, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 4 — "Tower Climb"  (Medium)
    // Zigzag vertical climb.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Tower Climb",
        difficulty: "medium",
        platforms: [
            { x: 50,  y: 540, w: 200, h: 20, type: "static" },
            { x: 300, y: 470, w: 120, h: 20, type: "static" },
            { x: 100, y: 400, w: 140, h: 20, type: "static" },
            { x: 320, y: 330, w: 120, h: 20, type: "moving", moveX: 60, speed: 1.4 },
            { x: 130, y: 260, w: 130, h: 20, type: "static" },
            { x: 350, y: 190, w: 140, h: 20, type: "static" },
            { x: 150, y: 120, w: 160, h: 20, type: "static" },
            { x: 400, y: 60,  w: 160, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 230, y: 520, w: 20, h: 20, type: "spike" },
            { x: 220, y: 380, w: 20, h: 20, type: "spike" },
            { x: 250, y: 240, w: 20, h: 20, type: "spike" },
            { x: 300, y: 170, w: 25, h: 25, type: "moving_block", moveY: 45, speed: 1.4 }
        ],
        goal: { x: 450, y: 20, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 5 — "Zigzag Dash"  (Medium)
    // Fast left-right pattern with more spikes.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Zigzag Dash",
        difficulty: "medium",
        platforms: [
            { x: 0,   y: 540, w: 160, h: 20, type: "static" },
            { x: 200, y: 480, w: 120, h: 20, type: "static" },
            { x: 400, y: 420, w: 140, h: 20, type: "static" },
            { x: 600, y: 360, w: 140, h: 20, type: "static" },
            { x: 380, y: 290, w: 120, h: 20, type: "moving", moveX: 50, speed: 1.5 },
            { x: 160, y: 220, w: 140, h: 20, type: "static" },
            { x: 400, y: 150, w: 130, h: 20, type: "static" },
            { x: 600, y: 80,  w: 160, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 140, y: 520, w: 20, h: 20, type: "spike" },
            { x: 380, y: 400, w: 20, h: 20, type: "spike" },
            { x: 580, y: 340, w: 20, h: 20, type: "spike" },
            { x: 300, y: 200, w: 25, h: 25, type: "moving_block", moveY: 35, speed: 1.3 }
        ],
        goal: { x: 650, y: 40, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 6 — "Floating Islands"  (Medium)
    // Scattered platforms, two movers.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Floating Islands",
        difficulty: "medium",
        platforms: [
            { x: 0,   y: 540, w: 180, h: 20, type: "static" },
            { x: 220, y: 460, w: 110, h: 20, type: "moving", moveX: 40, speed: 1.3 },
            { x: 420, y: 400, w: 120, h: 20, type: "static" },
            { x: 250, y: 330, w: 110, h: 20, type: "static" },
            { x: 480, y: 260, w: 130, h: 20, type: "moving", moveX: 55, speed: 1.5 },
            { x: 280, y: 190, w: 120, h: 20, type: "static" },
            { x: 100, y: 120, w: 160, h: 20, type: "static" },
            { x: 350, y: 60,  w: 160, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 160, y: 520, w: 20, h: 20, type: "spike" },
            { x: 400, y: 380, w: 20, h: 20, type: "spike" },
            { x: 230, y: 310, w: 20, h: 20, type: "spike" },
            { x: 370, y: 170, w: 25, h: 25, type: "moving_block", moveY: 45, speed: 1.4 },
            { x: 80,  y: 100, w: 20, h: 20, type: "spike" }
        ],
        goal: { x: 400, y: 20, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 7 — "The Gauntlet"  (Medium → Hard)
    // Tight jumps, narrower platforms, more obstacles.
    // ═══════════════════════════════════════════════════════════
    {
        name: "The Gauntlet",
        difficulty: "hard",
        platforms: [
            { x: 0,   y: 540, w: 160, h: 20, type: "static" },
            { x: 200, y: 470, w: 100, h: 20, type: "static" },
            { x: 360, y: 410, w: 100, h: 20, type: "moving", moveX: 40, speed: 1.5 },
            { x: 520, y: 350, w: 110, h: 20, type: "static" },
            { x: 340, y: 280, w: 100, h: 20, type: "static" },
            { x: 520, y: 210, w: 120, h: 20, type: "moving", moveX: 50, speed: 1.6 },
            { x: 300, y: 140, w: 110, h: 20, type: "static" },
            { x: 520, y: 70,  w: 160, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 140, y: 520, w: 20, h: 20, type: "spike" },
            { x: 280, y: 450, w: 20, h: 20, type: "spike" },
            { x: 500, y: 330, w: 20, h: 20, type: "spike" },
            { x: 320, y: 260, w: 20, h: 20, type: "spike" },
            { x: 430, y: 190, w: 25, h: 25, type: "moving_block", moveY: 40, speed: 1.7 }
        ],
        goal: { x: 570, y: 30, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 8 — "Sky Fortress"  (Hard)
    // Long path, small platforms, multiple movers.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Sky Fortress",
        difficulty: "hard",
        platforms: [
            { x: 0,   y: 540, w: 150, h: 20, type: "static" },
            { x: 190, y: 460, w: 100, h: 20, type: "static" },
            { x: 340, y: 390, w: 100, h: 20, type: "moving", moveX: 45, speed: 1.6 },
            { x: 520, y: 330, w: 100, h: 20, type: "static" },
            { x: 350, y: 260, w: 100, h: 20, type: "static" },
            { x: 150, y: 200, w: 110, h: 20, type: "moving", moveX: 50, speed: 1.5 },
            { x: 370, y: 130, w: 110, h: 20, type: "static" },
            { x: 570, y: 70,  w: 130, h: 20, type: "static" },
            { x: 200, y: 60,  w: 140, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 130, y: 520, w: 20, h: 20, type: "spike" },
            { x: 270, y: 440, w: 20, h: 20, type: "spike" },
            { x: 500, y: 310, w: 20, h: 20, type: "spike" },
            { x: 280, y: 240, w: 25, h: 25, type: "moving_block", moveY: 45, speed: 1.7 },
            { x: 350, y: 110, w: 20, h: 20, type: "spike" },
            { x: 530, y: 160, w: 30, h: 30, type: "moving_block", moveX: 35, speed: 1.9 }
        ],
        goal: { x: 240, y: 20, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 9 — "Chaos Canyon"  (Hard)
    // Three moving platforms, six obstacles.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Chaos Canyon",
        difficulty: "hard",
        platforms: [
            { x: 0,   y: 540, w: 140, h: 20, type: "static" },
            { x: 180, y: 470, w: 100, h: 20, type: "moving", moveX: 40, speed: 1.5 },
            { x: 370, y: 410, w: 100, h: 20, type: "static" },
            { x: 540, y: 350, w: 100, h: 20, type: "moving", moveY: 35, speed: 1.4 },
            { x: 360, y: 280, w: 100, h: 20, type: "static" },
            { x: 160, y: 210, w: 110, h: 20, type: "static" },
            { x: 370, y: 140, w: 100, h: 20, type: "moving", moveX: 45, speed: 1.6 },
            { x: 570, y: 80,  w: 130, h: 20, type: "static" },
            { x: 300, y: 60,  w: 140, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 120, y: 520, w: 20, h: 20, type: "spike" },
            { x: 350, y: 390, w: 20, h: 20, type: "spike" },
            { x: 340, y: 260, w: 20, h: 20, type: "spike" },
            { x: 260, y: 190, w: 25, h: 25, type: "moving_block", moveY: 35, speed: 1.6 },
            { x: 140, y: 190, w: 20, h: 20, type: "spike" },
            { x: 550, y: 60,  w: 20, h: 20, type: "spike" }
        ],
        goal: { x: 340, y: 20, w: 40, h: 40 }
    },

    // ═══════════════════════════════════════════════════════════
    // LEVEL 10 — "Final Ascent"  (Hard)
    // The ultimate challenge: narrow platforms, four movers,
    // six obstacles, long winding path.
    // ═══════════════════════════════════════════════════════════
    {
        name: "Final Ascent",
        difficulty: "hard",
        platforms: [
            { x: 0,   y: 540, w: 140, h: 20, type: "static" },
            { x: 170, y: 470, w: 90,  h: 20, type: "static" },
            { x: 320, y: 410, w: 90,  h: 20, type: "moving", moveX: 40, speed: 1.6 },
            { x: 500, y: 350, w: 100, h: 20, type: "static" },
            { x: 320, y: 290, w: 90,  h: 20, type: "moving", moveY: 30, speed: 1.4 },
            { x: 130, y: 230, w: 110, h: 20, type: "static" },
            { x: 330, y: 160, w: 90,  h: 20, type: "moving", moveX: 45, speed: 1.7 },
            { x: 540, y: 110, w: 100, h: 20, type: "static" },
            { x: 350, y: 60,  w: 100, h: 20, type: "moving", moveX: 35, speed: 1.5 },
            { x: 130, y: 50,  w: 140, h: 20, type: "static" }
        ],
        obstacles: [
            { x: 120, y: 520, w: 20, h: 20, type: "spike" },
            { x: 250, y: 450, w: 20, h: 20, type: "spike" },
            { x: 480, y: 330, w: 20, h: 20, type: "spike" },
            { x: 240, y: 210, w: 25, h: 25, type: "moving_block", moveY: 35, speed: 1.6 },
            { x: 520, y: 90,  w: 20, h: 20, type: "spike" },
            { x: 300, y: 140, w: 25, h: 25, type: "moving_block", moveX: 30, speed: 1.9 }
        ],
        goal: { x: 170, y: 10, w: 40, h: 40 }
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
    near_death: [
        "The void hungers.",
        "Almost lost to the void.",
        "Death whispered close.",
        "The edge of oblivion.",
        "Breath caught in silence."
    ],
    level_complete: [
        "The rules bend to your will!",
        "The impossible, conquered.",
        "Light breaks through chaos.",
        "You defied the pull.",
        "Freedom tastes like flight."
    ],
    physics_shift: [
        "Reality shifts beneath you.",
        "The rules just changed.",
        "Forces forget their names.",
        "The world twists around you.",
        "Physics rewrites itself."
    ]
};

const FALLBACK_ENDINGS = [
    "The ball rests still for the first time.\nThe fractured rules now heal.\nThe world remembers how to fall gently.",
    "Against every pull and push,\nyou found your way through the fracture.\nThe sky is yours now.",
    "Silence returns to the corridors of chaos.\nThe sphere glows with quiet triumph.\nThe universe whispers: 'Well played.'"
];

// ── API Call Helper ────────────────────────────────────────
async function callGemini(prompt, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Empty response');
            return text.trim();
        } catch (err) {
            console.warn(`Gemini API attempt ${attempt + 1} failed:`, err.message);
            if (attempt === maxRetries) return null;
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
    }
    return null;
}

// ── Level Generation (with Adaptive Difficulty) ──────────────
async function generateLevel(levelNumber) {
    const difficulties = ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard'];
    const diff = difficulties[Math.min(levelNumber - 1, 9)];

    // Adaptive difficulty adjustment
    let adaptiveInfo = { adjustment: 'maintain', detail: '' };
    if (window.PlayerStats) {
        adaptiveInfo = window.PlayerStats.calculateAdaptiveDifficulty(3);
    }

    let prompt = `Generate a 2D Bounce-style level in JSON format for a canvas game (800x580 play area).
Level number: ${levelNumber}, Difficulty: ${diff}

Include:
- "name": creative level name string
- "platforms": array of objects with {x, y, w, h, type} where type is "static" or "moving". Moving platforms also have moveX or moveY (pixels) and speed. All platforms must have y between 30 and 550, x between 0 and 660. Widths 80-250, height always 20.
- "obstacles": array of objects with {x, y, w, h, type} where type is "spike" or "moving_block". Moving blocks have moveX or moveY and speed.
- "difficulty": "${diff}"
- "goal": {x, y, w: 40, h: 40} — the level endpoint, placed on a platform

Include 6-9 platforms and 3-6 obstacles. First platform should be at bottom-left for spawn.

Return ONLY valid JSON, no markdown, no code fences, no explanation.`;

    // Apply adaptive adjustment to prompt
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
                level._adaptive = adaptiveInfo.adjustment;  // tag for UI
                return level;
            }
        } catch (e) {
            console.warn('Failed to parse AI level JSON:', e.message);
        }
    }

    // Fallback
    const fallback = FALLBACK_LEVELS[(levelNumber - 1) % FALLBACK_LEVELS.length];
    return { ...fallback, name: fallback.name || `Level ${levelNumber}`, _adaptive: adaptiveInfo.adjustment };
}

// ── Story Generation ───────────────────────────────────────
async function generateStory(levelNumber) {
    const prompt = `Generate a 2-3 sentence story about a ball trapped in a world where physics is broken. This is level ${levelNumber}. Make it emotional and cinematic. Return only the story text, no quotes, no labels.`;

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 10 && clean.length < 500) return clean;
    }

    return FALLBACK_STORIES[(levelNumber - 1) % FALLBACK_STORIES.length];
}

// ── Narration Generation (with Voice) ──────────────────────
async function generateNarration(event) {
    const prompt = `In one short dramatic sentence (max 12 words), narrate this game event: ${event}. Return only the sentence.`;

    let text;
    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 3 && clean.length < 100) text = clean;
    }

    if (!text) {
        const fallbacks = FALLBACK_NARRATIONS[event] || FALLBACK_NARRATIONS.physics_shift;
        text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    return text;
}

// ── Ending Generation ──────────────────────────────────────
async function generateEnding() {
    const prompt = `Write a 3-line poetic ending about escaping a broken physics world. Emotional and cinematic tone. Each line on a new line. No labels, no quotes.`;

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 20) return clean;
    }

    return FALLBACK_ENDINGS[Math.floor(Math.random() * FALLBACK_ENDINGS.length)];
}

// ── AI Coach Hint System ───────────────────────────────────
const FALLBACK_HINTS = [
    ['Try jumping diagonally toward the nearest platform.', 'Watch the moving platform\'s rhythm before jumping.', '1. Head right, then up.\n2. Time the moving platform.\n3. Leap to the glowing goal.'],
    ['Momentum is your friend in tight spots.', 'The red spike near the third platform requires precise timing.', '1. Clear the first gap quickly.\n2. Wait for the moving block to pass.\n3. Sprint to the goal platform.'],
    ['Look up — the path continues higher.', 'A moving platform halfway up is your only bridge.', '1. Climb the left staircase.\n2. Ride the moving platform right.\n3. Jump to the goal at the top.']
];

/**
 * Generate a progressive hint for the stuck player.
 * @param {number} levelNumber
 * @param {number} hintTier  1 = gentle, 2 = tactical, 3 = step-by-step
 * @returns {Promise<string>}
 */
async function generateHint(levelNumber, hintTier) {
    let prompt;
    if (hintTier === 1) {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer. Give a VAGUE 1-sentence hint about the general strategy. Don't mention specific platforms. Return ONLY the hint sentence.`;
    } else if (hintTier === 2) {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer. Give a TACTICAL 2-sentence hint about a specific section. Mention one key platform or obstacle. Return ONLY the hint sentences.`;
    } else {
        prompt = `The player is stuck on level ${levelNumber} of a bounce platformer. Give STEP-BY-STEP guidance in 3 numbered lines. Keep each step to 1 sentence.`;
    }

    const response = await callGemini(prompt);
    if (response) {
        const clean = response.replace(/^["']|["']$/g, '').trim();
        if (clean.length > 5 && clean.length < 500) {
            console.log(`[Coach] Hint tier ${hintTier} for level ${levelNumber}`);
            return clean;
        }
    }

    // Fallback
    const idx = (levelNumber - 1) % FALLBACK_HINTS.length;
    const tier = Math.min(hintTier, 3) - 1;
    return FALLBACK_HINTS[idx][tier];
}

// ── (TTS functionality removed) ────────────────────────────
function speakText(text) {
    // Disabled per request
}

// Export for modules
if (typeof window !== 'undefined') {
    window.AI = {
        generateLevel,
        generateStory,
        generateNarration,
        generateEnding,
        generateHint,
        speakText,
        _callGemini: callGemini,  // exposed for VoiceNarration emotion detection
        FALLBACK_LEVELS,
        FALLBACK_STORIES
    };
}
