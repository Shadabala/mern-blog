import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { readEnvFile } from '../utils/envHelper.js';

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
 * Fetch storage settings directly from .env file (with process.env fallback)
 */
export const getStorageConfig = () => {
    const env = readEnvFile();

    let rawDriver = (env.FILESYSTEM_DRIVER || process.env.FILESYSTEM_DRIVER || 'local').toLowerCase().trim();
    const driver = (rawDriver === 's3' || rawDriver === 'aws') ? 's3' : rawDriver;

    return {
        driver,
        aws: {
            accessKeyId: (env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim(),
            secretAccessKey: (env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
            region: (env.AWS_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1').trim(),
            bucket: (env.AWS_BUCKET || process.env.AWS_BUCKET || '').trim(),
            url: (env.AWS_URL || process.env.AWS_URL || '').trim()
        },
        backblaze: {
            accessKeyId: (env.BACKBLAZE_ACCESS_KEY_ID || process.env.BACKBLAZE_ACCESS_KEY_ID || '').trim(),
            secretAccessKey: (env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.BACKBLAZE_SECRET_ACCESS_KEY || '').trim(),
            region: (env.BACKBLAZE_DEFAULT_REGION || process.env.BACKBLAZE_DEFAULT_REGION || 'us-east-005').trim(),
            bucket: (env.BACKBLAZE_BUCKET || process.env.BACKBLAZE_BUCKET || '').trim(),
            endpoint: (env.BACKBLAZE_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || '').trim(),
            url: (env.BACKBLAZE_URL || process.env.BACKBLAZE_URL || '').trim()
        }
    };
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
    const config = getStorageConfig();
    const cleanRelativePath = relativePath.replace(/\\/g, '/');
    const localDiskPath = path.join(publicDir, cleanRelativePath);

    // 1. S3 Cloud Storage Handler
    if (config.driver === 's3' || config.driver === 'aws' || config.driver === 'backblaze') {
        const isBackblaze = config.driver === 'backblaze';
        const targetConfig = isBackblaze ? config.backblaze : config.aws;

        if (targetConfig.bucket && targetConfig.accessKeyId && targetConfig.secretAccessKey) {
            try {
                const s3ClientConfig = {
                    region: targetConfig.region || 'us-east-1',
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
                    Key: cleanRelativePath,
                    Body: fileBuffer,
                    ContentType: mimeType
                });

                await s3Client.send(putCommand);

                // Construct public URL
                // If custom AWS_URL / BACKBLAZE_URL (e.g. CloudFront CDN) is specified, use it directly.
                // Otherwise use local streaming proxy URL so browser won't get 403 Forbidden from private S3 bucket.
                const localUrl = `${baseUrl.replace(/\/$/, '')}/${cleanRelativePath}`;
                let cloudUrl = '';
                if (targetConfig.url) {
                    cloudUrl = `${targetConfig.url.replace(/\/$/, '')}/${cleanRelativePath}`;
                } else if (isBackblaze) {
                    cloudUrl = `https://${targetConfig.bucket}.s3.${targetConfig.region}.backblazeb2.com/${cleanRelativePath}`;
                } else {
                    cloudUrl = `https://${targetConfig.bucket}.s3.${targetConfig.region}.amazonaws.com/${cleanRelativePath}`;
                }

                const finalUrl = targetConfig.url ? cloudUrl : localUrl;

                return {
                    driver: 's3',
                    fileName: cleanRelativePath,
                    url: finalUrl,
                    externalLink: cloudUrl
                };
            } catch (cloudErr) {
                console.error(`Error uploading to ${config.driver.toUpperCase()} cloud storage:`, cloudErr.message);
                console.warn('Falling back to local storage.');
            }
        } else {
            console.warn(`FILESYSTEM_DRIVER is set to '${config.driver}', but AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET) are incomplete in .env. Falling back to local storage.`);
        }
    }

    // 2. Default Local Disk Storage Handler
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

    const config = getStorageConfig();
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
                    region: targetConfig.region || 'us-east-1',
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

/**
 * Retrieve file stream from cloud storage (S3 / Backblaze)
 *
 * @param {string} relativePath - e.g. "uploads/all/<filename>"
 * @returns {Promise<{ stream: any, contentType: string, contentLength: number } | null>}
 */
export const getFileStreamFromStorage = async (relativePath) => {
    const config = getStorageConfig();
    const cleanKey = (relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const isCloud = config.driver === 's3' || config.driver === 'aws' || config.driver === 'backblaze';
    const targetConfig = (config.driver === 'backblaze') ? config.backblaze : config.aws;

    if (!targetConfig.bucket || !targetConfig.accessKeyId || !targetConfig.secretAccessKey) {
        return null;
    }

    try {
        const s3ClientConfig = {
            region: targetConfig.region || 'us-east-1',
            credentials: {
                accessKeyId: targetConfig.accessKeyId,
                secretAccessKey: targetConfig.secretAccessKey
            }
        };

        if (config.driver === 'backblaze' && targetConfig.endpoint) {
            s3ClientConfig.endpoint = targetConfig.endpoint.startsWith('http')
                ? targetConfig.endpoint
                : `https://${targetConfig.endpoint}`;
        }

        const s3Client = new S3Client(s3ClientConfig);
        const command = new GetObjectCommand({
            Bucket: targetConfig.bucket,
            Key: cleanKey
        });

        const response = await s3Client.send(command);
        const byteArray = await response.Body.transformToByteArray();
        const buffer = Buffer.from(byteArray);

        return {
            buffer,
            stream: response.Body,
            contentType: response.ContentType,
            contentLength: response.ContentLength || buffer.length
        };
    } catch (err) {
        console.warn(`Could not get cloud stream for ${cleanKey}:`, err.message);
        return null;
    }
};

export default {
    getStorageConfig,
    uploadToStorage,
    deleteFromStorage,
    getFileStreamFromStorage
};
