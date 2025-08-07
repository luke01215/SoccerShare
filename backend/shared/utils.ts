// Shared utilities and configurations for Azure Functions
import { TableClient } from '@azure/data-tables';
import { BlobServiceClient } from '@azure/storage-blob';
import jwt from 'jsonwebtoken';

// Environment variables - PRODUCTION READY
export const config = {
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    jwtSecret: process.env.JWT_SECRET || (() => {
        throw new Error('JWT_SECRET environment variable is required for production');
    })(),
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || (() => {
        throw new Error('ADMIN_PASSWORD_HASH environment variable is required for production');
    })(),
    blobContainerName: 'soccer-videos',
    tokensTableName: 'DownloadTokens',
    usageTableName: 'DownloadUsage',
    videosTableName: 'Videos'
};

// Azure Storage clients
export const createBlobServiceClient = () => {
    return BlobServiceClient.fromConnectionString(config.storageConnectionString);
};

export const createTableClient = (tableName: string) => {
    return new TableClient(config.storageConnectionString, tableName);
};

// Token utilities
export interface DownloadToken {
    partitionKey: string;
    rowKey: string;
    tokenId: string;
    expiresAt: Date;
    maxDownloads: number;
    currentDownloads: number;
    allowedVideos: string; // JSON string or "*" for all
    description?: string;
    createdAt: Date;
    createdBy: string;
}

export interface VideoInfo {
    partitionKey: string;
    rowKey: string;
    videoId: string;
    title: string;
    description?: string;
    fileName: string;
    fileSize: number;
    uploadDate: Date;
    uploadedBy: string;
    downloadCount: number;
}

export interface DownloadUsage {
    partitionKey: string;
    rowKey: string;
    tokenId: string;
    videoId: string;
    downloadedAt: Date;
    ipAddress?: string;
}

// JWT utilities
export const generateAdminToken = (adminId: string): string => {
    return jwt.sign(
        { 
            adminId, 
            role: 'admin',
            iat: Math.floor(Date.now() / 1000)
        },
        config.jwtSecret,
        { expiresIn: '24h' }
    );
};

export const verifyAdminToken = (token: string): { adminId: string; role: string } | null => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        return decoded;
    } catch (error) {
        return null;
    }
};

// Token generation utility
export const generateDownloadToken = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Validation utilities
export const isTokenExpired = (token: DownloadToken): boolean => {
    return new Date() > new Date(token.expiresAt);
};

export const isTokenExhausted = (token: DownloadToken): boolean => {
    return token.currentDownloads >= token.maxDownloads;
};

export const canDownloadVideo = (token: DownloadToken, videoId: string): boolean => {
    if (isTokenExpired(token) || isTokenExhausted(token)) {
        return false;
    }
    
    if (token.allowedVideos === '*') {
        return true;
    }
    
    try {
        const allowedVideos = JSON.parse(token.allowedVideos);
        return allowedVideos.includes(videoId);
    } catch {
        return false;
    }
};

// CORS headers
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

// Error response utility
export const createErrorResponse = (message: string, statusCode: number = 400) => {
    return {
        status: statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ 
            error: message,
            timestamp: new Date().toISOString()
        })
    };
};

// Success response utility
export const createSuccessResponse = (data: any, statusCode: number = 200) => {
    return {
        status: statusCode,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        })
    };
};

// Initialize storage tables
export const initializeStorage = async (context?: any): Promise<void> => {
    try {
        // Create tables if they don't exist
        const tokensTable = createTableClient(config.tokensTableName);
        const usageTable = createTableClient(config.usageTableName);
        const videosTable = createTableClient(config.videosTableName);
        
        await Promise.all([
            tokensTable.createTable().catch(() => {}), // Ignore if already exists
            usageTable.createTable().catch(() => {}),
            videosTable.createTable().catch(() => {})
        ]);
        
        // Create blob container if it doesn't exist
        const blobService = createBlobServiceClient();
        const containerClient = blobService.getContainerClient(config.blobContainerName);
        await containerClient.createIfNotExists({
            access: 'blob'
        });
        
        if (context?.log) {
            context.log('Storage initialization completed');
        }
    } catch (error) {
        if (context?.log) {
            context.log.error('Storage initialization failed:', error);
        }
        throw error;
    }
};
