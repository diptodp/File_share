# ☕ Coffee-Powered File Share 🚀

A secure, temporary file sharing system built with lots of coffee and sleepless nights! Upload files, get unique 6-digit codes, and share them securely. Files are automatically deleted after 5 minutes for security.

> ✨ Brewing up secure file sharing, one upload at a time ✨

## ✨ Features

- **Easy Upload**: Drag & drop or browse to upload files (max 15MB)
- **Unique Codes**: Each file gets a unique 6-digit code for sharing
- **Auto-Expiry**: Files automatically delete after 5 minutes
- **Real-time Timer**: Countdown showing remaining time
- **Progress Tracking**: Upload progress indicator
- **Responsive Design**: Works on desktop and mobile
- **No Compression**: Files are stored and served in original format
- **Security**: Basic protection against code guessing
- **Coffee Theme**: Built with lots of coffee and good vibes ☕

## 🛠 Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **File Upload**: Multer middleware
- **Storage**: Local file system with automatic cleanup

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   ```
   http://localhost:3000
   ```

### Deploy to Vercel ☕

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts and enjoy your coffee while it deploys!**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/coffee-file-share)

## 📖 How to Use

### Upload a File
1. Visit the homepage
2. Drag & drop a file or click to browse
3. Wait for upload to complete
4. Copy the 6-digit code shown
5. Share the code with others

### Download a File
1. Enter the 6-digit code in the download section
2. Click "Check Code" to verify the file exists
3. Click "Download File" to download the original file
4. File will download in its exact original format

## 🔧 API Endpoints

- `POST /api/upload` - Upload a file
- `GET /api/file/:code` - Get file information by code
- `GET /api/download/:code` - Download file by code

## 🔒 Security Features

- File size validation (15MB maximum)
- Automatic file expiration (5 minutes)
- Unique code generation with collision prevention
- Input sanitization and validation
- CORS enabled for cross-origin requests

## 📁 Project Structure

```
file-share/
├── server.js          # Express server and API endpoints
├── package.json       # Dependencies and scripts
├── public/            # Frontend files
│   ├── index.html     # Main HTML page
│   ├── styles.css     # CSS styling
│   └── script.js      # Frontend JavaScript
├── uploads/           # Temporary file storage (auto-created)
└── README.md          # This file
```

## ⚙️ Configuration

- **Port**: Default 3000 (set PORT environment variable to change)
- **Max File Size**: 15MB (configurable in server.js)
- **Expiry Time**: 5 minutes (configurable in server.js)
- **Cleanup Interval**: 30 seconds (configurable in server.js)

## 🧪 Testing

The system includes:
- File upload with progress tracking
- Unique code generation and validation
- Automatic file expiration and cleanup
- Error handling for various scenarios
- Responsive UI for different screen sizes

## 📝 Important Notes

### Serverless Storage Behavior
- **Vercel Serverless Functions**: Each function call may use a different instance
- **Cross-Device Access**: Files uploaded from one device can be accessed from any other device
- **Persistent Storage**: Uses enhanced global storage with instance tracking
- **Auto-Cleanup**: Files automatically expire after 5 minutes regardless of access pattern

### Storage Architecture
- Files are stored in memory with enhanced persistence across function instances
- Each storage instance has a unique ID for debugging
- Automatic cleanup runs before each operation
- No user authentication required - designed for quick, temporary sharing

### Debugging
- Visit `/api/debug` to check storage state and instance information
- Health check at `/api/health` shows active files and cleanup status

## 🔄 Development

To run in development mode:
```bash
npm run dev
```

The server will restart automatically when files change (if using nodemon).

## 🚨 Important Security Notes

- This is designed for temporary file sharing only
- Files are automatically deleted after 5 minutes
- Do not use for sensitive or permanent file storage
- The system is designed for local/trusted network use
- Consider additional security measures for production deployment
