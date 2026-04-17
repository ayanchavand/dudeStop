let WAIT_SECONDS = 10; // Will be loaded from storage
const CIRCUMFERENCE = 2 * Math.PI * 5; // r=5

const inspiringLinks = [
  {
    title: "The Scale of the Universe",
    desc: "An interactive journey from quantum foam to the observable universe. Context for everything.",
    url: "https://htwins.net/scale2/"
  },
  {
    title: "Wikipedia: Rabbit hole edition",
    desc: "Open a random Wikipedia article and follow wherever curiosity leads.",
    url: "https://en.wikipedia.org/wiki/Special:Random"
  },
  {
    title: "The Marginalian",
    desc: "Maria Popova's long-running site on art, science, literature, and the meaning of life.",
    url: "https://www.themarginalian.org/"
  },
  {
    title: "Neal.fun — explorable curiosities",
    desc: "Playful, mind-expanding interactive explorations of data you never thought to question.",
    url: "https://neal.fun/"
  },
  {
    title: "Open Culture — free university courses",
    desc: "1,700+ free online courses from MIT, Yale, Stanford. You could learn almost anything.",
    url: "https://www.openculture.com/freeonlinecourses"
  },
  {
    title: "Project Gutenberg — free classic literature",
    desc: "70,000+ books that shaped human thought. The first page of one could change yours.",
    url: "https://www.gutenberg.org/browse/scores/top"
  },
  {
    title: "Astronomy Picture of the Day",
    desc: "NASA's daily photograph of the cosmos. Sometimes a picture puts everything in perspective.",
    url: "https://apod.nasa.gov/apod/astropix.html"
  },
  {
    title: "The Long Now Foundation",
    desc: "Talks and essays on long-term thinking — what does humanity look like in 10,000 years?",
    url: "https://longnow.org/ideas/"
  },
  {
    title: "Bartleby — great books online",
    desc: "Poems, essays, and speeches that have outlasted their authors by centuries.",
    url: "https://www.bartleby.com/"
  },
  {
    title: "Seeing Theory — visual statistics",
    desc: "Beautiful interactive visualizations that make probability and statistics genuinely click.",
    url: "https://seeing-theory.brown.edu/"
  },
  {
    title: "Google Arts & Culture",
    desc: "Explore 2,000+ museums and galleries. Walk through the Louvre. See brushstrokes up close.",
    url: "https://artsandculture.google.com/"
  },
  {
    title: "Radiolab — science & philosophy podcast",
    desc: "Stories that reveal the hidden order of the world through science, philosophy, and wonder.",
    url: "https://radiolab.org/episodes"
  },
  {
    title: "Our World in Data",
    desc: "The world is changing. This site shows how — with data, charts, and genuine optimism.",
    url: "https://ourworldindata.org/"
  },
  {
    title: "Internet Archive",
    desc: "880 billion saved web pages. Explore the history of the internet, or find lost things.",
    url: "https://archive.org/web/"
  },
  {
    title: "Nicky Case — explorable explanations",
    desc: "Interactive essays on game theory, trust, mental health, and more. Learn by doing.",
    url: "https://ncase.me/"
  },
  {
    title: "Khan Academy",
    desc: "Learn anything free — math, science, history, coding. One lesson could unlock a new skill.",
    url: "https://www.khanacademy.org/"
  },
  {
    title: "Letters of Note",
    desc: "Remarkable letters from history's most interesting people. Short reads, lasting impressions.",
    url: "https://lettersofnote.com/"
  },
  {
    title: "The Pudding — visual essays",
    desc: "Deeply reported journalism using data and interactive graphics. Surprising every time.",
    url: "https://pudding.cool/"
  },
  {
    title: "Futility Closet — curious oddities",
    desc: "Puzzles, paradoxes, and strange true stories from history. A site that rewards attention.",
    url: "https://www.futilitycloset.com/"
  },
  {
    title: "Europeana — world's cultural heritage",
    desc: "Explore digitized manuscripts, maps, and artifacts from thousands of years of civilization.",
    url: "https://www.europeana.eu/en"
  }
];

