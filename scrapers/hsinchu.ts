/**
 * 新竹市文化局 scraper
 * URL: https://culture.hccg.gov.tw/ch/home.jsp?id=9&parentpath=0,1
 *
 * Confirmed structure (server-rendered JSP):
 *   div.css_tr.list_list
 *     div.css_td.list_title > a[href, title]   ← event title (may include [類型] prefix)
 *     div.css_td.list_date_activity             ← "115-06-03~115-06-14" (ROC date range)
 *     div.css_td.list_date                      ← publish date
 *
 * Pagination: POST to home.jsp with page=N, pagesize=15
 * ROC year: +1911 = CE year
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/hsinchu.ts
 * Output: data/hsinchu-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL  = 'https://culture.hccg.gov.tw';
const POST_URL  = `${BASE_URL}/ch/home.jsp`;
const PAGE_SIZE = 15;
const MAX_PAGES = 10; // safety cap

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer': `${BASE_URL}/ch/home.jsp?id=9&parentpath=0,1`,
};

function rocToIso(rocStr: string): string {
  const m = rocStr.match(/(\d{2,3})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${parseInt(m[1]) + 1911}-${m[2]}-${m[3]}`;
}

function detectCategory(title: string): EventCategory {
  // Title often starts with [類型] bracket hints
  if (/\[展覽\]|展覽|展出|美術|裝置/.test(title))        return 'exhibition';
  if (/\[音樂\]|交響|音樂會|演奏|弦樂|鋼琴|管樂/.test(title)) return 'classical';
  if (/\[舞蹈\]|舞蹈|舞作|芭蕾/.test(title))             return 'dance';
  if (/\[戲劇\]|戲劇|話劇|劇場|音樂劇/.test(title))      return 'theater';
  if (/歌仔戲|布袋戲|傳統|國樂|偶戲/.test(title))        return 'traditional';
  if (/演唱會|音樂節|流行/.test(title))                  return 'pop';
  if (/\[講座\]|工作坊|講座|課程|研習/.test(title))       return 'workshop';
  return 'workshop';
}

async function fetchPage(pageNo: number): Promise<{ events: ArtEvent[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    id: '9',
    parentpath: '0,1',
    mcustomize: '',
    page: String(pageNo),
    pagesize: String(PAGE_SIZE),
    intpage: '1',
  });

  const data = await http.post(POST_URL, params.toString(), {
    headers: { 'Referer': `${BASE_URL}/ch/home.jsp?id=9&parentpath=0,1` },
  });

  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  $('div.css_tr.list_list').each((i, el) => {
    const titleEl = $(el).find('div.css_td.list_title a');
    const title   = titleEl.attr('title')?.trim() || titleEl.text().trim();
    const rawDate = $(el).find('div.css_td.list_date_activity').text().trim();
    const href    = titleEl.attr('href') ?? '';

    if (!title || !rawDate) return;

    // Parse ROC range "115-06-03~115-06-14"
    const parts = rawDate.split('~');
    const start = rocToIso(parts[0].trim());
    const end   = parts.length > 1 ? rocToIso(parts[1].trim()) : undefined;
    if (!start) return;

    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    const fullHref = href.startsWith('http')
      ? href
      : `${BASE_URL}/ch/${href.replace(/^\/ch\//, '')}`;

    events.push({
      id: `hsinchu-${Buffer.from(title + start).toString('base64').slice(0, 16)}`,
      title: title.replace(/^(\[[^\]]+\]\s*)+/, '').trim(), // strip all leading [bracket] tags
      start,
      end: end && end !== start ? end : undefined,
      category: detectCategory(title),
      venue: '新竹市文化局',
      city: 'Hsinchu',
      url: fullHref,
    });
  });

  const hasMore = $('div.css_tr.list_list').length === PAGE_SIZE;
  return { events, hasMore };
}

async function main() {
  console.log('Scraping 新竹市文化局…');

  const all: ArtEvent[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const { events, hasMore } = await fetchPage(page);
      for (const e of events) {
        if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
      }
      process.stdout.write(`\r  Page ${page} — ${all.length} events`);
      if (!hasMore) break;
      await new Promise((r) => setTimeout(r, 600));
    } catch (err: unknown) {
      console.warn(`\n  Page ${page} failed:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  console.log(`\n✓ ${all.length} upcoming events from 新竹市文化局`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'hsinchu-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/hsinchu-events.json');
}

main().catch((err) => console.error('Error:', err.message));
