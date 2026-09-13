import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE = 'http://127.0.0.1:4199/lab/experience/living-slice-v6.html?geometry=c&assist=auto';
const WEBDRIVER = 'http://127.0.0.1:9541';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) { if (!condition) throw new Error(message); }
async function waitFor(label, probe, timeoutMs = 16000) {
  const end = Date.now() + timeoutMs;
  let last;
  while (Date.now() < end) {
    try { const value = await probe(); if (value) return value; } catch (error) { last = error; }
    await sleep(30);
  }
  throw new Error(`${label} timed out${last ? `: ${last}` : ''}`);
}
function startProcess(command, args) {
  let output='';
  const child=spawn(command,args,{detached:true,stdio:['ignore','pipe','pipe'],env:process.env});
  const capture=(chunk)=>{output+=chunk.toString();if(output.length>30000)output=output.slice(-30000);};
  child.stdout.on('data',capture);child.stderr.on('data',capture);
  return {child,getOutput:()=>output};
}
function stopProcess(child){if(!child?.pid||child.exitCode!==null)return;try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}}
async function webdriver(path,init={}){
  const response=await fetch(`${WEBDRIVER}${path}`,{...init,headers:{'content-type':'application/json',...(init.headers??{})}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body?.value?.error)throw new Error(`WebDriver ${init.method??'GET'} ${path}: ${JSON.stringify(body)}`);
  return body.value;
}
async function execute(session,script){return webdriver(`/session/${session}/execute/sync`,{method:'POST',body:JSON.stringify({script,args:[]})});}
async function cdp(session,cmd,params={}){return webdriver(`/session/${session}/goog/cdp/execute`,{method:'POST',body:JSON.stringify({cmd,params})});}
async function screenshot(session,name){const data=await webdriver(`/session/${session}/screenshot`);await writeFile(`${OUTPUT}/${name}.png`,Buffer.from(data,'base64'));}
async function createSession(){const value=await webdriver('/session',{method:'POST',body:JSON.stringify({capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900']}}}})});return value.sessionId;}
async function setViewport(session,width,height,mobile){await cdp(session,'Emulation.setDeviceMetricsOverride',{width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile,positionX:0,positionY:0,dontSetVisibleSize:false});await cdp(session,'Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:mobile?5:1});}
async function navigate(session,{mobile,sentence}){
  const url=`${BASE}&sentence=${sentence}${mobile?'&debugFinger=1':''}`;
  await webdriver(`/session/${session}/url`,{method:'POST',body:JSON.stringify({url})});
  await waitFor(`v6 ${sentence} ready`,()=>execute(session,`return Boolean(window.__livingSliceV6)&&window.__livingSliceV6.snapshot().version===6;`));
  await execute(session,`window.__livingSliceV6.setTimingScale(4); return true;`);
}
async function snapshot(session){return execute(session,`return window.__livingSliceV6.snapshot();`);}
async function geometry(session){return execute(session,`
  const nodes=[...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')];
  const cards=nodes.map((node,index)=>{const r=node.getBoundingClientRect();const next=nodes[index+1]?.getBoundingClientRect();const exposed=next?Math.max(8,Math.min(r.width,next.left-r.left)):r.width;const x=index===nodes.length-1?r.left+r.width*.56:r.left+exposed*.46;const y=r.top+r.height*.58;return{card:node.dataset.card,x,y,left:r.left,top:r.top,width:r.width,height:r.height};});
  const s=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();
  return{cards,shared:{left:s.left,top:s.top,width:s.width,height:s.height},scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
`);}
function cardBy(geo,id){const c=geo.cards.find((x)=>x.card===id);if(!c)throw new Error(`missing ${id}`);return c;}
function playTarget(geo){return{x:geo.shared.left+geo.shared.width*.5,y:geo.shared.top+geo.shared.height*.58};}
async function mouseStart(s,p){await cdp(s,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'none'});await cdp(s,'Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});}
async function mouseMove(s,p){await cdp(s,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left',buttons:1});}
async function mouseEnd(s,p){await cdp(s,'Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',buttons:0,clickCount:1});}
async function touchStart(s,p){await cdp(s,'Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchMove(s,p){await cdp(s,'Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchEnd(s){await cdp(s,'Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function start(s,m,p){return m?touchStart(s,p):mouseStart(s,p);}async function move(s,m,p){return m?touchMove(s,p):mouseMove(s,p);}async function end(s,m,p){return m?touchEnd(s):mouseEnd(s,p);}

function expectedOpacity(sentence,phase,snap){
  const o=snap.overlays;
  if(phase==='intent'){
    if(sentence==='a'||sentence==='c')assert(o.intentThread.opacity>.35,`${sentence}: intent thread too faint ${o.intentThread.opacity}`);
  }
  if(phase==='pending'){
    assert(o.authoritySeal.opacity>(sentence==='b'?.2:.55),`${sentence}: pending seal missing ${o.authoritySeal.opacity}`);
  }
  if(phase==='resolving'){
    if(sentence==='a'||sentence==='c')assert(o.impactCore.opacity>.5,`${sentence}: resolving impact missing ${o.impactCore.opacity}`);
    assert(o.captureThread.opacity>(sentence==='a'?.5:.65),`${sentence}: capture direction missing ${o.captureThread.opacity}`);
  }
  if(phase==='settled'){
    assert(o.consequenceEcho.opacity>(sentence==='a'?.4:.5),`${sentence}: settled memory missing ${o.consequenceEcho.opacity}`);
  }
}

function presentationReady(sentence, phase, snap) {
  if (snap.sentencePhase !== phase) return false;
  try { expectedOpacity(sentence, phase, snap); return true; } catch { return false; }
}

async function waitForPresentation(session, label, sentence, phase) {
  return waitFor(`${label}: ${phase} presentation`, async () => {
    const snap = await snapshot(session);
    return presentationReady(sentence, phase, snap) ? snap : false;
  });
}

async function runSentence(session,{sentence,mobile,label}){
  await navigate(session,{mobile,sentence});
  let snap=await snapshot(session);
  assert(snap.sentence===sentence,`${label}: sentence mismatch ${snap.sentence}`);
  assert(snap.phase==='ready'&&snap.capturedValue===40&&snap.matchScore===340,`${label}: bad baseline`);
  const geo0=await geometry(session);assert(geo0.scrollWidth<=geo0.width+1,`${label}: overflow`);

  const geo=await geometry(session);const card=cardBy(geo,'AH');const target=playTarget(geo);
  const from={x:card.x,y:card.y};
  await start(session,mobile,from);
  for(let i=1;i<=10;i+=1){const u=i/10;await move(session,mobile,{x:from.x+(target.x-from.x)*u,y:from.y+(target.y-from.y)*u});await sleep(12);}
  await waitFor(`${label}: intent phase`,async()=> (await snapshot(session)).sentencePhase==='intent');
  snap=(sentence==='a'||sentence==='c') ? await waitForPresentation(session,label,sentence,'intent') : await snapshot(session);
  expectedOpacity(sentence,'intent',snap);
  assert(snap.capturedValue===40&&snap.matchScore===340,`${label}: presentation mutated truth at intent`);
  await screenshot(session,`${label}-intent`);

  await end(session,mobile,target);
  await waitFor(`${label}: pending phase`,async()=> (await snapshot(session)).sentencePhase==='pending');
  snap=await waitForPresentation(session,label,sentence,'pending');
  assert(snap.phase==='pending'&&snap.hand.includes('AH'),`${label}: pending truth wrong`);
  await screenshot(session,`${label}-pending`);

  await waitFor(`${label}: resolving phase`,async()=> (await snapshot(session)).sentencePhase==='resolving');
  snap=await waitForPresentation(session,label,sentence,'resolving');
  assert(snap.capturedValue===40&&snap.matchScore===340,`${label}: resolving mutated score early`);
  assert(snap.overlays.captureThread.width>40,`${label}: consequence path has no spatial length ${snap.overlays.captureThread.width}`);
  await screenshot(session,`${label}-resolving`);

  await waitFor(`${label}: settled phase`,async()=> (await snapshot(session)).sentencePhase==='settled');
  snap=await waitForPresentation(session,label,sentence,'settled');
  assert(!snap.hand.includes('AH'),`${label}: accepted card still in hand`);
  assert(snap.capturedValue===65&&snap.matchScore===340&&snap.initiative==='Prowadzisz',`${label}: settled truth wrong`);
  await screenshot(session,`${label}-settled`);
  return {sentence,capturedValue:snap.capturedValue,matchScore:snap.matchScore,initiative:snap.initiative};
}

async function runReject(session,{mobile,label}){
  await navigate(session,{mobile,sentence:'c'});
  await execute(session,`window.__livingSliceV6.rejectNext(); return true;`);
  const geo=await geometry(session);const card=cardBy(geo,'JH');const target=playTarget(geo);const from={x:card.x,y:card.y};
  await start(session,mobile,from);
  for(let i=1;i<=10;i+=1){const u=i/10;await move(session,mobile,{x:from.x+(target.x-from.x)*u,y:from.y+(target.y-from.y)*u});await sleep(10);}
  await waitFor(`${label}: reject intent`,async()=> (await snapshot(session)).sentencePhase==='intent');
  await end(session,mobile,target);
  await waitFor(`${label}: reject pending phase`,async()=> (await snapshot(session)).sentencePhase==='pending');
  await waitForPresentation(session,label,'c','pending');
  await screenshot(session,`${label}-reject-pending`);
  await waitFor(`${label}: reject return`,async()=>{const s=await snapshot(session);return s.phase==='ready'&&s.trace.some((e)=>e.type==='authority-reject');});
  const snap=await snapshot(session);
  assert(snap.hand.includes('JH')&&snap.capturedValue===40&&snap.matchScore===340,`${label}: reject truth corrupted`);
  assert(snap.sentencePhase==='ready',`${label}: presentation did not settle after reject ${snap.sentencePhase}`);
  await screenshot(session,`${label}-reject-return`);
  return true;
}

async function runViewport({mobile,width,height,name}){
  const outputs=[];
  for(const sentence of ['a','b','c']){
    const session=await createSession();
    try{await setViewport(session,width,height,mobile);outputs.push(await runSentence(session,{sentence,mobile,label:`v6-${sentence}-${name}`}));}
    finally{try{await webdriver(`/session/${session}`,{method:'DELETE'});}catch{}}
  }
  const rejectSession=await createSession();
  try{await setViewport(rejectSession,width,height,mobile);await runReject(rejectSession,{mobile,label:`v6-c-${name}`});}
  finally{try{await webdriver(`/session/${rejectSession}`,{method:'DELETE'});}catch{}}
  return outputs;
}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4199']);
const driver=startProcess('chromedriver',['--port=9541']);
try{
  await waitFor('Vite V6',async()=> (await fetch(`${BASE}&sentence=c`).catch(()=>null))?.ok);
  await waitFor('ChromeDriver V6',async()=> (await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);
  const desktop=await runViewport({mobile:false,width:1440,height:900,name:'desktop'});
  const mobile=await runViewport({mobile:true,width:390,height:844,name:'mobile'});
  console.log('experience living slice v6 browser smoke v2: PASS');
  console.log(JSON.stringify({desktop,mobile},null,2));
}catch(error){
  console.error('experience living slice v6 browser smoke v2: FAIL');console.error(error);
  console.error('\n--- vite output ---\n',vite.getOutput());console.error('\n--- chromedriver output ---\n',driver.getOutput());throw error;
}finally{stopProcess(driver.child);stopProcess(vite.child);}
