# Bounce Tales: Gravity Shift - Smart 3D AI Edition

A web-based 3D platformer featuring AI-driven storytelling and dynamic anti-gravity physics.

## Overview

Bounce Tales: Gravity Shift is an interactive web-based game that fuses classic platforming mechanics with modern generative AI. By leveraging generative models, the game breaks away from static level design by dynamically altering the physics environment (such as gravity and tension) and generating real-time narratives based on player performance. 

## Problem Statement

Traditional web-based platformers suffer from static environments and predictable outcomes. They lack the replayability that comes from adaptive difficulty and fail to engage players with unique, personalized narrative elements that respond directly to their gameplay actions.

## Solution

We developed a 2.5D game architecture that utilizes a sophisticated artificial intelligence integration to act as an active "Game Master." The Gemini API dynamically monitors the player's session and modifies the game's physical rules (like gravity and tension parameters) on the fly, while weaving a responsive, real-time narrative layer.

## Features

- Smart 3D illusion using Three.js
- Anti-gravity physics system
- AI-generated story using Gemini API
- Dynamic tension-based gameplay
- Responsive web controls

## Tech Stack

- HTML, CSS, JavaScript
- Three.js
- Node.js (Express)
- Google Cloud Run
- Gemini API

## Google Services Used

- Gemini API (AI generation)
- Cloud Run (deployment)

## How It Works

### Game Loop
The application runs on a continuous vanilla JavaScript `requestAnimationFrame` loop, synchronizing a custom 2D physics engine with an abstracted Three.js 3D rendering layer. This approach ensures highly performant logic while maintaining the 3D perspective illusion.

### AI Integration
The Express backend securely proxies requests to the Gemini API. During gameplay, telemetry data (such as player deaths, score, and tension) is sent to the model. The API returns JSON-structured payload modifiers that trigger narrative dialogue displays and alter the state of the active level.

### Gravity System
State-driven physics modifiers dynamically alter the directional pull of gravity in the game engine. Available gravity permutations include Reverse, Lateral, Zero-G, and Pulse states. The physics engine recalculates momentum and collision boundaries in real-time based on the current active gravity state.

## Setup Instructions

To run this project locally, follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/Bounce-Promptwars.git
   cd Bounce-Promptwars
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run locally**
   ```bash
   npm start
   ```
   The application will start the Express server internally and will be available on `http://localhost:8080`.

## Live Demo

**Cloud Run Deployment Link:** [https://bounce-connection-766171890128.asia-south1.run.app](https://bounce-connection-766171890128.asia-south1.run.app)

## Future Improvements

- Implementation of multi-player leaderboard sync via database persistence.
- Expansion of the Three.js rendering library to support fully rigged 3D models and advanced lighting shaders.
- Introducing a more complex dialogue tree memory so the Gemini API remembers past playthrough sessions natively.

## Conclusion

Bounce Tales: Gravity Shift showcases the potential of intertwining generative AI models with real-time web application environments. By utilizing the Gemini API and Google Cloud Run, we have successfully created a dynamic, scalable application that rethinks how static physics engines can become adaptive layers controlled entirely by AI.
