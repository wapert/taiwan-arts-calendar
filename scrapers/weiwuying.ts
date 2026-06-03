/**
 * 衛武營國家藝術文化中心 scraper
 *
 * Uses the internal JSON API discovered via Puppeteer network interception:
 *   GET /api/programs/list?size=50&start=UNIX&end=UNIX&catalog_type=program&page=N&chineseOnShelf=true
 *
 * The website homepage only shows a 30-day window (size=6).
 * We fetch a 9-month window and paginate to get all upcoming events.
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/weiwuying.ts
 * Output: data/weiwuying-events.json
 */

import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL  = 'https://www.npac-weiwuying.org';
const PAGE_SIZE = 50;
const MONTHS    = 9; // how many months ahead to fetch

function tsToIso(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toISOString().slice(0, 10);
}

function detectCategory(title: string): EventCategory {
  if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂|演奏|音樂會|協奏/.test(title)) return 'classical';
  if (/歌劇|opera/i.test(title))    return 'opera';
  if (/音樂劇|百老匯/.test(title))  return 'theater';
  if (/舞蹈|芭蕾|現代舞|舞作/.test(title)) return 'dance';
  if (/歌仔戲|布袋戲|國樂|傳統|戲曲|偶戲|馬戲/.test(title)) return 'traditional';
  if (/演唱會|音樂節|搖滾|流行/.test(title)) return 'pop';
  if (/展覽|裝置/.test(title))      return 'exhibition';
  if (/工作坊|講座|課程|論壇/.test(title)) return 'workshop';
  if (/音樂/.test(title))           return 'classical';
  if (/戲劇|劇場|劇團/.test(title)) return 'theater';
  return 'theater';
}

interface Row {
  _id: string;
  chinese: { title: string; site?: { site?: string }; };
  dateTime: { first: number; discrete: Array<{ time: number }> };
  activity?: { ticket?: { link?: string } };
}

interface ApiResponse {
  count: number;
  rows: Row[];
}

async function fetchPage(start: number, end: number, page: number): Promise<ApiResponse> {
  const url = `${BASE_URL}/api/programs/list?size=${PAGE_SIZE}&start=${start}&end=${end}&catalog_type=program&page=${page}&chineseOnShelf=true`;
  return http.getJson<ApiResponse>(url, {
    headers: { 'Referer': `${BASE_URL}/programs` },
  });
}

async function main() {
  const now     = Math.floor(Date.now() / 1000);
  const endTime = now + MONTHS * 30 * 24 * 3600;
  const today   = new Date().toISOString().slice(0, 10);

  console.log(`Fetching 衛武營 events (next ${MONTHS} months via API)…`);

  const all: ArtEvent[] = [];
  const seen = new Set<string>();
  let page = 1;

  // First call to get total count
  const first = await fetchPage(now, endTime, page);
  const total = first.count;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`  Total events in API: ${total} (${totalPages} pages)`);

  const processRows = (rows: Row[]) => {
    for (const row of rows) {
      if (seen.has(row._id)) continue;
      seen.add(row._id);

      const title = row.chinese?.title?.trim();
      if (!title) continue;

      const firstTs = row.dateTime?.first;
      if (!firstTs) continue;

      const start = tsToIso(firstTs);
      const discrete = row.dateTime?.discrete ?? [];
      const lastTs   = discrete.length > 0
        ? discrete[discrete.length - 1].time
        : firstTs;
      const end = tsToIso(lastTs);

      if ((end || start) < today) continue;

      const ticketLink = row.activity?.ticket?.link;

      all.push({
        id: `weiwuying-${row._id}`,
        title,
        start,
        end: end !== start ? end : undefined,
        category: detectCategory(title),
        venue: '衛武營國家藝術文化中心',
        city: 'Kaohsiung',
        url: ticketLink || `${BASE_URL}/programs/${row._id}?lang=zh`,
      });
    }
  };

  processRows(first.rows);

  for (page = 2; page <= totalPages; page++) {
    const res = await fetchPage(now, endTime, page);
    processRows(res.rows);
    process.stdout.write(`\r  Page ${page}/${totalPages} — ${all.length} events`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✓ ${all.length} upcoming events from 衛武營`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'weiwuying-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/weiwuying-events.json');
}

main().catch(err => console.error('Error:', err.message));
