/**
 * 台北表演藝術中心 (TPAC) scraper
 * URL: https://tpac.org.taipei/program?page=N
 *
 * Confirmed structure (server-rendered Vue SSR):
 *   a.card-program[href="/program/ID"][title="TITLE"]
 *     div.card-program__text-date  — "2026-06-04 - 2026-06-06"
 *     div.card-program__text-title — event title
 *     div.card-program__image-alert — "取消" if cancelled
 *
 * 2 pages total, ~44 events.
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/tpac.ts
 * Output: data/tpac-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL  = 'https://tpac.org.taipei';
const MAX_PAGES = 5;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function parseDates(raw: string): { start: string; end?: string } {
  // Format: "2026-06-04 - 2026-06-06" or "2026-06-05 - 2026-06-05"
  const dates = [...raw.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  if (dates.length === 0) return { start: '' };
  return { start: dates[0], end: dates.length > 1 && dates[1] !== dates[0] ? dates[1] : undefined };
}

function detectCategory(title: string, cate: string): EventCategory {
  const t = title + ' ' + cate;
  if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂|演奏/.test(t)) return 'classical';
  if (/歌劇|opera/i.test(t))    return 'opera';
  if (/音樂劇|百老匯/.test(t))  return 'theater';
  if (/舞蹈|芭蕾|現代舞/.test(t))  return 'dance';
  if (/爵士|jazz/i.test(t))     return 'pop';
  if (/歌仔戲|布袋戲|傳統|國樂|偶戲/.test(t)) return 'traditional';
  if (/演唱會|音樂節|流行|搖滾/.test(t)) return 'pop';
  if (/展覽/.test(t))           return 'exhibition';
  if (/講座|工作坊|讀劇|兒童/.test(t)) return 'workshop';
  return 'theater';
}

async function scrapePage(page: number): Promise<{ events: ArtEvent[]; hasMore: boolean }> {
  const url = `${BASE_URL}/program?page=${page}`;
  const data = await http.get(url);
  const $ = cheerio.load(data);

  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  $('a.card-program').each((i, el) => {
    // Skip cancelled events (badge OR title prefix)
    const alert = $(el).find('.card-program__image-alert').text().trim();
    const rawTitle = $(el).find('.card-program__text-title').text().trim() || $(el).attr('title') || '';
    if (alert.includes('取消') || rawTitle.includes('節目取消')) return;

    const href  = $(el).attr('href') ?? '';
    const title = $(el).find('.card-program__text-title').text().trim()
                  || $(el).attr('title')?.trim()
                  || '';
    const rawDate = $(el).find('.card-program__text-date').text().trim();
    const cate    = $(el).find('.card-program__text-cate').text().trim();

    if (!title || !rawDate) return;

    const { start, end } = parseDates(rawDate);
    if (!start) return;
    if ((end ?? start) < today) return;

    const id = href.split('/program/')[1] ?? `${page}-${i}`;
    events.push({
      id: `tpac-${id}`,
      title,
      start,
      end,
      category: detectCategory(title, cate),
      venue: '台北表演藝術中心',
      city: 'Taipei',
      url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
    });
  });

  // Has more if pagination includes next page
  const hasMore = $(`a[href="/program?page=${page + 1}"]`).length > 0
                  || $('a[href*="page="]').filter((_, el) => {
                    const n = parseInt($(el).attr('href')?.match(/page=(\d+)/)?.[1] ?? '0');
                    return n > page;
                  }).length > 0;

  return { events, hasMore };
}

async function main() {
  console.log('Scraping 台北表演藝術中心 (TPAC)…');

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

  console.log(`\n✓ ${all.length} upcoming events from 台北表演藝術中心`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'tpac-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/tpac-events.json');
}

main().catch((err) => console.error('Error:', err.message));
