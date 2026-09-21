import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import path from 'path';
import { fileURLToPath } from 'url';

import Connection from './database/db.js';
import Router from './routes/route.js';
import './helpers/Helper.js';

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

// Serve static uploaded files (uploads/all/...)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', Router);
app.use('/', Router);


const PORT = process.env.PORT || 8000;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

Connection(username, password);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); // nodemon restart trigger: uploader fix


