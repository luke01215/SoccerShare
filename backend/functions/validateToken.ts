import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { corsHeaders, createSuccessResponse, createErrorResponse } from '../shared/utils';

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

        // For now, use demo validation logic
        // In production, this will query Azure Table Storage
        const demoTokens: Record<string, any> = {
            'demo123': {
                valid: true,
                tokenData: {
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    maxDownloads: 5,
                    currentDownloads: 2,
                    allowedVideos: '*'
                }
            },
            'parent456': {
                valid: true,
                tokenData: {
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    maxDownloads: 3,
                    currentDownloads: 0,
                    allowedVideos: '*'
                }
            }
        };

        const tokenInfo = demoTokens[token];
        
        if (tokenInfo && tokenInfo.valid) {
            return createSuccessResponse({
                valid: true,
                tokenData: tokenInfo.tokenData
            });
        } else {
            return createSuccessResponse({
                valid: false,
                message: 'Invalid or expired token'
            });
        }

    } catch (error) {
        context.log.error('Error validating token:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

app.http('validateToken', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'tokens/validate',
    handler: validateToken
});
