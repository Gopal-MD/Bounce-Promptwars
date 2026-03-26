// ============================================================
// RENDER.JS — Three.js 3D Rendering Engine (2.5D Illusion)
// ============================================================
// Gameplay physics remain 2D (X, Y).
// Z-axis is used ONLY for visual depth — the "Smart 3D" illusion.

const Renderer3D = (() => {
    let scene, camera, renderer;
    let ballMesh, goalMesh;
    let platformMeshes = [];
    let obstacleMeshes = [];
    let gravityParticles = [];
    let ambientLight, dirLight, pointLight;
    let ghostMeshes = [];
    let simplex = null;

    if (typeof SimplexNoise !== 'undefined') {
        simplex = new SimplexNoise();
    }

    // Dimensions match our logical play area
    const W = 800, H = 580;
    let canvas;

    // ── Initialise Three.js ────────────────────────────────
    function init(canvasEl) {
        canvas = canvasEl;
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x060a1a, 0.0008);

        // Camera: tilted perspective for 2.5D depth illusion
        camera = new THREE.PerspectiveCamera(50, W / H, 1, 2000);
        camera.position.set(W / 2, H / 2, 700);
        camera.lookAt(W / 2, H / 2, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x060a1a);

        // Lighting
        ambientLight = new THREE.AmbientLight(0x334466, 0.6);
        scene.add(ambientLight);

        dirLight = new THREE.DirectionalLight(0x4fc3f7, 0.5);
        dirLight.position.set(400, 100, 500);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 1500;
        dirLight.shadow.camera.left = -500;
        dirLight.shadow.camera.right = 500;
        dirLight.shadow.camera.top = 400;
        dirLight.shadow.camera.bottom = -400;
        scene.add(dirLight);

        pointLight = new THREE.PointLight(0xb388ff, 0.4, 800);
        pointLight.position.set(W / 2, H / 2, 300);
        scene.add(pointLight);

        // Starfield background
        createStarfield();

        // Ground plane (very subtle grid)
        createGroundPlane();

        // Ball
        createBall();
    }

    // ── Starfield ──────────────────────────────────────────
    function createStarfield() {
        const geom = new THREE.BufferGeometry();
        const count = 300;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = Math.random() * W * 1.5 - W * 0.25;
            positions[i * 3 + 1] = Math.random() * H * 1.5 - H * 0.25;
            positions[i * 3 + 2] = -100 - Math.random() * 400;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.6
        });
        scene.add(new THREE.Points(geom, mat));
    }

    // ── Ground Plane ───────────────────────────────────────
    function createGroundPlane() {
        const geom = new THREE.PlaneGeometry(W * 1.2, H * 1.2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x0a0e27,
            transparent: true,
            opacity: 0.5,
            roughness: 0.9,
            metalness: 0.1
        });
        const plane = new THREE.Mesh(geom, mat);
        plane.position.set(W / 2, H / 2, -30);
        plane.receiveShadow = true;
        scene.add(plane);
    }

    // ── Ball & Ghosts ──────────────────────────────────────
    function createBall() {
        const geom = new THREE.SphereGeometry(12, 32, 32);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x4fc3f7,
            emissive: 0x1a6fa0,
            emissiveIntensity: 0.4,
            shininess: 100,
            specular: 0xffffff
        });
        ballMesh = new THREE.Mesh(geom, mat);
        ballMesh.castShadow = true;
        ballMesh.position.set(50, H - 50, 15); // Z = 15 for depth
        scene.add(ballMesh);

        // Motion trail ghosts
        for (let i = 0; i < 5; i++) {
            const ghostMat = new THREE.MeshPhongMaterial({
                color: 0x4fc3f7,
                emissive: 0x1a6fa0,
                transparent: true,
                opacity: 0
            });
            const ghost = new THREE.Mesh(geom, ghostMat);
            scene.add(ghost);
            ghostMeshes.push(ghost);
        }
    }

    // ── Build Level Geometry ───────────────────────────────
    function buildLevel(platforms, obstacles, goal) {
        // Clear old
        platformMeshes.forEach(m => scene.remove(m));
        obstacleMeshes.forEach(m => scene.remove(m));
        if (goalMesh) scene.remove(goalMesh);
        platformMeshes = [];
        obstacleMeshes = [];

        // Platforms
        platforms.forEach(p => {
            const geom = new THREE.BoxGeometry(p.w, p.h, 24);
            const mat = new THREE.MeshPhongMaterial({
                color: 0x1de9b6,
                emissive: 0x0d7a5f,
                emissiveIntensity: 0.2,
                shininess: 60,
                transparent: true,
                opacity: 0.85
            });
            const mesh = new THREE.Mesh(geom, mat);
            // Convert from top-left (2D) to center (Three.js)
            mesh.position.set(p.x + p.w / 2, H - (p.y + p.h / 2), 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { platform: p };
            scene.add(mesh);
            platformMeshes.push(mesh);
        });

        // Obstacles (spikes = cones, blocks = boxes)
        obstacles.forEach(o => {
            let mesh;
            if (o.type === 'spike') {
                const geom = new THREE.ConeGeometry(o.w / 2, o.h, 4);
                const mat = new THREE.MeshPhongMaterial({
                    color: 0xff5252,
                    emissive: 0x801a1a,
                    emissiveIntensity: 0.4,
                    shininess: 80
                });
                mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(o.x + o.w / 2, H - (o.y + o.h / 2), 5);
            } else {
                const geom = new THREE.BoxGeometry(o.w, o.h, 20);
                const mat = new THREE.MeshPhongMaterial({
                    color: 0xff7043,
                    emissive: 0x803020,
                    emissiveIntensity: 0.3,
                    shininess: 40
                });
                mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(o.x + o.w / 2, H - (o.y + o.h / 2), 0);
            }
            mesh.castShadow = true;
            mesh.userData = { obstacle: o };
            scene.add(mesh);
            obstacleMeshes.push(mesh);
        });

        // Goal (glowing sphere)
        if (goal) {
            const geom = new THREE.SphereGeometry(goal.w / 2, 24, 24);
            const mat = new THREE.MeshPhongMaterial({
                color: 0x4caf50,
                emissive: 0x2e7d32,
                emissiveIntensity: 0.6,
                shininess: 120,
                transparent: true,
                opacity: 0.9
            });
            goalMesh = new THREE.Mesh(geom, mat);
            goalMesh.position.set(goal.x + goal.w / 2, H - (goal.y + goal.h / 2), 10);
            scene.add(goalMesh);
        }
    }

    // ── Update Per Frame ───────────────────────────────────
    function update(ballState, platformArr, obstacleArr, gravityMode, tension) {
        if (!ballMesh || !renderer) return;

        const t = Date.now() / 1000;

        // Ball position (flip Y)
        if (ballState.alive) {
            ballMesh.visible = true;
            ballMesh.position.x = ballState.x;
            ballMesh.position.y = H - ballState.y;
            ballMesh.position.z = 15 + Math.sin(t * 3) * 2; // subtle bob

            // Squash & stretch
            const sx = ballState.scaleX || 1;
            const sy = ballState.scaleY || 1;
            ballMesh.scale.set(sx, sy, 1);

            // Glow intensity based on speed
            const speed = Math.hypot(ballState.vx || 0, ballState.vy || 0);
            const emInt = 0.3 + Math.min(speed / 20, 0.7);
            ballMesh.material.emissiveIntensity = emInt;

            // Motion Trail Update
            const trailCount = tension > 60 ? 5 : (tension > 30 ? 3 : 1);
            ghostMeshes.forEach((ghost, i) => {
                if (ballState.trail && i < ballState.trail.length && i < trailCount) {
                    const tData = ballState.trail[i];
                    ghost.position.set(tData.x, H - tData.y, 15);
                    ghost.visible = true;
                    // Fading opacity (0.3 -> 0)
                    ghost.material.opacity = 0.3 * (1 - (i / 5)) * (tData.alpha || 1);
                    ghost.material.color.copy(ballMesh.material.color);
                    ghost.material.emissive.copy(ballMesh.material.emissive);
                } else {
                    ghost.visible = false;
                }
            });

        } else {
            ballMesh.visible = false;
            ghostMeshes.forEach(g => g.visible = false);
        }

        // Update platform positions (for moving platforms)
        platformMeshes.forEach((mesh, i) => {
            if (platformArr[i]) {
                const p = platformArr[i];
                mesh.position.x = p.x + p.w / 2;
                mesh.position.y = H - (p.y + p.h / 2);
            }
        });

        // Update obstacle positions
        obstacleMeshes.forEach((mesh, i) => {
            if (obstacleArr[i]) {
                const o = obstacleArr[i];
                mesh.position.x = o.x + o.w / 2;
                mesh.position.y = H - (o.y + o.h / 2);
                // Spikes pulsate
                if (o.type === 'spike') {
                    const pulse = 1 + Math.sin(t * 4 + i) * 0.1;
                    mesh.scale.set(pulse, pulse, pulse);
                }
            }
        });

        // Goal animation
        if (goalMesh) {
            goalMesh.rotation.y = t;
            goalMesh.rotation.x = Math.sin(t * 0.5) * 0.2;
            const gPulse = 0.9 + Math.sin(t * 2) * 0.15;
            goalMesh.scale.set(gPulse, gPulse, gPulse);
            goalMesh.material.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.3;
        }

        // Gravity-dependent colour shift
        updateGravityVisuals(gravityMode);

        // Tension affects lighting warmth
        const tensionNorm = Math.min(tension / 100, 1);
        const r = Math.floor(70 + tensionNorm * 185);
        const g = Math.floor(100 - tensionNorm * 60);
        const b = Math.floor(180 - tensionNorm * 130);
        pointLight.color.setRGB(r / 255, g / 255, b / 255);
        pointLight.intensity = 0.3 + tensionNorm * 0.5;

        // Camera slight sway
        camera.position.x = W / 2 + Math.sin(t * 0.3) * 8;
        camera.position.y = H / 2 + Math.cos(t * 0.2) * 5;

        // Tension Camera Shake (Simplex Noise max 0.05) if tension > 60
        if (tension > 60 && simplex) {
            const shakeAmt = tension > 85 ? 0.05 : 0.02;
            const sx = simplex.noise2D(t * 10, 0) * shakeAmt * W;
            const sy = simplex.noise2D(0, t * 10) * shakeAmt * H;
            camera.position.x += sx;
            camera.position.y += sy;
        }

        renderer.render(scene, camera);
    }

    // ── Gravity Visuals ────────────────────────────────────
    function updateGravityVisuals(mode) {
        if (!ballMesh) return;
        const colors = {
            normal:  0x4fc3f7,
            reverse: 0xb388ff,
            left:    0xf48fb1,
            right:   0xffab40,
            zero:    0x81c784,
            pulse:   0xff5252
        };
        const c = colors[mode] || colors.normal;
        ballMesh.material.color.setHex(c);
        ballMesh.material.emissive.setHex(c).multiplyScalar(0.5);
    }

    // ── Screen Shake ───────────────────────────────────────
    function shake(intensity) {
        const origX = W / 2, origY = H / 2;
        let frames = 10;
        const shakeLoop = () => {
            if (frames <= 0) {
                camera.position.x = origX;
                camera.position.y = origY;
                return;
            }
            camera.position.x = origX + (Math.random() - 0.5) * intensity * frames;
            camera.position.y = origY + (Math.random() - 0.5) * intensity * frames;
            frames--;
            requestAnimationFrame(shakeLoop);
        };
        shakeLoop();
    }

    // ── Burst Particles (death/goal) ───────────────────────
    function burst(x, y, color, count) {
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i * 3] = x;
            positions[i * 3 + 1] = H - y;
            positions[i * 3 + 2] = 15;
            velocities.push({
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                vz: Math.random() * 3
            });
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color,
            size: 4,
            transparent: true,
            opacity: 1
        });
        const points = new THREE.Points(geom, mat);
        scene.add(points);

        let life = 1;
        const animate = () => {
            life -= 0.03;
            if (life <= 0) {
                scene.remove(points);
                geom.dispose();
                mat.dispose();
                return;
            }
            mat.opacity = life;
            const pos = geom.attributes.position.array;
            for (let i = 0; i < count; i++) {
                pos[i * 3] += velocities[i].vx;
                pos[i * 3 + 1] += velocities[i].vy;
                pos[i * 3 + 2] += velocities[i].vz;
                velocities[i].vy -= 0.08; // gravity on particles
            }
            geom.attributes.position.needsUpdate = true;
            requestAnimationFrame(animate);
        };
        animate();
    }

    // ── Resize Handler ─────────────────────────────────────
    function resize() {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    return { init, buildLevel, update, shake, burst, resize };
})();

window.Renderer3D = Renderer3D;
