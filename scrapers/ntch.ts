/**
 * 國家兩廳院 (NTCH) scraper — GraphQL API (no Puppeteer needed)
 * Endpoint: https://npac-ntch.org/tms/graphql
 *
 * Discovered by intercepting the site's own React app network calls.
 * Operation: MonthlyPrograms, fetched per-month and merged.
 *
 * Halls: 1=國家戲劇院, 2=國家音樂廳, 3=演奏廳, 4=實驗劇場
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/ntch.ts
 * Output: data/ntch-events.json
 */

import * as http from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const GQL_URL = 'https://npac-ntch.org/tms/graphql';
const BASE_URL = 'https://npac-ntch.org';

const HALL_NAMES: Record<string, string> = {
  '1': '國家戲劇院',
  '2': '國家音樂廳',
  '3': '演奏廳',
  '4': '實驗劇場',
  '281': '表演藝術圖書館',
};

// Map NTCH program type → our category
function detectCategory(title: string, hallId: string): EventCategory {
  const t = title;
  const h = HALL_NAMES[hallId] ?? '';

  if (/交響|管弦|弦樂|鋼琴|室內樂|古典|管樂|協奏/.test(t) || h === '國家音樂廳' || h === '演奏廳')
    return 'classical';
  if (/歌劇|opera/i.test(t))    return 'opera';
  if (/音樂劇|百老匯/.test(t))  return 'theater';
  if (/舞蹈|芭蕾|現代舞|雲門/.test(t)) return 'dance';
  if (/歌仔戲|布袋戲|偶戲|國樂|傳統|戲曲/.test(t)) return 'traditional';
  if (/演唱會|搖滾|流行/.test(t)) return 'pop';
  if (/講座|工作坊|課程/.test(t)) return 'workshop';
  if (h === '國家戲劇院' || h === '實驗劇場') return 'theater';
  return 'theater';
}

const GQL_QUERY = `
query MonthlyPrograms(
  $startFrom: DateOnly, $endOn: DateOnly,
  $limit: Int = 200, $offset: Int = 0,
  $types: [ProgramType!]
) {
  programs(
    startFrom: $startFrom endOn: $endOn
    limit: $limit offset: $offset types: $types
  ) {
    id cancelled title engTitle purchaseLink
    performanceSchedules {
      id date
      hall { id name }
    }
  }
}`;

interface GQLProgram {
  id: string;
  cancelled: boolean;
  title: string;
  engTitle: string;
  purchaseLink: string | null;
  performanceSchedules: Array<{
    id: string;
    date: string;
    hall: { id: string; name: string };
  }>;
}

async function fetchMonth(startFrom: string, endOn: string): Promise<GQLProgram[]> {
  const body = [{
    operationName: 'MonthlyPrograms',
    variables: {
      limit: 200, offset: 0,
      types: ['GENERAL','PARTNER','TOUR','SPECIAL','NSO','HOST','CO_ORGANIZE','CO_HOST'],
      startFrom,
      endOn,
    },
    query: GQL_QUERY,
  }];

  const data = await http.postJson<Array<{ data: { programs: GQLProgram[] } }>>(GQL_URL, body, {
    headers: { 'Origin': 'https://npac-ntch.org', 'Referer': 'https://npac-ntch.org/zh/programs' },
  });

  return data[0]?.data?.programs ?? [];
}

function monthRange(start: Date, months: number): Array<{ startFrom: string; endOn: string }> {
  const ranges = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    ranges.push({
      startFrom: `${d.getFullYear()}-${mm}-01`,
      endOn:     `${d.getFullYear()}-${mm}-${lastDay}`,
    });
  }
  return ranges;
}

async function main() {
  console.log('Fetching NTCH events via GraphQL…');

  const now   = new Date();
  const today = now.toISOString().slice(0, 10);
  const ranges = monthRange(now, 6); // fetch next 6 months

  const seen = new Set<string>();
  const artEvents: ArtEvent[] = [];

  for (const { startFrom, endOn } of ranges) {
    console.log(`  ${startFrom} → ${endOn}`);
    const programs = await fetchMonth(startFrom, endOn);

    for (const p of programs) {
      if (p.cancelled || seen.has(p.id)) continue;
      seen.add(p.id);

      const schedules = p.performanceSchedules.filter((s) => s.date >= today);
      if (schedules.length === 0) continue;

      const start = schedules[0].date;
      const end   = schedules[schedules.length - 1].date;
      const hall  = schedules[0].hall;

      artEvents.push({
        id: `ntch-${p.id}`,
        title: p.title,
        start,
        end: end !== start ? end : undefined,
        category: detectCategory(p.title, hall.id),
        venue: `國家兩廳院・${hall.name}`,
        city: 'Taipei',
        url: p.purchaseLink ?? `${BASE_URL}/zh/programs/${p.id}`,
      });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`✓ ${artEvents.length} upcoming events from 國家兩廳院`);

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'ntch-events.json'), JSON.stringify(artEvents, null, 2));
  console.log('Saved → data/ntch-events.json');
}

main().catch((err) => console.error('Error:', err.message));
