// Load and display settings in the popup
function loadPopupSettings() {
  chrome.storage.sync.get(['waitSeconds', 'monitoredSites', 'activeMonitoredSite', 'globalFreeVisit'], function(result) {
    const waitSeconds = result.waitSeconds || 10;
    const sites = result.monitoredSites || ['youtube.com'];
    const activeMonitoredSite = result.activeMonitoredSite || null;
    const globalFreeVisit = result.globalFreeVisit || { active: false, expiresAt: 0 };
    
    document.getElementById('timerValue').textContent = `${waitSeconds}s`;
    document.getElementById('siteCount').textContent = sites.length;
    
    const now = Date.now();
    const activeSiteEl = document.getElementById('activeSite');
    const freeVisitEl = document.getElementById('freeVisitStatus');
    
    if (activeMonitoredSite) {
      activeSiteEl.textContent = activeMonitoredSite;
    } else {
      activeSiteEl.textContent = '—';
    }
    
    if (globalFreeVisit.active && globalFreeVisit.expiresAt > now) {
      const remainingMs = globalFreeVisit.expiresAt - now;
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      freeVisitEl.textContent = `${minutes}m ${seconds}s`;
      freeVisitEl.style.color = 'var(--accent)';
    } else {
      freeVisitEl.textContent = 'None';
      freeVisitEl.style.color = 'var(--text-muted)';
    }
  });
}

// Open settings page
document.getElementById('openSettings').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', loadPopupSettings);

// Refresh every second to update free visit countdown
setInterval(loadPopupSettings, 1000);
