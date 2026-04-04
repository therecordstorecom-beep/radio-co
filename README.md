# radio-co.net — Website Documentation

## Quick Links

- **Live site:** https://radio-co.net
- **GitHub repo:** https://github.com/therecordstorecom-beep/radio-co
- **Vercel dashboard:** https://vercel.com/therecordstorecom-5001s-projects/radio-co.net
- **DNS management:** https://domains.google.com/registrar/radio-co.net/dns (or Squarespace Domains)

---

## How It Works

Static HTML site hosted on **Vercel** (free Hobby plan). Every `git push` to the `main` branch auto-deploys within ~30 seconds.

**No framework, no build step.** Just HTML, CSS, and vanilla JavaScript.

---

## File Structure

```
radio-co/
├── index.html              ← The live homepage (radio-co.net)
├── logo.jpg                ← Logo image (curved parentheses signal wave)
├── README.md               ← This file
├── .deploy-trigger         ← Ignore (used to force deploys)
│
├── versions/               ← Archived previous designs
│   ├── v1-crt-glitch.html      ← Original: CRT scanlines + static noise
│   ├── v2-particles.html       ← Current live: 3D ripple dot field
│   ├── v2-particles-subtle-tilt.html  ← Alt version: less 3D tilt
│   └── logo.jpg                ← Copy of logo for local preview
│
└── bench-visuals/          ← Product photography assets
    ├── bench-1-nobg.png        ← Bench cutout (front angle, no background)
    ├── bench-2-nobg.png        ← Bench cutout (side angle, no background)
    └── prompts.txt             ← AI prompts for generating scene backgrounds
```

---

## How to Edit the Website

### 1. Clone the repo
```bash
git clone https://github.com/therecordstorecom-beep/radio-co.git
cd radio-co
```

### 2. Edit `index.html`
Open in any code editor (VS Code, Sublime, etc). It's a single self-contained file — all CSS and JavaScript are inline. No dependencies to install.

### 3. Preview locally
Just open the file in a browser:
```bash
open index.html
```

### 4. Deploy
```bash
git add -A
git commit -m "describe your change"
git push
```
Vercel auto-deploys in ~30 seconds. That's it.

---

## How to Add a Subpage

Create a folder with an `index.html` inside it:

```bash
mkdir products
# create products/index.html with your content
git add -A && git commit -m "add products page" && git push
```

This makes it live at `radio-co.net/products`. No routing config needed — Vercel serves static files by folder structure.

---

## Current Design Details

The homepage (`index.html`) features:

### Visual Effects
- **3D dot grid** — tiny black dots covering the full page, viewed at a tilted perspective
- **Ripple effects** — two types randomly alternate:
  - **Ring:** single expanding circle, fast
  - **Wave:** concentric sine waves radiating outward (stone-in-water effect)
- **Click/tap anywhere** to spawn a ripple (interactive)
- Auto-ripples spawn every 5-8 seconds

### Logo
- Uses `mix-blend-mode: multiply` — white background becomes transparent, dark parts stay solid
- **Glitch effect** — random horizontal slice shifts every 2-8 seconds

### Subtitle
- "receive → transmit" types in character by character
- Arrow flickers in
- Text glitches out with random block characters
- Loops forever

### Key Parameters (in the `<script>` section of index.html)
| Parameter | Value | What it controls |
|-----------|-------|-----------------|
| `GRID_SPACING` | 14 | Distance between dots (lower = denser) |
| `BASE_DOT_SIZE` | 0.1 | Resting dot radius in pixels |
| `MAX_DOT_SIZE` | 1.2 | Maximum dot size during ripple |
| `TILT` | 0.65 | 3D perspective tilt (0 = flat, 1 = full) |
| `PERSPECTIVE` | 500 | Camera distance (lower = more dramatic) |

---

## Accounts & Access

### GitHub
- **Account:** therecordstorecom-beep
- **Repo:** radio-co (public)

### Vercel
- **Account:** therecordstorecom-5001s-projects
- **Plan:** Hobby (free, $0/mo)
- **Custom domain:** radio-co.net configured
- **Auto-deploy:** Connected to GitHub `main` branch

### DNS (Domain)
- **Registrar:** Google Domains / Squarespace Domains
- **Email:** therecordstore.com@gmail.com
- **DNS Records:**
  - `A` record: `@` → `216.198.79.1` (Vercel)
  - `CNAME` record: `www` → `1d853468201288ac.vercel-dns-017.com`
  - MX/DKIM records: Google Workspace email (don't touch these)

---

## Troubleshooting

### Push didn't deploy?
1. Check Vercel dashboard → Deployments tab
2. Verify Git connection: Settings → Git → should show `therecordstorecom-beep/radio-co`
3. If disconnected: reconnect to the repo named `radio-co` (NOT `radio-co.net`)

### Site not loading?
1. Check DNS: `dig radio-co.net A` should return `216.198.79.1`
2. Check Vercel domains: Settings → Domains → both should be green

### Want to revert to a previous version?
```bash
cp versions/v1-crt-glitch.html index.html  # or whichever version
git add -A && git commit -m "revert to v1" && git push
```

---

## Future Plans

The site is designed to evolve into a **3D ceramic customizer** where customers can customize their products. When ready:
- Upgrade from static HTML to **Next.js** (Vercel's native framework)
- Add Three.js / React Three Fiber for 3D preview
- Add backend for orders, accounts, payments
- Same domain, same repo, same deploy pipeline — zero migration needed
