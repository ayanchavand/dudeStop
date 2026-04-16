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
    // Also update the free visit dropdown
    loadFreeVisitSiteDropdown();
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

// ── Free visit management ──────────────────────────────────────────

function loadFreeVisitSiteDropdown() {
  chrome.storage.sync.get(['monitoredSites'], function(result) {
    const sites = result.monitoredSites || ['youtube.com'];
    const dropdown = document.getElementById('freeVisitSite');
    dropdown.innerHTML = '<option value="">Select a monitored website...</option>';
    sites.forEach(site => {
      const option = document.createElement('option');
      option.value = site;
      option.textContent = site;
      dropdown.appendChild(option);
    });
  });
}

function grantFreeVisit() {
  const site = document.getElementById('freeVisitSite').value;
  const durationMinutes = parseInt(document.getElementById('freeVisitDuration').value, 10);
  
  if (!site) {
    alert('Please select a website');
    return;
  }
  
  if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
    alert('Please enter a valid duration between 1 and 180 minutes');
    return;
  }
  
  const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
  
  chrome.storage.sync.get(['freeVisits'], function(result) {
    const freeVisits = result.freeVisits || {};
    freeVisits[site] = { expiresAt };
    chrome.storage.sync.set({ freeVisits }, function() {
      showFreeVisitSuccessMessage();
      loadFreeVisits();
      document.getElementById('freeVisitSite').value = '';
      document.getElementById('freeVisitDuration').value = '30';
    });
  });
}

function showFreeVisitSuccessMessage() {
  const msg = document.getElementById('freeVisitSuccessMsg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2000);
}

function loadFreeVisits() {
  chrome.storage.sync.get(['freeVisits'], function(result) {
    const freeVisits = result.freeVisits || {};
    const freeVisitList = document.getElementById('freeVisitList');
    
    // Clean up expired free visits
    const now = Date.now();
    const expiredSites = [];
    for (const site in freeVisits) {
      if (freeVisits[site].expiresAt <= now) {
        expiredSites.push(site);
      }
    }
    if (expiredSites.length > 0) {
      expiredSites.forEach(site => delete freeVisits[site]);
      chrome.storage.sync.set({ freeVisits });
    }
    
    freeVisitList.innerHTML = '';
    const activeSites = Object.keys(freeVisits).filter(site => freeVisits[site].expiresAt > now);
    
    if (activeSites.length === 0) {
      freeVisitList.innerHTML = '<li style="padding: 0.75rem; color: var(--text-dim); text-align: center;">No active free visits</li>';
      return;
    }
    
    activeSites.forEach(site => {
      const li = document.createElement('li');
      li.className = 'site-item';
      
      const updateTime = () => {
        const remainingMs = freeVisits[site].expiresAt - Date.now();
        if (remainingMs <= 0) {
          delete freeVisits[site];
          chrome.storage.sync.set({ freeVisits });
          li.remove();
          if (document.getElementById('freeVisitList').children.length === 0) {
            loadFreeVisits();
          }
          return;
        }
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        infoSpan.textContent = `${site} - ${minutes}m ${seconds}s remaining`;
      };
      
      const infoSpan = document.createElement('span');
      updateTime();
      li.appendChild(infoSpan);
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'End Visit';
      removeBtn.onclick = () => {
        delete freeVisits[site];
        chrome.storage.sync.set({ freeVisits });
        loadFreeVisits();
      };
      li.appendChild(removeBtn);
      
      freeVisitList.appendChild(li);
      
      // Update every second
      setInterval(updateTime, 1000);
    });
  });
}

// ── Event listeners ────────────────────────────────────────────────

document.getElementById('addSite').addEventListener('click', addSite);
document.getElementById('newSite').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addSite();
});

document.getElementById('waitSeconds').addEventListener('change', saveTimerSetting);
document.getElementById('waitSeconds').addEventListener('blur', saveTimerSetting);

document.getElementById('grantFreeVisit').addEventListener('click', grantFreeVisit);
document.getElementById('freeVisitDuration').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') grantFreeVisit();
});

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSites();
  loadTimerSetting();
  loadFreeVisits();
  // Refresh free visits every second
  setInterval(loadFreeVisits, 1000);
});