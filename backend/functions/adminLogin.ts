import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { corsHeaders, createSuccessResponse, createErrorResponse, generateAdminToken, config } from '../shared/utils';
import bcrypt from 'bcryptjs';

export async function adminLogin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Admin login request received');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return {
            status: 200,
            headers: corsHeaders
        };
    }

    try {
        // Get password from request body
        const requestBody = await request.json() as { password: string };
        
        if (!requestBody || !requestBody.password) {
            return createErrorResponse('Password is required', 400);
        }

        const { password } = requestBody;

        // Get the admin password from environment variables
        const adminPasswordHash = config.adminPassword;
        
        // In production, this should be a hashed password
        // For now, we'll do a simple comparison, but this should be bcrypt.compare()
        let isValidPassword = false;
        
        if (adminPasswordHash.startsWith('$2')) {
            // It's already hashed with bcrypt
            isValidPassword = await bcrypt.compare(password, adminPasswordHash);
        } else {
            // Plain text comparison (only for development)
            isValidPassword = password === adminPasswordHash;
            context.log.warn('WARNING: Using plain text password comparison. Use hashed passwords in production!');
        }

        if (!isValidPassword) {
            context.log.warn('Failed admin login attempt');
            return createErrorResponse('Invalid credentials', 401);
        }

        // Generate JWT token
        const token = generateAdminToken('admin');
        
        context.log('Admin login successful');
        return createSuccessResponse({
            success: true,
            token,
            expiresIn: '24h'
        });

    } catch (error) {
        context.log.error('Admin login error:', error);
        return createErrorResponse('Authentication failed', 500);
    }
}

app.http('adminLogin', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'admin/login',
    handler: adminLogin
});
