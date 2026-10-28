import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.VISUAL_CAPTURE_ORIGIN||'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const values={},sections=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 for(const path of ['/','/about','/vision-mission','/contact','/transfers']){
  const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.waitForSelector('[data-editor-section]');
  const data=await page.evaluate(()=>({
   fields:Array.from(document.querySelectorAll('[data-cms-key],[data-cms-image]')).map(el=>{
    const key=el.getAttribute('data-cms-key')||el.getAttribute('data-cms-image');let value=el.hasAttribute('data-cms-image')?el.getAttribute('src')||'':el.textContent.trim();
    if(value.startsWith(location.origin+'/'))value=value.slice(location.origin.length);
    return {key,value};
   }),
   sections:Array.from(document.querySelectorAll('[data-editor-section]')).map(el=>({id:el.getAttribute('data-editor-section'),label:el.getAttribute('data-editor-label'),visibility:el.getAttribute('data-editor-visibility'),visible:getComputedStyle(el).display!=='none'}))
  }));
  for(const field of data.fields){if(values[field.key]!==undefined)assert.equal(values[field.key],field.value,'Shared field must render the same value: '+field.key);values[field.key]=field.value;}
  for(const section of data.sections)if(section.visibility){const value=String(section.visible);if(values[section.visibility]!==undefined)assert.equal(values[section.visibility],value);values[section.visibility]=value;}
  sections.push({path,sections:data.sections});
 }
 await writeFile('.cache/visual-content-values.json',JSON.stringify(values,null,2));await writeFile('.cache/visual-sections-inventory.json',JSON.stringify(sections,null,2));
 console.log(JSON.stringify({capturedFields:Object.keys(values).length,pages:sections.map(p=>({path:p.path,sections:p.sections.map(s=>s.label)}))}));
}finally{await browser.close();}
