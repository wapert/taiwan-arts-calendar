/**
 * 台北市文化局 藝文活動通 scraper
 * URL: https://cultureexpress.taipei/Event/C000003
 *
 * Confirmed HTML structure (server-rendered):
 *   div.card > a.kf-img[href="/Event/C000003?ID=GUID&PageIndex=1&PageType=1"]
 *     > div.card-body
 *         p.card-date   — ROC dates "115/06/03 <span>(三)</span> 115/07/31"
 *         span.card-badge — category label
 *         div.rd-tit    — event title
 *         ul.card-text-list > li  — "活動地點：venue" / "活動票價：price"
 *
 * Pagination: /Event/C000003?&PageIndex=N  (27 pages, 10 events/page)
 * ROC year conversion: ROC year + 1911 = CE year
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/cultureexpress.ts
 * Output: data/cultureexpress-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL   = 'https://cultureexpress.taipei';
const LIST_BASE  = `${BASE_URL}/Event/C000003?&PageIndex=`;
const TOTAL_PAGES = 27;

// ROC date "115/06/03" → "2026-06-03"
function rocToIso(rocDate: string): string {
  const m = rocDate.match(/(\d{2,3})\/(\d{2})\/(\d{2})/);
  if (!m) return '';
  const year = parseInt(m[1]) + 1911;
  return `${year}-${m[2]}-${m[3]}`;
}

function detectCategory(title: string, badge: string): EventCategory {
  const t = title + ' ' + badge;
  if (/交響|室內樂|古典|弦樂|鋼琴|管弦|管樂|音樂會|音樂節|演奏/.test(t)) return 'classical';
  if (/歌劇|opera/i.test(t))                                               return 'opera';
  if (/音樂劇|百老匯/.test(t))                                             return 'theater';
  if (/舞蹈|芭蕾|現代舞|舞作/.test(t))                                     return 'dance';
  if (/歌仔戲|布袋戲|偶戲|國樂|傳統|戲曲/.test(t))                        return 'traditional';
  if (/演唱會|搖滾|流行|hip.hop/.test(t))                                  return 'pop';
  if (/展覽|展出|裝置|美術|藝術展/.test(t))                                return 'exhibition';
  if (/戲劇|話劇|劇場|劇團|音樂劇/.test(t))                               return 'theater';
  if (/講座|工作坊|課程|研習|論壇|競賽|徵件/.test(t))                     return 'workshop';
  return 'exhibition'; // default for culture bureau events
}

async function scrapePage(pageIndex: number): Promise<ArtEvent[]> {
  const url = `${LIST_BASE}${pageIndex}`;
  const data = await http.get(url);

  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  $('div.card').each((i, el) => {
    const link  = $(el).find('a.kf-img').attr('href') ?? '';
    // Extract just the ID from the href
    const idMatch = link.match(/ID=([a-f0-9\-]+)/);
    if (!idMatch) return;
    const id = idMatch[1];

    const title  = $(el).find('div.rd-tit').text().trim();
    const badge  = $(el).find('span.card-badge').text().trim();
    const rawDate = $(el).find('p.card-date').text().trim();

    // Extract venue from list items: "活動地點：xxx"
    let venue = '';
    $(el).find('ul.card-text-list li').each((_, li) => {
      const text = $(li).text().trim();
      if (text.startsWith('活動地點：')) {
        venue = text.replace('活動地點：', '').trim();
      }
    });

    if (!title || !rawDate) return;

    // Parse ROC dates — may have two dates (start + end)
    const rocDates = [...rawDate.matchAll(/\d{2,3}\/\d{2}\/\d{2}/g)].map((m) => m[0]);
    if (rocDates.length === 0) return;

    const start = rocToIso(rocDates[0]);
    const end   = rocDates.length > 1 ? rocToIso(rocDates[rocDates.length - 1]) : undefined;
    if (!start) return;

    // Skip past events
    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    events.push({
      id: `cultureexpress-${id}`,
      title,
      start,
      end: end !== start ? end : undefined,
      category: detectCategory(title, badge),
      venue: venue || '台北市',
      city: 'Taipei',
      url: `${BASE_URL}${link.replace(/&amp;/g, '&')}`,
    });
  });

  return events;
}

async function main() {
  console.log(`Scraping cultureexpress.taipei (${TOTAL_PAGES} pages)…`);
  const all: ArtEvent[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      const events = await scrapePage(page);
      for (const e of events) {
        if (!seen.has(e.id)) {
          seen.add(e.id);
          all.push(e);
        }
      }
      process.stdout.write(`\r  Page ${page}/${TOTAL_PAGES} — ${all.length} events so far`);
      // Polite delay
      await new Promise((r) => setTimeout(r, 800));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`\n  Page ${page} failed: ${msg}`);
    }
  }

  console.log(`\n✓ ${all.length} upcoming events from 台北市文化局`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'cultureexpress-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/cultureexpress-events.json');
}

main().catch((err) => console.error('Error:', err.message));
