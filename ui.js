// ============================================================
// UI.JS — User Interface Controller
// ============================================================

const UI = (() => {

    // ── DOM Elements ───────────────────────────────────────
    const screens = {
        title: document.getElementById('screen-title'),
        loading: document.getElementById('screen-loading'),
        story: document.getElementById('screen-story'),
        gameplay: document.getElementById('screen-gameplay'),
        levelComplete: document.getElementById('screen-level-complete'),
        gameOver: document.getElementById('screen-game-over'),
        ending: document.getElementById('screen-ending')
    };

    const hud = {
        lives: document.getElementById('hud-lives'),
        score: document.getElementById('hud-score'),
        level: document.getElementById('hud-level')
    };

    // ── Screen Management ──────────────────────────────────
    function hideAll() {
        Object.values(screens).forEach(s => {
            if (s) s.classList.remove('active');
        });
    }

    function showScreen(name) {
        hideAll();
        const screen = screens[name];
        if (screen) {
            screen.classList.add('active');
        }
    }

    // ── Title Screen ───────────────────────────────────────
    function showTitle() {
        showScreen('title');
    }

    // ── Loading Screen ─────────────────────────────────────
    function showLoading(levelNum) {
        showScreen('loading');
        const loadText = document.getElementById('loading-text');
        if (loadText) {
            loadText.textContent = `Generating Level ${levelNum}...`;
        }
        const loadSub = document.getElementById('loading-sub');
        if (loadSub) {
            const msgs = [
                'Spinning up the physics core...',
                'Calibrating bounce harmonics...',
                'Fracturing spacetime...',
                'Consulting the AI oracle...',
                'Rewriting physics laws...'
            ];
            loadSub.textContent = msgs[Math.floor(Math.random() * msgs.length)];
        }
    }

    // ── Story Screen ───────────────────────────────────────
    function showStory(story, levelName, difficulty, onContinue, adaptiveMsg = '') {
        showScreen('story');
        const storyTitle = document.getElementById('story-level-name');
        const storyText = document.getElementById('story-text');
        const storyDifficulty = document.getElementById('story-difficulty');
        const storyAdaptive = document.getElementById('story-adaptive-msg');
        const storyContinue = document.getElementById('btn-story-continue');

        if (storyTitle) storyTitle.textContent = levelName;
        if (storyText) {
            storyText.textContent = '';
            // Typewriter effect
            typeWriter(storyText, story, 30);
        }
        if (storyAdaptive) {
            storyAdaptive.textContent = adaptiveMsg;
            storyAdaptive.style.display = adaptiveMsg ? 'block' : 'none';
        }
        if (storyDifficulty) {
            storyDifficulty.textContent = difficulty ? difficulty.toUpperCase() : 'MEDIUM';
            storyDifficulty.className = `difficulty-badge diff-${difficulty || 'medium'}`;
        }

        if (storyContinue) {
            const newBtn = storyContinue.cloneNode(true);
            storyContinue.parentNode.replaceChild(newBtn, storyContinue);
            newBtn.addEventListener('click', onContinue);
        }
    }

    function typeWriter(element, text, speed) {
        let i = 0;
        element.textContent = '';
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // ── Gameplay Screen & Hints ────────────────────────────
    function showGameplay() {
        showScreen('gameplay');
    }

    let hintTimeout;
    function showHint(text) {
        const toast = document.getElementById('hint-toast');
        if (!toast) return;

        toast.innerHTML = text.replace(/\n/g, '<br>');
        toast.classList.remove('hidden');
        toast.classList.add('visible');

        clearTimeout(hintTimeout);
        // Auto-hide after 8 seconds
        hintTimeout = setTimeout(() => {
            toast.classList.remove('visible');
            toast.classList.add('hidden');
        }, 8000);
    }

    // Bind hint button
    const btnHint = document.getElementById('btn-hint');
    if (btnHint) {
        btnHint.addEventListener('click', () => {
            if (window.Game && window.Game.requestHint) {
                window.Game.requestHint();
            }
        });
    }

    // ── HUD Updates ────────────────────────────────────────
    function updateHUD(lives, score, levelNum, maxLevel) {
        if (hud.lives) {
            hud.lives.textContent = '♥'.repeat(Math.max(0, lives));
        }
        if (hud.score) {
            hud.score.textContent = score.toLocaleString();
        }
        if (hud.level && typeof levelNum === 'number' && typeof maxLevel === 'number') {
            hud.level.textContent = `${levelNum}/${maxLevel}`;
        }
    }

    // ── Level Complete ─────────────────────────────────────
    function showLevelComplete(level, score) {
        showScreen('levelComplete');
        const lcLevel = document.getElementById('lc-level');
        const lcScore = document.getElementById('lc-score');
        const lcBtn = document.getElementById('btn-next-level');

        if (lcLevel) lcLevel.textContent = `Level ${level} Complete!`;
        if (lcScore) lcScore.textContent = `Score: ${score.toLocaleString()}`;

        if (lcBtn) {
            const newBtn = lcBtn.cloneNode(true);
            lcBtn.parentNode.replaceChild(newBtn, lcBtn);
            newBtn.addEventListener('click', () => {
                window.Game.nextLevel();
            });
        }
    }

    // ── Game Over ──────────────────────────────────────────
    function showGameOver() {
        showScreen('gameOver');
        const goScore = document.getElementById('go-score');
        const goBtn = document.getElementById('btn-restart');

        if (goScore) goScore.textContent = `Final Score: ${window.Game.score.toLocaleString()}`;

        if (goBtn) {
            const newBtn = goBtn.cloneNode(true);
            goBtn.parentNode.replaceChild(newBtn, goBtn);
            newBtn.addEventListener('click', () => {
                window.Game.restartGame();
            });
        }
    }

    // ── Ending ─────────────────────────────────────────────
    function showEnding(text, score) {
        showScreen('ending');
        const endText = document.getElementById('ending-text');
        const endScore = document.getElementById('ending-score');
        const endBtn = document.getElementById('btn-play-again');

        if (endText) {
            typeWriter(endText, text, 50);
        }
        if (endScore) endScore.textContent = `Final Score: ${score.toLocaleString()}`;

        if (endBtn) {
            const newBtn = endBtn.cloneNode(true);
            endBtn.parentNode.replaceChild(newBtn, endBtn);
            newBtn.addEventListener('click', () => {
                window.Game.restartGame();
            });
        }
    }

    // ── Public API ─────────────────────────────────────────
    return {
        showTitle,
        showLoading,
        showStory,
        showGameplay,
        showHint,
        updateHUD,
        showLevelComplete,
        showGameOver,
        showEnding
    };
})();
