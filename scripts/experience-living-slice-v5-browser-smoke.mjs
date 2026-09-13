import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4198/lab/experience/living-slice-v5.html?geometry=c&assist=auto';
const WEBDRIVER = 'http://127.0.0.1:9540';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) { if (!condition) throw new Error(message); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

async function waitFor(label, probe, timeoutMs = 16000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try { const value = await probe(); if (value) return value; } catch (error) { lastError = error; }
    await sleep(30);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached:true, stdio:['ignore','pipe','pipe'], env:process.env });
  const capture = (chunk) => { output += chunk.toString(); if (output.length > 28000) output = output.slice(-28000); };
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
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}
async function createSession() {
  const value = await webdriver('/session', { method:'POST', body:JSON.stringify({ capabilities:{ alwaysMatch:{ browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'] } } } }) });
  return value.sessionId;
}
async function setViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', { width, height, screenWidth:width, screenHeight:height, deviceScaleFactor:1, mobile, positionX:0, positionY:0, dontSetVisibleSize:false });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled:mobile, maxTouchPoints:mobile ? 5 : 1 });
}
async function navigate(session, mobile) {
  const url = `${BASE_URL}${mobile ? '&debugFinger=1' : ''}`;
  await webdriver(`/session/${session}/url`, { method:'POST', body:JSON.stringify({ url }) });
  await waitFor('Living Slice V5 ready', () => execute(session, `return Boolean(window.__livingSliceV5) && window.__livingSliceV5.snapshot().version === 5;`));
}
async function snapshot(session) { return execute(session, `return window.__livingSliceV5.snapshot();`); }

async function geometry(session) {
  return execute(session, `
    const nodes=[...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')];
    const cards=nodes.map((node,index)=>{
      const r=node.getBoundingClientRect(); const next=nodes[index+1]?.getBoundingClientRect();
      const exposed=next?Math.max(8,Math.min(r.width,next.left-r.left)):r.width;
      const x=index===nodes.length-1?r.left+r.width*.56:r.left+exposed*.46;
      const y=r.top+r.height*.58;
      const hit=document.elementFromPoint(x,y)?.closest?.('.hand-card');
      return {card:node.dataset.card,x,y,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,physicallyAcquirable:hit===node};
    });
    const shared=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();
    return {width:innerWidth,docWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,cards,shared:shared.toJSON()};
  `);
}
async function heldGeometry(session) {
  return execute(session, `
    const n=document.querySelector('.hand-card.held'); if(!n) return null;
    const r=n.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
  `);
}
async function flightGeometry(session) {
  return execute(session, `
    const ghost=document.querySelector('.source-ghost');
    const seat=document.querySelector('[data-anchor="seat:1"] .seat-source');
    const target=document.querySelector('[data-anchor="trick-card:1"]');
    const point=(node)=>{if(!node)return null;const r=node.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height};};
    return {phase:document.body.dataset.sliceState,flight:ghost?.dataset.flight??null,ghost:point(ghost),seat:point(seat),target:point(target),opacity:ghost?Number(getComputedStyle(ghost).opacity):null,handPointerEvents:document.querySelector('[data-hand]').style.pointerEvents,fixtureVersion:document.body.dataset.fixtureVersion};
  `);
}
function cardBy(geo, id) {
  const card=geo.cards.find((entry)=>entry.card===id); if(!card) throw new Error(`card ${id} missing`); return card;
}
function playTarget(geo) { return { x:geo.shared.left+geo.shared.width*.5, y:geo.shared.top+geo.shared.height*.58 }; }

async function mouseStart(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'none'});await cdp(session,'Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});}
async function mouseMove(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left',buttons:1});}
async function mouseEnd(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',buttons:0,clickCount:1});}
async function touchStart(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchMove(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchEnd(session){await cdp(session,'Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function start(session,mobile,p){return mobile?touchStart(session,p):mouseStart(session,p);}
async function move(session,mobile,p){return mobile?touchMove(session,p):mouseMove(session,p);}
async function end(session,mobile,p){return mobile?touchEnd(session):mouseEnd(session,p);}

async function drag(session,mobile,from,to,steps=12){
  await start(session,mobile,from);
  for(let i=1;i<=steps;i+=1){const u=i/steps;await move(session,mobile,{x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u});await sleep(9);}
  await end(session,mobile,to);
}

async function testSourceFlight(session,label){
  await execute(session,`window.__livingSliceV5.setTimingScale(4); window.__livingSliceV5.replayOpponentSources(); return true;`);
  await waitFor(`${label}: source establish`,()=>execute(session,`return document.querySelector('.source-ghost')?.dataset.flight==='establish';`));
  const origin=await flightGeometry(session);
  assert(origin.fixtureVersion==='5',`${label}: wrong fixture version ${origin.fixtureVersion}`);
  assert(origin.handPointerEvents==='none',`${label}: hand not presentation-locked during source replay`);
  assert(origin.ghost&&origin.seat&&origin.target,`${label}: missing source geometry`);
  assert(origin.opacity>.5,`${label}: source ghost too faint ${origin.opacity}`);
  const originSourceDistance=distance(origin.ghost,origin.seat);
  const originTargetDistance=distance(origin.ghost,origin.target);
  assert(originSourceDistance<12,`${label}: source ownership drift ${originSourceDistance.toFixed(2)}px`);
  assert(originTargetDistance>70,`${label}: source/target collapsed ${originTargetDistance.toFixed(2)}px`);
  await screenshot(session,`${label}-source-establish`);

  await waitFor(`${label}: source moving`,()=>execute(session,`return document.querySelector('.source-ghost')?.dataset.flight==='moving';`));
  await sleep(120);
  const mid=await flightGeometry(session);
  assert(mid.ghost,`${label}: source ghost vanished mid-flight`);
  const midTargetDistance=distance(mid.ghost,mid.target);
  assert(midTargetDistance<originTargetDistance*.82,`${label}: no flight progress ${midTargetDistance.toFixed(2)} vs ${originTargetDistance.toFixed(2)}`);
  await screenshot(session,`${label}-source-mid`);
  await waitFor(`${label}: source replay ready`,async()=> (await snapshot(session)).phase==='ready');
  await execute(session,`window.__livingSliceV5.setTimingScale(1); return true;`);
  const snap=await snapshot(session);
  for(const type of ['source-establish','source-flight','source-arrival']){
    const events=snap.trace.filter((e)=>e.type===type);
    assert(events.length===2&&events[0].seat===1&&events[1].seat===2,`${label}: wrong ${type} trace ${JSON.stringify(events)}`);
  }
  return {originSourceDistance,originTargetDistance,midTargetDistance};
}

async function testExactOwnership(session,mobile,label){
  const geo=await geometry(session);
  const card=cardBy(geo,'9S');
  const pointer={x:card.left+card.width*.18,y:card.top+card.height*.20};
  const hit=await execute(session,`return document.elementFromPoint(${pointer.x},${pointer.y})?.closest?.('.hand-card')?.dataset.card??null;`);
  assert(hit==='9S',`${label}: exact contact cannot acquire 9S, hit ${hit}`);
  await start(session,mobile,pointer);
  await waitFor(`${label}: held`,async()=>Boolean((await snapshot(session)).held));
  let snap=await snapshot(session);
  let held=await heldGeometry(session);
  const material={x:held.left+snap.held.grabX,y:held.top+snap.held.grabY};
  const pickupError=distance(pointer,material);
  assert(pickupError<1.5,`${label}: pickup jumped ${pickupError.toFixed(2)}px`);
  assert(Math.abs(snap.held.assistX)<.1&&Math.abs(snap.held.assistY)<.1,`${label}: assist changed initial contact`);

  const moved={x:pointer.x+(mobile?26:40),y:pointer.y+(mobile?2:8)};
  await move(session,mobile,moved); await sleep(35);
  snap=await snapshot(session); held=await heldGeometry(session);
  if(mobile){
    assert(snap.held.assistTarget>10,`${label}: missing touch visibility candidate`);
    assert(snap.held.assistY<-10,`${label}: touch visibility did not engage ${snap.held.assistY}`);
    assert(snap.held.assistX<-1,`${label}: right-edge correction did not engage ${snap.held.assistX}`);
    assert(held.right<=384,`${label}: assisted card clips right edge ${held.right}`);
    assert(snap.held.identityOcclusion<.16,`${label}: identity still occluded ${snap.held.identityOcclusion}`);
  }else{
    assert(Math.abs(snap.held.assistX)<.1&&Math.abs(snap.held.assistY)<.1,`${label}: mouse received touch assist`);
  }
  assert(snap.field.filter((f)=>Math.abs(f.x)>.3).length>=2,`${label}: hand field did not respond`);
  await screenshot(session,`${label}-hand-contact`);
  await end(session,mobile,moved);
  await waitFor(`${label}: hand settle`,async()=> (await snapshot(session)).phase==='ready' && !(await snapshot(session)).held);
  return {pickupError,assistX:snap.held.assistX,assistY:snap.held.assistY,right:held.right};
}

async function testInteractionChain(session,mobile,label){
  let snap=await snapshot(session); let geo=await geometry(session);
  assert(snap.phase==='ready'&&snap.hand.length===7,`${label}: bad baseline`);
  assert(snap.capturedValue===40&&snap.matchScore===340,`${label}: bad baseline values`);
  assert(geo.scrollWidth<=geo.width+1,`${label}: horizontal overflow`);
  assert(geo.cards.every((c)=>c.physicallyAcquirable&&c.width>=56&&c.height>=78),`${label}: bad acquisition geometry`);
  await screenshot(session,`${label}-ready`);

  // Reorder seam is an integration boundary: exact hand ownership must coexist
  // with the compact private topology cue without producing play intent.
  const beforeOrder=snap.hand.join(',');
  const from=cardBy(geo,'9C'); const to=cardBy(geo,'QS');
  const reorderStart={x:from.left+Math.min(12,from.width*.18),y:from.top+from.height*.72};
  const reorderEnd={x:to.left+to.width*.78,y:reorderStart.y};
  await start(session,mobile,reorderStart); await move(session,mobile,reorderEnd); await sleep(35);
  const reorderMid=await snapshot(session);
  assert(reorderMid.playIntent==='none',`${label}: reorder became play intent`);
  assert(reorderMid.placeholder&&reorderMid.held,`${label}: missing reorder seam state`);
  const reorderRatio=reorderMid.placeholder.width/reorderMid.held.rect.width;
  assert(reorderRatio>=.32&&reorderRatio<=.52,`${label}: reorder seam ratio ${reorderRatio}`);
  assert(reorderMid.field.filter((f)=>Math.abs(f.x)>.3).length>=2,`${label}: reorder field absent`);
  await screenshot(session,`${label}-reorder-seam`);
  await end(session,mobile,reorderEnd);
  await waitFor(`${label}: reorder settle`,async()=> (await snapshot(session)).phase==='ready');
  snap=await snapshot(session);
  assert(snap.hand.join(',')!==beforeOrder,`${label}: reorder did not persist topology`);
  assert(!snap.trace.some((e)=>e.type==='commit'),`${label}: reorder accidentally committed`);

  // Illegal relation must remain reversible and authority-free.
  geo=await geometry(session); const illegal=cardBy(geo,'QS');
  await drag(session,mobile,{x:illegal.x,y:illegal.y},playTarget(geo));
  await waitFor(`${label}: illegal return`,async()=> (await snapshot(session)).phase==='ready');
  snap=await snapshot(session);
  assert(snap.hand.includes('QS')&&snap.capturedValue===40&&snap.matchScore===340,`${label}: illegal probe corrupted truth`);
  assert(snap.trace.some((e)=>e.type==='illegal-play-probe'&&e.card==='QS'),`${label}: missing illegal probe trace`);

  // Authority rejection crosses Hand Body -> scene pending -> hand restoration.
  await execute(session,`window.__livingSliceV5.rejectNext(); return true;`);
  geo=await geometry(session); const rejectCard=cardBy(geo,'JH'); const rejectTarget=playTarget(geo);
  await start(session,mobile,{x:rejectCard.x,y:rejectCard.y});
  for(let i=1;i<=10;i+=1){const u=i/10;await move(session,mobile,{x:rejectCard.x+(rejectTarget.x-rejectCard.x)*u,y:rejectCard.y+(rejectTarget.y-rejectCard.y)*u});await sleep(8);}
  await waitFor(`${label}: reject play intent`,async()=> (await snapshot(session)).playIntent==='legal');
  const rejectIntent=await snapshot(session);
  const originRatio=rejectIntent.placeholder.width/rejectIntent.held.rect.width;
  assert(originRatio>.38&&originRatio<=.66,`${label}: play-origin residue ratio ${originRatio}`);
  await screenshot(session,`${label}-play-intent`);
  await end(session,mobile,rejectTarget);
  await waitFor(`${label}: reject pending`,async()=> (await snapshot(session)).phase==='pending');
  await screenshot(session,`${label}-authority-pending`);
  await waitFor(`${label}: reject settled`,async()=>{const s=await snapshot(session);return s.phase==='ready'&&s.trace.some((e)=>e.type==='authority-reject');});
  snap=await snapshot(session);
  assert(snap.hand.includes('JH')&&snap.capturedValue===40&&snap.matchScore===340,`${label}: reject failed to restore truth`);

  // Accepted play crosses the same hand contract into trick resolution and must
  // leave persistent consequence/initiative without touching match score.
  geo=await geometry(session); const acceptCard=cardBy(geo,'AH');
  await drag(session,mobile,{x:acceptCard.x,y:acceptCard.y},playTarget(geo));
  await waitFor(`${label}: accepted settle`,async()=> (await snapshot(session)).phase==='settled');
  snap=await snapshot(session);
  assert(!snap.hand.includes('AH'),`${label}: accepted card remained in hand`);
  assert(snap.capturedValue===65,`${label}: captured value ${snap.capturedValue}`);
  assert(snap.matchScore===340,`${label}: ordinary trick changed match score`);
  assert(snap.trickCards.length===0,`${label}: trick did not collect`);
  assert(snap.nextInitiativeVisual&&snap.recentCaptureVisual,`${label}: missing persistent consequence/initiative`);
  const value=snap.trace.find((e)=>e.type==='captured-value');
  assert(value?.before===40&&value?.delta===25&&value?.after===65&&value?.matchScore===340,`${label}: wrong value causality`);
  await screenshot(session,`${label}-settled`);
  return {reorderRatio,originRatio,capturedValue:snap.capturedValue,matchScore:snap.matchScore,initiative:snap.initiative};
}

async function runViewport({label,width,height,mobile}){
  const session=await createSession();
  try{
    await setViewport(session,width,height,mobile); await navigate(session,mobile);
    const flight=await testSourceFlight(session,label);
    const ownership=await testExactOwnership(session,mobile,label);
    const settled=await testInteractionChain(session,mobile,label);
    const selection=await execute(session,`return window.getSelection()?.toString()??'';`);
    assert(!selection,`${label}: interaction left selected text ${JSON.stringify(selection)}`);
    return {label,flight,ownership,settled};
  }finally{try{await webdriver(`/session/${session}`,{method:'DELETE'});}catch{}}
}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4198']);
const driver=startProcess('chromedriver',['--port=9540']);
try{
  await waitFor('Vite V5',async()=> (await fetch(BASE_URL).catch(()=>null))?.ok);
  await waitFor('ChromeDriver V5',async()=> (await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);
  const desktop=await runViewport({label:'living-slice-v5-desktop',width:1440,height:900,mobile:false});
  const mobile=await runViewport({label:'living-slice-v5-mobile',width:390,height:844,mobile:true});
  console.log('experience living slice v5 browser smoke: PASS');
  console.log(JSON.stringify({desktop,mobile},null,2));
}catch(error){
  console.error('experience living slice v5 browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n',vite.getOutput());
  console.error('\n--- chromedriver output ---\n',driver.getOutput());
  throw error;
}finally{stopProcess(driver.child);stopProcess(vite.child);}
