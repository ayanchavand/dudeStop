const BYPASS_PARAM = "mindful_bypass";
const BYPASS_DURATION_MS = 5 * 60 * 1000;

let bypassUntil = 0;

let monitoredSites = ['youtube.com'];

// ✅ Updated structure
let globalFreeVisit = {
  active: false,
  expiresAt: 0,
  lastUsedAt: 0 // 👈 NEW: tracks last usage
};

let activeMonitoredSite = null;

// Track tabs that are actively on monitored sites
const monitoredTabs = new Map();
const processingTabs = new Set();

// Load from storage
chrome.storage.sync.get(['monitoredSites'], (result) => {
  monitoredSites = result.monitoredSites || ['youtube.com'];
});

chrome.storage.sync.get(['globalFreeVisit'], (result) => {
  globalFreeVisit = result.globalFreeVisit || {
    active: false,
    expiresAt: 0,
    lastUsedAt: 0
  };
});

chrome.storage.sync.get(['activeMonitoredSite'], (result) => {
  activeMonitoredSite = result.activeMonitoredSite || null;
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    if (changes.monitoredSites) {
      monitoredSites = changes.monitoredSites.newValue || ['youtube.com'];
    }
    if (changes.globalFreeVisit) {
      globalFreeVisit = changes.globalFreeVisit.newValue || {
        active: false,
        expiresAt: 0,
        lastUsedAt: 0
      };
    }
    if (changes.activeMonitoredSite) {
      activeMonitoredSite = changes.activeMonitoredSite.newValue || null;
    }
  }
});

// Helpers
function getSite(urlStr) {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return null;
  }
}

function isMonitoredUrl(urlStr) {
  const site = getSite(urlStr);
  if (!site) return false;
  return monitoredSites.some(m => site === m || site.endsWith('.' + m));
}

function isExtensionPage(urlStr) {
  return urlStr && urlStr.startsWith(chrome.runtime.getURL(""));
}

// ✅ NEW: 24h rule check
function canStartFreeVisit() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  return (now - globalFreeVisit.lastUsedAt) > DAY;
}

// ✅ NEW: start free visit properly
function startGlobalFreeVisit(durationMs) {
  const now = Date.now();

  if (!canStartFreeVisit()) return false;

  globalFreeVisit.active = true;
  globalFreeVisit.expiresAt = now + durationMs;
  globalFreeVisit.lastUsedAt = now;

  chrome.storage.sync.set({ globalFreeVisit });
  return true;
}

function hasGlobalFreeVisit() {
  if (globalFreeVisit.active) {
    const now = Date.now();

    if (globalFreeVisit.expiresAt > now) {
      return true;
    } else {
      const DAY = 24 * 60 * 60 * 1000;

      // 🔥 THIS is what was missing
      globalFreeVisit.active = false;
      globalFreeVisit.expiresAt = 0;
      globalFreeVisit.cooldownUntil = now + DAY;

      chrome.storage.sync.set({ globalFreeVisit });
    }
  }
  return false;
}

// Tabs tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined) {
    const site = getSite(changeInfo.url);

    if (isMonitoredUrl(changeInfo.url) && !isExtensionPage(changeInfo.url)) {
      if (!monitoredTabs.has(site)) {
        monitoredTabs.set(site, new Set());
      }
      monitoredTabs.get(site).add(tabId);
    } else if (!isExtensionPage(changeInfo.url)) {
      for (const tabs of monitoredTabs.values()) {
        tabs.delete(tabId);
      }
    }
  }

  if (changeInfo.status === "loading" && tab.url) {
    handleMonitoredNavigation(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  let removedSite = null;

  for (const [site, tabs] of monitoredTabs.entries()) {
    if (tabs.has(tabId)) {
      removedSite = site;
      tabs.delete(tabId);
    }
  }

  if (removedSite && activeMonitoredSite === removedSite) {
    const activeTabs = monitoredTabs.get(removedSite);
    if (!activeTabs || activeTabs.size === 0) {
      activeMonitoredSite = null;
      chrome.storage.sync.set({ activeMonitoredSite });
    }
  }

  processingTabs.delete(tabId);
});

// Core logic
function handleMonitoredNavigation(tabId, urlStr) {
  if (processingTabs.has(tabId)) return;

  const url = new URL(urlStr);
  const site = getSite(urlStr);

  if (!isMonitoredUrl(urlStr)) return;
  if (isExtensionPage(urlStr)) return;

  // Bypass param
  if (url.searchParams.has(BYPASS_PARAM)) {
    bypassUntil = Date.now() + BYPASS_DURATION_MS;
    url.searchParams.delete(BYPASS_PARAM);

    processingTabs.add(tabId);
    chrome.tabs.update(tabId, { url: url.toString() });
    processingTabs.delete(tabId);
    return;
  }

  const path = url.pathname;
  const allowedPaths = ["/api/", "/youtubei/", "/generate_204"];
  if (allowedPaths.some(p => path.startsWith(p))) return;

  processingTabs.add(tabId);

  // One-site rule
  if (activeMonitoredSite !== null && activeMonitoredSite !== site) {
    const blockedUrl = chrome.runtime.getURL("blocked.html") +
      "?activeSite=" + encodeURIComponent(activeMonitoredSite) +
      "&attemptedSite=" + encodeURIComponent(site) +
      "&reason=different_site";

    chrome.tabs.update(tabId, { url: blockedUrl });
    processingTabs.delete(tabId);
    return;
  }

  // Prevent multiple tabs
  const siteTabs = monitoredTabs.get(site) || new Set();
  const otherTabs = [...siteTabs].filter(id => id !== tabId);

  if (otherTabs.length >= 1) {
    const blockedUrl = chrome.runtime.getURL("blocked.html") +
      "?activeSite=" + encodeURIComponent(site) +
      "&reason=already_open";

    chrome.tabs.update(tabId, { url: blockedUrl });
    processingTabs.delete(tabId);
    return;
  }

  // ✅ Global free visit check
  if (hasGlobalFreeVisit()) {
    processingTabs.delete(tabId);
    return;
  }

  // Bypass window
  if (Date.now() < bypassUntil) {
    processingTabs.delete(tabId);
    return;
  }

  // Show interstitial
  const interstitialUrl =
    chrome.runtime.getURL("interstitial.html") +
    "?dest=" + encodeURIComponent(urlStr) +
    "&site=" + encodeURIComponent(site);

  chrome.tabs.update(tabId, { url: interstitialUrl });

  activeMonitoredSite = site;
  chrome.storage.sync.set({ activeMonitoredSite });

  processingTabs.delete(tabId);
}