import { chromium } from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.VERIFY_ORIGIN||'http://127.0.0.1:4175';
const testValues=process.env.VERIFY_TEST_VALUES==='1';
const output=process.env.VERIFY_OUTPUT||'.cache/live-content-browser';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',error=>errors.push(error.message));
 for(let refresh=0;refresh<2;refresh++){
  const r=await page.goto(origin,{waitUntil:'networkidle'});assert.equal(r.status(),200);
  const settings=await page.evaluate(async()=> (await(await fetch('/api/trpc/siteContent.public')).json()).result.data.json);
  const finance=await page.evaluate(async()=> (await(await fetch('/api/trpc/finance.overview')).json()).result.data.json);
  const cards=await page.evaluate(async()=> (await(await fetch('/api/trpc/giftCards.list')).json()).result.data.json);
  assert.equal(finance.accounts.length,4);
  assert.equal(cards.length,testValues?8:9);
  assert.equal(cards.every(c=>c.denominations.every(d=>d.sellingPriceLyd===null&&d.specialPriceUsd===null&&d.manualSellingPriceLyd===null)),true);
  if(testValues){
   assert.match(settings.site_name,/فحص حفظ Supabase/);
   assert.match(settings.hero_image,/migration_check=1/);
   assert.equal(finance.accounts.find(r=>r.id===4).notesAr,'فحص حفظ Supabase');
   assert.equal(cards.some(r=>r.slug==='steam'),false);
   assert.equal(cards.find(r=>r.slug==='playstation').description,'فحص حفظ Supabase');
  }
 }
 results.push('Two independent page loads read the persisted Supabase values');
 await page.screenshot({path:output+'/home.png',fullPage:true,animations:'disabled'});
 await page.goto(origin+'/gift-cards',{waitUntil:'networkidle'});
 assert.equal(await page.locator('article h3').count(),testValues?8:9);
 await page.screenshot({path:output+'/cards.png',fullPage:true,animations:'disabled'});
 results.push('Card visibility changes are reflected in the rendered catalog');
 const detailResponse=await page.goto(origin+'/gift-cards/shein',{waitUntil:'networkidle'});assert.equal(detailResponse.status(),200);
 assert.equal(await page.getByText('سعر البيع:',{exact:false}).count(),0);
 assert.equal(await page.getByText('السعر غير متوفر',{exact:true}).count(),0);
 await page.getByRole('button',{name:'$100',exact:true}).click();
 assert.equal(await page.getByRole('link',{name:'الشراء',exact:true}).count(),1);
 results.push('Face values remain selectable; private selling prices are not displayed');
 await page.goto(origin+'/admin',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,'/login');
 assert.equal((await page.request.get(origin+'/api/trpc/giftCards.admin.list')).status(),401);
 results.push('Admin page and API reject guests');
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/gift-cards',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(errors.length,0);
 await page.screenshot({path:output+'/mobile.png',fullPage:true,animations:'disabled'});
 await writeFile(output+'/results.json',JSON.stringify({origin,checkedAt:new Date().toISOString(),testValues,results,errors,adminPasswordLoginTested:false},null,2));
 console.log(JSON.stringify({origin,testValues,results}));
} finally {await browser.close();}
