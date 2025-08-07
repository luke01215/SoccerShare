import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { 
    corsHeaders, 
    createSuccessResponse, 
    createErrorResponse, 
    createTableClient, 
    config,
    DownloadToken,
    VideoInfo,
    isTokenExpired,
    isTokenExhausted,
    canDownloadVideo
} from '../shared/utils';

// Helper function to generate expiration warnings
function getExpirationWarning(daysRemaining: number, downloadsRemaining: number): string {
    if (daysRemaining <= 1 && downloadsRemaining <= 1) {
        return "⚠️ Token expires tomorrow OR after 1 more download";
    } else if (daysRemaining <= 1) {
        return `⚠️ Token expires tomorrow (${downloadsRemaining} downloads remaining)`;
    } else if (downloadsRemaining <= 1) {
        return `⚠️ Only 1 download remaining (expires in ${daysRemaining} days)`;
    } else if (daysRemaining <= 3) {
        return `Token expires in ${daysRemaining} days or ${downloadsRemaining} downloads`;
    } else if (downloadsRemaining <= 3) {
        return `Only ${downloadsRemaining} downloads remaining (expires in ${daysRemaining} days)`;
    } else {
        return `${downloadsRemaining} downloads remaining, expires in ${daysRemaining} days`;
    }
}

export async function validateToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Token validation request received');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return {
            status: 200,
            headers: corsHeaders
        };
    }

    try {
        // Get token from request body
        const requestBody = await request.json() as { token: string };
        
        if (!requestBody || !requestBody.token) {
            return createErrorResponse('Token is required', 400);
        }

        const token = requestBody.token.trim();

        // PRODUCTION LOGIC: Query Azure Table Storage
        const tokensTable = createTableClient(config.tokensTableName);
        const videosTable = createTableClient(config.videosTableName);

        try {
            // 1. Look up the token in Azure Table Storage
            const tokenEntity = await tokensTable.getEntity<DownloadToken>('tokens', token);
            
            // 2. CHECK RESTRICTIONS - DUAL EXPIRATION SYSTEM
            
            // Check if token is expired by TIME
            const isTimeExpired = isTokenExpired(tokenEntity);
            
            // Check if token is expired by DOWNLOAD LIMIT
            const isDownloadExpired = isTokenExhausted(tokenEntity);
            
            // Token is invalid if EITHER condition is met
            if (isTimeExpired && isDownloadExpired) {
                return createSuccessResponse({
                    valid: false,
                    message: `Token expired (reached both time limit and ${tokenEntity.maxDownloads} download limit)`,
                    reason: 'BOTH_LIMITS_REACHED'
                });
            } else if (isTimeExpired) {
                return createSuccessResponse({
                    valid: false,
                    message: `Token expired on ${new Date(tokenEntity.expiresAt).toLocaleDateString()}`,
                    reason: 'TIME_EXPIRED'
                });
            } else if (isDownloadExpired) {
                return createSuccessResponse({
                    valid: false,
                    message: `Download limit reached (${tokenEntity.maxDownloads}/${tokenEntity.maxDownloads} downloads used)`,
                    reason: 'DOWNLOAD_LIMIT_REACHED'
                });
            }

            // 3. GET ALLOWED VIDEOS based on token restrictions
            let allowedVideos: VideoInfo[] = [];
            
            if (tokenEntity.allowedVideos === '*') {
                // Token allows access to ALL videos
                const allVideos = videosTable.listEntities<VideoInfo>();
                
                for await (const video of allVideos) {
                    if (video.partitionKey === 'videos') {
                        allowedVideos.push(video);
                    }
                }
            } else {
                // Token restricts to specific videos
                try {
                    const allowedVideoIds = JSON.parse(tokenEntity.allowedVideos);
                    
                    for (const videoId of allowedVideoIds) {
                        try {
                            const video = await videosTable.getEntity<VideoInfo>('videos', videoId);
                            allowedVideos.push(video);
                        } catch (error) {
                            // Video not found, skip it
                            context.log(`Video ${videoId} not found`);
                        }
                    }
                } catch (parseError) {
                    context.log('Failed to parse allowedVideos JSON:', parseError);
                    return createErrorResponse('Invalid token configuration', 500);
                }
            }

            // 4. RETURN SUCCESS with token data and DUAL EXPIRATION INFO
            const daysRemaining = Math.ceil((new Date(tokenEntity.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const downloadsRemaining = tokenEntity.maxDownloads - tokenEntity.currentDownloads;
            
            return createSuccessResponse({
                valid: true,
                tokenData: {
                    tokenId: tokenEntity.tokenId,
                    expiresAt: tokenEntity.expiresAt,
                    maxDownloads: tokenEntity.maxDownloads,
                    currentDownloads: tokenEntity.currentDownloads,
                    downloadsRemaining: downloadsRemaining,
                    daysRemaining: daysRemaining,
                    // Show which limit will be hit first
                    expirationWarning: getExpirationWarning(daysRemaining, downloadsRemaining),
                    allowedVideos: allowedVideos.map(video => ({
                        videoId: video.videoId,
                        title: video.title,
                        description: video.description,
                        fileName: video.fileName,
                        fileSize: video.fileSize,
                        uploadDate: video.uploadDate
                    })),
                    description: tokenEntity.description || 'Download access token'
                }
            });

        } catch (error: any) {
            if (error.statusCode === 404) {
                // Token not found in database
                return createSuccessResponse({
                    valid: false,
                    message: 'Invalid token',
                    reason: 'NOT_FOUND'
                });
            }
            throw error; // Re-throw other errors
        }

    } catch (error) {
        context.log('Error validating token:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

app.http('validateToken', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'tokens/validate',
    handler: validateToken
});
