class YouTubeTranscriptExtractor {
    constructor() {
        this.transcriptPanel = null;
        this.init();
    }

    init() {
        this.addTranscriptButton();
        this.observeURLChanges();
    }

    addTranscriptButton() {
        const controls = document.querySelector('.ytp-chrome-bottom .ytp-chrome-controls .ytp-right-controls');
        if (controls && !document.querySelector('.ytp-transcript-btn')) {
            this.createTranscriptButton(controls);
        }
    }

    createTranscriptButton(/** @type {HTMLElement} */controls) {
        const button = new DOMParser().parseFromString(`    <button
        class="ytp-button ytp-transcript-btn"
        aria-label="Get Transcript"
        style="position: relative; overflow: initial;" >
        <svg fill="#fff" width="100%" height="100%" viewBox="-6 -15 58 58" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
            <title>file-contract-o</title>
            <use class="ytp-svg-shadow"/>
            <path d="M18.285 18.38H9.835a0.54 0.54 0 0 0 0 1.08H17.865A1.705 1.705 0 0 1 18.285 18.38Z"/>
            <path d="M22.08 11.3H9.835a0.54 0.54 0 1 0 0 1.08H22.08a0.54 0.54 0 1 0 0-1.08Z"/>
            <path d="M25.105 18.96V26.285a0.275 0.275 0 0 1-0.275 0.275H7.565a0.275 0.275 0 0 1-0.275-0.275V1.715a0.275 0.275 0 0 1 0.275-0.27H20.62v4.175a0.725 0.725 0 0 0 0.725 0.72h3.76l0 1.5c0.035 0 0.305-0.5 0.345-0.5 0.355-0.475 0.5-0.425 0.74-0.5 0.045 0 0.3 0 0.345 0V5.31L21.66 0H7.565A1.72 1.72 0 0 0 5.85 1.715V26.285A1.72 1.72 0 0 0 7.565 28H24.83a1.72 1.72 0 0 0 1.715-1.715V16.63c-0.16 0.22-0.315 0.45-0.46 0.685A8.08 8.08 0 0 0 25.105 18.96ZM22.065 2.57l2.14 2.325H22.065Z"/>
            <path d="M20.645 14.81H9.835a0.54 0.54 0 0 0 0 1.08H19.93Z"/>
            <path d="M13.5 24.415c0.035 0.22 0.295 0.29 0.465 0.36s0.36-0.06 0.5-0.13c0.845-0.41 2 0.075 2.89 0.075a0.415 0.415 0 0 0 0-0.83c-1.055 0-1.93-0.27-3-0.095a0.53 0.53 0 0 0-0.085-0.255 0.66 0.66 0 0 0-0.695-0.385 0.64 0.64 0 0 0-0.055-0.12 0.4 0.4 0 0 0-0.26-0.185 1.715 1.715 0 0 0 0.29-1.5 0.41 0.41 0 0 0-0.36-0.205c-0.55 0-1.025 0.56-1.385 0.91a25.925 25.925 0 0 0-2.43 2.85c-0.33 0.42 0.395 0.835 0.715 0.415a30.195 30.195 0 0 1 2.15-2.5c-0.185 0.305-0.38 0.605-0.585 0.89-0.295 0.455 0.405 0.845 0.715 0.42a0.82 0.82 0 0 1 0.265-0.26l-0.06 0.15h0l-0.045 0.1c-0.185 0.465 0.5 0.675 0.76 0.32a2.125 2.125 0 0 0 0.175-0.29A1.605 1.605 0 0 0 13.5 24.415Z"/>
            <path d="M30.145 10.08c0-0.1-0.2-1-1.535-1.865s-2.22-0.685-2.32-0.66a0.55 0.55 0 0 0-0.32 0.23L18.5 19.145a0.555 0.555 0 0 0-0.085 0.235l-0.5 4.225a0.55 0.55 0 0 0 0.24 0.5 0.555 0.555 0 0 0 0.57 0L22.425 22a0.5 0.5 0 0 0 0.18-0.17L30.06 10.465A0.545 0.545 0 0 0 30.145 10.08ZM20.22 22.34a4.125 4.125 0 0 0-0.58-0.445A5.55 5.55 0 0 0 19 21.535l0.15-1.265a4 4 0 0 1 2.175 1.425Z"/>
        </svg>
        </button>`, 'text/html').body.firstChild;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTranscript();
        });

        controls.prepend(button);
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
            const transcript = latestTranscript || await this.getTranscript();
            this.createTranscriptPanel(transcript);
        } catch (error) {
            this.showError('Cannot get transcript: ' + error.message);
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
                    this.closeTranscriptPanel();
                });
            }

            if (copyBtn2) {
                let lines = transcript.split('\n').map(x => x.substring(x.indexOf(' ')).trim()).join('\n')
                copyBtn2.addEventListener('click', () => {
                    this.copyTranscript(lines)
                    this.closeTranscriptPanel();
                })
                copyBtn3.addEventListener('click', () => {
                    this.downloadTranscript(lines)
                    this.closeTranscriptPanel();
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
        navigator.clipboard.writeText(transcript)
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
        // Re-inject the button when navigating between videos
        const observer = new MutationObserver((mutations) => {
            if (document.querySelector('.ytp-right-controls') && !document.querySelector('.ytp-transcript-btn')) {
                this.closeTranscriptPanel();
                this.addTranscriptButton();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

let a = new YouTubeTranscriptExtractor();

let latestTranscript = '';

window.addEventListener('message', async function(event) {
    // Check for our unique identifier
    if (event.data.type === "__youtube_transcript_get_timed_text_request__") {
        try {
            let response = await this.fetch(event.data.detail.requestUrl);
            let data = await response.json();
            if (data.events && Array.isArray(data.events)) {
                let lines = data.events.map(event => {
                    if (event.segs && Array.isArray(event.segs)) {
                        let text = event.segs.map(seg => seg.utf8).join('');
                        if (text.trim() === '') return '\n';
                        let sec = event.tStartMs / 1000 | 0;
                        let min = sec / 60 | 0;
                        let hour = min / 60 | 0;
                        return `${hour.toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')} ${text.trim()}`
                    }
                    return '';
                });
                latestTranscript = lines.join('');
            }
        } catch (error) {
            console.error(error);
        }
    }
});

// Create a script tag
const script = document.createElement('script');
script.setAttribute("type", "text/javascript");
script.src = chrome.runtime.getURL('yt-injector.js');

// Append the script tag to the DOM
document.documentElement.insertBefore(script, document.documentElement.firstChild);
