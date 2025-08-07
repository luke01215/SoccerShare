import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { 
    corsHeaders, 
    createSuccessResponse, 
    createErrorResponse, 
    createTableClient, 
    config,
    DownloadToken,
    generateDownloadToken,
    verifyAdminToken
} from '../shared/utils';

export async function generateSessionToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Session token generation request received');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return {
            status: 200,
            headers: corsHeaders
        };
    }

    try {
        // Verify admin authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return createErrorResponse('Admin authentication required', 401);
        }

        const adminToken = authHeader.substring(7);
        const adminData = verifyAdminToken(adminToken);
        if (!adminData) {
            return createErrorResponse('Invalid admin token', 401);
        }

        // Get request data
        const requestBody = await request.json() as {
            sessionName: string;
            description?: string;
            videoIds: string[];
            maxDownloads?: number;
            expiryDays?: number;
        };

        if (!requestBody.sessionName || !requestBody.videoIds || requestBody.videoIds.length === 0) {
            return createErrorResponse('Session name and video IDs are required', 400);
        }

        // Generate session-based token
        const sessionCode = generateSessionCode(requestBody.sessionName);
        const expiryDays = requestBody.expiryDays || 7; // Default 1 week
        const maxDownloads = requestBody.maxDownloads || 100; // Default 100 total downloads

        const tokenEntity: DownloadToken = {
            partitionKey: 'tokens',
            rowKey: sessionCode,
            tokenId: sessionCode,
            expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
            maxDownloads: maxDownloads,
            currentDownloads: 0,
            allowedVideos: JSON.stringify(requestBody.videoIds),
            description: requestBody.description || `${requestBody.sessionName} - Session Videos`,
            createdAt: new Date(),
            createdBy: adminData.adminId
        };

        // Save to Azure Table Storage
        const tokensTable = createTableClient(config.tokensTableName);
        await tokensTable.createEntity(tokenEntity);

        return createSuccessResponse({
            success: true,
            sessionToken: {
                code: sessionCode,
                description: tokenEntity.description,
                expiresAt: tokenEntity.expiresAt,
                maxDownloads: tokenEntity.maxDownloads,
                videoCount: requestBody.videoIds.length,
                shareMessage: `New ${requestBody.sessionName} videos available! Use code: ${sessionCode}`
            }
        });

    } catch (error) {
        context.log('Error generating session token:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

// Generate readable session codes
function generateSessionCode(sessionName: string): string {
    const clean = sessionName.toUpperCase()
        .replace(/[^A-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    const date = new Date().toISOString().slice(5, 10).replace('-', ''); // MMDD
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    
    return `${clean}-${date}-${random}`;
}

app.http('generateSessionToken', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'admin/generate-session-token',
    handler: generateSessionToken
});
