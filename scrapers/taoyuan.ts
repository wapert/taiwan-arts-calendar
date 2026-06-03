/**
 * 桃園市政府文化局 scraper
 * URL: https://culture.tycg.gov.tw/News.aspx?n=11099&sms=14558
 *
 * Confirmed structure (server-rendered ASP.NET):
 *   Table rows: <tr> containing:
 *     <td><a href="News_Content.aspx?n=11099&s=ID">title</a></td>
 *     <td>ROC date "115-06-05"</td>
 *     (activity date range may be embedded in title or a separate column)
 *
 * ROC year: +1911 = CE year
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/taoyuan.ts
 * Output: data/taoyuan-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL  = 'https://culture.tycg.gov.tw';
const LIST_URL  = `${BASE_URL}/News.aspx?n=11099&sms=14558`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function rocToIso(rocStr: string): string {
  const m = rocStr.match(/(\d{2,3})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (!m) return '';
  return `${parseInt(m[1]) + 1911}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
}

// Extract date range from title text like "6/5-7/25" or "115-06-05 to 115-07-31"
function extractDateFromTitle(title: string, fallbackRoc: string): { start: string; end?: string } {
  // Try ROC range in title: "115-06-05至115-07-31" or "115/06/05~115/07/25"
  const rocRange = title.match(/(\d{2,3}[-\/]\d{1,2}[-\/]\d{1,2})[~至～\-]\s*(\d{2,3}[-\/]\d{1,2}[-\/]\d{1,2})/);
  if (rocRange) {
    return { start: rocToIso(rocRange[1]), end: rocToIso(rocRange[2]) };
  }
  // Try simple month/day range in title: "6/5-7/25"
  const mdRange = title.match(/(\d{1,2})\/(\d{1,2})[~\-](\d{1,2})\/(\d{1,2})/);
  if (mdRange && fallbackRoc) {
    const baseYear = parseInt(fallbackRoc.split('-')[0]) + 1911;
    const start = `${baseYear}-${mdRange[1].padStart(2,'0')}-${mdRange[2].padStart(2,'0')}`;
    const end   = `${baseYear}-${mdRange[3].padStart(2,'0')}-${mdRange[4].padStart(2,'0')}`;
    return { start, end };
  }
  return { start: rocToIso(fallbackRoc) };
}

function detectCategory(title: string): EventCategory {
  if (/交響|音樂會|演奏|弦樂|鋼琴|管樂|古典/.test(title)) return 'classical';
  if (/歌劇|opera/i.test(title))                          return 'opera';
  if (/音樂劇|百老匯/.test(title))                        return 'theater';
  if (/舞蹈|舞作|芭蕾/.test(title))                       return 'dance';
  if (/歌仔戲|布袋戲|傳統|國樂|偶戲/.test(title))         return 'traditional';
  if (/演唱會|音樂節|流行|搖滾/.test(title))              return 'pop';
  if (/展覽|美展|藝術展/.test(title))                     return 'exhibition';
  if (/戲劇|話劇|劇場|劇團/.test(title))                  return 'theater';
  if (/講座|工作坊|課程|研習|競賽|徵件/.test(title))       return 'workshop';
  return 'exhibition';
}

async function scrapePage(url: string): Promise<{ events: ArtEvent[]; nextUrl?: string }> {
  const data = await http.get(url);
  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];

  // Event rows: <tr> containing a link to News_Content.aspx
  $('tr').each((i, el) => {
    const linkEl  = $(el).find('a[href*="News_Content.aspx"]');
    if (!linkEl.length) return;

    const title   = linkEl.text().trim();
    const href    = linkEl.attr('href') ?? '';

    // Get all td text — find ROC date patterns
    const tds = $(el).find('td').map((_, td) => $(td).text().trim()).get();
    const rocDate = tds.find((t) => /^\d{3}-\d{2}-\d{2}$/.test(t)) ?? '';

    if (!title) return;

    const { start, end } = extractDateFromTitle(title, rocDate);
    if (!start) return;

    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    const fullHref = href.startsWith('http') ? href : `${BASE_URL}/${href}`;

    events.push({
      id: `taoyuan-${href.split('s=')[1] ?? i}`,
      title,
      start,
      end: end && end !== start ? end : undefined,
      category: detectCategory(title),
      venue: '桃園市文化局',
      city: 'Taoyuan',
      url: fullHref,
    });
  });

  // Find next page link
  const nextLink = $('a').filter((_, el) => $(el).text().trim() === '下一頁').attr('href');
  const nextUrl  = nextLink ? (nextLink.startsWith('http') ? nextLink : `${BASE_URL}/${nextLink}`) : undefined;

  return { events, nextUrl };
}

async function main() {
  console.log('Scraping 桃園市文化局…');

  const all: ArtEvent[] = [];
  const seen = new Set<string>();
  let url: string | undefined = LIST_URL;
  let page = 1;

  while (url && page <= 5) {
    try {
      const { events, nextUrl } = await scrapePage(url);
      for (const e of events) {
        if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
      }
      process.stdout.write(`\r  Page ${page} — ${all.length} events`);
      url = nextUrl;
      page++;
      if (url) await new Promise((r) => setTimeout(r, 600));
    } catch (err: unknown) {
      console.warn(`\n  Page ${page} failed:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  console.log(`\n✓ ${all.length} upcoming events from 桃園市文化局`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'taoyuan-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/taoyuan-events.json');
}

main().catch((err) => console.error('Error:', err.message));
