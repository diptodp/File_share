# ☕ Vercel Deployment Guide

This guide will help you deploy your Coffee-Powered File Share to Vercel in just a few minutes!

## 🚀 Quick Deploy

### Option 1: One-Click Deploy
Click the button below to deploy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/coffee-file-share)

### Option 2: Manual Deploy

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? `coffee-file-share` (or your preferred name)
   - In which directory is your code located? `./`

5. **Grab a coffee while it deploys! ☕**

## 📁 Project Structure for Vercel

```
coffee-file-share/
├── api/
│   └── index.js          # Serverless API functions
├── public/
│   ├── index.html        # Frontend
│   ├── styles.css        # Coffee-themed styling
│   └── script.js         # Frontend logic
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── README.md
```

## ⚙️ Configuration

The `vercel.json` file is already configured for you:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

## 🔧 Environment Variables

No environment variables are required for basic functionality. The app works out of the box!

## 📝 Important Notes for Vercel Deployment

### File Storage Limitations
- **Vercel doesn't support persistent file storage** in serverless functions
- Files are stored **in memory** and will be lost when the function goes cold
- This is perfect for temporary file sharing (5-minute expiry)
- For production with longer retention, consider using:
  - AWS S3
  - Google Cloud Storage
  - Cloudinary
  - Or any other cloud storage service

### Memory Limitations
- Vercel has memory limits for serverless functions
- Current setup supports files up to 15MB
- Multiple large files may cause memory issues
- Consider implementing cleanup strategies for production

### Function Timeout
- Vercel functions have execution time limits
- Current configuration allows 30 seconds max
- Large file uploads may timeout on slow connections

## 🚀 After Deployment

1. **Test the deployment:**
   - Visit your Vercel URL
   - Try uploading a small file
   - Test the download functionality
   - Verify the 5-minute expiry works

2. **Custom Domain (Optional):**
   ```bash
   vercel --prod
   vercel domains add yourdomain.com
   ```

3. **Monitor your deployment:**
   - Check Vercel dashboard for function logs
   - Monitor memory usage
   - Watch for any timeout issues

## 🐛 Troubleshooting

### Common Issues:

1. **Function Timeout**
   - Reduce max file size
   - Optimize upload handling
   - Check network connection

2. **Memory Issues**
   - Clear expired files more frequently
   - Reduce concurrent uploads
   - Consider external storage

3. **CORS Issues**
   - Verify API routes are working
   - Check browser console for errors
   - Ensure proper headers are set

### Debug Commands:
```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Redeploy
vercel --prod
```

## ☕ Coffee Break Tips

- Deployment usually takes 1-2 minutes (perfect for a quick coffee break!)
- Vercel automatically handles HTTPS and CDN
- Your app will be available globally with fast loading times
- Free tier includes generous limits for personal projects

## 🎉 Success!

Once deployed, your Coffee-Powered File Share will be available at:
`https://your-project-name.vercel.app`

Share the link and start sharing files with the world! ☕🚀

---

*Built with lots of coffee and powered by Vercel's amazing platform!*
