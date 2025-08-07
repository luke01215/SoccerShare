import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobSASPermissions } from '@azure/storage-blob';
import { 
    corsHeaders, 
    createSuccessResponse, 
    createErrorResponse, 
    createTableClient, 
    createBlobServiceClient,
    config,
    DownloadToken,
    VideoInfo,
    DownloadUsage,
    isTokenExpired,
    isTokenExhausted,
    canDownloadVideo
} from '../shared/utils';

export async function downloadVideo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Video download request received');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return {
            status: 200,
            headers: corsHeaders
        };
    }

    try {
        // Get request data
        const requestBody = await request.json() as { 
            token: string; 
            videoId: string;
        };
        
        if (!requestBody.token || !requestBody.videoId) {
            return createErrorResponse('Token and video ID are required', 400);
        }

        const token = requestBody.token.trim();
        const videoId = requestBody.videoId.trim();

        // Get Azure clients
        const tokensTable = createTableClient(config.tokensTableName);
        const videosTable = createTableClient(config.videosTableName);
        const usageTable = createTableClient(config.usageTableName);
        const blobService = createBlobServiceClient();

        try {
            // 1. Validate token and check DUAL EXPIRATION
            const tokenEntity = await tokensTable.getEntity<DownloadToken>('tokens', token);
            
            // Check both time and download limits
            const isTimeExpired = isTokenExpired(tokenEntity);
            const isDownloadExpired = isTokenExhausted(tokenEntity);
            
            if (isTimeExpired || isDownloadExpired) {
                let message = 'Token has expired';
                if (isTimeExpired && isDownloadExpired) {
                    message = 'Token expired (both time limit and download limit reached)';
                } else if (isTimeExpired) {
                    message = `Token expired on ${new Date(tokenEntity.expiresAt).toLocaleDateString()}`;
                } else {
                    message = `Download limit reached (${tokenEntity.maxDownloads} downloads used)`;
                }
                
                return createErrorResponse(message, 403);
            }

            // 2. Check if token allows this specific video
            if (!canDownloadVideo(tokenEntity, videoId)) {
                return createErrorResponse('This video is not available with your token', 403);
            }

            // 3. Get video information
            const video = await videosTable.getEntity<VideoInfo>('videos', videoId);

            // 4. Generate time-limited download URL (15 minutes)
            const containerClient = blobService.getContainerClient(config.blobContainerName);
            const blobClient = containerClient.getBlobClient(video.fileName);
            
            // Generate SAS URL with read-only access
            const permissions = new BlobSASPermissions();
            permissions.read = true;
            
            const sasUrl = await blobClient.generateSasUrl({
                permissions: permissions,
                expiresOn: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            });

            // 5. UPDATE TOKEN USAGE (increment download count)
            const updatedToken = {
                ...tokenEntity,
                currentDownloads: tokenEntity.currentDownloads + 1
            };
            
            await tokensTable.updateEntity(updatedToken);

            // 6. LOG THE DOWNLOAD for analytics
            const downloadRecord: DownloadUsage = {
                partitionKey: 'usage',
                rowKey: `${token}-${videoId}-${Date.now()}`,
                tokenId: token,
                videoId: videoId,
                downloadedAt: new Date(),
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            };
            
            await usageTable.createEntity(downloadRecord);

            // 7. UPDATE VIDEO DOWNLOAD COUNT
            const updatedVideo = {
                ...video,
                downloadCount: (video.downloadCount || 0) + 1
            };
            await videosTable.updateEntity(updatedVideo);

            // 8. RETURN DOWNLOAD URL with updated token status
            const downloadsRemaining = updatedToken.maxDownloads - updatedToken.currentDownloads;
            const daysRemaining = Math.ceil((new Date(updatedToken.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            return createSuccessResponse({
                downloadUrl: sasUrl,
                videoTitle: video.title,
                fileSize: video.fileSize,
                expiresInMinutes: 15,
                tokenStatus: {
                    downloadsRemaining: downloadsRemaining,
                    daysRemaining: daysRemaining,
                    warning: downloadsRemaining <= 1 ? '⚠️ This was your last download!' : 
                             daysRemaining <= 1 ? '⚠️ Token expires tomorrow!' : 
                             downloadsRemaining <= 3 ? `Only ${downloadsRemaining} downloads left` : null
                }
            });

        } catch (error: any) {
            if (error.statusCode === 404) {
                return createErrorResponse('Token or video not found', 404);
            }
            throw error;
        }

    } catch (error) {
        context.log('Error processing download:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

app.http('downloadVideo', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'videos/download',
    handler: downloadVideo
});
