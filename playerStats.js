// ============================================================
// PLAYERSTATS.JS — Adaptive Difficulty System
// ============================================================

const PlayerStats = (() => {
    const STORAGE_KEY = 'bounce_playerStats';
    const PREFS_KEY  = 'bounce_preferences';

    // ── Internal State ─────────────────────────────────────
    let currentRun = null;   // metrics for the level being played right now

    // ── Persistence ────────────────────────────────────────
    /** @returns {Array} All stored level stats */
    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch { return []; }
    }

    /** Append a stat entry and persist */
    function _save(entry) {
        const all = getAll();
        all.push(entry);
        // Keep last 50 entries to avoid unbounded growth
        if (all.length > 50) all.splice(0, all.length - 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        console.log('[Adaptive] Saved stats:', entry);
    }

    function getPrefs() {
        try {
            return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
        } catch { return {}; }
    }

    function savePref(key, value) {
        const prefs = getPrefs();
        prefs[key] = value;
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }

    // ── Current Run Tracking ───────────────────────────────
    /**
     * Call when a new level starts playing.
     * @param {number} levelNumber
     * @param {string} difficulty
     */
    function startLevel(levelNumber, difficulty) {
        currentRun = {
            levelNumber,
            difficulty: difficulty || 'medium',
            startTime: Date.now(),
            deathCount: 0,
            obstaclesHit: 0,
            completed: false,
            timestamp: Date.now()
        };
        console.log(`[Adaptive] Tracking level ${levelNumber} (${difficulty})`);
    }

    /** Increment death counter for current run */
    function recordDeath() {
        if (currentRun) currentRun.deathCount++;
    }

    /** Increment obstacle-hit counter for current run */
    function recordObstacleHit() {
        if (currentRun) currentRun.obstaclesHit++;
    }

    /**
     * Finalise & persist the current run.
     * @param {boolean} completed  Did the player finish the level?
     */
    function endLevel(completed) {
        if (!currentRun) return;
        currentRun.completed = completed;
        currentRun.timeTaken = Math.round((Date.now() - currentRun.startTime) / 1000);
        _save({ ...currentRun });
        const finished = currentRun;
        currentRun = null;
        return finished;
    }

    // ── Adaptive Algorithm ─────────────────────────────────
    // Values: 'ease' | 'maintain' | 'challenge'
    const ADJUSTMENT = { EASE: 'ease', MAINTAIN: 'maintain', CHALLENGE: 'challenge' };

    /**
     * Analyse the last N levels and decide how to adjust difficulty.
     * @param {number} [window=3] How many recent levels to consider.
     * @returns {{ adjustment: string, score: number, detail: string }}
     */
    function calculateAdaptiveDifficulty(window = 3) {
        const all = getAll();
        if (all.length === 0) {
            return { adjustment: ADJUSTMENT.MAINTAIN, score: 10, detail: 'No data yet.' };
        }

        const recent = all.slice(-Math.min(window, all.length));
        let score = 0;

        recent.forEach(s => {
            if (s.completed) score += 10;
            score -= s.deathCount * 5;
            score -= s.obstaclesHit * 2;
            // Bonus for fast completion (under 60 s)
            if (s.completed && s.timeTaken < 60) score += 3;
        });

        // Average per level
        score = Math.round(score / recent.length);

        let adjustment, detail;
        if (score < 5) {
            adjustment = ADJUSTMENT.EASE;
            detail = 'Adjusting: slightly easier level ahead.';
        } else if (score > 15) {
            adjustment = ADJUSTMENT.CHALLENGE;
            detail = 'Adjusting: extra challenge incoming!';
        } else {
            adjustment = ADJUSTMENT.MAINTAIN;
            detail = 'Difficulty unchanged.';
        }

        console.log(`[Adaptive] Window=${recent.length}, Score=${score} → ${adjustment}`);
        return { adjustment, score, detail };
    }

    /**
     * Adjust the Gemini level-generation prompt based on the adaptive result.
     * @param {string} basePrompt   Original prompt.
     * @param {string} adjustment   'ease' | 'maintain' | 'challenge'
     * @returns {string}  Modified prompt.
     */
    function adjustLevelPrompt(basePrompt, adjustment) {
        if (adjustment === ADJUSTMENT.EASE) {
            return basePrompt + '\n\nIMPORTANT: Make this level slightly EASIER — use fewer moving platforms, wider platform widths (150-250), and only 2-3 obstacles.';
        }
        if (adjustment === ADJUSTMENT.CHALLENGE) {
            return basePrompt + '\n\nIMPORTANT: Make this level moderately HARDER — add 2 extra obstacles, increase platform movement speed by 20%, and reduce platform widths by 10%.';
        }
        return basePrompt;
    }

    // ── High Score ─────────────────────────────────────────
    function getHighScore() {
        return parseInt(getPrefs().highScore || '0', 10);
    }
    function setHighScore(score) {
        if (score > getHighScore()) savePref('highScore', score);
    }

    // ── Public API ─────────────────────────────────────────
    return {
        startLevel,
        recordDeath,
        recordObstacleHit,
        endLevel,
        calculateAdaptiveDifficulty,
        adjustLevelPrompt,
        getAll,
        getPrefs,
        savePref,
        getHighScore,
        setHighScore,
        ADJUSTMENT
    };
})();

// Expose globally
window.PlayerStats = PlayerStats;
