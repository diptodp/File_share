class FileShareApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.timers = new Map();
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadProgress = document.getElementById('upload-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.uploadResult = document.getElementById('upload-result');
        this.sharingCode = document.getElementById('sharing-code');
        this.uploadedFilename = document.getElementById('uploaded-filename');
        this.uploadedFilesize = document.getElementById('uploaded-filesize');
        this.uploadTimer = document.getElementById('upload-timer');
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        this.uploadAnotherBtn = document.getElementById('upload-another-btn');

        // Download elements
        this.codeInput = document.getElementById('code-input');
        this.checkCodeBtn = document.getElementById('check-code-btn');
        this.downloadResult = document.getElementById('download-result');
        this.downloadError = document.getElementById('download-error');
        this.downloadFilename = document.getElementById('download-filename');
        this.downloadFilesize = document.getElementById('download-filesize');
        this.downloadTimer = document.getElementById('download-timer');
        this.downloadBtn = document.getElementById('download-btn');
        this.checkAnotherBtn = document.getElementById('check-another-btn');
        this.tryAgainBtn = document.getElementById('try-again-btn');
        this.errorText = document.getElementById('error-text');

        // Toast
        this.toast = document.getElementById('toast');
    }

    attachEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input change
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Button events
        this.copyCodeBtn.addEventListener('click', this.copyCode.bind(this));
        this.uploadAnotherBtn.addEventListener('click', this.resetUpload.bind(this));
        this.checkCodeBtn.addEventListener('click', this.checkCode.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadFile.bind(this));
        this.checkAnotherBtn.addEventListener('click', this.resetDownload.bind(this));
        this.tryAgainBtn.addEventListener('click', this.resetDownload.bind(this));

        // Code input events
        this.codeInput.addEventListener('input', this.formatCodeInput.bind(this));
        this.codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkCode();
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.uploadFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.uploadFile(file);
        }
    }

    formatCodeInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
    }

    async uploadFile(file) {
        // Validate file size
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (file.size > maxSize) {
            this.showToast('File size exceeds 15MB limit', 'error');
            return;
        }

        // Show progress
        this.uploadProgress.style.display = 'block';
        this.uploadResult.style.display = 'none';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.progressFill.style.width = percentComplete + '%';
                    this.progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    this.handleUploadSuccess(response);
                } else {
                    const error = JSON.parse(xhr.responseText);
                    this.showToast(error.error || 'Upload failed', 'error');
                    this.uploadProgress.style.display = 'none';
                }
            });

            xhr.addEventListener('error', () => {
                this.showToast('Upload failed', 'error');
                this.uploadProgress.style.display = 'none';
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed', 'error');
            this.uploadProgress.style.display = 'none';
        }
    }

    handleUploadSuccess(response) {
        this.uploadProgress.style.display = 'none';
        this.uploadResult.style.display = 'block';
        
        this.sharingCode.textContent = response.code;
        this.uploadedFilename.textContent = response.filename;
        this.uploadedFilesize.textContent = this.formatFileSize(response.size);
        
        // Start countdown timer
        this.startTimer(response.expiresAt, this.uploadTimer, response.code);

        this.showToast('☕ File brewed and ready to share!');
    }

    async checkCode() {
        const code = this.codeInput.value.trim();
        
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            this.showToast('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/file/${code}`);
            const data = await response.json();

            if (response.ok) {
                this.handleCodeSuccess(data);
            } else {
                this.handleCodeError(data.error);
            }
        } catch (error) {
            console.error('Check code error:', error);
            this.handleCodeError('Failed to check code');
        }
    }

    handleCodeSuccess(data) {
        this.downloadError.style.display = 'none';
        this.downloadResult.style.display = 'block';
        
        this.downloadFilename.textContent = data.filename;
        this.downloadFilesize.textContent = this.formatFileSize(data.size);
        
        // Start countdown timer
        this.startTimer(data.expiresAt, this.downloadTimer, data.code);
        
        // Store code for download
        this.downloadBtn.dataset.code = data.code;
    }

    handleCodeError(error) {
        this.downloadResult.style.display = 'none';
        this.downloadError.style.display = 'block';
        this.errorText.textContent = error;
    }

    downloadFile() {
        const code = this.downloadBtn.dataset.code;
        if (code) {
            window.open(`/api/download/${code}`, '_blank');
        }
    }

    startTimer(expiresAt, timerElement, code) {
        // Clear existing timer if any
        if (this.timers.has(code)) {
            clearInterval(this.timers.get(code));
        }

        const updateTimer = () => {
            const now = Date.now();
            const timeRemaining = expiresAt - now;

            if (timeRemaining <= 0) {
                timerElement.textContent = 'Expired';
                clearInterval(this.timers.get(code));
                this.timers.delete(code);
                return;
            }

            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        this.timers.set(code, intervalId);
    }

    copyCode() {
        const code = this.sharingCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('☕ Code copied! Time to share the brew!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('☕ Code copied! Time to share the brew!');
        });
    }

    resetUpload() {
        this.uploadResult.style.display = 'none';
        this.uploadProgress.style.display = 'none';
        this.fileInput.value = '';
    }

    resetDownload() {
        this.downloadResult.style.display = 'none';
        this.downloadError.style.display = 'none';
        this.codeInput.value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.style.display = 'block';
        
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FileShareApp();
});
