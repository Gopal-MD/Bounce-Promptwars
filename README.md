# Bounce Classic: Physics Rewritten (AI Edition)

A 2D canvas platformer inspired by Nokia Bounce, reimagined with Gemini-powered content generation.

## What It Is

- 2D platformer with fixed 800x580 play area
- AI-generated levels, story text, event narration, and ending text
- Adaptive difficulty based on player performance
- Progressive AI coach hints for stuck players
- Mobile touch controls + keyboard controls

## Core Features

- Gemini Level Generation
   - Generates JSON level layouts with platforms, obstacles, and goal placement
   - Falls back to handcrafted levels if AI or parsing fails
- Adaptive Difficulty
   - Tracks recent performance (deaths, obstacle hits, clear times)
   - Adjusts upcoming level prompt: ease, maintain, or challenge
- AI Story and Narration
   - Story briefing shown before each level
   - Dynamic narration for near-death and level-complete moments
- AI Coach Hints
   - Hint button unlocks after a cooldown
   - 3-tier hint progression (gentle -> tactical -> step-by-step)
- Resilience
   - Fallback stories, narrations, endings, and hints keep gameplay running offline/API-down

## Controls

- Desktop
   - Left/Right arrows or A/D: move
   - Up arrow, W, or Space: jump
- Mobile
   - On-screen left/right/jump buttons

## Project Structure

```text
PromptWars/
   index.html              # App shell and overlays
   style.css               # Visual design and HUD styling
   game.js                 # Physics, game loop, states, collisions
   ui.js                   # Screen transitions, HUD, hint toast
   ai.js                   # Gemini calls, generation logic, fallbacks
   playerStats.js          # Adaptive difficulty tracking and scoring
   api/generateContent.js  # Vercel serverless Gemini proxy
   vercel.json             # Vercel routing/config
   package.json            # Project metadata
```

## Run Locally

This project is plain HTML/CSS/JS. You can run it with any static server.

1. Start a local server from project root.

```bash
python -m http.server 8000
```

2. Open:

```text
http://localhost:8000
```

Note: AI requests go to /api/generateContent. That endpoint is available on Vercel deployment, not from Python static server alone.

## Deploy to Vercel

1. Install and log in to Vercel CLI:

```bash
npm install -g vercel
vercel login
```

2. Deploy:

```bash
vercel --prod
```

3. In Vercel dashboard, set environment variable:

- Name: GEMINI_API_KEY
- Value: your Gemini API key

4. Redeploy after adding variables:

```bash
vercel --prod
```

## Security Note

Do not commit real API keys. Keep GEMINI_API_KEY only in environment variables on Vercel.

## Tech

- HTML5 Canvas 2D
- Vanilla JavaScript
- Web APIs (Speech synthesis hook present, currently disabled)
- Google Gemini API (via serverless proxy)
- Vercel Serverless Functions
