/**
 * NPAC venues scraper — covers:
 *   國家兩廳院  https://npac-ntch.org
 *   北部流行音樂中心  https://northflow.org.tw
 *   國家歌劇院(台中)  https://npac-ntt.org
 *   衛武營  https://npac-weiwuying.org
 *
 * Run: npx ts-node scrapers/npac.ts
 * Output: data/npac-events.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

interface VenueConfig {
  name: string;
  city: string;
  baseUrl: string;
  eventsPath: string;
  selectors: {
    item: string;
    title: string;
    date: string;
    link: string;
    category?: string;
  };
}

const VENUES: VenueConfig[] = [
  {
    name: '國家兩廳院',
    city: 'Taipei',
    baseUrl: 'https://npac-ntch.org',
    eventsPath: '/programs',
    selectors: {
      item: '.program-item',
      title: '.program-title',
      date: '.program-date',
      link: 'a',
    },
  },
  {
    name: '北部流行音樂中心',
    city: 'Taipei',
    baseUrl: 'https://www.northflow.org.tw',
    eventsPath: '/activity/list',
    selectors: {
      item: '.activity-item',
      title: '.activity-name',
      date: '.activity-date',
      link: 'a',
    },
  },
  {
    name: '國家歌劇院',
    city: 'Taichung',
    baseUrl: 'https://npac-ntt.org',
    eventsPath: '/programs',
    selectors: {
      item: '.program-item',
      title: '.program-title',
      date: '.program-date',
      link: 'a',
    },
  },
  {
    name: '衛武營國家藝術文化中心',
    city: 'Kaohsiung',
    baseUrl: 'https://npac-weiwuying.org',
    eventsPath: '/programs',
    selectors: {
      item: '.program-item',
      title: '.program-title',
      date: '.program-date',
      link: 'a',
    },
  },
];

// Keyword-based category detection (繁體中文)
function detectCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (/交響|室內樂|弦樂|鋼琴|管弦|協奏|古典/.test(t)) return 'classical';
  if (/演唱會|音樂祭|搖滾|流行|hip.hop|嘻哈/.test(t)) return 'pop';
  if (/歌劇|opera|合唱|聲樂/.test(t)) return 'opera';
  if (/舞蹈|舞作|芭蕾|現代舞|雲門/.test(t)) return 'dance';
  if (/音樂劇|戲劇|話劇|劇場|劇團/.test(t)) return 'theater';
  if (/歌仔戲|布袋戲|國樂|傳統|民俗/.test(t)) return 'traditional';
  if (/展覽|展出|裝置|視覺/.test(t)) return 'exhibition';
  if (/工作坊|講座|workshop|talk/.test(t)) return 'workshop';
  return 'theater'; // default for performing arts venues
}

async function scrapeVenue(venue: VenueConfig): Promise<ArtEvent[]> {
  const url = `${venue.baseUrl}${venue.eventsPath}`;
  console.log(`Fetching ${url}…`);

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 TaiwanArtsCalendar/1.0' },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    const events: ArtEvent[] = [];

    $(venue.selectors.item).each((i, el) => {
      const title = $(el).find(venue.selectors.title).text().trim();
      const rawDate = $(el).find(venue.selectors.date).text().trim();
      const href = $(el).find(venue.selectors.link).attr('href') ?? '';
      const link = href.startsWith('http') ? href : `${venue.baseUrl}${href}`;

      if (!title || !rawDate) return;

      // Normalise date: accept YYYY-MM-DD, YYYY/MM/DD, 民國 etc.
      const dateMatch = rawDate.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (!dateMatch) return;
      const start = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;

      events.push({
        id: `npac-${venue.name}-${i}`,
        title,
        start,
        category: detectCategory(title),
        venue: venue.name,
        city: venue.city,
        url: link,
      });
    });

    console.log(`  ✓ ${events.length} events from ${venue.name}`);
    return events;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  ✗ Failed to scrape ${venue.name}: ${message}`);
    return [];
  }
}

async function main() {
  const all: ArtEvent[] = [];

  for (const venue of VENUES) {
    const events = await scrapeVenue(venue);
    all.push(...events);
  }

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'npac-events.json'), JSON.stringify(all, null, 2));
  console.log(`\nSaved ${all.length} events to data/npac-events.json`);
}

main();
