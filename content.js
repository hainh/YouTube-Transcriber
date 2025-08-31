class YouTubeTranscriptExtractor {
    constructor() {
        this.isActive = false;
        this.transcriptPanel = null;
        this.init();
    }

    init() {
        this.addTranscriptButton();
        
        this.observeURLChanges();
    }

    addTranscriptButton() {
        // Đợi YouTube UI load xong
        const checkForControls = setInterval(() => {
            const controls = document.querySelector('.ytp-chrome-bottom .ytp-chrome-controls .ytp-left-controls');
            
            if (controls && !document.getElementById('transcript-extractor-btn')) {
                this.createTranscriptButton(controls);
                clearInterval(checkForControls);
            }
        }, 1000);
    }

    setButtonStyles(button) {
        button.style.width = '48px';
        button.style.height = '48px';
        button.style.fontSize = '18px';
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.opacity = '0.8';
    }

    createTranscriptButton(controls) {
        const button = document.createElement('button');
        button.id = 'transcript-extractor-btn';
        button.className = 'ytp-button transcript-btn';
        button.innerHTML = '📝';
        button.title = 'Lấy Transcript';
        // Thêm class và style
        button.classList.add('transcript-extractor-btn');
        this.setButtonStyles(button);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTranscript();
        });

        // Thêm hover effect
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });

        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.8';
        });

        controls.appendChild(button);
    }

    async toggleTranscript() {
        if (this.transcriptPanel) {
            this.closeTranscriptPanel();
        } else {
            await this.openTranscriptPanel();
        }
    }

    async openTranscriptPanel() {
        try {
            const transcript = await this.getTranscript();
            this.createTranscriptPanel(transcript);
        } catch (error) {
            this.showError('Không thể lấy transcript: ' + error.message);
        }
    }

    async getTranscript() {
        try {
            const videoId = this.extractVideoId();
            if (!videoId) throw new Error('Not found Video ID');

            // Thử tìm transcript button trên trang
            const transcriptButton = await this.findTranscriptButton();
            if (transcriptButton) {
                return await this.extractTranscriptFromPage();
            }

            throw new Error('This Video has no subtitle/transcript');
        } catch (error) {
            throw error;
        }
    }

    extractVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    async findTranscriptButton() {
        return new Promise((resolve) => {
            // Tìm nút "Show transcript" trong menu
            const checkTranscript = () => {
                // Mở menu actions nếu cần
                const menuButton = document.querySelector('button[aria-label*="More actions"], button[aria-label*="Thêm"]');
                if (menuButton && !document.querySelector('[aria-label*="transcript"], [aria-label*="phụ đề"]')) {
                    menuButton.click();
                    
                    setTimeout(() => {
                        const transcriptBtn = document.querySelector('[aria-label*="transcript"], [aria-label*="phụ đề"], [aria-label*="Show transcript"]');
                        resolve(transcriptBtn);
                    }, 500);
                } else {
                    const transcriptBtn = document.querySelector('[aria-label*="transcript"], [aria-label*="phụ đề"], [aria-label*="Show transcript"]');
                    resolve(transcriptBtn);
                }
            };

            checkTranscript();
        });
    }

    async extractTranscriptFromPage() {
        return new Promise((resolve, reject) => {
            // Tìm và click nút transcript
            const transcriptButton = document.querySelector('[aria-label*="transcript"], [aria-label*="phụ đề"], [aria-label*="Show transcript"]');
            
            if (transcriptButton) {
                transcriptButton.click();
                
                // Đợi transcript panel xuất hiện
                setTimeout(() => {
                    const transcriptContainer = document.querySelector('#segments-container, ytd-transcript-segment-list-renderer');
                    
                    if (transcriptContainer) {
                        const segments = transcriptContainer.querySelectorAll('ytd-transcript-segment-renderer');
                        let transcript = '';
                        
                        segments.forEach((segment, index) => {
                            const text = segment ? segment.innerText.trim() : '';
                            
                            if (text) {
                                transcript += `${text.replaceAll(/\s+/g, ' ')}\n`;
                            }
                        });
                        
                        resolve(transcript || 'Cannot extract transcript content');
                    } else {
                        reject(new Error('Not found transcript container'));
                    }
                }, 2000);
            } else {
                reject(new Error('Cannot find transcript button'));
            }
        });
    }

    createTranscriptPanel(transcript) {
        // Tạo overlay
        const overlay = document.createElement('div');
        overlay.id = 'transcript-overlay';
        this.setOverlayStyles(overlay);

        // Tạo panel
        const panel = document.createElement('div');
        this.setPanelStyles(panel);

        // Header
        const header = document.createElement('div');
        this.setHeaderStyles(header);

        header.innerHTML = `
            <span>📝 YouTube Transcript</span>
            <div>
                <button id="copy-transcript" class="transcript-header-btn">Copy</button>
                <button id="copy-transcript-2" class="transcript-header-btn">Copy without Timestamp</button>
                <button id="copy-transcript-3" class="transcript-header-btn">Download without Timestamp</button>
                <button id="close-transcript" class="transcript-header-btn">✕</button>
            </div>
        `;

        // Style header buttons
        setTimeout(() => {
            const copyBtn = document.getElementById('copy-transcript');
            const copyBtn2 = document.getElementById('copy-transcript-2');
            const copyBtn3 = document.getElementById('copy-transcript-3');
            const closeBtn = document.getElementById('close-transcript');
            if (copyBtn) this.setHeaderButtonStyles(copyBtn);
            if (copyBtn2) this.setHeaderButtonStyles(copyBtn2);
            if (copyBtn3) this.setHeaderButtonStyles(copyBtn3);
            if (closeBtn) this.setHeaderButtonStyles(closeBtn);
        }, 0);

        // Content
        const content = document.createElement('div');
        this.setContentStyles(content);
        content.textContent = transcript;

        // Thêm các element vào panel
        panel.appendChild(header);
        panel.appendChild(content);
        overlay.appendChild(panel);

        // Thêm event listeners
        setTimeout(() => {
            const closeBtn = document.getElementById('close-transcript');
            const copyBtn = document.getElementById('copy-transcript');
            const copyBtn2 = document.getElementById('copy-transcript-2');
            const copyBtn3 = document.getElementById('copy-transcript-3');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeTranscriptPanel();
                });
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyTranscript(transcript);
                });
            }
			
			if (copyBtn2) {
				let lines = transcript.split('\n').map(x => x.substring(x.indexOf(' ')).trim()).join('\n')
				copyBtn2.addEventListener('click', () => {
					this.copyTranscript(lines)
				})
				copyBtn3.addEventListener('click', () => {
					this.downloadTranscript(lines)
				})
			}
        }, 0);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTranscriptPanel();
            }
        });

        // Thêm vào DOM
        document.body.appendChild(overlay);
        this.transcriptPanel = overlay;
    }

    setOverlayStyles(overlay) {
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
    }

    setPanelStyles(panel) {
        panel.style.background = 'white';
        panel.style.width = '80%';
        panel.style.maxWidth = '800px';
        panel.style.height = '80%';
        panel.style.borderRadius = '8px';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.overflow = 'hidden';
        panel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    }

    setHeaderStyles(header) {
        header.style.padding = '15px 20px';
        header.style.background = '#1976d2';
        header.style.color = 'white';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.fontWeight = 'bold';
    }

    setHeaderButtonStyles(button) {
        button.style.background = 'rgba(255,255,255,0.2)';
        button.style.border = 'none';
        button.style.color = 'white';
        button.style.padding = '5px 10px';
        button.style.borderRadius = '4px';
        button.style.marginRight = '10px';
        button.style.cursor = 'pointer';
    }

    setContentStyles(content) {
        content.style.flex = '1';
        content.style.padding = '20px';
        content.style.overflowY = 'auto';
        content.style.fontFamily = "'Courier New', monospace";
        content.style.fontSize = '14px';
        content.style.lineHeight = '1.6';
        content.style.whiteSpace = 'pre-wrap';
        content.style.background = '#f8f9fa';
    }

    copyTranscript(transcript) {
        navigator.clipboard.writeText(transcript).then(() => {
            const copyBtn = document.getElementById('copy-transcript');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        });
    }

    downloadTranscript(transcript) {
        try {
            // Lấy thông tin video
            const videoTitle = this.getVideoTitle();
            const videoId = this.extractVideoId();
            
            // Tạo tên file
            const fileName = `YouTube_Transcript_${videoTitle.replaceAll(/[^\w ]/g, '')}_${videoId}.txt`;
            
            // Tạo nội dung file với metadata
            const fileContent = transcript;
            
            // Tạo blob và download
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Cleanup URL object
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Download error:', error);
        }
    }
	getVideoTitle() {
		return document.title;	
	}
	
    closeTranscriptPanel() {
        if (this.transcriptPanel) {
            this.transcriptPanel.remove();
            this.transcriptPanel = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        this.setErrorStyles(errorDiv);
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    setErrorStyles(errorDiv) {
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.background = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '15px 20px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.zIndex = '10001';
        errorDiv.style.fontFamily = 'Arial, sans-serif';
        errorDiv.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    }

    observeURLChanges() {
        let currentURL = location.href;
        
        const observer = new MutationObserver(() => {
            if (location.href !== currentURL) {
                currentURL = location.href;
                this.closeTranscriptPanel();
                // Re-add button after URL change
                setTimeout(() => {
                    this.addTranscriptButton();
                }, 2000);
            }
        });

        observer.observe(document, { childList: true, subtree: true });
    }
}

// Khởi tạo khi trang load xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new YouTubeTranscriptExtractor();
    });
} else {
    new YouTubeTranscriptExtractor();
}