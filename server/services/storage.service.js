import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import Setting from '../models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

/**
 * Common MIME types dictionary
 */
const MIME_TYPES = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    txt: 'text/plain',
    csv: 'text/csv'
};

/**
 * Fetch storage settings from DB with fallback to process.env
 */
export const getStorageConfig = async () => {
    try {
        const keys = [
            'FILESYSTEM_DRIVER',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_DEFAULT_REGION',
            'AWS_BUCKET',
            'AWS_URL',
            'BACKBLAZE_ACCESS_KEY_ID',
            'BACKBLAZE_SECRET_ACCESS_KEY',
            'BACKBLAZE_DEFAULT_REGION',
            'BACKBLAZE_BUCKET',
            'BACKBLAZE_ENDPOINT',
            'BACKBLAZE_URL'
        ];

        const settings = await Setting.find({ key: { $in: keys } });
        const config = {};
        settings.forEach((s) => {
            if (s.key && s.value !== undefined) {
                config[s.key] = s.value;
            }
        });

        const driver = (config.FILESYSTEM_DRIVER || process.env.FILESYSTEM_DRIVER || 'local').toLowerCase();

        return {
            driver,
            aws: {
                accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
                region: config.AWS_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
                bucket: config.AWS_BUCKET || process.env.AWS_BUCKET || '',
                url: config.AWS_URL || process.env.AWS_URL || ''
            },
            backblaze: {
                accessKeyId: config.BACKBLAZE_ACCESS_KEY_ID || process.env.BACKBLAZE_ACCESS_KEY_ID || '',
                secretAccessKey: config.BACKBLAZE_SECRET_ACCESS_KEY || process.env.BACKBLAZE_SECRET_ACCESS_KEY || '',
                region: config.BACKBLAZE_DEFAULT_REGION || process.env.BACKBLAZE_DEFAULT_REGION || 'us-east-005',
                bucket: config.BACKBLAZE_BUCKET || process.env.BACKBLAZE_BUCKET || '',
                endpoint: config.BACKBLAZE_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || '',
                url: config.BACKBLAZE_URL || process.env.BACKBLAZE_URL || ''
            }
        };
    } catch (err) {
        console.error('Error fetching storage config:', err);
        return {
            driver: (process.env.FILESYSTEM_DRIVER || 'local').toLowerCase(),
            aws: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
                bucket: process.env.AWS_BUCKET || '',
                url: process.env.AWS_URL || ''
            },
            backblaze: {
                accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY || '',
                region: process.env.BACKBLAZE_DEFAULT_REGION || 'us-east-005',
                bucket: process.env.BACKBLAZE_BUCKET || '',
                endpoint: process.env.BACKBLAZE_ENDPOINT || '',
                url: process.env.BACKBLAZE_URL || ''
            }
        };
    }
};

/**
 * Upload file to storage (local disk or S3/Backblaze cloud)
 * Matches Laravel base-module AizUploadController@upload
 *
 * @param {Object} file - Multer uploaded file object
 * @param {string} relativePath - Relative path, e.g. "uploads/all/<filename>"
 * @param {string} ext - File extension, e.g. "png"
 * @param {string} baseUrl - Base URL of the API server, e.g. "http://localhost:5000"
 */
