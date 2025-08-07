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
        const adminPasswordHash = config.adminPasswordHash;
        
        // In production, this should be a hashed password
        // Production-only: ONLY bcrypt comparison allowed
        let isValidPassword = false;
        
        if (adminPasswordHash.startsWith('$2')) {
            // It's properly hashed with bcrypt
            isValidPassword = await bcrypt.compare(password, adminPasswordHash);
        } else {
            // SECURITY: Never allow plain text passwords in production
            context.log('ERROR: ADMIN_PASSWORD_HASH must be a bcrypt hash starting with $2. Plain text passwords are not allowed.');
            return createErrorResponse('Invalid server configuration. Admin password must be properly hashed.', 500);
        }

        if (!isValidPassword) {
            context.log('Failed admin login attempt');
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
        context.log('Admin login error:', error);
        return createErrorResponse('Authentication failed', 500);
    }
}

app.http('adminLogin', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'admin/login',
    handler: adminLogin
});
