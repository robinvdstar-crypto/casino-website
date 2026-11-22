/* Run from the website root. All external requests are intercepted; no real leads or measurements. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createRequire} = require('node:module');
const requireTools = createRequire(path.join(process.env.PRIVACY_TEST_TOOLS_ROOT || process.cwd(), 'package.json'));
const {chromium} = requireTools('playwright');
const createCollector = require('./privacy-collector.cjs');
const root = process.cwd();
const jazz = path.basename(root) === 'jazzbandboeken';
const screenDir = process.env.PRIVACY_SCREENSHOT_DIR;
if (screenDir) fs.mkdirSync(screenDir, {recursive:true});
const id = jazz ? 'G-W7DW2BKDFT' : 'G-493575CQY1';
const formPath = jazz ? '/contact.html' : '/';
const formSelector = jazz ? '#aanvraagformulier' : '.contact-form';
const results = [];
const failures = [];
const networkEvidence = [];
let browser;
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || file.includes('/.git/')) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.mp4':'video/mp4'};
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
function commandCount(page, name) {
  return page.evaluate(name => (window.dataLayer || []).filter(a => a?.[0] === 'event' && a[1] === name).length, name);
}
async function run(name, fn) {
  if(process.env.PRIVACY_TEST_FILTER && !new RegExp(process.env.PRIVACY_TEST_FILTER).test(name))return;
  try { await fn(); results.push(name); console.log('PASS ' + name); }
  catch(error) { failures.push(name); console.error('FAIL ' + name + ': ' + error.message); }
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  async function setup({consent, blocked=false, width=1280, stored, storageBlocked=false, tagDelay=0, responseDelay=120} = {}) {
    let record;
    // Route interception can cancel keepalive requests during navigation. Observe real HTTP
    // receipt instead, without altering Google batching, consent or the production tag.
    const collector=process.env.GA_TAG_FIXTURE_DIR ? await createCollector((url,body)=>record(url,body)) : null;
    const context = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block',
      ...(collector ? {ignoreHTTPSErrors:true,proxy:{server:collector.url,bypass:'127.0.0.1,localhost'}} : {})});
    if(collector)context.on('close',()=>collector.close());
    if (consent !== undefined || stored || storageBlocked) await context.addInitScript(({consent, stored, storageBlocked}) => {
      if (storageBlocked) { Storage.prototype.getItem = () => {throw Error('blocked');}; Storage.prototype.setItem = () => {throw Error('blocked');}; return; }
      // Seed only once: preserve actual changes/revocations across navigations.
      if (!sessionStorage.getItem('privacy-test-seeded')) {
        localStorage.setItem('site-privacy-consent', stored || JSON.stringify({version:'2026-11-22.1', at:new Date().toISOString(), analytics:consent}));
        sessionStorage.setItem('privacy-test-seeded','yes');
      }
    }, {consent,stored,storageBlocked});
    const state = {tag:0, analytics:[], posts:0, mode:'success', payloads:[], redirects:[], foreign:[], errors:[],confirmedAt:null};
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.origin === origin) return route.continue();
      if (url.hostname === 'api.web3forms.com') {
        state.posts++; state.payloads.push(req.postData());
        await new Promise(r => setTimeout(r, responseDelay));
        if (state.mode === 'network') return route.abort();
        if (state.mode === 'json') return route.fulfill({status:200,body:'invalid json'});
        if(state.mode==='success')state.confirmedAt=Date.now();
        return route.fulfill({status:state.mode === 'http' ? 500 : 200,contentType:'application/json',body:JSON.stringify({success:state.mode === 'string' ? 'true' : state.mode === 'success'})});
      }
      if (['jazzbandboeken.nl','casinotafelshuren.com'].includes(url.hostname) && url.pathname === '/bedankt.html') {
        state.redirects.push(url.origin + url.pathname);
        return route.fulfill({status:302,headers:{location:origin + '/bedankt.html'},body:''});
      }
      if (url.hostname === 'www.googletagmanager.com') {
        state.tag++;
        if(tagDelay) await new Promise(resolve=>setTimeout(resolve,tagDelay));
        if (blocked) return route.abort();
        // Optional real public runtime fixture, while every collection request stays blocked.
        const fixture = process.env.GA_TAG_FIXTURE_DIR && path.join(process.env.GA_TAG_FIXTURE_DIR, id + '.js');
        const js = fixture ? fs.readFileSync(fixture,'utf8') : `window.__tagMockLoaded=true;const consume=a=>{if(a[0]==='event')a[2]?.event_callback?.();};window.dataLayer.forEach(consume);const push=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=(...items)=>{const result=push(...items);items.forEach(consume);return result;};`;
        return route.fulfill({contentType:'text/javascript',body:js});
      }
      if (/google-analytics\.com$|analytics\.google\.com$|doubleclick\.net$|googleadservices\.com$/.test(url.hostname)) {
        if(collector)return route.continue();
        record(url,req.postData()||'');
        return route.fulfill({status:204,body:''});
      }
      state.foreign.push(url.hostname);
      // No fonts, YouTube, PDOK or other third-party request leaves the test browser.
      if (req.resourceType() === 'document' && /youtube/.test(url.hostname)) return route.fulfill({contentType:'text/html',body:'<title>Mock video</title>'});
      return route.abort();
    });
    record=(url,body)=>{
      const values=[url.searchParams,...body.split('\n').map(s=>new URLSearchParams(s))];
      assert(!values.some(v=>['dl','dr'].some(k=>(v.get(k)||'').includes('fixture@example.test'))),'No query PII in page location or referrer');
      assert(!/Testfixture|fixture%40example|0612345678/i.test(url.href+body),'No form PII in Analytics requests');
      state.analytics.push({events:values.flatMap(v=>v.getAll('en')),id:values.flatMap(v=>v.getAll('tid')),receivedAt:Date.now()});
    };
    const page = await context.newPage();
    page.on('pageerror', err => state.errors.push(err.message));
    return {context,page,state};
  }
  async function open(p, pathname='/') { await p.goto(origin + pathname, {waitUntil:'networkidle'}); }
  async function fill(p, selector=formSelector) {
    await p.locator(selector).evaluate(form => {
      form.querySelectorAll('input[required],select[required],textarea[required]').forEach(field => {
        if (field.tagName === 'SELECT') { field.value = [...field.options].find(o=>o.value && o.value !== 'Anders')?.value || ''; }
        else if (field.type === 'date') field.value='2030-06-15';
        else if (field.type === 'time') field.value= /end|eind/i.test(field.name + field.id) ? '21:00' : '18:00';
        else if (field.type === 'email') field.value='fixture@example.test';
        else if (field.type === 'tel') field.value='0612345678';
        else if (!['checkbox','radio','hidden'].includes(field.type)) field.value='Testfixture';
        field.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const set=(id,value)=>{const field=form.querySelector('#'+id);if(field){field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));}};
      set('event-date','2030-06-15');set('event-start-time','18:00');set('event-end-time','21:00');
      set('event-address','Testlocatie');set('customer-name','Testfixture');set('customer-email','fixture@example.test');set('customer-phone','0612345678');
      ['event-type','guest-count','budget-indication'].forEach(id=>{const f=form.querySelector('#'+id);if(f)set(id,[...f.options].find(o=>o.value && o.value!=='Anders').value);});
      const intent=form.querySelector('input[name="Wat zoekt de klant ongeveer"]');if(intent){intent.checked=true;intent.dispatchEvent(new Event('change',{bubbles:true}));}
    });
  }
  async function submit(p, selector=formSelector, twice=false) {
    await p.locator(selector).evaluate((form,twice) => {form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));if(twice)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));},twice);
  }
  await run('no choice / refusal: no GA script, event or cookie; navigation and privacy controls', async () => {
    const {context,page,state}=await setup();await open(page);
    assert.equal(state.tag,0);assert.equal(state.analytics.length,0);
    assert.equal((await context.cookies()).filter(c=>/^_ga/.test(c.name)).length,0);
    assert(await page.locator('.site-consent').isVisible());
    assert(!state.foreign.some(h=>/fonts\.googleapis|fonts\.gstatic/.test(h)));
    await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();
    await page.reload({waitUntil:'networkidle'});assert.equal(state.tag,0);
    assert(await page.locator('.site-consent').isHidden());
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.choice),'no');
    await page.keyboard.press('Escape');assert(await page.locator('.site-consent').isHidden());
    assert(page.url().startsWith(origin));assert.equal(state.errors.length,0);
    await context.close();
  });
  await run('grant once: exact ID, denied advertising, clean location; duplicate bootstrap guarded',async()=>{
    const {context,page,state}=await setup();await open(page,'/?email=fixture@example.test#secret');
    await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();
    await page.waitForTimeout(500);assert.equal(state.tag,1);
    const commands=await page.evaluate(()=>Array.from(window.dataLayer||[],a=>Array.from(a)));
    assert.equal(commands.filter(a=>a[0]==='config'&&a[1]===id).length,1);
    const update=commands.find(a=>a[0]==='consent'&&a[1]==='update')[2];
    assert.equal(update.analytics_storage,'granted');for(const k of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(update[k],'denied');
    assert(!commands.find(a=>a[0]==='set'&&a[1]==='page_location')[2].includes('email='));
    await page.addScriptTag({url:origin+'/assets/privacy-consent.js'});
    assert.equal(state.tag,1);assert.equal(await page.locator('.site-consent').count(),1);
    const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('site-privacy-consent')));
    assert.equal(data.analytics,true);assert(data.at);assert(data.version);
    await context.close();
  });
  await run('withdrawal preserves input and disables runtime/cookies across tabs without reload',async()=>{
    const {context,page,state}=await setup({consent:true});await open(page,formPath);await fill(page);await page.waitForTimeout(500);
    await context.addCookies([{name:'_ga',value:'test',url:origin},{name:'_ga_OLD',value:'test',domain:'127.0.0.1',path:'/'}]);
    const other=await context.newPage();await open(other,formPath);await fill(other);await other.waitForTimeout(500);
    await page.evaluate(()=>window.__noReloadMarker=true);await other.evaluate(()=>window.__noReloadMarker=true);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();
    const before=state.tag;
    await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();
    await page.waitForTimeout(200);
    for(const p of [page,other]){
      assert.equal(await p.evaluate(()=>window.__noReloadMarker),true);
      assert.equal(await p.evaluate(()=>window.SitePrivacy.hasConsent()),false);
      assert.equal(await p.locator(formSelector+' input[type="email"]').inputValue(),'fixture@example.test');
      assert.equal(await p.evaluate(()=>window['ga-disable-'+document.querySelector('[data-measurement-id]').dataset.measurementId]),true);
    }
    assert.equal((await context.cookies()).filter(c=>/^_ga/.test(c.name)).length,0);
    const count=state.analytics.length;
    for(const p of [page,other])await p.evaluate(()=>{
      window.gtag?.('event','test_after_withdraw');
      window.dataLayer?.push(['event','test_bypass_wrapper_after_withdraw']);
      window.dispatchEvent(new Event('scroll'));document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(1300);assert.equal(state.analytics.length,count);assert.equal(state.tag,before);
    await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(7500);assert.equal(state.analytics.length,count);
    assert.equal(await page.locator('script[data-site-analytics]').count(),0);assert.equal(state.errors.length,0);
    await context.close();
  });
  await run('cross-tab grant hides stale banner, regrant does not duplicate the Google runtime',async()=>{
    const {context,page,state}=await setup();await open(page);const other=await context.newPage();await open(other);
    await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();await other.waitForTimeout(300);
    assert(await other.locator('.site-consent').isHidden());assert.equal(await other.evaluate(()=>window.SitePrivacy.hasConsent()),true);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();await page.waitForTimeout(300);
    assert.equal(await page.locator('script[data-site-analytics]').count(),1);assert.equal(state.tag,2);await context.close();
  });
  await run('regrant after withdrawal during tag load resumes one runtime and one lead',async()=>{
    const {context,page,state}=await setup({consent:false,tagDelay:350});await open(page);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();
    await page.waitForTimeout(700);assert.equal(state.analytics.length,0);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();
    await page.evaluate(()=>window.SitePrivacy.lead(document.createElement('form')));await page.waitForTimeout(1100);
    assert.equal(state.tag,1);assert.equal(await commandCount(page,'generate_lead'),1);
    if(process.env.GA_TAG_FIXTURE_DIR)assert.equal(state.analytics.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,1);
    await context.close();
  });
  await run('outdated/malformed choice and blocked storage fail closed',async()=>{
    for(const opts of [{stored:'{"version":"old","analytics":true}'},{stored:JSON.stringify({version:'2026-11-19.1',analytics:true,at:'2026-11-20T00:00:00Z'})},{stored:'broken'},{stored:JSON.stringify({version:'2026-11-22.1',analytics:true,at:'2099-01-01T00:00:00Z'})},{storageBlocked:true}]){
      const {context,page,state}=await setup(opts);await open(page);assert.equal(state.tag,0);assert(await page.locator('.site-consent').isVisible());
      await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();assert.equal(state.errors.length,0);await context.close();
    }
  });
  await run('confirmed success + double submit: one request, one parameter-safe lead, existing redirect',async()=>{
    const {context,page,state}=await setup({consent:true});await open(page,formPath);await fill(page);
    // Observe event arguments without affecting the real/mocked tag and without delaying redirect.
    await page.evaluate(()=>{window.__leadCalls=[];const original=window.gtag;window.gtag=function(...args){if(args[0]==='event'&&args[1]==='generate_lead'){window.__leadCalls.push(args);sessionStorage.setItem('test-leads',JSON.stringify(window.__leadCalls));}return original?.(...args);};});
    await Promise.all([page.waitForURL('**/bedankt.html'),submit(page,formSelector,true)]);
    assert.equal(state.posts,1);
    const events=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('test-leads')||'[]'));
    assert.equal(events.length,1);assert.deepEqual(Object.keys(events[0][2]).sort(),['event_timeout','send_to','transport_type']);assert.equal(events[0][2].send_to,id);
    assert.equal(await commandCount(page,'generate_lead'),0);
    await page.reload({waitUntil:'networkidle'});assert.equal(await commandCount(page,'generate_lead'),0);assert.equal(state.posts,1);
    if(jazz)assert.deepEqual(state.redirects,['https://jazzbandboeken.nl/bedankt.html']);
    assert.equal(state.errors.length,0);await context.close();
  });
  await run('no event before Web3Forms confirmation; one real tag event after confirmation',async()=>{
    const {context,page,state}=await setup({consent:true,responseDelay:900});await open(page,formPath);await fill(page);
    await submit(page,formSelector,true);await page.waitForTimeout(250);
    assert.equal(state.posts,1);assert.equal(await commandCount(page,'generate_lead'),0);
    assert.equal(state.analytics.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,0);
    await page.waitForURL('**/bedankt.html');await page.waitForTimeout(300);
    if(process.env.GA_TAG_FIXTURE_DIR){
      const packets=state.analytics.filter(x=>x.events.includes('generate_lead'));
      assert.equal(packets.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,1);
      assert(packets.every(x=>x.id.includes(id)&&x.receivedAt>=state.confirmedAt));
      await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(7500);
      assert.equal(state.analytics.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,1);
      networkEvidence.push({property:id,successfulWeb3FormsResponses:1,requests:state.posts,generateLeadEvents:1,receivedAfterConfirmation:true,noReplayAfterThanksReload:true,observationAfterReloadMs:7500,receiver:'closed local TLS proxy',formAndRedirectUnmodified:true,googleTagUnmodified:true});
    }
    assert.equal(state.posts,1);assert.equal(state.errors.length,0);await context.close();
  });
  await run('slow Google tag: one safe event after confirmed success, bounded redirect on timeout',async()=>{
    for(const delay of [250,900]){
      const {context,page,state}=await setup({consent:false,tagDelay:delay});await open(page,formPath);await fill(page);
      await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();
      await page.evaluate(()=>{window.__leadCalls=0;const save=()=>{const original=window.gtag;window.gtag=(...args)=>{if(args[0]==='event'&&args[1]==='generate_lead')sessionStorage.setItem('slow-leads',String(Number(sessionStorage.getItem('slow-leads')||0)+1));return original?.(...args);};};document.querySelector('[data-choice="yes"]').click();save();});
      const started=Date.now();await Promise.all([page.waitForURL('**/bedankt.html'),submit(page,formSelector,true)]);
      assert.equal(state.posts,1);assert(Date.now()-started<2000,'Analytics wait is bounded even with a slow/blocked runtime');
      assert.equal(await page.evaluate(()=>Number(sessionStorage.getItem('slow-leads')||0)),delay<500?1:0);
      await page.waitForTimeout(1100);assert.equal(await commandCount(page,'generate_lead'),0);await context.close();
    }
  });
  await run('withdraw while tag loads: no queued or replayed lead after consent changes',async()=>{
    const {context,page,state}=await setup({consent:false,tagDelay:350});await open(page,formPath);await fill(page);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();
    await submit(page);await page.waitForTimeout(160);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();
    await Promise.all([page.waitForURL('**/bedankt.html'),page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click()]);
    assert.equal(state.posts,1);assert.equal(await commandCount(page,'generate_lead'),0);assert.equal(state.analytics.length,0);
    assert.equal((await context.cookies()).filter(c=>/^_ga/.test(c.name)).length,0);await context.close();
  });
  await run('unconfirmed/error responses and invalid form: no lead; retry remains possible',async()=>{
    const {context,page,state}=await setup({consent:true});await open(page,formPath);
    await submit(page);await page.waitForTimeout(250);assert.equal(state.posts,0);
    await fill(page);
    for(const mode of ['http','false','json','network','string']){
      state.mode=mode;await submit(page);await page.waitForTimeout(300);
      assert(!page.url().endsWith('/bedankt.html'));assert.equal(await commandCount(page,'generate_lead'),0);
      assert.equal(await page.locator(formSelector+' button[type="submit"]').isEnabled(),true);
    }
    state.mode='success';await Promise.all([page.waitForURL('**/bedankt.html'),submit(page)]);assert.equal(state.posts,6);
    assert.equal(state.errors.length,0);await context.close();
  });
  await run('no consent and adblocker: confirmed request and redirect work, no replay on thanks',async()=>{
    for(const opts of [{consent:false},{consent:true,blocked:true}]){
      const {context,page,state}=await setup(opts);await open(page,formPath);await fill(page);
      await Promise.all([page.waitForURL('**/bedankt.html'),submit(page)]);assert.equal(state.posts,1);assert.equal(state.analytics.length,0);
      assert.equal(await commandCount(page,'generate_lead'),0);
      if(!opts.consent){assert.equal(state.tag,0);await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Statistieken toestaan',exact:true}).click();assert.equal(await commandCount(page,'generate_lead'),0);}
      assert.equal(state.errors.length,0);await context.close();
    }
  });
  await run('Analytics throwing never blocks a successful request',async()=>{
    const {context,page,state}=await setup({consent:true});await open(page,formPath);await fill(page);
    await page.evaluate(()=>{window.gtag=()=>{throw Error('test analytics failure');};});
    await Promise.all([page.waitForURL('**/bedankt.html'),submit(page)]);assert.equal(state.posts,1);assert.equal(state.errors.length,0);await context.close();
  });
  if(jazz)await run('compact Jazz form also emits one lead after success',async()=>{
    const {context,page,state}=await setup({consent:true});await open(page,'/jack-club-music.html');await fill(page,'.compact-request-form');
    await page.evaluate(()=>{const original=window.SitePrivacy;window.__compact=0;/* API is frozen; observe gtag instead. */const g=window.gtag;window.gtag=(...args)=>{if(args[1]==='generate_lead')sessionStorage.setItem('compact-leads',String(Number(sessionStorage.getItem('compact-leads')||0)+1));g(...args);};});
    await Promise.all([page.waitForURL('**/bedankt.html'),submit(page,'.compact-request-form',true)]);
    assert.equal(state.posts,1);assert.equal(await page.evaluate(()=>sessionStorage.getItem('compact-leads')),'1');
    if(process.env.GA_TAG_FIXTURE_DIR){
      await page.waitForTimeout(7500);assert.equal(state.analytics.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,1);
      await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(7500);
      assert.equal(state.analytics.flatMap(x=>x.events).filter(x=>x==='generate_lead').length,1);
      networkEvidence.push({property:id,form:'compact',requests:state.posts,generateLeadEvents:1,noReplayAfterThanksReload:true,observationAfterRedirectMs:7500,observationAfterReloadMs:7500});
    }
    await context.close();
  });
  if(jazz)await run('YouTube requires its own click and can be removed; Analytics stays denied',async()=>{
    const {context,page,state}=await setup({consent:false});await open(page,'/jack-club-music.html');
    assert.equal(await page.locator('iframe').count(),0);assert(!state.foreign.some(h=>h.includes('youtube')));
    await page.getByRole('button',{name:/YouTube laden/}).click();assert.equal(await page.locator('iframe').count(),1);assert.equal(state.tag,0);
    await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).click();await page.getByRole('button',{name:'Geladen YouTube-video’s verwijderen',exact:true}).click();assert.equal(await page.locator('iframe').count(),0);
    await context.close();
  });
  await run('320/390px and desktop: no horizontal overflow, equal buttons, keyboard controls, privacy route',async()=>{
    for(const width of [320,390,1280]){
      const {context,page,state}=await setup({width});await open(page);
      if(screenDir)await page.screenshot({path:path.join(screenDir,`${jazz?'jazz':'casino'}-${width}-consent.png`)});
      assert.equal(await page.locator('#site-consent-title').count(),1);
      const sizes=await page.locator('.site-consent-actions button').evaluateAll(bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
      assert.equal(sizes[0].w,sizes[1].w);assert.equal(sizes[0].h,sizes[1].h);assert(sizes[0].h>=44);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).focus();await page.keyboard.press('Enter');assert(await page.locator('.site-consent').isHidden());
      if(width<600){const menu=page.getByRole('button',{name:'Menu openen',exact:true});if(await menu.isVisible()){await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');if(jazz)await menu.click();else await page.locator('#mobile-menu a').first().click();assert.equal(await menu.getAttribute('aria-expanded'),'false');}}
      await page.getByRole('button',{name:'Privacy-instellingen',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.choice),'no');
      await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.choice),'yes');
      await page.getByRole('button',{name:'Alleen noodzakelijk',exact:true}).click();
      const response=await page.goto(origin+'/privacy/',{waitUntil:'networkidle'});assert.equal(response.status(),200);assert(await page.getByRole('heading',{name:/Privacyverklaring/,level:1}).isVisible());
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(state.tag,0);assert.equal(state.errors.length,0);
      if(screenDir)await page.screenshot({path:path.join(screenDir,`${jazz?'jazz':'casino'}-${width}-privacy.png`)});
      if(jazz){await open(page,formPath);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
      await context.close();
    }
  });
  console.log(JSON.stringify({site:jazz?'Jazz':'Casino',passed:results.length,failures,networkEvidence,externalRequestsSent:0,realFormsSubmitted:0}));
  if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
