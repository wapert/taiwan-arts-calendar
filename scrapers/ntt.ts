/**
 * 臺中國家歌劇院 (NTT) scraper
 * URL: https://www.npac-ntt.org/program/events
 *
 * Confirmed HTML structure:
 *   div.card.ntt
 *     a.img-link[href="/program/events/c-ID"]
 *     div.card-body
 *       h3.card-title > a (title)   + span.events-place (venue)
 *       p.event-time > span  (date: "2026/05/26<b>(二)</b>～2026/06/07<b>(日)</b>")
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/ntt.ts
 * Output: data/ntt-events.json
 */

import * as cheerio from 'cheerio';
import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const BASE_URL = 'https://www.npac-ntt.org';
const LIST_URL = `${BASE_URL}/program/events`;

function parseDates(raw: string): { start: string; end?: string } {
  const dates = [...raw.matchAll(/(\d{4})\/(\d{2})\/(\d{2})/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`
  );
  if (dates.length === 0) return { start: '' };
  if (dates.length === 1) return { start: dates[0] };
  return { start: dates[0], end: dates[dates.length - 1] };
}

function detectCategory(title: string, venue: string): EventCategory {
  const t = title + ' ' + venue;
  if (/交響|室內樂|古典|弦樂|鋼琴|管弦|管樂/.test(t)) return 'classical';
  if (/歌劇|opera/i.test(t))                            return 'opera';
  if (/音樂劇|百老匯/.test(t))                          return 'theater';
  if (/舞蹈|芭蕾|現代舞/.test(t))                       return 'dance';
  if (/歌仔戲|布袋戲|國樂|傳統|戲曲|偶戲/.test(t))     return 'traditional';
  if (/演唱會|音樂節|搖滾|流行/.test(t))                return 'pop';
  if (/展覽/.test(t))                                    return 'exhibition';
  if (/工作坊|講座|課程|電影/.test(t))                  return 'workshop';
  if (/音樂/.test(t))                                    return 'classical';
  return 'theater';
}

async function main() {
  console.log(`Fetching NTT events…`);

  const data = await http.get(LIST_URL);

  const $ = cheerio.load(data);
  const today = new Date().toISOString().slice(0, 10);
  const events: ArtEvent[] = [];
  const seen = new Set<string>();

  $('div.card.ntt').each((i, el) => {
    const href  = $(el).find('a.img-link').attr('href') ?? '';
    const id    = href.split('/').pop() ?? `${i}`;
    if (!href || seen.has(id)) return;
    seen.add(id);

    const title  = $(el).find('h3.card-title > a').first().text().trim();
    const venue  = $(el).find('span.events-place').text().replace(/\s/g, '').trim();
    // Get text from p.event-time, stripping <b> tags (day-of-week)
    const rawDate = $(el).find('p.event-time').text().trim();

    if (!title || !rawDate) return;

    const { start, end } = parseDates(rawDate);
    if (!start) return;

    const endOrStart = end ?? start;
    if (endOrStart < today) return;

    events.push({
      id: `ntt-${id}`,
      title,
      start,
      end: end !== start ? end : undefined,
      category: detectCategory(title, venue),
      venue: venue ? `國家歌劇院・${venue}` : '國家歌劇院',
      city: 'Taichung',
      url: `${BASE_URL}${href}`,
    });
  });

  console.log(`✓ ${events.length} upcoming events from 國家歌劇院`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'ntt-events.json'), JSON.stringify(events, null, 2));
  console.log('Saved → data/ntt-events.json');
}

main().catch((err) => console.error('Error:', err.message));
