/**
 * yii.tw scraper — Hsinchu City Culture Bureau 演藝廳音樂廳 events
 * URL: https://yii.tw/hsinchu/events?place=新竹市文化局演藝廳音樂廳
 *
 * Confirmed structure (server-rendered, 10 events/page, ~13 pages):
 *   div.mt-3 > div.row
 *     div.col-lg-8
 *       a.text-black[href="/events/ID"] > h4  — title
 *       div.mt-1 > a.text-black              — venue name
 *       div.mt-1 > a.text-black              — dates "2026-06-26、2026-06-27"
 *
 * Pagination: ?place=...&page=N
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/yii.ts
 * Output: data/yii-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL   = 'https://yii.tw';
const PLACE_ENC  = encodeURIComponent('新竹市文化局演藝廳音樂廳');
const LIST_BASE  = `${BASE_URL}/hsinchu/events?place=${PLACE_ENC}`;
const MAX_PAGES  = 15;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function detectCategory(title: string): EventCategory {
  if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂|演奏|音樂會/.test(title)) return 'classical';
  if (/歌劇|opera/i.test(title))    return 'opera';
  if (/音樂劇|百老匯/.test(title))  return 'theater';
  if (/舞蹈|芭蕾|現代舞/.test(title))  return 'dance';
  if (/歌仔戲|布袋戲|傳統|國樂|民謠/.test(title)) return 'traditional';
  if (/演唱會|流行|搖滾/.test(title))  return 'pop';
  if (/展覽/.test(title))            return 'exhibition';
  if (/工作坊|講座|課程/.test(title)) return 'workshop';
  return 'classical'; // music hall bias
}

function parseDates(raw: string): { start: string; end?: string } {
  // Format: "2026-06-26、2026-06-27" or "2026-06-26"
  const dates = [...raw.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  if (dates.length === 0) return { start: '' };
  return { start: dates[0], end: dates.length > 1 ? dates[dates.length - 1] : undefined };
}

async function scrapePage(page: number): Promise<{ events: ArtEvent[]; hasMore: boolean }> {
  const url = page === 1 ? LIST_BASE : `${LIST_BASE}&page=${page}`;
  const data = await http.get(url);
  const $ = cheerio.load(data);

  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  // Each event card: div.mt-3 > div.row
  $('div.mt-3').each((_, card) => {
    const col = $(card).find('div.col-lg-8');
    if (!col.length) return;

    // Title link: the <a> wrapping <h4>
    const titleLink = col.find('a.text-black').first();
    const title     = titleLink.find('h4').text().trim();
    const href      = titleLink.attr('href') ?? '';
    if (!title || !href.startsWith('/events/')) return;

    // Venue + date: two .mt-1 divs after the title
    const mt1s = col.find('div.mt-1');
    const venue = mt1s.eq(0).text().trim();
    const rawDate = mt1s.eq(1).text().trim();

    const { start, end } = parseDates(rawDate);
    if (!start) return;

    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    const id = href.split('/events/')[1];
    events.push({
      id: `yii-${id}`,
      title,
      start,
      end: end && end !== start ? end : undefined,
      category: detectCategory(title),
      venue: venue || '新竹市文化局演藝廳音樂廳',
      city: 'Hsinchu',
      url: `${BASE_URL}${href}`,
    });
  });

  const hasMore = events.length === 10;
  return { events, hasMore };
}

async function main() {
  console.log(`Scraping yii.tw Hsinchu events…`);

  const all: ArtEvent[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const { events, hasMore } = await scrapePage(page);
      for (const e of events) {
        if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
      }
      process.stdout.write(`\r  Page ${page} — ${all.length} events`);
      if (!hasMore) break;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      console.warn(`\n  Page ${page} failed:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  console.log(`\n✓ ${all.length} upcoming events from yii.tw (新竹市文化局演藝廳)`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'yii-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/yii-events.json');
}

main().catch((err) => console.error('Error:', err.message));
