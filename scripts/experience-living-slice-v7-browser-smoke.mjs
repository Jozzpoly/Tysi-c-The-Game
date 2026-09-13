import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE = 'http://127.0.0.1:4199/lab/experience/living-slice-v7.html?geometry=c';
const WEBDRIVER = 'http://127.0.0.1:9540';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) { if (!condition) throw new Error(message); }
async function waitFor(label, probe, timeoutMs = 15000) {
  const end = Date.now() + timeoutMs;
  let last;
  while (Date.now() < end) {
    try { const value = await probe(); if (value) return value; } catch (error) { last = error; }
    await sleep(30);
  }
  throw new Error(`${label} timed out${last ? `: ${last}` : ''}`);
}
function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached:true, stdio:['ignore','pipe','pipe'], env:process.env });
  const capture = (chunk) => { output += chunk.toString(); if (output.length > 26000) output = output.slice(-26000); };
  child.stdout.on('data', capture); child.stderr.on('data', capture);
  return { child, getOutput:() => output };
}
function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
}
async function webdriver(path, init = {}) {
  const response = await fetch(`${WEBDRIVER}${path}`, { ...init, headers:{ 'content-type':'application/json', ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.value?.error) throw new Error(`WebDriver ${init.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`);
  return body.value;
}
async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, { method:'POST', body:JSON.stringify({ script, args:[] }) });
}
async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, { method:'POST', body:JSON.stringify({ cmd, params }) });
}
async function screenshot(session, name) {
  const data = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(data, 'base64'));
}
async function createSession() {
  const value = await webdriver('/session', { method:'POST', body:JSON.stringify({ capabilities:{ alwaysMatch:{ browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'] } } } }) });
  return value.sessionId;
}
async function setViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', { width, height, screenWidth:width, screenHeight:height, deviceScaleFactor:1, mobile, positionX:0, positionY:0, dontSetVisibleSize:false });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled:mobile, maxTouchPoints:mobile ? 5 : 1 });
}
async function navigate(session) {
  await webdriver(`/session/${session}/url`, { method:'POST', body:JSON.stringify({ url:BASE }) });
  await waitFor('V7 ready', () => execute(session, `return Boolean(window.__livingSliceV7) && window.__livingSliceV7.snapshot().version === 7;`));
}
async function snapshot(session) { return execute(session, `return window.__livingSliceV7.snapshot();`); }
async function geometry(session) {
  return execute(session, `
    const cards=[...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')].map((node)=>{const r=node.getBoundingClientRect();return{card:node.dataset.card,left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};});
    const shared=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();
    return {cards,shared:{left:shared.left,top:shared.top,width:shared.width,height:shared.height}};
  `);
}
function cardBy(geo, id) {
  const card=geo.cards.find((item)=>item.card===id);
  if (!card) throw new Error(`missing card ${id}`);
  return card;
}
function cardPoint(card, mobile) {
  return { x:card.left + card.width*(mobile ? .18 : .32), y:card.top + card.height*.66 };
}
function playTarget(geo) { return { x:geo.shared.left+geo.shared.width*.5, y:geo.shared.top+geo.shared.height*.58 }; }

async function mouseStart(session,p) {
  await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'none'});
  await cdp(session,'Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});
}
async function mouseMove(session,p) { await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left',buttons:1}); }
async function mouseEnd(session,p) { await cdp(session,'Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',buttons:0,clickCount:1}); }
async function touchStart(session,p) { await cdp(session,'Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]}); }
async function touchMove(session,p) { await cdp(session,'Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]}); }
async function touchEnd(session) { await cdp(session,'Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); }
async function start(session,mobile,p) { return mobile ? touchStart(session,p) : mouseStart(session,p); }
async function move(session,mobile,p) { return mobile ? touchMove(session,p) : mouseMove(session,p); }
async function end(session,mobile,p) { return mobile ? touchEnd(session) : mouseEnd(session,p); }

async function enterIntent(session, mobile, cardId) {
  const geo=await geometry(session);
  const card=cardBy(geo,cardId);
  const from=cardPoint(card,mobile);
  const target=playTarget(geo);
  await start(session,mobile,from);
  const steps=10;
  for(let i=1;i<=steps;i+=1){const u=i/steps;await move(session,mobile,{x:from.x+(target.x-from.x)*u,y:from.y+(target.y-from.y)*u});await sleep(8);}
  await waitFor(`${cardId} intent`, async()=> (await snapshot(session)).materialPhase==='intent');
  return {from,target};
}

async function runReject(session, mobile, label) {
  await navigate(session);
  await execute(session, `window.__livingSliceV7.setTimingScale(3); window.__livingSliceV7.rejectNext(); return true;`);
  const {target}=await enterIntent(session,mobile,'JH');
  await screenshot(session,`${label}-intent`);
  await end(session,mobile,target);
  await waitFor(`${label} pending`, async()=> (await snapshot(session)).materialPhase==='pending');
  const pendingStyle=await execute(session, `const n=document.querySelector('.hand-card.held.pending'); if(!n)return null; const s=getComputedStyle(n); return {opacity:Number(s.opacity),filter:s.filter};`);
  assert(pendingStyle && pendingStyle.opacity>.85,`${label}: pending card lost material visibility ${JSON.stringify(pendingStyle)}`);
  await screenshot(session,`${label}-pending`);
  await waitFor(`${label} reject`, async()=> (await snapshot(session)).materialReject===true);
  await screenshot(session,`${label}-reject`);
  await waitFor(`${label} reject settle`, async()=> { const s=await snapshot(session); return s.phase==='ready' && s.hand.includes('JH'); });
  const settled=await snapshot(session);
  assert(settled.capturedValue===40 && settled.matchScore===340,`${label}: reject changed truth`);
  assert(!settled.residue,`${label}: rejected action created consequence residue`);
  assert(settled.materialTrace.some((e)=>e.type==='material-reject'),`${label}: missing material reject trace`);
  return {pendingOpacity:pendingStyle.opacity,rejectReturned:true};
}

async function runAccept(session, mobile, label) {
  await navigate(session);
  await execute(session, `window.__livingSliceV7.setTimingScale(3); return true;`);
  const {target}=await enterIntent(session,mobile,'AH');
  await screenshot(session,`${label}-accept-intent`);
  await end(session,mobile,target);
  await waitFor(`${label} accept pending`, async()=> (await snapshot(session)).materialPhase==='pending');
  await screenshot(session,`${label}-accept-pending`);
  await waitFor(`${label} resolving`, async()=> (await snapshot(session)).materialPhase==='resolving');
  await waitFor(`${label} material capture ghosts`, async()=> {
    const s=await snapshot(session);
    return s.materialCaptureGhosts.length===3 && s.materialCaptureGhosts.every((g)=>g.material && g.opacity>=.45);
  });
  const resolving=await snapshot(session);
  assert(resolving.trickMemory.length===3,`${label}: missing public trick memory ${JSON.stringify(resolving.trickMemory)}`);
  await screenshot(session,`${label}-resolving`);
  await waitFor(`${label} settled`, async()=> (await snapshot(session)).materialPhase==='settled');
  const settled=await snapshot(session);
  assert(settled.capturedValue===65,`${label}: captured value ${settled.capturedValue}`);
  assert(settled.matchScore===340,`${label}: ordinary trick changed match score ${settled.matchScore}`);
  assert(settled.initiative==='Prowadzisz',`${label}: initiative ${settled.initiative}`);
  assert(settled.residue?.visible && settled.residue.cards.length===3,`${label}: residue missing ${JSON.stringify(settled.residue)}`);
  assert(settled.nextInitiativeVisual,`${label}: base next-initiative cue missing`);
  await screenshot(session,`${label}-settled`);
  return {trickMemory:settled.trickMemory,residue:settled.residue.cards,capturedValue:settled.capturedValue,matchScore:settled.matchScore};
}

async function runViewport({label,width,height,mobile}) {
  const session=await createSession();
  try {
    await setViewport(session,width,height,mobile);
    const reject=await runReject(session,mobile,`${label}-reject`);
    const accept=await runAccept(session,mobile,`${label}-accept`);
    return {label,reject,accept};
  } finally { try { await webdriver(`/session/${session}`,{method:'DELETE'}); } catch {} }
}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4199']);
const driver=startProcess('chromedriver',['--port=9540']);
try {
  await waitFor('Vite V7',async()=> (await fetch(BASE).catch(()=>null))?.ok);
  await waitFor('ChromeDriver V7',async()=> (await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);
  const desktop=await runViewport({label:'living-slice-v7-desktop',width:1440,height:900,mobile:false});
  const mobile=await runViewport({label:'living-slice-v7-mobile',width:390,height:844,mobile:true});
  console.log('experience living slice v7 browser smoke: PASS');
  console.log(JSON.stringify({desktop,mobile},null,2));
} catch(error) {
  console.error('experience living slice v7 browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n',vite.getOutput());
  console.error('\n--- chromedriver output ---\n',driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child); stopProcess(vite.child);
}