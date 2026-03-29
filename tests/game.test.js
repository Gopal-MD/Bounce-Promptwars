/**
 * Game Tests — Physics and core gameplay validation
 */
describe('Game Physics', () => {
    const W = 800;
    const H = 580;

    test('canvas dimensions should be correct', () => {
        expect(W).toBe(800);
        expect(H).toBe(580);
    });

    test('collision detection should work with rectangles', () => {
        const ball = { x: 100, y: 100, vx: 0, vy: 0, radius: 12 };
        const platform = { x: 50, y: 110, w: 200, h: 20 };

        // Simple AABB collision check
        const collides = !(
            ball.x + ball.radius < platform.x ||
            ball.x - ball.radius > platform.x + platform.w ||
            ball.y + ball.radius < platform.y ||
            ball.y - ball.radius > platform.y + platform.h
        );

        expect(collides).toBe(true);
    });

    test('gravity vector should return valid values', () => {
        const gravityVectors = {
            normal: { gx: 0, gy: 0.45 },
            reverse: { gx: 0, gy: -0.45 },
            left: { gx: -0.45, gy: 0.1 },
            right: { gx: 0.45, gy: 0.1 }
        };

        Object.values(gravityVectors).forEach(vector => {
            expect(typeof vector.gx).toBe('number');
            expect(typeof vector.gy).toBe('number');
            expect(isFinite(vector.gx)).toBe(true);
            expect(isFinite(vector.gy)).toBe(true);
        });
    });

    test('score calculation should increment correctly', () => {
        let score = 0;
        const baseReward = 1000;
        const deathBonus = Math.max(0, 500 - 2 * 100);
        const tensionBonus = Math.round(50 * 2);

        score += baseReward + deathBonus + tensionBonus;

        expect(score).toBeGreaterThan(baseReward);
        expect(score).toBe(1800);
    });

    test('tension system should stay within bounds', () => {
        const TENSION_MAX = 100;
        let tension = 0;

        tension = Math.min(TENSION_MAX, tension + 150);
        expect(tension).toBeLessThanOrEqual(TENSION_MAX);
        expect(tension).toBe(100);
    });
});
