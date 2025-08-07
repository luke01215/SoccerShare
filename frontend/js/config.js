// Configuration for ClipCleats frontend
// This file will be updated during deployment with actual URLs

window.CLIPCLEATS_CONFIG = {
    // API Configuration
    apiBaseUrl: '/api', // Will be replaced with actual Azure Functions URL during deployment
    
    // Application Settings
    appName: 'ClipCleats',
    tagline: 'Your team\'s soccer moments, captured and shared',
    version: '1.0.0',
    
    // Production Settings
    isDevelopment: false,
    
    // Production-only: No demo tokens for security
    demoTokens: {},
    
    // Production-only: No demo videos - all content from Azure Storage
    demoVideos: [],
    
    // UI Configuration
    ui: {
        showLoadingAnimations: true,
        autoHideSuccessMessages: true,
        successMessageDuration: 3000,
        errorMessageDuration: 5000,
        maxVideosPerPage: 10
    },
    
    // File upload limits (for admin)
    upload: {
        maxFileSize: 500 * 1024 * 1024, // 500 MB
        allowedFormats: ['mp4', 'mov', 'avi', 'mkv'],
        chunkSize: 4 * 1024 * 1024 // 4 MB chunks for large file uploads
    },
    
    // Token validation settings
    tokens: {
        minLength: 6,
        maxLength: 20,
        allowedCharacters: 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    },
    
    // Deployment information (will be set during deployment)
    deployment: {
        environment: 'development',
        deployedAt: null,
        buildVersion: null,
        azureRegion: null
    }
};

// Helper functions for configuration
window.CLIPCLEATS_UTILS = {
    // Get the API base URL
    getApiUrl: function(endpoint) {
        const baseUrl = window.CLIPCLEATS_CONFIG.apiBaseUrl;
        return baseUrl + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
    },
    
    // Check if running in development mode
    isDevelopment: function() {
        return window.CLIPCLEATS_CONFIG.isDevelopment || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    },
    
    // Format file size for display
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Format duration for display
    formatDuration: function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    },
    
    // Validate token format
    isValidTokenFormat: function(token) {
        const config = window.CLIPCLEATS_CONFIG.tokens;
        return token.length >= config.minLength && 
               token.length <= config.maxLength &&
               /^[A-Za-z0-9]+$/.test(token);
    },
    
    // Get relative time string (e.g., "2 days ago")
    getRelativeTime: function(date) {
        const now = new Date();
        const diffTime = Math.abs(now - new Date(date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }
};

// Initialize configuration when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('ClipCleats Configuration Loaded', {
        version: window.CLIPCLEATS_CONFIG.version,
        environment: window.CLIPCLEATS_CONFIG.deployment.environment,
        isDevelopment: window.CLIPCLEATS_UTILS.isDevelopment()
    });
    
    // Set page title
    document.title = window.CLIPCLEATS_CONFIG.appName + ' - Soccer Video Sharing';
});
