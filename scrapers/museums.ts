/**
 * 美術館 & 文化館 scraper — six museums via Puppeteer
 *
 * Venues:
 *   TFAM  台北市立美術館  https://www.tfam.museum
 *   KMFA  高雄市立美術館  https://www.kmfa.gov.tw
 *   ChiMei 奇美博物館    https://www.chimeimuseum.org
 *   CKSMH 中正紀念堂     https://www.cksmh.gov.tw
 *   NMH   台北歷史博物館  https://www.nmh.gov.tw
 *
 * Run: npx ts-node --project tsconfig.scraper.json scrapers/museums.ts
 * Output: data/museums-events.json
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require('puppeteer');
import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent, EventCategory } from '../lib/eventTypes';

const today = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();

function parseDate(raw: string): string {
  if (!raw) return '';
  // YYYY/MM/DD or YYYY.MM.DD or YYYY-MM-DD
  const m = raw.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // MM.DD (KMFA short format — assume current year)
  const md = raw.match(/^(\d{1,2})\.(\d{2})$/);
  if (md) return `${currentYear}-${md[1].padStart(2,'0')}-${md[2]}`;
  return '';
}

function parseDateRange(raw: string): { start: string; end?: string } {
  const parts = raw.split(/[\-~～至]/).map(s => s.trim()).filter(Boolean);
  const start = parseDate(parts[0]);
  const end   = parts[1] ? parseDate(parts[1]) : undefined;
  return { start, end };
}

function makeEvent(opts: {
  id: string; title: string; start: string; end?: string;
  venue: string; city: string; url: string;
  category?: EventCategory;
}): ArtEvent | null {
  if (!opts.title || !opts.start) return null;
  // Include if still running: end date is today or future
  // OR if no end date: start must be today or future
  const activeUntil = opts.end || opts.start;
  if (activeUntil < today) return null;
  // Filter junk titles
  const junk = ['下方連結','更新日期','相關連結',':::','回上頁','更多'];
  if (junk.some(j => opts.title.includes(j)) || opts.title.length < 4) return null;
  return {
    id: opts.id,
    title: opts.title,
    start: opts.start,
    end: opts.end && opts.end !== opts.start ? opts.end : undefined,
    category: opts.category ?? 'exhibition',
    venue: opts.venue,
    city: opts.city,
    url: opts.url,
  };
}

// ── TFAM ──────────────────────────────────────────────────────────────────
async function scrapeTFAM(page: any): Promise<ArtEvent[]> {
  console.log('  Scraping TFAM…');
  await page.goto('https://www.tfam.museum/Exhibition/Exhibition.aspx?ddlLang=zh-tw', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const raw = await page.evaluate(() => {
    return [...document.querySelectorAll('div.row.Exhibition_list')].map((card, i) => {
      const titleEl = card.querySelector('h3,h4,[class*=title],a');
      const dateEl  = card.querySelector('p.date-middle,.date-middle,[class*=date]');
      const linkEl  = card.querySelector('a[href*=Exhibition_Special], a[href*=Exhibition_Detail]');
      return {
        title: titleEl?.textContent?.trim() || '',
        date:  dateEl?.textContent?.trim() || '',
        link:  linkEl?.getAttribute('href') || '',
        i,
      };
    });
  });

  return raw.flatMap((r: any) => {
    const { start, end } = parseDateRange(r.date);
    const e = makeEvent({
      id: `tfam-${r.i}-${start}`,
      title: r.title.replace(/\s+/g, ' ').trim(),
      start, end,
      venue: '台北市立美術館',
      city: 'Taipei',
      url: r.link ? `https://www.tfam.museum${r.link.startsWith('/') ? '' : '/'}${r.link}` : 'https://www.tfam.museum/Exhibition/Exhibition.aspx?ddlLang=zh-tw',
    });
    return e ? [e] : [];
  });
}

// ── KMFA ──────────────────────────────────────────────────────────────────
async function scrapeKMFA(page: any): Promise<ArtEvent[]> {
  console.log('  Scraping KMFA…');
  await page.goto('https://www.kmfa.gov.tw/exhibition.aspx', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const raw = await page.evaluate(() => {
    const results: any[] = [];
    document.querySelectorAll('h2').forEach((h2, i) => {
      const parent = h2.closest('li,div,article,.item');
      const allText = parent?.textContent || '';
      // Only take the first MM.DD pattern (opening date); ignore stale dates
      const dateMatch = allText.match(/(\d{1,2}\.\d{2})/);
      const link = parent?.querySelector('a')?.href || '';
      results.push({ title: h2.textContent?.trim() || '', date: dateMatch?.[1] || '', link, i });
    });
    return results.filter((r: any) => r.title.length > 3);
  });

  return raw.flatMap((r: any) => {
    const start = parseDate(r.date);   // "06.13" → "2026-06-13"
    const e = makeEvent({
      id: `kmfa-${r.i}-${start}`,
      title: r.title.replace(/\s+/g, ' ').trim(),
      start,
      venue: '高雄市立美術館',
      city: 'Kaohsiung',
      url: r.link || 'https://www.kmfa.gov.tw/exhibition.aspx',
    });
    return e ? [e] : [];
  });
}

// ── ChiMei ────────────────────────────────────────────────────────────────
async function scrapeChiMei(page: any): Promise<ArtEvent[]> {
  console.log('  Scraping 奇美博物館…');
  await page.goto('https://www.chimeimuseum.org/exhibition-event', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const raw = await page.evaluate(() => {
    // Grab all dates from body text in one pass
    const bodyText = document.body.innerText;
    const allDates = bodyText.match(/20\d\d\.\d{2}\.\d{2}/g) || [];

    // Only current / special exhibitions (not permanent collection)
    const seen = new Set<string>();
    return [...document.querySelectorAll('a[href*=special-exhibition]')]
      .map((a, i) => {
        const href = a.getAttribute('href') || '';
        // Must link to a specific exhibition page (has an ID segment)
        if (!href.match(/special-exhibition\/[a-f0-9]+/)) return null;
        // Use title attribute or heading text, not body description
        const titleEl = a.closest('section,div,article')?.querySelector('h2,h3,h4,[class*=title]');
        const text = titleEl?.textContent?.trim() || (a as HTMLElement).title || '';
        if (!text || text.length < 5 || seen.has(href)) return null;
        seen.add(href);
        return { title: text, link: href, i };
      })
      .filter(Boolean)
      .map((r: any, i) => ({ ...r, dates: allDates.slice(0, 2), i }));
  });

  return raw.flatMap((r: any) => {
    const start = parseDate(r.dates[0] || '');
    const end   = parseDate(r.dates[1] || '');
    const e = makeEvent({
      id: `chimei-${r.i}-${start}`,
      title: r.title.replace(/\s+/g, ' ').trim().slice(0, 80),
      start, end,
      venue: '奇美博物館',
      city: 'Tainan',
      url: r.link.startsWith('http') ? r.link : `https://www.chimeimuseum.org${r.link}`,
    });
    return e ? [e] : [];
  });
}

// ── CKSMH ─────────────────────────────────────────────────────────────────
async function scrapeCKSMH(page: any): Promise<ArtEvent[]> {
  console.log('  Scraping 中正紀念堂…');
  const results: ArtEvent[] = [];
  const seen = new Set<string>();

  for (const [urlSuffix, catNote] of [
    ['/cl.aspx?n=6063', 'exhibition'],
    ['/News_Actives_photo.aspx?n=9029&sms=14954', 'performance'],
  ]) {
    const url = `https://www.cksmh.gov.tw${urlSuffix}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));

    const raw = await page.evaluate(() => {
      return [...document.querySelectorAll('*')].filter(el => {
        const t = el.textContent;
        return t.match(/20\d\d-\d\d-\d\d/) && el.children.length < 10 && el.textContent.trim().length < 400 && el.querySelector('a');
      }).map((el, i) => {
        const title = el.querySelector('h2,h3,h4,.title,[class*=title]')?.textContent?.trim()
          || el.querySelector('a')?.textContent?.trim();
        const dates = el.textContent.match(/20\d\d-\d\d-\d\d/g) || [];
        const link = (el.querySelector('a') as HTMLAnchorElement)?.getAttribute('href');
        return { title, dates, link, i };
      }).filter((r: any) => r.title && r.dates.length);
    });

    for (const r of raw as any[]) {
      const start = r.dates[0];
      const end   = r.dates[1];
      const key   = `${r.title}-${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Clean title: keep only the part inside 【】 if present, else first ~40 chars
      let cleanTitle = r.title.replace(/\s+/g, ' ').trim();
      const bracket = cleanTitle.match(/【([^】]+)】/);
      if (bracket) cleanTitle = bracket[1].trim();
      else cleanTitle = cleanTitle.split('（')[0].split('　')[0].trim().slice(0, 60);

      const e = makeEvent({
        id: `cksmh-${r.i}-${start}`,
        title: cleanTitle,
        start, end,
        venue: '國立中正紀念堂',
        city: 'Taipei',
        url: r.link ? `https://www.cksmh.gov.tw${r.link.startsWith('/') ? '' : '/'}${r.link}` : url,
        category: catNote === 'performance' ? 'theater' : 'exhibition',
      });
      if (e) results.push(e);
    }
  }
  return results;
}

// ── NMH ───────────────────────────────────────────────────────────────────
async function scrapeNMH(page: any): Promise<ArtEvent[]> {
  console.log('  Scraping 台北歷史博物館…');
  await page.goto('https://www.nmh.gov.tw/News_Actives_photo.aspx?n=6983&sms=13323', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const raw = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href*=actId], a[href*=culture], .newsItem a, .list-item a, [class*=activity] a')].map((a, i) => {
      const title = (a as HTMLElement).title || a.textContent?.trim();
      const parent = a.closest('li,div,tr,.item');
      const dates = parent?.textContent?.match(/20\d\d-\d\d-\d\d/g) || [];
      return { title, dates, link: (a as HTMLAnchorElement).href, i };
    }).filter((r: any) => r.title && r.title.length > 3);
  });

  const seen = new Set<string>();
  return raw.flatMap((r: any) => {
    const start = r.dates[0] || '';
    const end   = r.dates[1];
    if (!start || seen.has(r.title)) return [];
    seen.add(r.title);
    const e = makeEvent({
      id: `nmh-${r.i}-${start}`,
      title: r.title.replace(/\[另開新視窗\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80),
      start, end,
      venue: '國立歷史博物館',
      city: 'Taipei',
      url: r.link || 'https://www.nmh.gov.tw/News_Actives_photo.aspx?n=6983&sms=13323',
    });
    return e ? [e] : [];
  });
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('Launching Puppeteer for museum scrapers…');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-TW,zh;q=0.9' });

  const all: ArtEvent[] = [];

  try { all.push(...await scrapeTFAM(page));   } catch(e) { console.warn('TFAM error:', (e as Error).message); }
  try { all.push(...await scrapeKMFA(page));   } catch(e) { console.warn('KMFA error:', (e as Error).message); }
  try { all.push(...await scrapeChiMei(page)); } catch(e) { console.warn('ChiMei error:', (e as Error).message); }
  try { all.push(...await scrapeCKSMH(page));  } catch(e) { console.warn('CKSMH error:', (e as Error).message); }
  try { all.push(...await scrapeNMH(page));    } catch(e) { console.warn('NMH error:', (e as Error).message); }

  await browser.close();

  // Deduplicate by title+start
  const seen = new Set<string>();
  const deduped = all.filter(e => {
    const key = `${e.title}|${e.start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n✓ ${deduped.length} exhibition events from museums`);
  deduped.forEach(e => console.log(`  ${e.start} | ${e.city.padEnd(10)} | ${e.venue.padEnd(12)} | ${e.title.slice(0,45)}`));

  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'museums-events.json'), JSON.stringify(deduped, null, 2));
  console.log('Saved → data/museums-events.json');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
