// ============================================================
// UI.JS — User Interface Controller
// Bounce Tales: Gravity Shift — Smart 3D AI Edition
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
        level: document.getElementById('hud-level'),
        tensionFill: document.getElementById('tension-fill'),
        tensionValue: document.getElementById('tension-value')
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
        if (screen) screen.classList.add('active');
    }

    // ── Title Screen ───────────────────────────────────────
    let introPlayed = false;
    function showTitle() {
        showScreen('title');
        refreshLeaderboards();
        setPlayerName(window.PlayerStats?.getPlayerName?.() || 'Unknown Pilot');
        
        // Touch controls visibility check
        const touchCtrls = document.querySelector('.touch-controls');
        if (touchCtrls) {
            touchCtrls.style.display = ('ontouchstart' in window) ? 'flex' : 'none';
        }

        if (!introPlayed) {
            introPlayed = true;
            const lines = document.querySelectorAll('.intro-line');
            if (lines.length > 0) {
                const logo = document.querySelector('.title-logo');
                const tagline = document.querySelector('.title-tagline');
                const features = document.querySelector('.feature-list');
                const btn = document.getElementById('btn-start');
                const nameInput = document.querySelector('.username-section');
                
                [logo, tagline, features, btn, nameInput].forEach(el => {
                    if(el) el.style.opacity = '0';
                });
                
                lines.forEach((line, i) => {
                    setTimeout(() => line.classList.add('fade-in'), i * 800);
                    setTimeout(() => line.classList.replace('fade-in', 'fade-out'), 3500);
                });
                
                setTimeout(() => {
                    const introEl = document.getElementById('cinematic-intro');
                    if (introEl) introEl.style.display = 'none';
                    [logo, tagline, features, btn, nameInput].forEach(el => {
                        if(el && el.style) {
                            el.style.transition = 'opacity 1s ease';
                            el.style.opacity = '1';
                        }
                    });
                }, 4000);
            }
        }
    }

    // ── Loading Screen ─────────────────────────────────────
    function showLoading(levelNum) {
        showScreen('loading');
        const loadText = document.getElementById('loading-text');
        if (loadText) loadText.textContent = `Generating Level ${levelNum}...`;
        const loadSub = document.getElementById('loading-sub');
        if (loadSub) {
            const msgs = [
                'Bending gravity fields...',
                'Calibrating 3D physics...',
                'Fracturing spacetime...',
                'Consulting the AI oracle...',
                'Rendering dimensional shifts...',
                'Aligning gravity vectors...'
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
        const storyGravity = document.getElementById('story-gravity');
        const storyAdaptive = document.getElementById('story-adaptive-msg');
        const storyContinue = document.getElementById('btn-story-continue');

        if (storyTitle) storyTitle.textContent = levelName;
        if (storyText) {
            storyText.textContent = '';
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
        if (storyGravity) {
            storyGravity.textContent = '⬇ NORMAL GRAVITY';
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

    // ── Narration ──────────────────────────────────────────
    let narrationTimeout;
    function showNarration(text) {
        const bar = document.getElementById('narration-bar');
        if (!bar) return;
        bar.textContent = text;
        bar.classList.remove('hidden');
        bar.classList.add('visible');
        clearTimeout(narrationTimeout);
        narrationTimeout = setTimeout(() => {
            bar.classList.remove('visible');
            bar.classList.add('hidden');
        }, 4000);
    }

    // ── Gravity Indicator ──────────────────────────────────
    function updateGravityIndicator(mode) {
        const icon = document.getElementById('gravity-icon');
        const label = document.getElementById('gravity-label');
        const hud = document.getElementById('gravity-indicator');
        if (!icon || !label || !hud) return;

        const config = {
            normal:  { icon: '⬇', label: 'NORMAL',  color: '#FFFFFF' },
            reverse: { icon: '⬆', label: 'REVERSE', color: '#b388ff' },
            left:    { icon: '⬅', label: 'LATERAL', color: '#ffab40' },
            right:   { icon: '➡', label: 'LATERAL', color: '#ffab40' },
            zero:    { icon: '◎', label: 'ZERO-G',  color: '#00FFFF' },
            pulse:   { icon: '⚡', label: 'PULSE',   color: '#ff5252' }
        };
        const c = config[mode] || config.normal;
        icon.textContent = c.icon;
        label.textContent = c.label;
        hud.style.color = c.color;
        hud.style.borderColor = c.color + '40';
    }

    // ── HUD Updates ────────────────────────────────────────
    let lastLives = 5;
    function updateHUD(lives, score, levelNum, maxLevel, tension = 0) {
        if (hud.lives) {
            if (lives < lastLives) {
                if (navigator.vibrate) navigator.vibrate([80,30,80]);
                hud.lives.innerHTML = '<span class="heart heart-crack">♥</span>' + '♥'.repeat(Math.max(0, lives));
                setTimeout(() => { if(hud.lives) hud.lives.textContent = '♥'.repeat(Math.max(0, lives)); }, 400);
            } else {
                hud.lives.textContent = '♥'.repeat(Math.max(0, lives));
            }
            lastLives = lives;
        }
        if (hud.score) hud.score.textContent = score.toLocaleString();
        if (hud.level) hud.level.textContent = `${levelNum}/${maxLevel}`;
        if (hud.tensionFill) hud.tensionFill.style.width = `${Math.min(100, tension)}%`;
        if (hud.tensionValue) hud.tensionValue.textContent = Math.round(tension);

        const vig = document.getElementById('tension-vignette');
        if (vig) {
            if (tension >= 86) vig.classList.add('visible');
            else vig.classList.remove('visible');
        }
    }

    // ── Level Complete ─────────────────────────────────────
    function showLevelComplete(level, score) {
        showScreen('levelComplete');
        const lcLevel = document.getElementById('lc-level');
        const lcScore = document.getElementById('lc-score');
        const lcPlayer = document.getElementById('lc-player');
        const lcBtn = document.getElementById('btn-next-level');

        if (lcLevel) lcLevel.textContent = `Level ${level} Complete!`;
        if (lcScore) {
            lcScore.textContent = `Score: 0`;
            let current = 0;
            const inc = Math.max(1, Math.floor(score / 30));
            const timer = setInterval(() => {
                current += inc;
                if (current >= score) {
                    current = score;
                    clearInterval(timer);
                }
                lcScore.textContent = `Score: ${current.toLocaleString()}`;
            }, 30);
        }
        if (lcPlayer) lcPlayer.textContent = `Pilot: ${window.PlayerStats?.getPlayerName?.() || 'Unknown Pilot'}`;
        if (navigator.vibrate) navigator.vibrate(200);

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
        const goPlayer = document.getElementById('go-player');
        const goBtn = document.getElementById('btn-restart');

        if (goScore) goScore.textContent = `Final Score: ${window.Game.score.toLocaleString()}`;
        if (goPlayer) goPlayer.textContent = `Pilot: ${window.PlayerStats?.getPlayerName?.() || 'Pilot'}`;
        refreshLeaderboards();

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
        const endPlayer = document.getElementById('ending-player');
        const endBtn = document.getElementById('btn-play-again');

        if (endText) {
            endText.innerHTML = '';
            // It might be formatted with newlines, replace with br
            const formatted = text.replace(/\n/g, '<br/>');
            endText.innerHTML = formatted;
        }
        if (endScore) endScore.textContent = `Final Score: ${score.toLocaleString()}`;
        if (endPlayer) endPlayer.textContent = `Pilot: ${window.PlayerStats?.getPlayerName?.() || 'Unknown Pilot'}`;
        refreshLeaderboards();

        if (endBtn) {
            const newBtn = endBtn.cloneNode(true);
            endBtn.parentNode.replaceChild(newBtn, endBtn);
            newBtn.addEventListener('click', () => {
                window.Game.restartGame();
            });
        }
    }

    function setPlayerName(name) {
        const safe = String(name || 'Unknown Pilot').trim() || 'Unknown Pilot';
        const hudPlayer = document.getElementById('hud-player');
        const playerTag = document.getElementById('player-name-tag');
        const input = document.getElementById('username-input');
        if (hudPlayer) hudPlayer.textContent = safe;
        if (playerTag) playerTag.textContent = `Pilot: ${safe}`;
        if (input && document.activeElement !== input) input.value = safe;
    }

    function renderLeaderboard(listEl, emptyEl, data) {
        if (!listEl) return;
        const rows = (data || []).slice(0, 5);
        listEl.innerHTML = '';
        rows.forEach((entry, idx) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            li.innerHTML = `<span class="lb-rank">#${idx + 1}</span><span class="lb-name">${entry.name}</span><span class="lb-score">${entry.score}</span>`;
            listEl.appendChild(li);
        });
        if (emptyEl) emptyEl.style.display = rows.length ? 'none' : 'block';
    }

    function refreshLeaderboards() {
        const data = window.PlayerStats?.getLeaderboard?.() || [];
        renderLeaderboard(
            document.getElementById('leaderboard-list-title'),
            document.getElementById('leaderboard-empty-title'),
            data
        );
        renderLeaderboard(
            document.getElementById('leaderboard-list-gameover'),
            null,
            data
        );
        renderLeaderboard(
            document.getElementById('leaderboard-list-ending'),
            null,
            data
        );
    }

    // ── Public API ─────────────────────────────────────────
    return {
        showTitle,
        showLoading,
        showStory,
        showGameplay,
        showHint,
        showNarration,
        updateGravityIndicator,
        updateHUD,
        setPlayerName,
        refreshLeaderboards,
        showLevelComplete,
        showGameOver,
        showEnding
    };
})();

window.UI = UI;
