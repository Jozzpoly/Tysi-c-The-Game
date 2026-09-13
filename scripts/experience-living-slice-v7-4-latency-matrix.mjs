import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE='http://127.0.0.1:4204/lab/experience/living-slice-v7-4.html?geometry=c';
const WEBDRIVER='http://127.0.0.1:9545';
const OUTPUT='artifacts/experience';
const DELAYS=[35,140,560,1200];
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
function assert(condition,message){if(!condition)throw new Error(message);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
async function waitFor(label,probe,timeoutMs=15000){const end=Date.now()+timeoutMs;let last;while(Date.now()<end){try{const value=await probe();if(value)return value;}catch(error){last=error;}await sleep(12);}throw new Error(`${label} timed out${last?`: ${last}`:''}`);}
function startProcess(command,args){let output='';const child=spawn(command,args,{detached:true,stdio:['ignore','pipe','pipe'],env:process.env});const capture=(chunk)=>{output+=chunk.toString();if(output.length>36000)output=output.slice(-36000);};child.stdout.on('data',capture);child.stderr.on('data',capture);return{child,getOutput:()=>output};}
function stopProcess(child){if(!child?.pid||child.exitCode!==null)return;try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}}
async function webdriver(path,init={}){const response=await fetch(`${WEBDRIVER}${path}`,{...init,headers:{'content-type':'application/json',...(init.headers??{})}});const body=await response.json().catch(()=>({}));if(!response.ok||body?.value?.error)throw new Error(`WebDriver ${init.method??'GET'} ${path}: ${JSON.stringify(body)}`);return body.value;}
async function execute(session,script){return webdriver(`/session/${session}/execute/sync`,{method:'POST',body:JSON.stringify({script,args:[]})});}
async function cdp(session,cmd,params={}){return webdriver(`/session/${session}/goog/cdp/execute`,{method:'POST',body:JSON.stringify({cmd,params})});}
async function screenshot(session,name){const data=await webdriver(`/session/${session}/screenshot`);await writeFile(`${OUTPUT}/${name}.png`,Buffer.from(data,'base64'));}
async function createSession(){const value=await webdriver('/session',{method:'POST',body:JSON.stringify({capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900']}}}})});return value.sessionId;}
async function setViewport(session,width,height,mobile){await cdp(session,'Emulation.setDeviceMetricsOverride',{width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile,positionX:0,positionY:0,dontSetVisibleSize:false});await cdp(session,'Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:mobile?5:1});}
async function navigate(session){await webdriver(`/session/${session}/url`,{method:'POST',body:JSON.stringify({url:BASE})});await waitFor('V7.4 latency ready',()=>execute(session,`return Boolean(window.__livingSliceV74)&&Boolean(window.__livingSliceV5)&&typeof window.__livingSliceV5.setAuthorityDelayMs==='function';`));}
async function snapshot(session){return execute(session,`return window.__livingSliceV74.snapshot();`);}
async function geometry(session){return execute(session,`const cards=[...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')].map(node=>{const r=node.getBoundingClientRect();return{card:node.dataset.card,left:r.left,top:r.top,width:r.width,height:r.height};});const s=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();return{cards,shared:{left:s.left,top:s.top,right:s.right,bottom:s.bottom,width:s.width,height:s.height}};`);}
function cardBy(geo,id){const card=geo.cards.find((item)=>item.card===id);if(!card)throw new Error(`missing card ${id}`);return card;}
function grabPoint(card,mobile){return{x:card.left+card.width*(mobile?.18:.32),y:card.top+card.height*.66};}
function ingressCenter(geo){return{x:geo.shared.left+geo.shared.width*.50,y:geo.shared.top+geo.shared.height*.92};}
function thresholdCenter(geo){return{x:geo.shared.left+geo.shared.width*.50,y:geo.shared.top+geo.shared.height*.80};}
async function mouseStart(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'none'});await cdp(session,'Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});}
async function mouseMove(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left',buttons:1});}
async function mouseEnd(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',buttons:0,clickCount:1});}
async function touchStart(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchMove(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchEnd(session){await cdp(session,'Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function start(session,mobile,p){return mobile?touchStart(session,p):mouseStart(session,p);}
async function move(session,mobile,p){return mobile?touchMove(session,p):mouseMove(session,p);}
async function end(session,mobile,p){return mobile?touchEnd(session):mouseEnd(session,p);}
async function heldCenter(session){return execute(session,`const n=document.querySelector('.hand-card.held');if(!n)return null;const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};`);}

async function enterIngress(session,mobile,cardId){
  const geo=await geometry(session);const card=cardBy(geo,cardId);const from=grabPoint(card,mobile);const desired=ingressCenter(geo);const threshold=thresholdCenter(geo);let pointer={...desired};
  await start(session,mobile,from);
  for(let i=1;i<=12;i+=1){const u=i/12;await move(session,mobile,{x:from.x+(pointer.x-from.x)*u,y:from.y+(pointer.y-from.y)*u});await sleep(7);}
  await waitFor(`${cardId} ingress intent`,async()=>{const s=await snapshot(session);return s.materialPhase==='intent';});
  for(let i=0;i<4;i+=1){const held=await heldCenter(session);assert(held,`${cardId}: held center missing`);const dx=desired.x-held.x;const dy=desired.y-held.y;if(Math.hypot(dx,dy)<2)break;pointer={x:pointer.x+dx,y:pointer.y+dy};await move(session,mobile,pointer);await sleep(18);}
  const held=await heldCenter(session);assert(held,`${cardId}: final ingress center missing`);const ingressError=dist(held,desired);assert(ingressError<6,`${cardId}: cannot place card at release ingress ${ingressError.toFixed(2)}px`);
  const initialThresholdDistance=dist(held,threshold);assert(initialThresholdDistance>12,`${cardId}: ingress is not materially distinct from pending rest ${initialThresholdDistance.toFixed(2)}px`);
  return{release:pointer,releaseCenter:held,threshold,initialThresholdDistance,ingressError};
}

function findTrace(trace,type){return trace.find((entry)=>entry.type===type);}
function lastTrace(trace,type){return [...trace].reverse().find((entry)=>entry.type===type);}

async function probeDelay(session,mobile,label,delay){
  await navigate(session);
  await execute(session,`window.__livingSliceV74.setTimingScale(1);window.__livingSliceV5.setAuthorityDelayMs(${delay});return window.__livingSliceV5.snapshot().authorityDelayMs;`);
  const configured=await snapshot(session);assert(configured.authorityDelayMs===delay,`${label}: authority delay not configured ${configured.authorityDelayMs}`);
  const ingress=await enterIngress(session,mobile,'AH');
  await end(session,mobile,ingress.release);

  let stablePending=null;
  if(delay>=560){
    await waitFor(`${label} stable long pending`,async()=>{const s=await snapshot(session);return s.materialPhase==='pending'&&s.authorityThreshold?.thresholdError<2.5;});
    stablePending=await snapshot(session);
    assert(stablePending.capturedValue===40&&stablePending.matchScore===340,`${label}: consequence leaked before authority`);
    assert(!stablePending.residue,`${label}: residue leaked before authority`);
    if(delay===1200)await screenshot(session,`${label}-stable-pending`);
  }

  const movingOrSettled=await waitFor(`${label} authority handoff`,async()=>{const s=await snapshot(session);return s.identityHandoff?.card==='AH'&&(s.identityHandoff.phase==='moving'||s.identityHandoff.phase==='settled')?s:null;});
  if(delay===35||delay===1200){await screenshot(session,`${label}-handoff`);}
  await waitFor(`${label} handoff settled`,async()=>{const s=await snapshot(session);return s.identityHandoff?.phase==='settled'&&!s.handoffCarrierVisible?s:null;});
  const accepted=await snapshot(session);const h=accepted.identityHandoff;
  assert(h.sourceKind==='authority-boundary',`${label}: carrier source was ${h.sourceKind}`);
  assert(h.reason==='transition-end',`${label}: carrier completed via ${h.reason}`);
  assert(h.startGap<2,`${label}: carrier start gap ${h.startGap.toFixed(2)}px`);
  assert(h.revealGap<3&&h.sizeGap<3,`${label}: canonical swap discontinuity reveal=${h.revealGap.toFixed(2)} size=${h.sizeGap.toFixed(2)}`);
  assert(h.visibleCopies===1,`${label}: accepted identity copies ${h.visibleCopies}`);

  const movingEvent=lastTrace(accepted.v74Trace,'authority-handoff-moving');
  const boundaryEvent=lastTrace(accepted.v74Trace,'authority-boundary-captured');
  const establishedEvent=lastTrace(accepted.v74Trace,'authority-handoff-established');
  assert(movingEvent?.visibleCopies===1,`${label}: moving identity copies ${movingEvent?.visibleCopies}`);
  assert(establishedEvent?.sourceKind==='authority-boundary',`${label}: established source ${establishedEvent?.sourceKind}`);
  assert(boundaryEvent&&establishedEvent&&establishedEvent.t-boundaryEvent.t<70,`${label}: boundary->carrier handoff too late ${boundaryEvent&&establishedEvent?establishedEvent.t-boundaryEvent.t:'missing'}ms`);

  const commit=findTrace(accepted.trace,'commit');
  const authority=findTrace(accepted.trace,'authority-accept');
  const boundary=findTrace(accepted.trace,'authority-boundary');
  assert(commit&&authority&&boundary,`${label}: canonical timing trace incomplete`);
  const observedDelay=authority.t-commit.t;
  const delayTolerance=Math.max(75,delay*.18);
  assert(Math.abs(observedDelay-delay)<=delayTolerance,`${label}: authority timing ${observedDelay}ms vs ${delay}ms`);
  assert(commit.t<=authority.t&&authority.t<=boundary.t,`${label}: authority trace order broken`);

  const sourceThresholdDistance=dist(h.startRect,ingress.threshold);
  const ingressProgress=clamp(1-sourceThresholdDistance/ingress.initialThresholdDistance,0,1.5);
  if(delay===35)assert(ingressProgress<.95,`${label}: 35ms authority unexpectedly waited for full pending rest progress=${ingressProgress.toFixed(3)}`);
  if(delay>=560)assert(ingressProgress>.95,`${label}: long authority never reached pending rest progress=${ingressProgress.toFixed(3)}`);
  if(stablePending)assert(stablePending.authorityThreshold.thresholdError<2.5,`${label}: long pending rest unstable`);

  await waitFor(`${label} final truth`,async()=>{const s=await snapshot(session);return s.materialPhase==='settled'&&s.residue?.visible&&s.residue.cards.join(',')==='10H,KH,AH'?s:null;});
  const settled=await snapshot(session);
  const trickCompleted=findTrace(settled.trace,'trick-completed');
  assert(trickCompleted&&trickCompleted.t>=authority.t,`${label}: trick consequence preceded authority`);
  assert(settled.capturedValue===65&&settled.matchScore===340&&settled.initiative==='Prowadzisz',`${label}: final truth mismatch`);
  assert(!settled.overflowX,`${label}: horizontal overflow`);
  return{delay,observedDelay,ingressError:ingress.ingressError,initialThresholdDistance:ingress.initialThresholdDistance,ingressProgress,sourceThresholdDistance,authorityTravel:h.authorityTravel,startGap:h.startGap,revealGap:h.revealGap,sizeGap:h.sizeGap,boundaryToCarrierMs:establishedEvent.t-boundaryEvent.t,handoffReason:h.reason};
}

async function runViewport({label,width,height,mobile}){
  const session=await createSession();
  try{
    await setViewport(session,width,height,mobile);
    const results=[];
    for(const delay of DELAYS)results.push(await probeDelay(session,mobile,`${label}-${delay}ms`,delay));
    for(let i=1;i<results.length;i+=1){assert(results[i].ingressProgress+0.08>=results[i-1].ingressProgress,`${label}: pending progress regressed with longer authority ${results[i-1].delay}->${results[i].delay}`);}
    return results;
  }finally{try{await webdriver(`/session/${session}`,{method:'DELETE'});}catch{}}
}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4204']);const driver=startProcess('chromedriver',['--port=9545']);
try{await waitFor('Vite latency matrix',async()=>(await fetch(BASE).catch(()=>null))?.ok);await waitFor('ChromeDriver latency matrix',async()=>(await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);const desktop=await runViewport({label:'v74-latency-desktop',width:1440,height:900,mobile:false});const mobile=await runViewport({label:'v74-latency-mobile',width:390,height:844,mobile:true});console.log('experience living slice v7.4 latency matrix: PASS');console.log(JSON.stringify({desktop,mobile},null,2));}catch(error){console.error('experience living slice v7.4 latency matrix: FAIL');console.error(error);console.error('\n--- vite output ---\n',vite.getOutput());console.error('\n--- chromedriver output ---\n',driver.getOutput());throw error;}finally{stopProcess(driver.child);stopProcess(vite.child);}
