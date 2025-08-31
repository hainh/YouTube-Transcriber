function checkStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        const statusElement = document.getElementById('status-text');
        
        if (currentTab.url && currentTab.url.includes('youtube.com/watch')) {
            statusElement.textContent = '✅ Ready to extract transcript';
            statusElement.parentElement.className = 'status active';
        } else if (currentTab.url && currentTab.url.includes('youtube.com')) {
            statusElement.textContent = '⚠️ Please open a YouTube video';
            statusElement.parentElement.className = 'status inactive';
        } else {
            statusElement.textContent = '❌ This site is not YouTube';
            statusElement.parentElement.className = 'status inactive';
        }
    });
}

function refreshExtension() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
        window.close();
    });
}

function initPopup() {
    checkStatus();
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshExtension);
    }
    
    setInterval(checkStatus, 2000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup);
} else {
    initPopup();
}