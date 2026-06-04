# 台灣藝文活動月曆 🎭🎵
**Taiwan Arts & Performance Calendar**

A color-coded online calendar for arts, music, theater, dance, and cultural events across Taiwan — covering Taipei, Hsinchu, Taoyuan, Taichung, and Kaohsiung.

🌐 **Live site:** https://taiwan-arts-calendar.vercel.app

---

## Features

- 📅 Month view + list view (FullCalendar)
- 🎨 8 color-coded event categories (classical, pop, theater, dance, opera, traditional arts, exhibition, workshop)
- 🏙️ Filter by city and category
- 🌙 Dark / light theme toggle
- 🔄 Auto-refreshed weekly via GitHub Actions

---

## Event Sources (13 scrapers → 1,400+ events)

| Source | Coverage | Method |
|--------|----------|--------|
| 國家兩廳院 (NTCH) | Taipei | GraphQL API |
| 台北表演藝術中心 (TPAC) | Taipei | HTML scraper |
| 臺北流行音樂中心 (TMC/北流) | Taipei | HTML scraper |
| Legacy 音樂展演空間 | Taipei / Taichung | HTML scraper |
| KKTIX | Taipei | Puppeteer (Cloudflare bypass) |
| OpenTix 兩廳院文化生活 | All cities | REST API |
| 台北市藝文活動通 | Taipei | HTML scraper (27 pages) |
| 國家歌劇院 (NTT) | Taichung | HTML scraper |
| 衛武營國家藝術文化中心 | Kaohsiung | Internal JSON API |
| 新竹市文化局 | Hsinchu | POST-based scraper |
| 新竹縣文化局 (hchcc) | Hsinchu | HTML scraper |
| 桃園市文化局 | Taoyuan | HTML scraper |
| yii.tw | Hsinchu | HTML scraper |

---

## Local Development

```bash
# Clone
git clone https://github.com/wapert/taiwan-arts-calendar.git
cd taiwan-arts-calendar

# Install dependencies
npm install

# Run scrapers to populate event data
npm run scrape:all

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Scraper Commands

```bash
# Run all scrapers + merge into public/events.json
npm run scrape:all

# Run individual scrapers
npm run scrape:ntch            # 國家兩廳院
npm run scrape:weiwuying       # 衛武營
npm run scrape:ntt             # 國家歌劇院
npm run scrape:tpac            # 台北表演藝術中心
npm run scrape:tmc             # 臺北流行音樂中心
npm run scrape:legacy          # Legacy 音樂展演空間
npm run scrape:kktix           # KKTIX (Puppeteer)
npm run scrape:opentix         # OpenTix
npm run scrape:cultureexpress  # 台北市藝文活動通
npm run scrape:hsinchu         # 新竹市文化局
npm run scrape:hchcc           # 新竹縣文化局
npm run scrape:taoyuan         # 桃園市文化局
npm run scrape:yii             # yii.tw
npm run scrape:merge           # Merge all data/ → public/events.json
```

---

## Deployment (Vercel)

The app is deployed on **Vercel** (free tier).

### First-time deploy

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub → import `wapert/taiwan-arts-calendar`
3. Click **Deploy** — no extra config needed (Next.js auto-detected)

### Make the site public

Vercel enables login protection by default. To allow anyone to access:

1. Vercel Dashboard → project `taiwan-arts-calendar`
2. **Settings** → **Deployment Protection**
3. Toggle **Vercel Authentication** → **OFF**
4. Save

---

## Auto-Refresh via GitHub Actions

Events are automatically refreshed every **Monday at 10:00 AM Taiwan time** (02:00 UTC).

### How it works

```
Every Monday 10am Taiwan time
        ↓
GitHub Actions runs all 13 scrapers (~5 min)
        ↓
Commits updated public/events.json to repo
        ↓
Vercel detects the push → redeploys in ~30 sec
        ↓
Live site shows fresh event data
```

### Trigger a manual refresh

If you want to refresh events immediately without waiting for Monday:

1. Go to the **[Actions tab](https://github.com/wapert/taiwan-arts-calendar/actions)** on GitHub
2. Click **"Refresh Events"** in the left sidebar
3. Click **"Run workflow"** → **"Run workflow"** (green button)
4. Wait ~5 minutes for all scrapers to finish
5. Vercel auto-redeploys — live site is updated

### Change the refresh schedule

Edit `.github/workflows/scrape.yml`, line 5:

```yaml
- cron: '0 2 * * 1'   # Every Monday 02:00 UTC = 10:00 Taiwan
```

Cron format: `minute hour day month weekday`

| Schedule | Cron expression |
|----------|----------------|
| Every Monday 10am Taiwan | `0 2 * * 1` |
| Daily 10am Taiwan | `0 2 * * *` |
| Mon + Thu 10am Taiwan | `0 2 * * 1,4` |
| Daily 6am Taiwan | `0 22 * * *` |

Use [crontab.guru](https://crontab.guru) to build cron expressions.

---

## Project Structure

```
taiwan-arts-calendar/
├── app/
│   ├── page.tsx               # Main calendar page with theme toggle
│   ├── layout.tsx             # HTML layout + metadata
│   ├── globals.css            # FullCalendar overrides + dark/light tokens
│   └── api/events/route.ts    # REST endpoint (/api/events?city=&category=)
├── components/
│   ├── CalendarView.tsx       # FullCalendar (month + list view)
│   ├── FilterBar.tsx          # Category pills + city dropdown
│   ├── Legend.tsx             # Color legend strip
│   └── EventModal.tsx         # Event detail popup
├── lib/
│   ├── eventTypes.ts          # TypeScript types + 8 category color config
│   └── sampleEvents.ts        # Fallback sample data
├── scrapers/
│   ├── utils.ts               # Shared HTTP retry (3-attempt, 15s→30s→45s)
│   ├── ntch.ts                # 國家兩廳院 — GraphQL API
│   ├── weiwuying.ts           # 衛武營 — internal JSON API
│   ├── ntt.ts                 # 國家歌劇院 — HTML
│   ├── tpac.ts                # 台北表演藝術中心 — HTML
│   ├── tmc.ts                 # 臺北流行音樂中心 — HTML
│   ├── legacy.ts              # Legacy 音樂展演空間 — HTML
│   ├── kktix.ts               # KKTIX — Puppeteer (Cloudflare bypass)
│   ├── opentix.ts             # OpenTix — REST API pagination
│   ├── cultureexpress.ts      # 台北市藝文活動通 — HTML 27-page
│   ├── hsinchu.ts             # 新竹市文化局 — POST pagination
│   ├── hchcc.ts               # 新竹縣文化局 — HTML
│   ├── taoyuan.ts             # 桃園市文化局 — HTML
│   ├── yii.ts                 # yii.tw — HTML
│   └── merge.ts               # Dedup + sort → public/events.json
├── public/
│   └── events.json            # Merged events (auto-generated, do not edit)
├── data/                      # Per-source raw JSON (auto-generated)
└── .github/workflows/
    └── scrape.yml             # Weekly auto-refresh (every Monday 10am TW)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Calendar UI | FullCalendar 6 (React) |
| Styling | Tailwind CSS v4 |
| Scraping | Axios + Cheerio + Puppeteer |
| Hosting | Vercel (free tier) |
| Auto-refresh | GitHub Actions (free, public repo) |
