# DudeStop

A Chrome extension that pauses you before accessing distracting websites. Make a mindful decision about how you spend your time.

## Core Features

### 🛑 Mindful Interstitial Screen
When you try to access a monitored website, DudeStop shows an interstitial page that gives you a moment to pause and reflect. This screen encourages mindful decision-making before allowing access.

### 🎯 Customizable Monitored Websites
- Add or remove websites from your monitoring list
- Each monitored site can have independent settings (in Per-Site mode)
- Default monitored site: `youtube.com`

### 🆓 Free Visits
Grants guilt-free access to monitored sites without waiting for timers:
- **Per-Site Mode**: Each monitored site gets its own 30-minute free visit
- **Global Mode**: One global 30-minute free visit applies to all monitored sites
- Free visits are highlighted on the interstitial screen
- One-site-active rule is still enforced during free visits

### ⏱️ Bypass Window
- **5-minute mindful bypass**: Click "Proceed" on the interstitial to get 5 minutes of unrestricted access
- Allows you to access multiple tabs of a site temporarily
- Separate from free visit functionality

### 🎮 Two Timer Modes

#### Per-Site Mode (Default)
- Each monitored website has its own timer
- Independent free visits and bypass tracking per site
- **One-Site-Active Rule**: Only one monitored site can be active at a time
  - If YouTube is active, attempting to access Twitter shows a block
  - Must close all tabs of the active site before accessing another monitored site
- Maximum control and compartmentalization

#### Global Mode
- Single shared timer for all monitored websites
- One global 30-minute free visit applies to all sites simultaneously
- **One-Site-Active Rule Still Applies**: Only one monitored site can be active at a time
  - Even with free visits, you can't switch between monitored sites while one is active
  - Must close all tabs of current site before accessing another
- Streamlined experience with fewer restrictions

### 🚫 Enhanced Blocking Focus

When a site is blocked, DudeStop shows context-aware messaging:
- **Different Site Attempt**: "YouTube is blocked right now. You're currently focused on Twitter. Close all tabs of Twitter first."
- **Multiple Tabs**: "Keep focus—one tab at a time. You already have this site open."
- Emphasized site names in accent color for clarity
- Clear explanation of the one-site-active rule

### 📊 Quick Stats Popup
Click the DudeStop icon in your toolbar to see:
- Currently active site (Per-Site mode)
- Quick access to settings
- Status overview

### ⚙️ Settings & Configuration
Access the options page from the popup to:
- Add or remove monitored websites
- Switch between Per-Site and Global timer modes
- View current settings and active timers
- Per-Site mode: Configure free visit limits per site

## How It Works

### Per-Site Mode Flow
1. You attempt to access a monitored site (e.g., YouTube)
2. If no site is currently active, that site becomes the active site
3. DudeStop shows the interstitial pause screen
4. You can:
   - **Use Free Visit**: Get 30 minutes on that site without waiting
   - **Proceed**: Get 5 minutes of unrestricted access
   - **Go Back**: Close the site
5. If you try to access a different monitored site while one is active, you see a block message
6. Once you close all tabs of the active site, the timer resets

### Global Mode Flow
1. You attempt to access any monitored site
2. DudeStop shows the interstitial pause screen
3. You can:
   - **Use Free Visit**: Get 30 minutes on any monitored site (global)
   - **Proceed**: Get 5 minutes of unrestricted access
   - **Go Back**: Close the site
4. The one-site-active rule still applies—you can't have multiple monitored sites open simultaneously
5. After the global timer expires or free visit ends, you need to use another free visit or proceed again

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select this folder

## Technical Details

### Files Overview

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration, permissions, and metadata |
| `background.js` | Core extension logic: traffic monitoring, timer management, state persistence |
| `popup.html` / `popup.js` | Extension popup interface showing quick stats |
| `options.html` / `options.js` | Settings page for configuring monitored sites and timer mode |
| `interstitial.html` / `interstitial.js` | Pause screen shown before access (context-aware per mode) |
| `blocked.html` | Block page shown when one-site-active rule is violated |

### Data Persistence
All settings are stored in `chrome.storage.sync` for:
- Monitored sites list
- Timer mode preference (Per-Site vs Global)
- Free visit status and expiration times
- Active site tracking
- Bypass window state

### Chrome Permissions
- `tabs`: Monitor tab creation and closure, extract URLs
- `storage`: Store and sync user settings
- `<all_urls>`: Intercept navigation to monitored sites

## Configuration Examples

### Add a New Monitored Site
1. Click the DudeStop icon → "Settings"
2. In the "Monitored Sites" section, enter a domain (e.g., `twitter.com`)
3. Click "Add Site"
4. The site is now monitored

### Switch to Global Timer Mode
1. Click the DudeStop icon → "Settings"
2. In the "Timer Mode" section, select "Global Timer"
3. Settings save automatically

## Default Configuration
- **Monitored Site**: youtube.com
- **Timer Mode**: Per-Site (independent timers per site)
- **Free Visit Duration**: 30 minutes
- **Bypass Window Duration**: 5 minutes

## Tips for Effective Use

- **Per-Site Mode**: Best if you want separate breaks and limits for different sites
- **Global Mode**: Best if you want stricter overall control with one shared timer
- **Free Visits**: Save these for intentional use; they're meant to be guilt-free!
- **Bypass Window**: Use for genuine reasons you need quick access; it encourages mindfulness
- **Close Sites**: To reset or access another monitored site, completely close all tabs of the current site
