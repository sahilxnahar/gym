import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/supplement-library.js';

test('supplement education cards are curated, cited, non-prescriptive and explicitly cautious',()=>{
 const entries=globalThis.ForgeSupplementLibrary;
 assert.equal(entries.length,8);
 for(const entry of entries){
  assert.ok(entry.id&&entry.name&&entry.what&&entry.exercise&&entry.cautions);
  assert.ok(entry.sources.length>=2);
  assert.ok(entry.sources.every(source=>source.url.startsWith('https://')&&source.title));
  assert.doesNotMatch(entry.what+' '+entry.exercise+' '+entry.cautions,/\b(?:take|use|consume)\s+\d+\s*(?:mg|g|mcg|iu)\b/i);
 }
 assert.match(entries.find(entry=>entry.id==='iron').cautions,/children/i);
 assert.match(entries.find(entry=>entry.id==='caffeine').cautions,/sleep/i);
});
