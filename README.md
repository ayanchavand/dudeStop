# DudeStop

A Chrome extension that pauses you before accessing distracting websites. Make a mindful decision about how you spend your time.

## Features

- **Interstitial pages** - Shows a pause screen before accessing monitored sites
- **Customizable sites** - Add/remove which websites to monitor
- **Free visits** - Allow a limited number of free visits per time period
- **Bypass option** - Temporarily bypass blocks with a 5-minute bypass window

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select this folder

## Configuration

- Click the DudeStop icon to see quick stats
- Visit the options page (accessible from the extension popup) to:
  - Add/remove monitored websites
  - Set free visit limits per site
  - Manage bypass duration

## Default monitored sites

- youtube.com

## Files

- `manifest.json` - Extension configuration
- `background.js` - Core logic and traffic monitoring
- `popup.html/js` - Extension popup interface
- `options.html/js` - Settings page
- `interstitial.html/js` - Pause screen shown before blocked sites
- `blocked.html` - Alternative blocked page
