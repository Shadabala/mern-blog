import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Connection from './database/db.js';
import Router from './routes/route.js';
import './helpers/Helper.js';
import { getFileStreamFromStorage } from './services/storage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serve static uploaded files from local disk (uploads/all/...)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Cloud storage fallback: if file is not on local disk (e.g. stored in S3), stream directly from cloud
app.use(['/uploads', '/public/uploads'], async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }

    try {
        let subPath = req.path.replace(/^\/+/, '');
        if (!subPath.startsWith('uploads/')) {
            subPath = 'uploads/' + subPath;
        }
        subPath = subPath.replace(/^uploads\/uploads\//, 'uploads/');
        const cleanKey = subPath.replace(/\\/g, '/');

        const streamResult = await getFileStreamFromStorage(cleanKey);

        if (streamResult && streamResult.buffer) {
            if (streamResult.contentType) {
                res.setHeader('Content-Type', streamResult.contentType);
            }
            if (streamResult.contentLength) {
                res.setHeader('Content-Length', streamResult.contentLength);
            }
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            // Save to local disk cache so subsequent requests are served instantly by express.static
            try {
                const localCachePath = path.join(__dirname, 'public', cleanKey);
                const localCacheDir = path.dirname(localCachePath);
                if (!fs.existsSync(localCacheDir)) {
                    fs.mkdirSync(localCacheDir, { recursive: true });
                }
                fs.writeFileSync(localCachePath, streamResult.buffer);
            } catch {
                // Ignore background cache write errors
            }

            return res.send(streamResult.buffer);
        }
        return next();
    } catch (err) {
        console.warn('Cloud storage stream route error:', err.message);
        return next();
    }
});

app.use('/api', Router);
app.use('/', Router);


const PORT = process.env.PORT || 8000;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

Connection(username, password);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); // nodemon restart trigger: uploader fix


