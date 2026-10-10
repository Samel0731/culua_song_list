import { writeFile } from 'node:fs/promises';
import { parseSheet, groupSheetRows, SHEET_URL } from '../utils/archive/sheet.mjs';
const response=await fetch(SHEET_URL,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`Sheet returned ${response.status}`);
const preview=parseSheet(await response.text());
if(!preview.rows.length || preview.errors.length)throw new Error(`Snapshot validation failed: ${JSON.stringify(preview.errors.slice(0,10))}`);
await writeFile(new URL('../utils/archive/legacy-snapshot.json',import.meta.url),JSON.stringify({capturedAt:new Date().toISOString(),songs:groupSheetRows(preview.rows),aliases:[]},null,2)+'\n');
console.log(preview.counts);
