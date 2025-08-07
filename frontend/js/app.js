// ClipCleats - Main App JavaScript
class ClipCleatsApp {
    constructor() {
        this.apiBaseUrl = window.CLIPCLEATS_UTILS ? window.CLIPCLEATS_UTILS.getApiUrl('') : '/api';
        this.currentToken = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkForStoredToken();
    }

    bindEvents() {
        const tokenForm = document.getElementById('tokenForm');
        if (tokenForm) {
            tokenForm.addEventListener('submit', (e) => this.handleTokenSubmit(e));
        }
    }

    checkForStoredToken() {
        const storedToken = localStorage.getItem('clipcleatsToken');
        if (storedToken) {
            document.getElementById('tokenInput').value = storedToken;
            this.validateToken(storedToken);
        }
    }

    async handleTokenSubmit(e) {
        e.preventDefault();
        const tokenInput = document.getElementById('tokenInput');
        const token = tokenInput.value.trim();
        
        if (!token) {
            this.showError('Please enter a token');
            return;
        }

        await this.validateToken(token);
    }

    async validateToken(token) {
        this.showLoading(true);
        this.hideError();

        try {
            // For now, we'll simulate the API call
            // Replace this with actual API call once backend is deployed
            const response = await this.validateTokenWithBackend(token);
            
            if (response.valid) {
                this.currentToken = token;
                localStorage.setItem('clipcleatsToken', token);
                this.showTokenStatus(response.tokenData);
                await this.loadVideos();
            } else {
                this.showError(response.message || 'Invalid token');
                this.clearTokenData();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.showError('Unable to validate token. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // PRODUCTION TOKEN VALIDATION - Backend API only
    async validateTokenWithBackend(token) {
        try {
            const response = await fetch(this.apiBaseUrl + '/tokens/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                return { valid: false, message: 'Invalid or expired token' };
            }
        } catch (error) {
            console.error('Token validation error:', error);
            return { 
                valid: false, 
                message: 'Unable to validate token. Please ensure ClipCleats backend is deployed to Azure.' 
            };
        }
    }

    showTokenStatus(tokenData) {
        const tokenStatus = document.getElementById('tokenStatus');
        const expiryElement = document.getElementById('tokenExpiry');
        const remainingElement = document.getElementById('downloadsRemaining');

        // Format expiry date
        const expiryDate = new Date(tokenData.expiresAt);
        const now = new Date();
        // Display expiry with dual limits awareness
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Show both time and download limits
        const remaining = tokenData.maxDownloads - tokenData.currentDownloads;
        
        expiryElement.innerHTML = `
            <div class="dual-expiry-display">
                <div class="time-limit">📅 ${daysUntilExpiry > 0 ? `${daysUntilExpiry} day(s)` : 'Expired'} (${expiryDate.toLocaleDateString()})</div>
                <div class="or-divider">OR</div>
                <div class="download-limit">📥 ${remaining} downloads remaining</div>
            </div>
        `;

        // Calculate remaining downloads with progress indication
        const downloadProgress = ((tokenData.maxDownloads - remaining) / tokenData.maxDownloads) * 100;
        remainingElement.innerHTML = tokenData.maxDownloads === 999 
            ? 'Unlimited downloads' 
            : `
                <div class="download-progress-container">
                    <span class="download-count">${remaining}/${tokenData.maxDownloads} downloads left</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${downloadProgress}%"></div>
                    </div>
                </div>
            `;

        // Add warning classes based on limits
        if (remaining <= 1 || daysUntilExpiry <= 1) {
            tokenStatus.classList.add('critical-warning');
        } else if (remaining <= 3 || daysUntilExpiry <= 3) {
            tokenStatus.classList.add('warning');
        }

        tokenStatus.classList.remove('hidden');
    }

    async loadVideos() {
        try {
            // Simulate loading videos - replace with actual API call
            const videos = await this.simulateVideoLoad();
            this.displayVideos(videos);
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showError('Unable to load videos. Please try again.');
        }
    }

    // Temporary simulation - replace with actual API call
    async simulateVideoLoad() {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use demo videos from config if available
        return window.CLIPCLEATS_CONFIG ? window.CLIPCLEATS_CONFIG.demoVideos : [
            {
                id: 'video1',
                title: '🏆 Championship Final vs Thunder Eagles - March 15, 2025',
                description: 'Epic championship match with amazing goals!',
                uploadDate: '2025-03-15',
                fileSize: '245 MB',
                duration: '45 minutes'
            }
        ];
    }

    displayVideos(videos) {
        const videosSection = document.getElementById('videosSection');
        const videosList = document.getElementById('videosList');

        videosList.innerHTML = '';

        videos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            videosList.appendChild(videoCard);
        });

        videosSection.classList.remove('hidden');
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-title">${video.title}</div>
            <div class="video-info">
                <div><i class="fas fa-calendar"></i> ${new Date(video.uploadDate).toLocaleDateString()}</div>
                <div><i class="fas fa-clock"></i> ${video.duration}</div>
                <div><i class="fas fa-file"></i> ${video.fileSize}</div>
            </div>
            ${video.description ? `<div class="video-description">${video.description}</div>` : ''}
            <div class="video-actions">
                <button class="btn btn-primary" onclick="app.downloadVideo('${video.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        return card;
    }

    async downloadVideo(videoId) {
        if (!this.currentToken) {
            this.showError('Please validate your token first');
            return;
        }

        this.showLoading(true);

        try {
            // Simulate download initiation - replace with actual API call
            const downloadUrl = await this.simulateDownloadRequest(videoId);
            
            if (downloadUrl) {
                // Create temporary download link
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `soccer-video-${videoId}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Update token status
                await this.validateToken(this.currentToken);
                
                this.showSuccess('Download started successfully!');
            } else {
                this.showError('Unable to generate download link');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Download failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Temporary simulation - replace with actual API call
    async simulateDownloadRequest(videoId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production, this would return a time-limited SAS URL from Azure Blob Storage
        return `https://example.blob.core.windows.net/videos/${videoId}.mp4?sastoken=simulated`;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        const error = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        error.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const error = document.getElementById('error');
        error.classList.add('hidden');
    }

    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.style.cssText = `
            background: #d4ffd4;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        `;
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    }

    clearTokenData() {
        this.currentToken = null;
        localStorage.removeItem('clipcleatsToken');
        document.getElementById('tokenStatus').classList.add('hidden');
        document.getElementById('videosSection').classList.add('hidden');
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ClipCleatsApp();
});
