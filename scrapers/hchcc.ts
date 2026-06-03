/**
 * 新竹縣文化局 (hchcc.gov.tw) scraper — 演藝廳 performance schedule
 * URL: https://www.hchcc.gov.tw/Tw/ArtMuseum/ActList?filter=8961630F-BD1B-4576-A844-2A4C1E2D49B4
 *
 * Confirmed structure (server-rendered):
 *   a[href*="ActDetail"][title="EVENT TITLE"]
 *     div.list_block > div.list_date   — "2026/08/15\n~2026/08/15\n◷ 14:30"
 *     div.list_block > div.list_item > div.list_title
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/hchcc.ts
 * Output: data/hchcc-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL = 'https://www.hchcc.gov.tw';
const LIST_URL = `${BASE_URL}/Tw/ArtMuseum/ActList?filter=8961630F-BD1B-4576-A844-2A4C1E2D49B4`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function parseDate(raw: string): { start: string; end?: string } {
  // Format: "2026/08/15\n~2026/08/15\n◷ 14:30" or "2026/06/05~06/07"
  const dates = [...raw.matchAll(/(\d{4})\/(\d{2})\/(\d{2})/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`
  );
  if (dates.length === 0) return { start: '' };
  if (dates.length === 1) return { start: dates[0] };
  return { start: dates[0], end: dates[dates.length - 1] };
}

function detectCategory(title: string): EventCategory {
  if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂|演奏|音樂會/.test(title)) return 'classical';
  if (/歌劇|opera/i.test(title))   return 'opera';
  if (/音樂劇|百老匯/.test(title)) return 'theater';
  if (/舞蹈|芭蕾|現代舞/.test(title)) return 'dance';
  if (/兒童劇|親子劇|童話/.test(title)) return 'theater';
  if (/歌仔戲|布袋戲|傳統|國樂|客語|民謠/.test(title)) return 'traditional';
  if (/演唱會|流行|搖滾/.test(title)) return 'pop';
  if (/展覽/.test(title)) return 'exhibition';
  if (/講座|工作坊|課程|徵件/.test(title)) return 'workshop';
  return 'theater';
}

async function main() {
  console.log('Fetching 新竹縣文化局 events…');

  const data = await http.get(LIST_URL);
  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  $('a[href*="ActDetail"]').each((i, el) => {
    const href  = $(el).attr('href') ?? '';
    const title = $(el).attr('title')?.trim() ?? $(el).find('.list_title').text().trim();
    if (!title || !href.includes('id=')) return;

    const rawDate = $(el).find('.list_date').text().trim();
    const { start, end } = parseDate(rawDate);
    if (!start) return;

    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    const id = href.match(/id=([a-f0-9\-]+)/i)?.[1] ?? `${i}`;
    const fullHref = href.startsWith('http') ? href : `${BASE_URL}/Tw/ArtMuseum/${href}`;

    events.push({
      id: `hchcc-${id}`,
      title,
      start,
      end: end && end !== start ? end : undefined,
      category: detectCategory(title),
      venue: '新竹縣文化局演藝廳',
      city: 'Hsinchu',
      url: fullHref,
    });
  });

  console.log(`✓ ${events.length} upcoming events from 新竹縣文化局`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'hchcc-events.json'), JSON.stringify(events, null, 2));
  console.log('Saved → data/hchcc-events.json');
}

main().catch((err) => console.error('Error:', err.message));
