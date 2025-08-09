# SoccerShare Azure Deployment Script
# This script deploys the infrastructure and application to Azure

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "soccershare-$(Get-Random -Minimum 1000 -Maximum 9999)"
)

# Ensure Azure CLI is installed and user is logged in
Write-Host "Checking Azure CLI installation..." -ForegroundColor Yellow
az version --output table 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

Write-Host "Azure CLI is installed. Checking login status..." -ForegroundColor Yellow
az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please log in to Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to log in to Azure"
        exit 1
    }
}

Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Green
az group create --name $ResourceGroupName --location $Location

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create resource group"
    exit 1
}

Write-Host "Deploying infrastructure using Bicep template..." -ForegroundColor Green
$deploymentOutput = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "infrastructure/main.bicep" `
    --parameters appName=$AppName `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy infrastructure"
    exit 1
}

# Parse deployment outputs
$deployment = $deploymentOutput | ConvertFrom-Json
$functionAppName = $deployment.properties.outputs.functionAppName.value
$functionAppUrl = $deployment.properties.outputs.functionAppUrl.value
$storageAccountName = $deployment.properties.outputs.storageAccountName.value
$staticWebAppUrl = $deployment.properties.outputs.staticWebAppUrl.value

Write-Host "Infrastructure deployed successfully!" -ForegroundColor Green
Write-Host "Function App: $functionAppName" -ForegroundColor Cyan
Write-Host "Function App URL: $functionAppUrl" -ForegroundColor Cyan
Write-Host "Storage Account: $storageAccountName" -ForegroundColor Cyan
Write-Host "Static Web App URL: $staticWebAppUrl" -ForegroundColor Cyan

# Build and deploy Azure Functions
Write-Host "Building and deploying Azure Functions..." -ForegroundColor Green
Set-Location "backend"

# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install npm dependencies"
    exit 1
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build TypeScript"
    exit 1
}

# Deploy to Azure Functions
Write-Host "Deploying to Azure Functions..." -ForegroundColor Yellow
func azure functionapp publish $functionAppName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Azure Functions"
    exit 1
}

Set-Location ".."

# Deploy Static Web App
Write-Host "Deploying frontend to Static Web App..." -ForegroundColor Green

# Create deployment-specific config file (preserving original config.js)
$frontendConfig = @"
// Auto-generated deployment configuration
window.SOCCERSHARE_CONFIG = {
    apiBaseUrl: '$functionAppUrl/api',
    version: '1.0.0',
    deployedAt: '$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")',
    paypalEmail: 'luke01215@gmail.com'
};
"@

$frontendConfig | Out-File -FilePath "frontend/js/deployment-config.js" -Encoding UTF8

Write-Host "⚠️  Important: Update your frontend to load deployment-config.js for API URL" -ForegroundColor Yellow

# Deploy to Static Web App (requires Azure Static Web Apps CLI)
Write-Host "To complete the deployment:" -ForegroundColor Yellow
Write-Host "1. Install Static Web Apps CLI: npm install -g @azure/static-web-apps-cli" -ForegroundColor White
Write-Host "2. Deploy frontend: swa deploy ./frontend --app-name $AppName-frontend" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Alternatively, you can:" -ForegroundColor Yellow
Write-Host "1. Manually upload the frontend folder to the Static Web App through Azure Portal" -ForegroundColor White
Write-Host "2. Set up GitHub Actions for continuous deployment" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "=== DEPLOYMENT SUMMARY ===" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "Function App: $functionAppName" -ForegroundColor White
Write-Host "Function App URL: $functionAppUrl" -ForegroundColor White
Write-Host "Static Web App URL: $staticWebAppUrl" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚠️  CRITICAL: Set environment variables before testing!" -ForegroundColor Red
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Complete the frontend deployment using the instructions above" -ForegroundColor White
Write-Host "2. Set ADMIN_PASSWORD_HASH, JWT_SECRET, AZURE_STORAGE_CONNECTION_STRING in Azure Portal" -ForegroundColor White
Write-Host "3. Test the application by visiting the Static Web App URL" -ForegroundColor White
Write-Host "4. Generate secure tokens through the admin panel" -ForegroundColor White
