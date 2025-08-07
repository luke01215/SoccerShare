# ClipCleats Security Hardening Guide 🔒

## 🚨 **CRITICAL: Protecting Your Secrets**

### ✅ **Current Security (Good!)**
Your ClipCleats app already has solid security foundations:
- Environment variables (not hardcoded)
- bcrypt password hashing
- JWT authentication
- Azure-hosted backend

### 🔒 **ENHANCED SECURITY MEASURES**

## 1. **Azure Key Vault Integration** (Recommended)

Instead of storing secrets in Function App settings, use Azure Key Vault for maximum security:

### Setup Azure Key Vault:
```powershell
# Create Key Vault
az keyvault create --name "clipcleats-secrets" --resource-group "clipcleats-prod" --location "East US"

# Add secrets to Key Vault
az keyvault secret set --vault-name "clipcleats-secrets" --name "AdminPasswordHash" --value "$2b$10$yourHashHere"
az keyvault secret set --vault-name "clipcleats-secrets" --name "JWTSecret" --value "your64CharacterSecret"
az keyvault secret set --vault-name "clipcleats-secrets" --name "StorageConnectionString" --value "DefaultEndpointsProtocol=https;..."

# Grant Function App access to Key Vault
az functionapp identity assign --name "your-function-app" --resource-group "clipcleats-prod"
az keyvault set-policy --name "clipcleats-secrets" --object-id "function-app-identity-id" --secret-permissions get
```

### Update Function App to use Key Vault:
```typescript
// backend/shared/utils.ts - Enhanced with Key Vault
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class SecureConfig {
    private static instance: SecureConfig;
    private secretClient: SecretClient;
    private cache: Map<string, string> = new Map();

    private constructor() {
        const credential = new DefaultAzureCredential();
        this.secretClient = new SecretClient('https://clipcleats-secrets.vault.azure.net/', credential);
    }

    static getInstance(): SecureConfig {
        if (!SecureConfig.instance) {
            SecureConfig.instance = new SecureConfig();
        }
        return SecureConfig.instance;
    }

    async getSecret(secretName: string): Promise<string> {
        // Check cache first (for performance)
        if (this.cache.has(secretName)) {
            return this.cache.get(secretName)!;
        }

        try {
            const secret = await this.secretClient.getSecret(secretName);
            if (secret.value) {
                this.cache.set(secretName, secret.value);
                return secret.value;
            }
            throw new Error(`Secret ${secretName} is empty`);
        } catch (error) {
            throw new Error(`Failed to retrieve secret ${secretName}: ${error}`);
        }
    }

    // Clear cache periodically for security
    clearCache(): void {
        this.cache.clear();
    }
}

// Updated config with Key Vault
export const getSecureConfig = async () => {
    const secureConfig = SecureConfig.getInstance();
    
    return {
        adminPasswordHash: await secureConfig.getSecret('AdminPasswordHash'),
        jwtSecret: await secureConfig.getSecret('JWTSecret'),
        storageConnectionString: await secureConfig.getSecret('StorageConnectionString'),
        // Other non-secret config
        blobContainerName: 'soccer-videos',
        tokensTableName: 'DownloadTokens',
        usageTableName: 'DownloadUsage',
        videosTableName: 'Videos'
    };
};
```

## 2. **Runtime Secret Protection**

### Environment Variable Encryption:
```typescript
// backend/shared/encryption.ts
import * as crypto from 'crypto';

export class RuntimeSecurity {
    private static encryptionKey: Buffer;

    static initializeEncryption() {
        // Use a key derived from multiple sources
        const keyMaterial = process.env.ENCRYPTION_SEED || crypto.randomBytes(32).toString('hex');
        this.encryptionKey = crypto.scryptSync(keyMaterial, 'clipcleats-salt', 32);
    }

    static encryptInMemory(data: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    static decryptInMemory(encryptedData: string): string {
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
```

## 3. **Network Security**

### Update CORS to be Restrictive:
```typescript
// backend/shared/utils.ts - Secure CORS
export const getCorsHeaders = (origin?: string) => {
    // Only allow your specific domain in production
    const allowedOrigins = [
        'https://your-clipcleats-app.azurestaticapps.net',
        'https://clipcleats.yourdomain.com' // If you have a custom domain
    ];
    
    const corsOrigin = allowedOrigins.includes(origin || '') ? origin : 'null';
    
    return {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    };
};
```

