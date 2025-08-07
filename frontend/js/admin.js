// ClipCleats - Admin JavaScript
class ClipCleatsAdmin {
    constructor() {
        // Set API base URL and initialize admin token
        this.apiBaseUrl = window.CLIPCLEATS_UTILS ? window.CLIPCLEATS_UTILS.getApiUrl('') : '/api';
        this.adminToken = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminSession();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Token generation form
        const tokenForm = document.getElementById('tokenGenerationForm');
        if (tokenForm) {
            tokenForm.addEventListener('submit', (e) => this.handleTokenGeneration(e));
        }

        // Video upload form
        const uploadForm = document.getElementById('videoUploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleVideoUpload(e));
        }
    }

    checkAdminSession() {
        const storedToken = localStorage.getItem('clipcleatsAdminToken');
        if (storedToken) {
            this.adminToken = storedToken;
            this.showAdminDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('adminPassword');
        const password = passwordInput.value;

        this.showLoading(true);
        this.hideError();

        try {
            // Simulate admin authentication - replace with actual API call
            const authResult = await this.simulateAdminAuth(password);
            
            if (authResult.success) {
                this.adminToken = authResult.token;
                localStorage.setItem('clipcleatsAdminToken', authResult.token);
                this.showAdminDashboard();
                await this.loadDashboardData();
            } else {
                this.showError('Invalid admin password');
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Production-only authentication - NO DEMO PASSWORDS
    async simulateAdminAuth(password) {
        // This will ONLY work when deployed to Azure with proper backend
        try {
            const response = await fetch(this.apiBaseUrl + '/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            // If backend isn't available, show helpful message
            return { 
                success: false, 
                message: 'Backend authentication not available. Deploy to Azure first.' 
            };
        }
    }

    showAdminDashboard() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
    }

    logout() {
        this.adminToken = null;
        localStorage.removeItem('clipcleatsAdminToken');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('adminPassword').value = '';
    }

    async loadDashboardData() {
        try {
            // Load stats and data
            const [stats, tokens, videos] = await Promise.all([
                this.simulateStatsLoad(),
                this.simulateTokensLoad(),
                this.simulateVideosLoad()
            ]);

            this.updateStats(stats);
            this.displayTokens(tokens);
            this.displayAdminVideos(videos);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Error loading dashboard data');
        }
    }

    // Production API calls - replace simulations after deployment
    async simulateStatsLoad() {
        // TODO: Replace with actual API call to /api/admin/stats
        try {
            const response = await fetch(this.apiBaseUrl + '/admin/stats', {
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Stats API not available yet, using defaults');
        }
        
        // Default values when backend is not ready
        return {
            totalVideos: 0,
            activeTokens: 0,
            totalDownloads: 0
        };
    }

    async simulateTokensLoad() {
        // TODO: Replace with actual API call to /api/admin/tokens
        try {
            const response = await fetch(this.apiBaseUrl + '/admin/tokens', {
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Tokens API not available yet, showing empty list');
        }
        
        // Empty list when backend is not ready
        return [];
    }

    async simulateVideosLoad() {
        // TODO: Replace with actual API call to /api/admin/videos
        try {
            const response = await fetch(this.apiBaseUrl + '/admin/videos', {
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Videos API not available yet, showing empty list');
        }
        
        // Empty list when backend is not ready
        return [];
    }

    updateStats(stats) {
        document.getElementById('totalVideos').textContent = stats.totalVideos;
        document.getElementById('activeTokens').textContent = stats.activeTokens;
        document.getElementById('totalDownloads').textContent = stats.totalDownloads;
    }

    async handleTokenGeneration(e) {
        e.preventDefault();
        
        const expiryDays = parseInt(document.getElementById('tokenExpiry').value);
        const maxDownloads = parseInt(document.getElementById('maxDownloads').value);
        const description = document.getElementById('tokenDescription').value;

        this.showLoading(true);

        try {
            // Simulate token generation - replace with actual API call
            const newToken = await this.simulateTokenGeneration({
                expiryDays,
                maxDownloads,
                description
            });

            this.displayGeneratedToken(newToken);
            document.getElementById('tokenGenerationForm').reset();
            
            // Reload tokens list
            const tokens = await this.simulateTokensLoad();
            this.displayTokens(tokens);
            
        } catch (error) {
            console.error('Token generation error:', error);
            this.showError('Failed to generate token. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async simulateTokenGeneration(params) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate a random token
        const tokenValue = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        
        return {
            value: tokenValue,
            expiresAt: new Date(Date.now() + params.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
            maxDownloads: params.maxDownloads,
            description: params.description || 'No description'
        };
    }

    displayGeneratedToken(token) {
        const tokenDisplay = document.getElementById('generatedToken');
        const tokenValueInput = document.getElementById('newTokenValue');
        
        tokenValueInput.value = token.value;
        tokenDisplay.classList.remove('hidden');

        // Auto-hide after 30 seconds
        setTimeout(() => {
            tokenDisplay.classList.add('hidden');
        }, 30000);
    }

    displayTokens(tokens) {
        const tokensList = document.getElementById('tokensList');
        tokensList.innerHTML = '';

        if (tokens.length === 0) {
            tokensList.innerHTML = '<p style="text-align: center; color: #666;">No tokens generated yet.</p>';
            return;
        }

        tokens.forEach(token => {
            const tokenItem = this.createTokenItem(token);
            tokensList.appendChild(tokenItem);
        });
    }

    createTokenItem(token) {
        const isExpired = new Date(token.expiresAt) < new Date();
        const isExhausted = token.currentDownloads >= token.maxDownloads;
        const status = isExpired ? 'expired' : (isExhausted ? 'exhausted' : 'active');

        const item = document.createElement('div');
        item.className = 'token-item';
        item.innerHTML = `
            <div class="token-details">
                <h5>${token.value}</h5>
                <p><strong>Description:</strong> ${token.description}</p>
                <p><strong>Expires:</strong> ${new Date(token.expiresAt).toLocaleDateString()}</p>
                <p><strong>Downloads:</strong> ${token.currentDownloads} / ${token.maxDownloads === 999 ? 'Unlimited' : token.maxDownloads}</p>
                <p><strong>Created:</strong> ${new Date(token.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="token-status">
                <span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <button class="btn btn-danger btn-sm" onclick="admin.deleteToken('${token.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        return item;
    }

    displayAdminVideos(videos) {
        const videosList = document.getElementById('adminVideosList');
        videosList.innerHTML = '';

        if (videos.length === 0) {
            videosList.innerHTML = '<p style="text-align: center; color: #666;">No videos uploaded yet.</p>';
            return;
        }

        videos.forEach(video => {
            const videoItem = this.createAdminVideoItem(video);
            videosList.appendChild(videoItem);
        });
    }

    createAdminVideoItem(video) {
        const item = document.createElement('div');
        item.className = 'admin-video-item';
        item.innerHTML = `
            <div class="video-details">
                <h5>${video.title}</h5>
                <p><strong>Description:</strong> ${video.description}</p>
                <p><strong>Uploaded:</strong> ${new Date(video.uploadDate).toLocaleDateString()}</p>
                <p><strong>Size:</strong> ${video.fileSize} | <strong>Downloads:</strong> ${video.downloads}</p>
            </div>
            <div class="video-actions">
                <button class="btn btn-danger" onclick="admin.deleteVideo('${video.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        return item;
    }

    async handleVideoUpload(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('videoFile');
        const titleInput = document.getElementById('videoTitle');
        const descriptionInput = document.getElementById('videoDescription');

        if (!fileInput.files[0]) {
            this.showError('Please select a video file');
            return;
        }

        this.showLoading(true);

        try {
            // Simulate video upload - replace with actual Azure Blob Storage upload
            await this.simulateVideoUpload({
                file: fileInput.files[0],
                title: titleInput.value,
                description: descriptionInput.value
            });

            this.showSuccess('Video uploaded successfully!');
            document.getElementById('videoUploadForm').reset();
            
            // Reload videos list
            const videos = await this.simulateVideosLoad();
            this.displayAdminVideos(videos);
            
            // Update stats
            const stats = await this.simulateStatsLoad();
            this.updateStats(stats);
            
        } catch (error) {
            console.error('Video upload error:', error);
            this.showError('Failed to upload video. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async simulateVideoUpload(videoData) {
        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In production, this would upload to Azure Blob Storage
        console.log('Uploading video:', videoData.title, videoData.file.name);
    }

    async deleteToken(tokenId) {
        if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
            return;
        }

        try {
            // Simulate token deletion - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.showSuccess('Token deleted successfully!');
            
            // Reload tokens list
            const tokens = await this.simulateTokensLoad();
            this.displayTokens(tokens);
            
        } catch (error) {
            console.error('Token deletion error:', error);
            this.showError('Failed to delete token.');
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
            return;
        }

        try {
            // Simulate video deletion - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.showSuccess('Video deleted successfully!');
            
            // Reload videos list
            const videos = await this.simulateVideosLoad();
            this.displayAdminVideos(videos);
            
            // Update stats
            const stats = await this.simulateStatsLoad();
            this.updateStats(stats);
            
        } catch (error) {
            console.error('Video deletion error:', error);
            this.showError('Failed to delete video.');
        }
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
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const error = document.getElementById('error');
        error.classList.add('hidden');
    }

    showSuccess(message) {
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
}

// Global function for token copying
function copyToken() {
    const tokenInput = document.getElementById('newTokenValue');
    tokenInput.select();
    document.execCommand('copy');
    
    const button = document.querySelector('.btn-copy');
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.innerHTML = originalHtml;
        button.style.background = '';
    }, 2000);
}

// Initialize the admin app when the page loads
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new ClipCleatsAdmin();
});
