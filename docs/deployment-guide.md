# SoccerShare Deployment Guide

## Prerequisites

### Required Software
1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Functions Core Tools** - [Install Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
3. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
4. **PowerShell** (for Windows) or **Bash** (for Linux/Mac)

### Azure Requirements
- Active Azure subscription
- Sufficient permissions to create resources
- Resource group (will be created if it doesn't exist)

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/SoccerShare.git
   cd SoccerShare
   ```

2. **Run the deployment script:**
   ```powershell
   # Windows PowerShell
   .\infrastructure\deploy.ps1 -ResourceGroupName "soccershare-rg" -Location "East US"
   ```
   
   ```bash
   # Linux/Mac (coming soon)
   ./infrastructure/deploy.sh soccershare-rg "East US"
   ```

3. **Follow the prompts** and wait for deployment to complete.

### Option 2: Manual Deployment

#### Step 1: Deploy Infrastructure

1. **Login to Azure:**
   ```bash
   az login
   ```

2. **Create resource group:**
   ```bash
   az group create --name soccershare-rg --location "East US"
   ```

3. **Deploy infrastructure:**
   ```bash
   az deployment group create \
     --resource-group soccershare-rg \
     --template-file infrastructure/main.bicep \
     --parameters appName=soccershare-123
   ```

#### Step 2: Deploy Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Deploy to Azure Functions:**
   ```bash
   func azure functionapp publish your-function-app-name
   ```

#### Step 3: Deploy Frontend

1. **Install Static Web Apps CLI:**
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

2. **Deploy frontend:**
   ```bash
   swa deploy ./frontend --app-name your-static-web-app-name
   ```

## Configuration

### Environment Variables

Set these in your Azure Function App settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection string | `DefaultEndpointsProtocol=https;...` |
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key` |
| `ADMIN_PASSWORD` | Admin login password | `SoccerCoach2025!` |

### Storage Configuration

The deployment automatically creates:
- **Blob Container**: `soccer-videos` (for video storage)
- **Tables**: 
  - `DownloadTokens` (token management)
  - `DownloadUsage` (usage tracking)
  - `Videos` (video metadata)

## Post-Deployment Setup

### 1. Test the Application

1. **Visit your Static Web App URL**
2. **Test with demo tokens:**
   - `demo123` (5 downloads, expires in 7 days)
   - `parent456` (3 downloads, expires in 3 days)

### 2. Admin Access

1. **Go to:** `https://your-static-web-app.azurestaticapps.net/admin.html`
2. **Login with:** `SoccerCoach2025!` (or your custom password)
3. **Generate real tokens** for parents

### 3. Upload Videos

1. **Use the admin interface** to upload video files
2. **Videos are stored** in Azure Blob Storage
3. **Thumbnails** (optional) can be generated using Azure Media Services

## Security Considerations

### Production Security Checklist

- [ ] Change default admin password
- [ ] Update JWT secret to a strong, unique value
- [ ] Configure CORS to allow only your domain
- [ ] Enable Azure Function authentication (optional)
- [ ] Set up Azure Key Vault for secrets
- [ ] Configure SSL/TLS certificates
- [ ] Enable Azure Storage firewall rules
- [ ] Set up monitoring and alerts

### Recommended Security Updates

1. **Update admin password:**
   ```bash
   az functionapp config appsettings set \
     --name your-function-app-name \
     --resource-group soccershare-rg \
     --settings ADMIN_PASSWORD="YourSecurePassword123!"
   ```

2. **Update JWT secret:**
   ```bash
   az functionapp config appsettings set \
     --name your-function-app-name \
     --resource-group soccershare-rg \
     --settings JWT_SECRET="your-very-secure-secret-key"
   ```

3. **Configure CORS:**
   ```bash
   az functionapp cors add \
     --name your-function-app-name \
     --resource-group soccershare-rg \
     --allowed-origins https://your-domain.com
   ```

## Monitoring and Maintenance

### Application Insights

Monitor your application using Azure Application Insights:
- Function execution metrics
- Error tracking and debugging
- Performance monitoring
- Custom telemetry

### Cost Monitoring

Set up budget alerts:
```bash
az consumption budget create \
  --account-name your-billing-account \
  --budget-name soccershare-budget \
  --amount 50 \
  --time-grain Monthly \
  --time-period start-date=2025-08-01 end-date=2026-08-01
```

### Backup Strategy

1. **Database backups**: Azure Tables are automatically geo-replicated
2. **Video backups**: Enable blob versioning and soft delete
3. **Configuration backups**: Export ARM templates regularly

## Troubleshooting

### Common Issues

#### 1. Function App Not Starting
```bash
# Check logs
func azure functionapp logstream your-function-app-name

# Common fixes:
# - Check environment variables
# - Verify storage connection string
# - Review package.json dependencies
```

#### 2. CORS Issues
```javascript
// Add to frontend config
const config = {
  apiBaseUrl: 'https://your-function-app.azurewebsites.net/api'
};
```

#### 3. Storage Connection Issues
```bash
# Test storage connection
az storage account show-connection-string \
  --name your-storage-account \
  --resource-group soccershare-rg
```

#### 4. Token Validation Failures
- Check JWT secret configuration
- Verify token expiration settings
- Review token format in database

### Support Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
- [GitHub Issues](https://github.com/your-username/SoccerShare/issues)

## Scaling Considerations

### Performance Optimization

1. **Enable CDN** for static content
2. **Configure blob caching** headers
3. **Implement video compression** before upload
4. **Use Azure Media Services** for video streaming
5. **Enable Function App scaling** settings

### Cost Optimization

1. **Use cool/archive storage** for old videos
2. **Set up lifecycle policies** for automatic archiving
3. **Monitor unused tokens** and clean up regularly
4. **Optimize Function App timeout** settings

## Advanced Features (Future)

- Multi-tenant support
- Video streaming instead of downloads
- Mobile app integration
- Automated video processing
- Email notifications
- Advanced analytics dashboard