## 4. **Deployment Security**

### Secure Deployment Script:
```powershell
# infrastructure/secure-deploy.ps1 - Enhanced Security
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$AdminPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "clipcleats-$(Get-Random -Minimum 10000 -Maximum 99999)"
)

# Generate secure secrets
$JWTSecret = [System.Web.Security.Membership]::GeneratePassword(64, 16)
$EncryptionSeed = [System.Web.Security.Membership]::GeneratePassword(32, 8)

# Convert SecureString to hash
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($AdminPassword))
$PasswordHash = (node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$PlainPassword', 12));")

Write-Host "🔒 Deploying with enhanced security..." -ForegroundColor Green

# Deploy infrastructure with Key Vault
az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "infrastructure/secure-main.bicep" `
    --parameters appName=$AppName adminPasswordHash=$PasswordHash jwtSecret=$JWTSecret encryptionSeed=$EncryptionSeed

# Clear sensitive variables
$PlainPassword = $null
$AdminPassword = $null
[System.GC]::Collect()

Write-Host "✅ Secure deployment completed!" -ForegroundColor Green
```

## 5. **Application-Level Security**

### Rate Limiting:
```typescript
// backend/shared/rateLimiter.ts
export class RateLimiter {
    private static attempts: Map<string, { count: number; resetTime: number }> = new Map();
    
    static checkRateLimit(clientIP: string, maxAttempts: number = 5, windowMinutes: number = 15): boolean {
        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;
        
        const clientData = this.attempts.get(clientIP);
        
        if (!clientData || now > clientData.resetTime) {
            this.attempts.set(clientIP, { count: 1, resetTime: now + windowMs });
            return true;
        }
        
        if (clientData.count >= maxAttempts) {
            return false; // Rate limited
        }
        
        clientData.count++;
        return true;
    }
}

// Use in adminLogin.ts
const clientIP = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
if (!RateLimiter.checkRateLimit(clientIP)) {
    return createErrorResponse('Too many login attempts. Please try again later.', 429);
}
```

## 6. **Data Protection at Rest**

### Encrypt Sensitive Table Storage Data:
```typescript
// backend/shared/dataEncryption.ts
export class TableDataEncryption {
    static encryptSensitiveFields(entity: any): any {
        const encrypted = { ...entity };
        
        // Encrypt sensitive fields
        if (encrypted.description) {
            encrypted.description = RuntimeSecurity.encryptInMemory(encrypted.description);
        }
        
        return encrypted;
    }
    
    static decryptSensitiveFields(entity: any): any {
        const decrypted = { ...entity };
        
        if (decrypted.description) {
            decrypted.description = RuntimeSecurity.decryptInMemory(decrypted.description);
        }
        
        return decrypted;
    }
}
```

## 🛡️ **CRITICAL SECURITY CHECKLIST**

### ✅ **Before Production:**
- [ ] Enable Azure Key Vault for all secrets
- [ ] Set up restrictive CORS policies
- [ ] Enable HTTPS-only mode
- [ ] Configure rate limiting
- [ ] Set up Azure Monitor alerts
- [ ] Enable Azure Security Center
- [ ] Test with security tools (OWASP ZAP)

### ✅ **Ongoing Security:**
- [ ] Rotate JWT secrets monthly
- [ ] Monitor for suspicious login attempts
- [ ] Regular security audits
- [ ] Keep Azure Functions runtime updated
- [ ] Review access logs weekly

## 🚨 **NEVER DO THIS:**
- ❌ Store secrets in Git repositories
- ❌ Log sensitive data (passwords, tokens)
- ❌ Use weak passwords or short JWT secrets
- ❌ Allow CORS from all origins in production
- ❌ Skip HTTPS in any environment
- ❌ Share environment variables in plain text

## ✅ **YOUR DATA IS SECURE WHEN:**
- Secrets are in Azure Key Vault (not environment variables)
- All communication is HTTPS-only
- Rate limiting prevents brute force attacks
- CORS is restricted to your domain only
- Logs don't contain sensitive information
- Regular security monitoring is in place
