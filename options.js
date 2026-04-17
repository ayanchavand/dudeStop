// ── Timer settings ────────────────────────────────────────────────

function loadTimerSetting() {
  chrome.storage.sync.get(['waitSeconds'], function(result) {
    const waitSeconds = result.waitSeconds || 10;
    document.getElementById('waitSeconds').value = waitSeconds;
  });
}

function saveTimerSetting() {
  const waitSeconds = parseInt(document.getElementById('waitSeconds').value, 10);
  if (isNaN(waitSeconds) || waitSeconds < 1 || waitSeconds > 300) {
    alert('Please enter a valid number between 1 and 300');
    return;
  }
  chrome.storage.sync.set({waitSeconds}, function() {
    showSuccessMessage();
  });
}

function showSuccessMessage() {
  const msg = document.getElementById('timerSuccessMsg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2000);
}

// ── Site management ───────────────────────────────────────────────

// Load and display the list of monitored sites
function loadSites() {
  chrome.storage.sync.get(['monitoredSites'], function(result) {
    const sites = result.monitoredSites || ['youtube.com'];
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';
    sites.forEach(site => {
      const li = document.createElement('li');
      li.className = 'site-item';
      const siteSpan = document.createElement('span');
      siteSpan.textContent = site;
      li.appendChild(siteSpan);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => removeSite(site);
      li.appendChild(removeBtn);
      siteList.appendChild(li);
    });
  });
}

// Add a new site
function addSite() {
  const newSite = document.getElementById('newSite').value.trim().toLowerCase();
  if (!newSite) return;
  // Simple validation: check for basic domain format
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newSite)) {
    alert('Please enter a valid domain (e.g., example.com)');
    return;
  }
  chrome.storage.sync.get(['monitoredSites'], function(result) {
    const sites = result.monitoredSites || ['youtube.com'];
    if (!sites.includes(newSite)) {
      sites.push(newSite);
      chrome.storage.sync.set({monitoredSites: sites}, loadSites);
    }
    document.getElementById('newSite').value = '';
  });
}

// Remove a site
function removeSite(site) {
  chrome.storage.sync.get(['monitoredSites'], function(result) {
    const sites = result.monitoredSites || ['youtube.com'];
    const updatedSites = sites.filter(s => s !== site);
    chrome.storage.sync.set({monitoredSites: updatedSites}, loadSites);
  });
}

// ── Global Free Visit management ───────────────────────────────────

function grantGlobalFreeVisit() {
  const durationMinutes = parseInt(document.getElementById('freeVisitDuration').value, 10);
  
  if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
    alert('Please enter a valid duration between 1 and 180 minutes');
    return;
  }
  
  const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
  const globalFreeVisit = { active: true, expiresAt };
  
  chrome.storage.sync.set({ globalFreeVisit }, function() {
    showFreeVisitSuccessMessage();
    loadGlobalFreeVisitStatus();
    document.getElementById('freeVisitDuration').value = '30';
  });
}

function showFreeVisitSuccessMessage() {
  const msg = document.getElementById('freeVisitSuccessMsg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2000);
}

function loadGlobalFreeVisitStatus() {
  chrome.storage.sync.get(['globalFreeVisit'], function(result) {
    const globalFreeVisit = result.globalFreeVisit || { active: false, expiresAt: 0 };
    const statusEl = document.getElementById('freeVisitStatus');
    
    const now = Date.now();
    if (globalFreeVisit.active && globalFreeVisit.expiresAt > now) {
      const remainingMs = globalFreeVisit.expiresAt - now;
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      statusEl.textContent = `Active — ${minutes}m ${seconds}s remaining`;
      statusEl.style.color = 'var(--accent)';
    } else {
      statusEl.textContent = 'No active free visit';
      statusEl.style.color = 'var(--text-dim)';
    }
  });
}

// ── Event listeners ────────────────────────────────────────────────

document.getElementById('addSite').addEventListener('click', addSite);
document.getElementById('newSite').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addSite();
});

document.getElementById('waitSeconds').addEventListener('change', saveTimerSetting);
document.getElementById('waitSeconds').addEventListener('blur', saveTimerSetting);

document.getElementById('grantFreeVisit').addEventListener('click', grantGlobalFreeVisit);
document.getElementById('freeVisitDuration').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') grantGlobalFreeVisit();
});

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSites();
  loadTimerSetting();
  loadGlobalFreeVisitStatus();
  // Refresh free visit status every second
  setInterval(loadGlobalFreeVisitStatus, 1000);
});