/**
 * OpenTix 兩廳院文化生活 scraper
 * API: https://csm.api.opentix.life/programs?page=N&rowCount=50
 *
 * Discovered via Puppeteer network interception from:
 *   https://www.opentix.life/search/%20/ABOUT_TO_BEGIN?category=戲劇-現代戲劇&...&type=programs
 *
 * Event fields:
 *   id, name, displayCategory, startDateTime (Unix s), endDateTime (Unix s), cities[]
 *
 * City filter: only keep our target cities (北/中/南部)
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/opentix.ts
 * Output: data/opentix-events.json
 */

import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const API_BASE   = 'https://csm.api.opentix.life';
const BASE_URL   = 'https://www.opentix.life';
const ROW_COUNT  = 50;
const MONTHS     = 9;

// Target cities we care about (tw name → our city key)
const CITY_MAP: Record<string, string> = {
  '台北': 'Taipei',  '臺北': 'Taipei',  '基隆': 'Taipei',
  '新北': 'NewTaipei', '新北市': 'NewTaipei',
  '新竹': 'Hsinchu',
  '桃園': 'Taoyuan',
  '台中': 'Taichung', '臺中': 'Taichung',
  '台南': 'Tainan',   '臺南': 'Tainan',
  '高雄': 'Kaohsiung',
};

// Map OpenTix displayCategory → our EventCategory
function mapCategory(cat: string, title: string): EventCategory {
  if (cat === '舞蹈') return 'dance';
  if (cat === '展覽') return 'exhibition';
  if (cat === '音樂') {
    if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂/.test(title)) return 'classical';
    if (/歌劇|opera/i.test(title)) return 'opera';
    if (/演唱會|流行|搖滾/.test(title)) return 'pop';
    return 'classical';
  }
  if (cat === '戲劇') {
    if (/音樂劇/.test(title)) return 'theater';
    if (/歌仔戲|布袋戲|客家戲|傳統|偶戲|馬戲/.test(title)) return 'traditional';
    if (/歌劇|opera/i.test(title)) return 'opera';
    return 'theater';
  }
  if (/工作坊|講座|課程/.test(title)) return 'workshop';
  return 'theater';
}

function tsToIso(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

interface Row {
  id: string;
  name: string;
  displayCategory: string;
  startDateTime: number;
  endDateTime: number;
  cities: string[];
  imageUrl?: string;
}

interface ApiResponse {
  result: { nextPage: number | null; data: Row[] };
}

async function fetchPage(page: number): Promise<ApiResponse> {
  const url = `${API_BASE}/programs?page=${page}&rowCount=${ROW_COUNT}`;
  return http.getJson<ApiResponse>(url, {
    headers: { 'Referer': `${BASE_URL}/search/%20/ABOUT_TO_BEGIN?type=programs` },
  });
}

async function main() {
  const now   = Math.floor(Date.now() / 1000);
  const endTs = now + MONTHS * 30 * 24 * 3600;
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Fetching OpenTix programs (next ${MONTHS} months)…`);

  const all: ArtEvent[] = [];
  const seen = new Set<string>();
  let page = 1;

  while (true) {
    const res = await fetchPage(page);
    const rows: Row[] = res?.result?.data ?? [];
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);

      // Date filter: event must end after today and start before our window
      if (row.endDateTime < now || row.startDateTime > endTs) continue;

      // City filter: must include at least one target city
      const city = (row.cities ?? []).map(c => CITY_MAP[c]).find(Boolean);
      if (!city) continue;

      const start = tsToIso(row.startDateTime);
      const end   = tsToIso(row.endDateTime);
      if (start < today) continue;

      all.push({
        id: `opentix-${row.id}`,
        title: row.name,
        start,
        end: end !== start ? end : undefined,
        category: mapCategory(row.displayCategory, row.name),
        venue: 'OpenTix',
        city,
        url: `${BASE_URL}/event/${row.id}`,
      });
    }

    process.stdout.write(`\r  Page ${page} — ${all.length} events`);

    if (!res?.result?.nextPage) break;
    page++;
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✓ ${all.length} upcoming events from OpenTix`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'opentix-events.json'), JSON.stringify(all, null, 2));
  console.log('Saved → data/opentix-events.json');
}

main().catch(err => console.error('Error:', err.message));
