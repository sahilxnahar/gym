import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('PWA shell has local resources and install metadata',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const manifest=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.match(html,/rel="manifest"/);
 assert.match(html,/<title>Forge — Your workout journal<\/title>/);
 assert.match(html,/Skip to main content/);
 assert.match(html,/forge-theme\.css/);
 assert.equal(manifest.short_name,'Forge');
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.some(icon=>icon.sizes.includes('192')));
 assert.ok(manifest.icons.some(icon=>icon.sizes.includes('512')));
 assert.doesNotMatch(html,/<script[^>]*src="https?:/);
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.match(sw,/api/);
});
