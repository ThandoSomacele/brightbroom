// src/lib/server/constants.ts
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory (relative to the project root)
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../../static/uploads');

// Maximum file upload sizes (in bytes)
export const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Image output dimensions
export const PROFILE_IMAGE_WIDTH = 500;
export const PROFILE_IMAGE_HEIGHT = 500;
