/**
 * 臺北流行音樂中心 (TMC / 北流) scraper
 * URL: https://www.tmc.taipei/tw/blog/show?filter=eyJkaXJlY3Rpb24iOiJsYXN0ZXN0In0=
 *
 * Confirmed structure (server-rendered):
 *   a.c-card-clip-wrap[href="https://www.tmc.taipei/tw/blog/show/SLUG"][title="TITLE"]
 *     div.c-card-clip__content
 *       span.c-tag.main        — category tag (展覽 / 演出 / 活動 ...)
 *       h3.c-card-clip__title  — event title
 *       div.c-card-clip__info
 *         span.date            — "2026.06.06 (六) ~ 2026.06.07 (日)" or single date
 *         span.location        — venue name
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/tmc.ts
 * Output: data/tmc-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL  = 'https://www.tmc.taipei';
const LIST_URL  = `${BASE_URL}/tw/blog/show?filter=eyJkaXJlY3Rpb24iOiJsYXN0ZXN0In0=`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function parseDates(raw: string): { start: string; end?: string } {
  // "2026.06.06 (六) ~ 2026.06.07 (日)" or "2021.09.18 (六) ~ 2030.12.31 (二)"
  const dates = [...raw.matchAll(/(\d{4})\.(\d{2})\.(\d{2})/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`
  );
  if (dates.length === 0) return { start: '' };
  return { start: dates[0], end: dates.length > 1 && dates[1] !== dates[0] ? dates[1] : undefined };
}

function detectCategory(title: string, tag: string): EventCategory {
  const t = title + ' ' + tag;
  if (tag === '展覽')            return 'exhibition';
  if (/演唱會|流行|搖滾|hip.hop|嘻哈/.test(t)) return 'pop';
  if (/交響|古典|室內樂|爵士/.test(t)) return 'classical';
  if (/音樂劇/.test(t))         return 'theater';
  if (/舞蹈/.test(t))           return 'dance';
  if (/傳統|國樂/.test(t))      return 'traditional';
  if (/講座|工作坊|課程|競賽/.test(t)) return 'workshop';
  return 'pop'; // TMC bias toward pop music
}

async function main() {
  console.log('Scraping 臺北流行音樂中心 (TMC)…');

  const data = await http.get(LIST_URL);
  const $ = cheerio.load(data);

  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];
  const seen = new Set<string>();

  $('a.c-card-clip-wrap').each((i, el) => {
    const href  = $(el).attr('href') ?? '';
    const title = $(el).find('h3.c-card-clip__title').text().trim()
                  || $(el).attr('title')?.trim()
                  || '';
    const rawDate = $(el).find('span.date').text().trim();
    const venue   = $(el).find('span.location').text().trim();
    const tag     = $(el).find('span.c-tag').first().text().trim();

    if (!title || !rawDate) return;

    const { start, end } = parseDates(rawDate);
    if (!start) return;
    if ((end ?? start) < today) return;

    const slug = href.split('/blog/show/')[1] ?? `${i}`;
    if (seen.has(slug)) return;
    seen.add(slug);

    events.push({
      id: `tmc-${slug}`,
      title,
      start,
      end,
      category: detectCategory(title, tag),
      venue: venue ? `臺北流行音樂中心・${venue}` : '臺北流行音樂中心',
      city: 'Taipei',
      url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
    });
  });

  console.log(`✓ ${events.length} upcoming events from 臺北流行音樂中心`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'tmc-events.json'), JSON.stringify(events, null, 2));
  console.log('Saved → data/tmc-events.json');
}

main().catch((err) => console.error('Error:', err.message));
