// Load and display settings in the popup
function loadPopupSettings() {
  chrome.storage.sync.get(['waitSeconds', 'monitoredSites'], function(result) {
    const waitSeconds = result.waitSeconds || 10;
    const sites = result.monitoredSites || ['youtube.com'];
    
    document.getElementById('timerValue').textContent = `${waitSeconds}s`;
    document.getElementById('siteCount').textContent = sites.length;
  });
}

// Open settings page
document.getElementById('openSettings').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', loadPopupSettings);
