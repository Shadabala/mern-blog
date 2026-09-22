import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Upload from '../models/Upload.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import { uploadToStorage, deleteFromStorage } from '../services/storage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'all');

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extension to type map matching Laravel base-module AizUploadController
const extensionTypeMap = {
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    svg: 'image',
    webp: 'image',
    gif: 'image',
    bmp: 'image',
    ico: 'image',
    tiff: 'image',
    mp4: 'video',
    mpg: 'video',
    mpeg: 'video',
    webm: 'video',
    ogg: 'video',
    avi: 'video',
    mov: 'video',
    flv: 'video',
    swf: 'video',
    mkv: 'video',
    wmv: 'video',
    wma: 'audio',
    aac: 'audio',
    wav: 'audio',
    mp3: 'audio',
    m4a: 'audio',
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    tar: 'archive',
    gz: 'archive',
    doc: 'document',
    docx: 'document',
    txt: 'document',
    pdf: 'document',
    xls: 'document',
    xlsx: 'document',
    ppt: 'document',
    pptx: 'document',
    csv: 'document'
};

const formatFileResponse = (file, req) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const cleanFileName = (file.file_name || '').replace(/\\/g, '/');
    const localUrl = `${baseUrl}/${cleanFileName}`;
    const url = file.external_link || localUrl;

    return {
        _id: file._id,
        id: file._id,
        file_original_name: file.file_original_name || 'Unknown',
        file_name: cleanFileName,
        url: url,
        local_url: localUrl,
        user_id: file.user_id?._id || file.user_id,
        extension: file.extension,
        type: file.type,
        file_size: file.file_size,
        external_link: file.external_link,
        created_at: file.createdAt,
        updated_at: file.updatedAt
    };
};

/**
 * Get paginated list of uploaded files with search & sort
 * Matches AizUploadController::get_uploaded_files & index
 */
export const getUploadedFiles = async (req, res) => {
    try {
        const { search, sort, type, page = 1, limit = 60 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 60;
        const skip = (pageNum - 1) * limitNum;

        const query = { deleted_at: null };

        // If not admin, restrict to own files
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'staff') {
            query.user_id = req.user._id;
        }

        if (search && search.trim()) {
            query.file_original_name = { $regex: search.trim(), $options: 'i' };
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        let sortOption = { createdAt: -1 }; // newest
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'smallest') {
            sortOption = { file_size: 1 };
        } else if (sort === 'largest') {
            sortOption = { file_size: -1 };
        }

        const total = await Upload.countDocuments(query);
        let files;
        try {
            files = await Upload.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .populate('user_id', 'name email username')
                .lean();
        } catch (popErr) {
            console.warn('Populate user_id error, falling back to basic query:', popErr.message);
            files = await Upload.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean();
        }

        const formattedFiles = files.map(file => {
            const formatted = formatFileResponse(file, req);
            if (file.user_id && typeof file.user_id === 'object') {
                formatted.user = {
                    name: file.user_id.name,
                    email: file.user_id.email,
                    username: file.user_id.username
                };
            }
            return formatted;
        });

        return res.status(200).json({
            success: true,
            data: formattedFiles,
            current_page: pageNum,
            last_page: Math.ceil(total / limitNum) || 1,
            total,
            from: skip + 1,
            to: skip + formattedFiles.length
        });
    } catch (error) {
        console.error('Error fetching uploaded files:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch uploaded files',
            error: error.message
        });
    }
};

/**
 * Upload single/multiple file endpoint for Uppy XHRUpload
 * Matches AizUploadController::upload
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const rawOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(rawOriginalName).replace('.', '').toLowerCase();
        const baseName = path.basename(rawOriginalName, path.extname(rawOriginalName));
        const fileType = extensionTypeMap[ext] || 'other';

        // Relative path matching Laravel base-module: 'uploads/all/<filename>'
        const relativePath = `uploads/all/${req.file.filename}`;
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Upload using storage service (supports local disk and AWS S3)
        const storageResult = await uploadToStorage(req.file, relativePath, ext, baseUrl);

        const uploadDoc = new Upload({
            file_original_name: baseName,
            file_name: storageResult.fileName,
            user_id: (req.user && mongoose.isValidObjectId(req.user._id)) ? req.user._id : null,
            extension: ext,
            type: fileType,
            file_size: req.file.size,
            external_link: storageResult.externalLink
        });

        await uploadDoc.save();

        const formatted = formatFileResponse(uploadDoc, req);

        return res.status(200).json({
            success: true,
            id: uploadDoc._id,
            data: formatted,
            url: formatted.url,
            file_name: formatted.file_name
        });
    } catch (error) {
        console.error('Error handling upload:', error);
        return res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: error.message
        });
    }
};

/**
 * Get file objects by list of IDs
 * Matches AizUploadController::get_preview_files / get_file_by_ids
 */
export const getFileByIds = async (req, res) => {
    try {
        let ids = req.body.ids || req.query.ids;
        if (!ids) {
            return res.status(200).json([]);
        }

        if (typeof ids === 'string') {
            ids = ids.split(',').map(s => s.trim()).filter(Boolean);
        }

        const files = await Upload.find({
            _id: { $in: ids },
            deleted_at: null
        }).lean();

        const formatted = files.map(file => formatFileResponse(file, req));
        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error in getFileByIds:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve file details',
            error: error.message
        });
    }
};

/**
 * Delete single file
 * Matches AizUploadController::destroy
 */
export const destroyFile = async (req, res) => {
    try {
        const fileId = req.params.id || req.body.id;
        const file = await Upload.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Permission check
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'staff' && String(file.user_id) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this file!"
            });
        }

        // Remove from storage (S3 and/or local)
        await deleteFromStorage(file);

        await Upload.findByIdAndDelete(fileId);

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error.message
        });
    }
};

/**
 * Bulk delete files
 * Matches AizUploadController::bulk_uploaded_files_delete
 */
export const bulkDeleteFiles = async (req, res) => {
    try {
        const ids = req.body.id || req.body.ids;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files selected for deletion'
            });
        }

        const files = await Upload.find({ _id: { $in: ids } });

        for (const file of files) {
            await deleteFromStorage(file);
        }

        await Upload.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({
            success: true,
            message: 'Selected files deleted successfully',
            deletedCount: files.length
        });
    } catch (error) {
        console.error('Error in bulk file deletion:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete files in bulk',
            error: error.message
        });
    }
};

/**
 * Get detailed file info
 * Matches AizUploadController::file_info
 */
export const fileInfo = async (req, res) => {
    try {
        const fileId = req.params.id || req.body.id;
        let file;
        try {
            file = await Upload.findById(fileId).populate('user_id', 'name email username').lean();
        } catch (popErr) {
            file = await Upload.findById(fileId).lean();
        }

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const formatted = formatFileResponse(file, req);
        if (file.user_id && typeof file.user_id === 'object') {
            formatted.user = {
                name: file.user_id.name,
                email: file.user_id.email,
                username: file.user_id.username
            };
        }

        return res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Error fetching file info:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get file info',
            error: error.message
        });
    }
};
