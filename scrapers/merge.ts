/**
 * Merges all scraped JSON files from /data into a single events.json
 * and copies it to /public/events.json so the frontend can fetch it statically.
 *
 * Run after scrapers: npx ts-node scrapers/merge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ArtEvent } from '../lib/eventTypes';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(__dirname, '..', 'public', 'events.json');

function main() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  const all: ArtEvent[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    const events: ArtEvent[] = JSON.parse(raw);
    all.push(...events);
    console.log(`  + ${events.length} events from ${file}`);
  }

  // Deduplicate by title + start date
  const seen = new Set<string>();
  const deduped = all.filter((e) => {
    const key = `${e.title}|${e.start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date
  deduped.sort((a, b) => a.start.localeCompare(b.start));

  fs.writeFileSync(OUT_FILE, JSON.stringify(deduped, null, 2));
  console.log(`\nMerged ${deduped.length} unique events → public/events.json`);
}

main();
