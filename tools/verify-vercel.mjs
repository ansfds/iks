import assert from 'node:assert/strict';
import {config} from 'dotenv';
config({path:'.env.local',quiet:true});
process.env.NODE_ENV='production';process.env.VERCEL='1';
const {default:handler}=await import('../api/index.mjs');
const request=(pathname,options)=>handler.fetch(new Request('https://iks-pearl.vercel.app/api/index?__path='+encodeURIComponent(pathname),options));
for(const path of ['/','/gift-cards','/gift-cards/playstation','/gift-cards/xbox','/gift-cards/shein','/transfers','/contact','/login']){
 const r=await request(path);assert.equal(r.status,200,path);assert.match(await r.text(),/<meta property="og:image"/);
}
for(const path of ['/admin','/admin/settings']){const r=await request(path);assert.equal(r.status,302);assert.equal(r.headers.get('location'),'/login');}
const cards=await request('/api/trpc/giftCards.list');assert.equal(cards.status,200);
const catalog=(await cards.json()).result.data.json;assert.equal(catalog.length,9);
assert.equal(catalog.flatMap(c=>c.denominations).length,34);
assert.equal(catalog.every(c=>c.denominations.every(d=>d.sellingPriceLyd===null&&d.specialPriceUsd===null)),true);
assert.equal((await request('/api/trpc/giftCards.admin.list')).status,401);
assert.equal((await request('/sitemap.xml')).status,200);
const configResult=await request('/api/trpc/auth.configuration');
assert.equal((await configResult.json()).result.data.json.configured,true);
console.log('Actual Vercel artifact + live Supabase: public routes, 9 cards, 34 denominations, sitemap, configured Auth and guest Admin protection PASS. Password login is not tested by this script.');