export const uploadToStorage = async (file, relativePath, ext, baseUrl) => {
    const config = await getStorageConfig();
    const isCloud = config.driver === 's3' || config.driver === 'aws' || config.driver === 'backblaze';
    const localDiskPath = path.join(publicDir, relativePath);

    if (isCloud) {
        const isBackblaze = config.driver === 'backblaze';
        const targetConfig = isBackblaze ? config.backblaze : config.aws;

        if (targetConfig.bucket && targetConfig.accessKeyId && targetConfig.secretAccessKey) {
            try {
                const s3ClientConfig = {
                    region: targetConfig.region,
                    credentials: {
                        accessKeyId: targetConfig.accessKeyId,
                        secretAccessKey: targetConfig.secretAccessKey
                    }
                };

                if (isBackblaze && targetConfig.endpoint) {
                    s3ClientConfig.endpoint = targetConfig.endpoint.startsWith('http')
                        ? targetConfig.endpoint
                        : `https://${targetConfig.endpoint}`;
                }

                const s3Client = new S3Client(s3ClientConfig);
                const fileBuffer = fs.readFileSync(localDiskPath);
                const mimeType = MIME_TYPES[ext.toLowerCase()] || file.mimetype || 'application/octet-stream';

                const putCommand = new PutObjectCommand({
                    Bucket: targetConfig.bucket,
                    Key: relativePath.replace(/\\/g, '/'),
                    Body: fileBuffer,
                    ContentType: mimeType
                });

                await s3Client.send(putCommand);

                // Unlink temporary local copy matching Laravel unlink(base_path('public/') . $path)
                if (fs.existsSync(localDiskPath)) {
                    try {
                        fs.unlinkSync(localDiskPath);
                    } catch (unlinkErr) {
                        console.warn('Could not unlink local temp file after cloud upload:', unlinkErr.message);
                    }
                }

                // Construct public URL
                let cloudUrl = '';
                if (targetConfig.url) {
                    cloudUrl = `${targetConfig.url.replace(/\/$/, '')}/${relativePath.replace(/\\/g, '/')}`;
                } else if (isBackblaze) {
                    cloudUrl = `https://${targetConfig.bucket}.s3.${targetConfig.region}.backblazeb2.com/${relativePath.replace(/\\/g, '/')}`;
                } else {
                    cloudUrl = `https://${targetConfig.bucket}.s3.${targetConfig.region}.amazonaws.com/${relativePath.replace(/\\/g, '/')}`;
                }

                return {
                    driver: config.driver,
                    fileName: relativePath.replace(/\\/g, '/'),
                    url: cloudUrl,
                    externalLink: cloudUrl
                };
            } catch (cloudErr) {
                console.error(`Error uploading to ${config.driver} cloud storage:`, cloudErr);
                // Fall back to local storage if cloud upload fails
            }
        } else {
            console.warn(`${config.driver.toUpperCase()} storage is active but credentials or bucket are not configured. Falling back to local storage.`);
        }
    }

    // Default: Local disk storage
    const cleanRelativePath = relativePath.replace(/\\/g, '/');
    const localUrl = `${baseUrl.replace(/\/$/, '')}/${cleanRelativePath}`;

    return {
        driver: 'local',
        fileName: cleanRelativePath,
        url: localUrl,
        externalLink: null
    };
};

/**
 * Delete file from storage (removes from S3 if cloud-stored and unlinks local file)
 * Matches Laravel base-module AizUploadController@destroy
 *
 * @param {Object} uploadDoc - Upload MongoDB document
 */
export const deleteFromStorage = async (uploadDoc) => {
    if (!uploadDoc) return;

    const config = await getStorageConfig();
    const fileName = (uploadDoc.file_name || '').replace(/\\/g, '/');
    const isCloudFile = Boolean(
        uploadDoc.external_link ||
        config.driver === 's3' ||
        config.driver === 'aws' ||
        config.driver === 'backblaze'
    );

    // If cloud stored, delete from S3
    if (isCloudFile && fileName) {
        try {
            const isBackblaze = config.driver === 'backblaze' || (uploadDoc.external_link && uploadDoc.external_link.includes('backblaze'));
            const targetConfig = isBackblaze ? config.backblaze : config.aws;

            if (targetConfig.bucket && targetConfig.accessKeyId && targetConfig.secretAccessKey) {
                const s3ClientConfig = {
                    region: targetConfig.region,
                    credentials: {
                        accessKeyId: targetConfig.accessKeyId,
                        secretAccessKey: targetConfig.secretAccessKey
                    }
                };

                if (isBackblaze && targetConfig.endpoint) {
                    s3ClientConfig.endpoint = targetConfig.endpoint.startsWith('http')
                        ? targetConfig.endpoint
                        : `https://${targetConfig.endpoint}`;
                }

                const s3Client = new S3Client(s3ClientConfig);
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: targetConfig.bucket,
                    Key: fileName
                }));
            }
        } catch (err) {
            console.warn('Could not delete object from cloud storage:', err.message);
        }
    }

    // Also remove local file if it exists
    if (fileName) {
        const localPath = path.join(publicDir, fileName);
        if (fs.existsSync(localPath)) {
            try {
                fs.unlinkSync(localPath);
            } catch (err) {
                console.warn('Could not unlink local file:', err.message);
            }
        }
    }
};
