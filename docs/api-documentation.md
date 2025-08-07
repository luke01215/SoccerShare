# SoccerShare API Documentation

## Overview
The SoccerShare API provides endpoints for managing soccer video downloads through a token-based system.

## Base URL
```
https://your-function-app-name.azurewebsites.net/api
```

## Authentication
- **Admin endpoints**: Require JWT token in Authorization header
- **User endpoints**: Require valid download token

## Endpoints

### Admin Authentication

#### POST /admin/login
Authenticate admin user and receive JWT token.

**Request Body:**
```json
{
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "expiresIn": "24h"
}
```

### Token Management

#### POST /admin/tokens (Admin)
Generate a new download token.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "expiryDays": 7,
  "maxDownloads": 5,
  "description": "Parents from Saturday game",
  "allowedVideos": "*"
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "tokenId": "abc123def456",
    "expiresAt": "2025-08-13T00:00:00Z",
    "maxDownloads": 5,
    "description": "Parents from Saturday game"
  }
}
```

#### GET /admin/tokens (Admin)
List all generated tokens.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "tokens": [
    {
      "tokenId": "abc123",
      "expiresAt": "2025-08-13T00:00:00Z",
      "maxDownloads": 5,
      "currentDownloads": 2,
      "description": "Parents from Saturday game",
      "createdAt": "2025-08-06T00:00:00Z"
    }
  ]
}
```

#### DELETE /admin/tokens/{tokenId} (Admin)
Delete a specific token.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token deleted successfully"
}
```

### Token Validation

#### POST /tokens/validate
Validate a download token.

**Request Body:**
```json
{
  "token": "abc123def456"
}
```

**Response:**
```json
{
  "valid": true,
  "tokenData": {
    "expiresAt": "2025-08-13T00:00:00Z",
    "maxDownloads": 5,
    "currentDownloads": 2,
    "allowedVideos": "*"
  }
}
```

### Video Management

#### GET /videos
List available videos (requires valid token).

**Headers:**
```
X-Download-Token: <download_token>
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "videoId": "video1",
      "title": "Game vs Thunder Eagles - March 15, 2025",
      "description": "Full game footage",
      "uploadDate": "2025-03-15T00:00:00Z",
      "fileSize": 256840960,
      "duration": "45:30"
    }
  ]
}
```

#### POST /admin/videos (Admin)
Upload a new video.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `video`: Video file
- `title`: Video title
- `description`: Video description (optional)

**Response:**
```json
{
  "success": true,
  "video": {
    "videoId": "video123",
    "title": "Game vs Thunder Eagles",
    "uploadDate": "2025-08-06T00:00:00Z"
  }
}
```

#### GET /admin/videos (Admin)
List all videos with admin details.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "videoId": "video1",
      "title": "Game vs Thunder Eagles",
      "description": "Full game footage",
      "uploadDate": "2025-03-15T00:00:00Z",
      "fileSize": 256840960,
      "downloadCount": 15,
      "uploadedBy": "admin"
    }
  ]
}
```

#### DELETE /admin/videos/{videoId} (Admin)
Delete a video.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

### Download Management

#### POST /downloads/initiate
Initiate a video download.

**Headers:**
```
X-Download-Token: <download_token>
```

**Request Body:**
```json
{
  "videoId": "video1"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://storage.blob.core.windows.net/videos/video1.mp4?sv=...",
  "expiresIn": 3600,
  "remainingDownloads": 4
}
```

### Analytics

#### GET /admin/analytics (Admin)
Get download analytics.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalVideos": 8,
    "activeTokens": 12,
    "totalDownloads": 47,
    "downloadsToday": 5,
    "popularVideos": [
      {
        "videoId": "video1",
        "title": "Game vs Thunder Eagles",
        "downloadCount": 15
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-06T12:00:00Z"
}
```

### Common Error Codes
- `INVALID_TOKEN`: Token is invalid or expired
- `TOKEN_EXHAUSTED`: Token has reached download limit
- `UNAUTHORIZED`: Admin authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `STORAGE_ERROR`: Storage operation failed

## Rate Limiting
- Admin endpoints: 100 requests per minute
- User endpoints: 20 requests per minute
- Download endpoints: 5 requests per minute

## CORS
CORS is enabled for all origins in development. In production, configure allowed origins in the Azure Function App settings.
