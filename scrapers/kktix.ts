/**
 * KKTIX scraper — uses Puppeteer to bypass Cloudflare
 * URL: https://kktix.com/events?event_tag_ids_in=1
 *
 * Confirmed DOM structure (Puppeteer-rendered):
 *   li.type-view > a.cover[href="https://ORGANIZER.kktix.cc/events/ID"]
 *     .event-title h2          — event title
 *     span.category            — category label (同好, 音樂, 展覽...)
 *     div.ft > span.date       — "2026/4/4(六)" date text
 *
 * Note: Cloudflare challenge is bypassed by Puppeteer's real Chrome.
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/kktix.ts
 * Output: data/kktix-events.json
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require('puppeteer');
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

// Tag IDs to scrape (1 = all concerts / entertainment)
const URLS = [
  'https://kktix.com/events?event_tag_ids_in=1',
  'https://kktix.com/events?event_tag_ids_in=2',
];

function parseDate(raw: string): string {
  // "2026/4/4(六)" or "2026/12/31"
  const m = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function mapCategory(cat: string, title: string): EventCategory {
  const t = cat + ' ' + title;
  if (/音樂|concert|live|演唱/i.test(t)) return 'pop';
  if (/古典|交響|室內樂/i.test(t))       return 'classical';
  if (/展覽|exhibition/i.test(t))        return 'exhibition';
  if (/舞蹈|dance/i.test(t))             return 'dance';
  if (/戲劇|theater|劇場/i.test(t))      return 'theater';
  if (/工作坊|講座|課程/i.test(t))       return 'workshop';
  return 'pop'; // default: KKTIX is mostly pop/live music
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scrapeUrl(page: any, url: string, today: string): Promise<ArtEvent[]> {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  return page.evaluate((_todayStr: string) => {
    const results: Array<{
      title: string; date: string; category: string; url: string;
    }> = [];

    // a.cover is the direct event card element (12 found vs only 2 li.type-view wrappers)
    document.querySelectorAll('a.cover[href*="kktix"]').forEach(cover => {
      const link    = cover as HTMLAnchorElement;
      const titleEl = cover.querySelector('.event-title h2');
      const catEl   = cover.querySelector('span.category');
      const dateEl  = cover.querySelector('span.date');

      if (!titleEl) return;

      results.push({
        title:    titleEl.textContent?.trim() ?? '',
        date:     dateEl?.textContent?.trim() ?? '',
        category: catEl?.textContent?.replace(/\s+/g, '').trim() ?? '',
        url:      link.href,
      });
    });
    return results;
  }, today).then((rows: Array<{title:string;date:string;category:string;url:string}>) =>
    rows
      .map((r, i) => {
        const start = parseDate(r.date);
        if (!start || start < today) return null;
        const id = r.url.split('/events/')[1]?.split('?')[0] ?? `kktix-${i}`;
        return {
          id: `kktix-${id}`,
          title: r.title,
          start,
          category: mapCategory(r.category, r.title),
          venue: 'KKTIX',
          city: 'Taipei',   // KKTIX doesn't show city on the list page
          url: r.url,
        } as ArtEvent;
      })
      .filter((e): e is ArtEvent => e !== null)
  );
}

async function main() {
  console.log('Launching Puppeteer for KKTIX (Cloudflare bypass)…');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  const today = new Date().toISOString().slice(0, 10);
  const all: ArtEvent[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    console.log(`  Scraping ${url}…`);
    try {
      const events = await scrapeUrl(page, url, today);
      for (const e of events) {
        if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
      }
      console.log(`  → ${events.length} events`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.warn(`  Failed: ${(err as Error).message}`);
    }
  }

  await browser.close();

  console.log(`✓ ${all.length} upcoming events from KKTIX`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'kktix-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/kktix-events.json');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
