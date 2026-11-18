import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseUrl=process.argv[2]||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const failures=[];
const results={};
mkdirSync('artifacts/notebook-preview',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(baseUrl+'/student-lab-notebook.html',{waitUntil:'networkidle'});
 assert.ok(response?.ok(),'notebook page returns HTTP success');
 assert.equal(await page.locator('main h1').count(),1);
 assert.equal(await page.locator('a.skip-link[href="#main-content"]').count(),1);
 for(const id of ['report-title','report-class','report-question','report-method','report-evidence','report-conclusion']) {
  assert.equal(await page.locator('label[for="'+id+'"]').count(),1,'label exists for '+id);
 }
 assert.match(await page.locator('#notebook-status').innerText(),/local use|device|not configured/i);
 await page.locator('#report-title').fill('Plant growth investigation');
 await page.locator('#report-question').fill('How does light affect plant growth?');
 await page.locator('#report-method').fill('Place seedlings under different light levels.');
 await page.locator('#report-evidence').fill('The plant receiving more light grew taller.');
 await page.locator('#report-conclusion').fill('Light availability affected growth.');
 await page.locator('#save-report').click();
 assert.equal(await page.locator('#report-list .report-card').count(),1,'report saves locally');
 assert.match(await page.locator('#report-list').innerText(),/Plant growth investigation/);
 await page.locator('#report-list').getByRole('button',{name:'Edit'}).click();
 assert.equal(await page.locator('#report-title').inputValue(),'Plant growth investigation');
 await page.locator('#report-title').fill('Plant growth investigation revised');
 await page.locator('#save-report').click();
 assert.match(await page.locator('#report-list').innerText(),/revised/);
 await page.evaluate(()=>{
  const key='osdmaverick.lab-notebook.v1';
  const reports=JSON.parse(localStorage.getItem(key)||'[]');
  reports[0].assessment={scores:null,feedback:[]};
  localStorage.setItem(key,JSON.stringify(reports));
 });
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('#report-list').innerText(),/Plant growth investigation revised/,'malformed legacy assessment does not break local report rendering');
 assert.deepEqual(errors,[],'malformed persisted assessment causes no uncaught browser error');
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#export-all').click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/lab-notebook-backup\.json/);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'artifacts/notebook-preview/notebook-desktop.png',fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
 assert.equal(overflow,false,'desktop layout has no horizontal overflow');
 results.localCreateEditExport=true;
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('#report-list .report-card').count(),1,'local report persists after reload');
 const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
 assert.equal(mobileOverflow,false,'mobile layout has no horizontal overflow');
 await page.screenshot({path:'artifacts/notebook-preview/notebook-mobile.png',fullPage:true});
 const menu=page.locator('.menu-toggle');
 if(await menu.count()){await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');}
 results.mobilePersistenceAndNavigation=true;
 assert.deepEqual(errors,[],'no uncaught browser errors');results.runtimeErrors=true;
} catch(e){failures.push(e.stack||e.message);}
finally{await browser.close();}
console.log(JSON.stringify({results,failures},null,2));
if(failures.length)process.exitCode=1;
