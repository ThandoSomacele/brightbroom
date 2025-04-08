// src/routes/uploads/[[path]]/+server.ts
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { UPLOAD_DIR } from '$lib/server/constants';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

/**
 * Serve static uploaded files
 * 
 * This route handler serves files from the uploads directory.
 * It includes security checks to prevent directory traversal attacks.
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    // Get the requested path from parameters
    const requestedPath = params.path || '';
    
    // Prevent directory traversal by normalizing the path and checking for suspicious patterns
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Ensure the path starts with 'profile-images/' for security
    // This restricts access to only the profile-images subdirectory
    if (!normalizedPath.startsWith('profile-images/')) {
      throw error(403, 'Access denied');
    }
    
    // Build the full path to the file
    const filePath = path.join(UPLOAD_DIR, normalizedPath);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw error(404, 'File not found');
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Ensure it's a file, not a directory
    if (!stats.isFile()) {
      throw error(403, 'Not a file');
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    
    // Return the file with appropriate headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': `"${stats.size}-${stats.mtime.getTime()}"`,
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error serving static file:', err.message);
      throw error(500, 'Error serving file');
    }
    throw err;
  }
};
