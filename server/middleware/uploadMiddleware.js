import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'all');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(original).toLowerCase();
        const baseName = path.basename(original, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    }
});

// Middleware that handles both 'aiz_file' (from AIZ Uppy) and standard 'file'
export const aizUploadMiddleware = (req, res, next) => {
    const singleUpload = upload.single('aiz_file');
    singleUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (req.file) {
            return next();
        }
        // Fallback check for field named 'file'
        const fallbackUpload = upload.single('file');
        fallbackUpload(req, res, (err2) => {
            if (err2) {
                return res.status(400).json({ success: false, message: err2.message });
            }
            next();
        });
    });
};
