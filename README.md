# Bounce Classic 2026 - Deployment Guide

## Quick Start

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

## Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from https://aistudio.google.com/app/apikey

## Project Structure

```
bounce-classic-2026/
├── index.html              # Main game page
├── style.css               # Game styling
├── game.js                 # Physics engine
├── ai.js                   # Gemini integration (secure)
├── ui.js                   # UI components
├── api/
│   └── generateContent.js  # Serverless API proxy
├── vercel.json             # Vercel configuration
├── package.json            # Project metadata
├── .gitignore              # Git ignore rules
├── .env.example            # Environment template
└── README.md               # This file
```

## How It Works

1. **Client** (index.html, game.js, ai.js) sends requests to `/api/generateContent`
2. **Vercel Serverless** (api/generateContent.js) receives the request
3. **Backend** securely calls Gemini API with the `GEMINI_API_KEY` environment variable
4. **Response** is sent back to the client

This keeps your API key secure and prevents it from being exposed in client-side code.

## Security Notes

✅ **API Key is protected** - Stored only on Vercel, never sent to client
✅ **CORS enabled** - Works seamlessly from any origin
✅ **Rate limited** - Vercel serverless functions scale automatically
✅ **Secure** - API requests are made server-to-server, not client-to-Gemini

## Troubleshooting

### Deployment fails
```bash
vercel --prod --force
```

### API calls returning errors
- Check Vercel logs: `vercel logs`
- Verify `GEMINI_API_KEY` is set in Vercel project settings
- Check browser DevTools (F12) → Network tab

### 404 on API endpoint
- Ensure `api/generateContent.js` exists
- Check `vercel.json` routes configuration
- Redeploy: `vercel --prod --force`

## Local Testing

To test locally before deploying:

1. Create `.env.local`:
```
GEMINI_API_KEY=your_actual_api_key
```

2. Run a local server (Python):
```bash
python -m http.server 8000
```

3. Visit `http://localhost:8000`

**Note**: Serverless function won't work locally. You'll need to either:
- Use the production Gemini endpoint temporarily (not recommended)
- Or set up a local Node.js server

## Credits

- **Game**: Bounce Classic (Nokia Bounce remake)
- **AI**: Google Gemini 2.0 Flash
- **Hosting**: Vercel
- **Year**: 2026
