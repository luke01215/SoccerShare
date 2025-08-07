# ClipCleats Demo Launcher 🚀

## Quick Demo Instructions

### 🎯 **How to Run the Demo:**

1. **Open the demo files in your browser:**
   - Open `demo-index.html` for the parent/user interface
   - Open `demo-admin.html` for the coach/admin interface

2. **Try the Parent Interface (`demo-index.html`):**
   - Use demo tokens: `EAGLES-AUG14`, `LIONS-SEPT2`, or `EXPIRED-TOKEN`
   - See how token validation works
   - Experience the video download interface
   - Test the support modal

3. **Try the Admin Interface (`demo-admin.html`):**
   - Login with password: `demo123`
   - Generate new tokens with different settings
   - View token management dashboard
   - See video management interface
   - Explore the donation section

### 📱 **What You'll See:**

#### **Parent Experience:**
- Clean, soccer-themed interface
- Token entry and validation
- Video list with download buttons
- Token status and expiration warnings
- Support/donation modal

#### **Coach Experience:**
- Admin login with security
- Dashboard with statistics
- Token generation with restrictions
- Token management and monitoring
- Video upload interface (demo)
- Donation/support section

### 💡 **Demo Features Working:**

✅ **Frontend UI** - Complete interface with soccer styling
✅ **Token Validation** - Simulated backend responses
✅ **Admin Dashboard** - Full coach interface
✅ **Token Generation** - Creates demo tokens
✅ **Video Management** - Shows video listing
✅ **Donation System** - PayPal integration preview
✅ **Responsive Design** - Works on mobile and desktop
✅ **Error Handling** - Shows proper error messages

### 🔗 **Demo Flow:**

1. **Start with Parent Interface:**
   ```
   Open: demo-index.html
   Try token: EAGLES-AUG14
   ```

2. **Switch to Admin Interface:**
   ```
   Open: demo-admin.html
   Login: demo123
   Generate a token
   ```

3. **Test Generated Token:**
   ```
   Copy token from admin
   Go back to demo-index.html
   Try the new token
   ```

### 🚀 **After Demo - Next Steps:**

1. **Deploy to Azure** using your `deploy.ps1` script
2. **Set environment variables** (password hash, JWT secret, storage)
3. **Replace PayPal email** in the donation forms
4. **Upload real videos** to Azure Blob Storage
5. **Share with parents** and generate real tokens

### 📁 **Demo Files Created:**

- `demo-index.html` - Parent/user interface demo
- `demo-admin.html` - Coach/admin interface demo
- `DEMO-GUIDE.md` - This instruction file

The demo uses your existing CSS and shows exactly how ClipCleats will work in production, just with simulated data instead of Azure backend calls.

### 🎮 **Quick Start:**

```bash
# Option 1: Open files directly
start demo-index.html
start demo-admin.html

# Option 2: Use a simple web server (if you have Python)
python -m http.server 8000
# Then visit: http://localhost:8000/demo-index.html

# Option 3: Use Node.js simple server (if you have npx)
npx serve .
# Then visit the provided URLs
```

**Enjoy exploring your ClipCleats application!** ⚽💙
