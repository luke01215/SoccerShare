# SoccerShare User Guide

## For Parents - How to Download Videos

### Step 1: Get Your Download Token
Your coach or team admin will provide you with a download token. This is a unique code that looks like `demo123` or `parent456`.

### Step 2: Access the SoccerShare Website
1. Go to the SoccerShare website (URL provided by your coach)
2. You'll see a simple form asking for your download token

### Step 3: Enter Your Token
1. Type or paste your download token into the text box
2. Click "Validate Token"
3. If successful, you'll see:
   - How many downloads you have remaining
   - When your token expires
   - Available videos to download

### Step 4: Download Videos
1. Browse the available videos
2. Click the "Download" button next to any video you want
3. The video will start downloading to your device
4. Your remaining download count will update automatically

### Important Notes
- **Download Limit**: Each token has a limited number of downloads
- **Expiration**: Tokens expire after a certain time period
- **File Size**: Videos can be large (100-500 MB) - ensure you have enough storage space
- **Internet**: Large downloads work best on WiFi

### Troubleshooting

#### "Invalid Token" Error
- Double-check you typed the token correctly
- Ask your coach if the token has expired
- Make sure there are no extra spaces

#### Download Doesn't Start
- Check your internet connection
- Ensure you have enough storage space
- Try using a different browser
- Contact your coach for help

#### Video Won't Play
- Most modern devices can play MP4 videos
- Try a different video player app
- Make sure the download completed fully

---

## For Coaches/Admins - How to Manage Videos

### Getting Started
1. Go to the admin page: `your-website.com/admin.html`
2. Enter your admin password (provided during setup)
3. You'll see the admin dashboard with statistics and management tools

### Dashboard Overview
The dashboard shows:
- **Total Videos**: Number of videos uploaded
- **Active Tokens**: Currently valid download tokens
- **Total Downloads**: How many times videos have been downloaded

### Managing Download Tokens

#### Creating a New Token
1. Scroll to "Generate Download Token" section
2. Choose settings:
   - **Expires In**: How long the token will be valid (1 day to 1 month)
   - **Max Downloads**: How many times the token can be used (1 to unlimited)
   - **Description**: Optional note about who the token is for
3. Click "Generate Token"
4. **Copy the generated token** and share it with parents

#### Token Best Practices
- **For single families**: 3-5 downloads, 1-2 weeks expiration
- **For team groups**: 10+ downloads, 2-4 weeks expiration
- **For special events**: Unlimited downloads, shorter expiration
- **Always add descriptions** to track which tokens are for whom

#### Managing Existing Tokens
- View all tokens in the "Token Management" section
- See how many downloads have been used
- Delete tokens that are no longer needed
- Monitor expiration dates

### Managing Videos

#### Uploading New Videos
1. Go to "Video Management" section
2. Click "Select Video File" and choose your video
3. Enter a descriptive title (e.g., "Game vs Eagles - March 15")
4. Add optional description with details
5. Click "Upload Video"
6. Wait for upload to complete (may take several minutes for large files)

#### Video Tips
- **File formats**: MP4 works best for compatibility
- **File size**: Compress videos if they're over 500 MB
- **Naming**: Use clear, descriptive titles with dates
- **Quality**: Balance file size vs. video quality

#### Managing Existing Videos
- View all uploaded videos in the admin interface
- See download statistics for each video
- Delete old or unwanted videos to save storage space

### Security and Privacy

#### Keeping Your Admin Account Secure
- Don't share your admin password
- Log out when finished
- Access admin panel only from trusted devices
- Change password if you suspect it's been compromised

#### Token Security
- Only share tokens with intended recipients
- Delete unused tokens regularly
- Monitor download usage for unusual activity
- Set appropriate expiration dates

### Understanding Usage Analytics

The dashboard provides insights into:
- **Most popular videos**: Which games/events parents download most
- **Download patterns**: When parents are most active
- **Token usage**: Which tokens are being used effectively
- **Storage usage**: How much space your videos are using

### Common Admin Tasks

#### Weekly Routine
1. Upload new game/practice videos
2. Generate tokens for new parents or events
3. Check and clean up expired tokens
4. Review download statistics

#### Monthly Routine
1. Delete old videos to manage storage costs
2. Review overall usage patterns
3. Update admin password if needed
4. Check Azure costs and usage

### Troubleshooting

#### Upload Fails
- Check your internet connection
- Ensure video file isn't corrupted
- Try a smaller file size
- Contact technical support if issues persist

#### Can't Generate Tokens
- Refresh the page and try again
- Log out and log back in
- Check that you're still connected to the internet

#### Parents Can't Download
- Verify the token hasn't expired
- Check that downloads aren't exhausted
- Make sure you shared the correct token
- Test the token yourself first

### Getting Help

#### Technical Issues
- Check the deployment guide for troubleshooting steps
- Review Azure portal for error messages
- Contact your technical administrator

#### Feature Requests
- Document what additional features would be helpful
- Consider the cost implications of new features
- Discuss with other coaches about common needs

---

## Technical Details (For Advanced Users)

### Browser Compatibility
- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: Works on most modern smartphones and tablets
- **JavaScript**: Must be enabled for the application to work

### Storage Requirements
- **For Parents**: Ensure adequate device storage for video downloads
- **For Admins**: Azure storage costs increase with more videos

### Performance Tips
- **WiFi recommended** for uploading and downloading large videos
- **Clear browser cache** if experiencing issues
- **Use modern browsers** for best performance

### Privacy and Data
- Videos are stored securely in Microsoft Azure
- Download tokens don't contain personal information
- No user accounts or personal data are stored
- Videos are only accessible with valid tokens
