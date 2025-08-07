# ClipCleats Security Guide 🔒

## ⚠️ CRITICAL SECURITY NOTICE

**The current demo version is NOT secure for production use!** 

## 🚨 Current Security Issues

### **Frontend Security Problems:**
1. **Hardcoded passwords in JavaScript** - Anyone can view source code
2. **Client-side only authentication** - No real security
3. **No password hashing** - Passwords stored in plain text
4. **No rate limiting** - Vulnerable to brute force attacks

### **Demo vs Production Authentication:**

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| Password Storage | Frontend JavaScript (INSECURE) | Backend environment variables |
| Password Hashing | None | bcrypt hashing |
| Authentication | Client-side only | Server-side JWT |
| Rate Limiting | None | Implemented |
| HTTPS | Optional | Required |

## 🔒 Proper Security Implementation

### **For Production Deployment:**

#### 1. **Secure Password Setup**
```bash
# Generate a strong password hash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword123!', 10))"

# Set in Azure Function App settings
az functionapp config appsettings set \
  --name your-function-app \
  --resource-group your-rg \
  --settings ADMIN_PASSWORD="$2b$10$HashedPasswordGoesHere"
```

#### 2. **Environment Variables (Azure)**
```bash
# Set secure admin password
ADMIN_PASSWORD="$2b$10$SecureHashedPassword"

# Set JWT secret
JWT_SECRET="very-long-random-secret-key-at-least-32-characters"

# Set other security settings
CORS_ORIGINS="https://yourdomain.com"
RATE_LIMIT_MAX="100"
```

#### 3. **Backend Authentication Flow (Secure)**
```typescript
// Real authentication in backend/functions/adminLogin.ts
export async function adminLogin(request: HttpRequest): Promise<HttpResponseInit> {
    const { password } = await request.json();
    
    // 1. Rate limiting check
    // 2. Password validation with bcrypt
    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
    
    // 3. Generate JWT token
    if (isValid) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return { success: true, token };
    }
    
    return { success: false };
}
```

#### 4. **Frontend Authentication (Secure)**
```javascript
// Real authentication in frontend
async function authenticateAdmin(password) {
    const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    
    return await response.json();
}
```

## 🛡️ Security Checklist for Production

### **Before Deploying:**
- [ ] Remove all hardcoded passwords from frontend
- [ ] Set strong admin password in Azure environment variables
- [ ] Use bcrypt for password hashing
- [ ] Implement JWT authentication
- [ ] Enable HTTPS only
- [ ] Set up CORS properly
- [ ] Implement rate limiting
- [ ] Add login attempt logging
- [ ] Set up Azure Key Vault for secrets
- [ ] Enable Azure Function authentication (optional extra layer)

### **Password Requirements:**
- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Not easily guessable
- Unique to this application

### **Example Strong Passwords:**
```
ClipCleats2025!SecureCoach
Soccer#TeamPass$2025
MyTeam&Videos!Safe123
```

## 🔧 How to Secure Your Deployment

### **Step 1: Generate Secure Password Hash**
```bash
# Install bcryptjs
npm install bcryptjs

# Generate hash (replace with your password)
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword123!', 10))"
```

### **Step 2: Update Azure Settings**
```bash
# Set the hashed password in Azure
az functionapp config appsettings set \
  --name your-clipcleats-app \
  --resource-group clipcleats-rg \
  --settings ADMIN_PASSWORD="$2b$10$YourHashedPasswordHere"
```

### **Step 3: Update Frontend for Production**
Replace the demo authentication with real API calls:

```javascript
// In frontend/js/admin.js - replace simulateAdminAuth with:
async function authenticateAdmin(password) {
    const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
        throw new Error('Authentication failed');
    }
    
    return await response.json();
}
```

## 🚨 Current Demo Passwords

**⚠️ FOR DEMO/TESTING ONLY - REMOVE BEFORE PRODUCTION:**

- `admin123` - Basic demo access
- `clipcleats2025` - ClipCleats themed password
- `coach123` - Simple coach access

**These passwords are visible in the source code and should NEVER be used in production!**

## 📞 Security Support

### **If You Need Help:**
1. Check Azure documentation for Function App security
2. Use Azure Key Vault for sensitive data
3. Consider hiring a security consultant for production deployments
4. Follow OWASP security guidelines

### **Security Best Practices:**
- Never store passwords in frontend code
- Always use HTTPS in production
- Implement proper session management
- Log authentication attempts
- Set up monitoring and alerts
- Regular security updates

---

**Remember: Security is critical when handling team data. Take time to implement proper authentication before going live!** 🔒⚽
