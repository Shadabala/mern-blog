import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Locate the .env file path
 */
export const getEnvPath = () => {
    const serverEnv = path.resolve(__dirname, '../.env');
    if (fs.existsSync(serverEnv)) return serverEnv;
    const rootEnv = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(rootEnv)) return rootEnv;
    return serverEnv;
};

/**
 * Parse the current .env file into a dictionary (keys mapped in exact and UPPERCASE)
 */
export const readEnvFile = () => {
    const envPath = getEnvPath();
    if (!fs.existsSync(envPath)) return {};

    try {
        const content = fs.readFileSync(envPath, 'utf8');
        const envMap = {};
        const lines = content.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
                const key = line.slice(0, eqIdx).trim();
                let value = line.slice(eqIdx + 1).trim();

                // Strip outer quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                envMap[key] = value;
                envMap[key.toUpperCase()] = value;
            }
        }
        return envMap;
    } catch (err) {
        console.error('Error reading .env file:', err);
        return {};
    }
};

/**
 * Fetch a value from .env file or process.env with case-insensitive fallback
 */
export const getEnvValue = (key, defaultValue = '') => {
    if (!key) return defaultValue;
    const rawKey = String(key).trim();
    const upperKey = rawKey.toUpperCase();
    const envMap = readEnvFile();

    // 1. Check parsed .env (upper then raw)
    if (envMap[upperKey] !== undefined) return envMap[upperKey];
    if (envMap[rawKey] !== undefined) return envMap[rawKey];

    // 2. Check process.env (upper then raw)
    if (process.env[upperKey] !== undefined) return process.env[upperKey];
    if (process.env[rawKey] !== undefined) return process.env[rawKey];

    return defaultValue;
};

/**
 * Update or create key-value in .env file strictly in UPPERCASE format
 * Eliminates duplicate keys and case-insensitive variants
 */
export const overWriteEnvFile = (type, val) => {
    if (!type || typeof type !== 'string') return;
    if (process.env.DEMO_MODE === 'On') return;

    const envPath = getEnvPath();
    if (!fs.existsSync(envPath)) {
        try {
            fs.writeFileSync(envPath, '', 'utf8');
        } catch (e) {
            console.error('Failed to create .env file:', e);
            return;
        }
    }

    const upperKey = type.trim().toUpperCase();
    const trimmedVal = val !== undefined && val !== null ? String(val).trim() : '';
    const formattedVal = `"${trimmedVal.replace(/"/g, '\\"')}"`;

    let content = '';
    try {
        content = fs.readFileSync(envPath, 'utf8');
    } catch (err) {
        console.error('Failed to read .env file:', err);
        return;
    }

    const lines = content.split(/\r?\n/);
    const newLines = [];
    let matched = false;

    for (const line of lines) {
        const trimmed = line.trim();
        // Preserve comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
            const currentKey = line.slice(0, eqIdx).trim();
            // If matches key (case-insensitive)
            if (currentKey.toUpperCase() === upperKey) {
                if (!matched) {
                    newLines.push(`${upperKey}=${formattedVal}`);
                    matched = true;
                }
                // Any duplicate case variant is pruned
                continue;
            }
        }
        newLines.push(line);
    }

    // If key did not exist in any case, append it
    if (!matched) {
        newLines.push(`${upperKey}=${formattedVal}`);
    }

    try {
        fs.writeFileSync(envPath, newLines.join('\r\n'), 'utf8');
        process.env[upperKey] = trimmedVal;
        process.env[type.trim()] = trimmedVal;
    } catch (err) {
        console.error(`Failed to write to .env for key ${upperKey}:`, err);
    }
};

/**
 * Handle direct .env key updates from API requests (forces UPPERCASE)
 */
export const env_key_update = async (req, res) => {
    try {
        const { types } = req.body;
        if (Array.isArray(types)) {
            for (const type of types) {
                if (typeof type === 'string' && req.body[type] !== undefined) {
                    overWriteEnvFile(type, req.body[type]);
                }
            }
        } else if (req.body && typeof req.body === 'object') {
            for (const [key, val] of Object.entries(req.body)) {
                if (!['types', 'types[]', 'lang', '_id', '__v'].includes(key) && val !== undefined) {
                    overWriteEnvFile(key, val);
                }
            }
        }

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Environment settings updated successfully'
        });
    } catch (error) {
        console.error('Error in env_key_update:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update environment settings'
        });
    }
};

export default {
    getEnvPath,
    readEnvFile,
    getEnvValue,
    overWriteEnvFile,
    env_key_update
};
