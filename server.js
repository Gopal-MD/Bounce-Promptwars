import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import generateContent from './api/generateContent.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files from current directory
app.use(express.static(__dirname));

// API route mapping Vercel wrapper
app.all('/api/generateContent', async (req, res) => {
    // Vercel serverless functions have a standard (req, res) signature
    try {
        await generateContent(req, res);
    } catch(err) {
        console.error("API error proxy:", err);
        res.status(500).json({ error: "Internal ErrorProxy" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running internally on port ${port}`);
});