// ── Inspiring link logic ──────────────────────────────────────────

let currentLink = null;

function pickRandom(excludeUrl) {
  const pool = excludeUrl
    ? inspiringLinks.filter(l => l.url !== excludeUrl)
    : inspiringLinks;
  return pool[Math.floor(Math.random() * pool.length)];
}

function showLink(link) {
  currentLink = link;
  document.getElementById('inspire-title').textContent = link.title;
  document.getElementById('inspire-desc').textContent = link.desc;
}

showLink(pickRandom());

document.getElementById('btn-go').addEventListener('click', () => {
  if (currentLink) window.location.href = currentLink.url;
});

document.getElementById('btn-shuffle').addEventListener('click', () => {
  showLink(pickRandom(currentLink ? currentLink.url : null));
});

// ── YouTube wait-period countdown ─────────────────────────────────

const btnYT    = document.getElementById('btn-youtube');
const numEl    = document.getElementById('countdown-num');
const ringFill = document.getElementById('ring-fill');

ringFill.style.strokeDasharray  = CIRCUMFERENCE;
ringFill.style.strokeDashoffset = 0;

let secondsLeft = WAIT_SECONDS;
let countdownDone = false;
let countdownStarted = false;

const params = new URLSearchParams(window.location.search);
const site = params.get('site') || 'YouTube';

function tick() {
  secondsLeft--;

  // Animate the ring draining as time passes
  const progress = secondsLeft / WAIT_SECONDS;
  ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  if (secondsLeft <= 0) {
    countdownDone = true;
    btnYT.classList.remove('countdown-active');
    btnYT.classList.add('ready');
    document.getElementById('yt-btn-label').textContent = `I still want to go to ${site}`;
    ringFill.style.strokeDashoffset = CIRCUMFERENCE;
    return;
  }

  numEl.textContent = ` — wait ${secondsLeft}s`;
  setTimeout(tick, 1000);
}

// Load timer setting and set up button
chrome.storage.sync.get(['waitSeconds'], function(result) {
  WAIT_SECONDS = result.waitSeconds || 10;
  secondsLeft = WAIT_SECONDS;
  numEl.textContent = '';
  document.getElementById('yt-btn-label').textContent = `I want to go to ${site} — click to start`;
});

btnYT.addEventListener('click', () => {
  if (countdownDone) {
    // Timer already finished, proceed to destination
    const dest = params.get('dest') || `https://www.${site.toLowerCase()}.com`;
    const destUrl = new URL(dest);
    destUrl.searchParams.set('mindful_bypass', '1');
    window.location.href = destUrl.toString();
  } else if (!countdownStarted) {
    // Start the countdown timer
    countdownStarted = true;
    btnYT.classList.add('countdown-active');
    tick();
  }
});

// ── Free visit button ──────────────────────────────────────────────

const btnFreeVisit = document.getElementById('btn-free-visit');
btnFreeVisit.addEventListener('click', () => {
  // Grant 30 minute global free visit
  const durationMinutes = 30;
  const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
  const globalFreeVisit = { active: true, expiresAt };
  
  chrome.storage.sync.set({ globalFreeVisit }, function() {
    // Show success message
    const originalText = btnFreeVisit.textContent;
    btnFreeVisit.textContent = '✓ Free visit granted!';
    btnFreeVisit.disabled = true;
    btnFreeVisit.style.opacity = '0.5';
    
    // Redirect after a short delay
    setTimeout(() => {
      const dest = params.get('dest') || `https://www.${site.toLowerCase()}.com`;
      window.location.href = dest;
    }, 1000);
  });
});

// ── Starfield ─────────────────────────────────────────────────────

const starsEl = document.getElementById('stars');
for (let i = 0; i < 80; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 1.5 + 0.5;
  s.style.cssText = `
    width: ${size}px; height: ${size}px;
    top: ${Math.random() * 100}%;
    left: ${Math.random() * 100}%;
    --dur: ${3 + Math.random() * 5}s;
    --delay: ${Math.random() * 5}s;
    --max-opacity: ${0.15 + Math.random() * 0.35};
  `;
  starsEl.appendChild(s);
}
