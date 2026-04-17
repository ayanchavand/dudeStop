const BYPASS_PARAM = "mindful_bypass";
const BYPASS_DURATION_MS = 5 * 60 * 1000;

let bypassUntil = 0;
let monitoredSites = ['youtube.com']; // Default, will be loaded from storage
let freeVisits = {}; // Track free visits: {site: {expiresAt}}
let activeMonitoredSite = null; // Track which monitored site is currently active

// Track tabs that are actively on monitored sites: Map<site, Set<tabId>>
const monitoredTabs = new Map();
// Track tabs we're currently processing to avoid double-redirects
const processingTabs = new Set();

// Load monitored sites from storage
chrome.storage.sync.get(['monitoredSites'], function(result) {
  monitoredSites = result.monitoredSites || ['youtube.com'];
});

// Load free visits from storage
chrome.storage.sync.get(['freeVisits'], function(result) {
  freeVisits = result.freeVisits || {};
});

// Load active monitored site from storage
chrome.storage.sync.get(['activeMonitoredSite'], function(result) {
  activeMonitoredSite = result.activeMonitoredSite || null;
});

// Listen for changes to monitored sites, free visits, and active site
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    if (changes.monitoredSites) {
      monitoredSites = changes.monitoredSites.newValue || ['youtube.com'];
    }
    if (changes.freeVisits) {
      freeVisits = changes.freeVisits.newValue || {};
    }
    if (changes.activeMonitoredSite) {
      activeMonitoredSite = changes.activeMonitoredSite.newValue || null;
    }
  }
});

function getSite(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname;
  } catch {
    return null;
  }
}

function isMonitoredUrl(urlStr) {
  const site = getSite(urlStr);
  if (!site) return false;
  return monitoredSites.some(monitored => site === monitored || site.endsWith('.' + monitored));
}

function isExtensionPage(urlStr) {
  return urlStr && urlStr.startsWith(chrome.runtime.getURL(""));
}

// Check if a site has an active free visit
function hasFreeVisit(site) {
  if (freeVisits[site]) {
    const now = Date.now();
    if (freeVisits[site].expiresAt > now) {
      return true;
    } else {
      // Free visit has expired, remove it
      delete freeVisits[site];
      chrome.storage.sync.set({ freeVisits });
    }
  }
  return false;
}

// Keep monitoredTabs in sync as tabs navigate away or close
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process once the URL is available
  if (changeInfo.url !== undefined) {
    const site = getSite(changeInfo.url);
    if (isMonitoredUrl(changeInfo.url) && !isExtensionPage(changeInfo.url)) {
      if (!monitoredTabs.has(site)) {
        monitoredTabs.set(site, new Set());
      }
      monitoredTabs.get(site).add(tabId);
    } else if (!isExtensionPage(changeInfo.url)) {
      // Remove from all sites
      for (const tabs of monitoredTabs.values()) {
        tabs.delete(tabId);
      }
    }
  }

  // Handle redirect for main_frame loads
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
  
  // If we removed a tab from the active site and no other tabs of that site exist, reset activeMonitoredSite
  if (removedSite && activeMonitoredSite === removedSite) {
    const activeTabs = monitoredTabs.get(removedSite);
    if (!activeTabs || activeTabs.size === 0) {
      activeMonitoredSite = null;
      chrome.storage.sync.set({ activeMonitoredSite });
    }
  }
  
  processingTabs.delete(tabId);
});

function handleMonitoredNavigation(tabId, urlStr) {
  // Avoid double-processing the same tab
  if (processingTabs.has(tabId)) {
    return;
  }

  const url = new URL(urlStr);
  const site = getSite(urlStr);

  // Skip if not monitored
  if (!isMonitoredUrl(urlStr)) return;

  // Skip if already an extension page
  if (isExtensionPage(urlStr)) return;

  // Check for free visit — if active, allow access
  if (hasFreeVisit(site)) {
    return;
  }

  // Handle bypass token — set timer and strip param
  if (url.searchParams.has(BYPASS_PARAM)) {
    bypassUntil = Date.now() + BYPASS_DURATION_MS;
    url.searchParams.delete(BYPASS_PARAM);
    processingTabs.add(tabId);
    chrome.tabs.update(tabId, { url: url.toString() });
    processingTabs.delete(tabId);
    return;
  }

  // Within bypass window — let through
  if (Date.now() < bypassUntil) {
    return;
  }

  const path = url.pathname;
  const allowedPaths = ["/api/", "/youtubei/", "/generate_204"];
  if (allowedPaths.some((p) => path.startsWith(p))) return;

  processingTabs.add(tabId);

  // ONE-SITE-ACTIVE RULE: Check if a different monitored site is currently active
  if (activeMonitoredSite !== null && activeMonitoredSite !== site) {
    // Different monitored site is active — show generic blocked page
    const blockedUrl = chrome.runtime.getURL("blocked.html");
    chrome.tabs.update(tabId, { url: blockedUrl });
    processingTabs.delete(tabId);
    return;
  }

  // Check how many other tabs are already on this site (excluding this tab)
  const siteTabs = monitoredTabs.get(site) || new Set();
  const otherTabs = [...siteTabs].filter(id => id !== tabId);

  if (otherTabs.length >= 1) {
    // Already have a tab open on this site — show generic blocked page
    const blockedUrl = chrome.runtime.getURL("blocked.html");
    chrome.tabs.update(tabId, { url: blockedUrl });
  } else {
    // First tab on this site — show the mindful interstitial
    const interstitialUrl =
      chrome.runtime.getURL("interstitial.html") +
      "?dest=" + encodeURIComponent(urlStr) +
      "&site=" + encodeURIComponent(site);
    chrome.tabs.update(tabId, { url: interstitialUrl });
    
    // Set this site as the active monitored site
    activeMonitoredSite = site;
    chrome.storage.sync.set({ activeMonitoredSite });
  }

  processingTabs.delete(tabId);
}
