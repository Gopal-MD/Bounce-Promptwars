/**
 * AI Tests — Offline AI Engine validation
 */
describe('AI Engine', () => {
    let window;

    beforeEach(() => {
        window = {};
        const fs = require('fs');
        eval(fs.readFileSync('./ai.js', 'utf8'));
        window.AI = global.AI || {};
    });

    test('should generate a valid level object', () => {
        const level = window.AI.generateLevel ? window.AI.generateLevel(1) : null;
        expect(level).not.toBeNull();
        expect(level).toHaveProperty('platforms');
        expect(level).toHaveProperty('obstacles');
        expect(level).toHaveProperty('goal');
        expect(Array.isArray(level.platforms)).toBe(true);
    });

    test('should generate story text for a level', () => {
        window.AI.generateMissionArc('TestPilot');
        const story = window.AI.generateStory(1);
        expect(story).toBeDefined();
        expect(typeof story).toBe('string');
        expect(story.length).toBeGreaterThan(0);
    });

    test('offline mode should be enabled', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./ai.js', 'utf8');
        expect(content).toContain('OFFLINE_MODE');
    });

    test('should provide narration for events', () => {
        const narration = window.AI.generateNarration('level_complete');
        expect(narration).toBeDefined();
        expect(typeof narration).toBe('string');
    });
});
