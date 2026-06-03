/**
 * Legacy 音樂展演空間 scraper
 * URL: https://www.legacy.com.tw/page/programlist/
 *
 * Confirmed structure (server-rendered):
 *   td.program_search_title > a[href="/article/page/AREA/ID"]  — title + link
 *   td containing "演出場地：VENUE"                            — venue name
 *   td containing "演出日期：YYYY-MM-DD(Day)"                  — date
 *
 * Covers: Legacy Taipei, Legacy TERA, Legacy Taichung, Legacy MAX, Legacy MINI
 * All events are pop/live music category.
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/legacy.ts
 * Output: data/legacy-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent } from '../lib/eventTypes';

const BASE_URL = 'https://www.legacy.com.tw';
const LIST_URL = `${BASE_URL}/page/programlist/`;

function detectCity(venue: string, href: string): string {
  if (/taichung|台中/i.test(venue) || href.includes('/taichung/')) return 'Taichung';
  if (/kaohsiung|高雄/i.test(venue)) return 'Kaohsiung';
  return 'Taipei';
}

async function main() {
  console.log('Fetching Legacy events…');

  const data = await http.get(LIST_URL);
  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];
  const seen = new Set<string>();

  // Each event: li > table with td.program_search_title, and tds for venue/date
  $('li').each((_, li) => {
    const titleEl = $(li).find('td.program_search_title a');
    if (!titleEl.length) return;

    const title = titleEl.text().trim();
    const href  = titleEl.attr('href') ?? '';
    const id    = href.split('/').pop() ?? '';

    if (!title || !id || seen.has(id)) return;
    seen.add(id);

    // Find tds containing venue and date by text prefix
    let venue = '';
    let rawDate = '';
    $(li).find('td').each((_, td) => {
      const text = $(td).text().trim();
      if (text.startsWith('演出場地：')) venue   = text.replace('演出場地：', '').trim();
      if (text.startsWith('演出日期：')) rawDate = text.replace('演出日期：', '').trim();
    });

    // Parse "2026-08-29(六)" → "2026-08-29"
    const dateMatch = rawDate.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return;
    const start = dateMatch[1];
    if (start < today) return;

    const city = detectCity(venue, href);
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    events.push({
      id: `legacy-${id}`,
      title,
      start,
      category: 'pop',
      venue: venue || 'Legacy',
      city,
      url: fullUrl,
    });
  });

  console.log(`✓ ${events.length} upcoming events from Legacy`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'legacy-events.json'), JSON.stringify(events, null, 2));
  console.log('Saved → data/legacy-events.json');
}

main().catch(err => console.error('Error:', err.message));
