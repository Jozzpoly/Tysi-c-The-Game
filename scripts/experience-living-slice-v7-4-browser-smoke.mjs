import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE='http://127.0.0.1:4203/lab/experience/living-slice-v7-4.html?geometry=c';
const WEBDRIVER='http://127.0.0.1:9544';
const OUTPUT='artifacts/experience';
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
function assert(condition,message){if(!condition)throw new Error(message);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
async function waitFor(label,probe,timeoutMs=15000){const end=Date.now()+timeoutMs;let last;while(Date.now()<end){try{const value=await probe();if(value)return value;}catch(error){last=error;}await sleep(20);}throw new Error(`${label} timed out${last?`: ${last}`:''}`);}
function startProcess(command,args){let output='';const child=spawn(command,args,{detached:true,stdio:['ignore','pipe','pipe'],env:process.env});const capture=(chunk)=>{output+=chunk.toString();if(output.length>32000)output=output.slice(-32000);};child.stdout.on('data',capture);child.stderr.on('data',capture);return{child,getOutput:()=>output};}
function stopProcess(child){if(!child?.pid||child.exitCode!==null)return;try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}}
async function webdriver(path,init={}){const response=await fetch(`${WEBDRIVER}${path}`,{...init,headers:{'content-type':'application/json',...(init.headers??{})}});const body=await response.json().catch(()=>({}));if(!response.ok||body?.value?.error)throw new Error(`WebDriver ${init.method??'GET'} ${path}: ${JSON.stringify(body)}`);return body.value;}
async function execute(session,script){return webdriver(`/session/${session}/execute/sync`,{method:'POST',body:JSON.stringify({script,args:[]})});}
async function cdp(session,cmd,params={}){return webdriver(`/session/${session}/goog/cdp/execute`,{method:'POST',body:JSON.stringify({cmd,params})});}
async function screenshot(session,name){const data=await webdriver(`/session/${session}/screenshot`);await writeFile(`${OUTPUT}/${name}.png`,Buffer.from(data,'base64'));}
async function createSession(){const value=await webdriver('/session',{method:'POST',body:JSON.stringify({capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900']}}}})});return value.sessionId;}
async function setViewport(session,width,height,mobile){await cdp(session,'Emulation.setDeviceMetricsOverride',{width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile,positionX:0,positionY:0,dontSetVisibleSize:false});await cdp(session,'Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:mobile?5:1});}
async function navigate(session){await webdriver(`/session/${session}/url`,{method:'POST',body:JSON.stringify({url:BASE})});await waitFor('V7.4 ready',()=>execute(session,`return Boolean(window.__livingSliceV74)&&window.__livingSliceV74.snapshot().version===7.4;`));}
async function snapshot(session){return execute(session,`return window.__livingSliceV74.snapshot();`);}
async function geometry(session){return execute(session,`const cards=[...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')].map(node=>{const r=node.getBoundingClientRect();return{card:node.dataset.card,left:r.left,top:r.top,width:r.width,height:r.height};});const s=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();return{cards,shared:{left:s.left,top:s.top,width:s.width,height:s.height}};`);}
function cardBy(geo,id){const card=geo.cards.find((item)=>item.card===id);if(!card)throw new Error(`missing card ${id}`);return card;}
function point(card,mobile){return{x:card.left+card.width*(mobile?.18:.32),y:card.top+card.height*.66};}
function thresholdPoint(geo){return{x:geo.shared.left+geo.shared.width*.50,y:geo.shared.top+geo.shared.height*.80};}
async function mouseStart(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'none'});await cdp(session,'Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});}
async function mouseMove(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left',buttons:1});}
async function mouseEnd(session,p){await cdp(session,'Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',buttons:0,clickCount:1});}
async function touchStart(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchMove(session,p){await cdp(session,'Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y,radiusX:8,radiusY:9,force:1}]});}
async function touchEnd(session){await cdp(session,'Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function start(session,mobile,p){return mobile?touchStart(session,p):mouseStart(session,p);}
async function move(session,mobile,p){return mobile?touchMove(session,p):mouseMove(session,p);}
async function end(session,mobile,p){return mobile?touchEnd(session):mouseEnd(session,p);}

async function controlledPose(session){return execute(session,`const n=document.querySelector('.hand-card.held');const s=document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();if(!n)return null;const r=n.getBoundingClientRect();return{held:{x:r.left+r.width/2,y:r.top+r.height/2,left:r.left,top:r.top,width:r.width,height:r.height},threshold:{x:s.left+s.width*.50,y:s.top+s.height*.80}};`);}

async function enterThresholdIntent(session,mobile,cardId){
  const geo=await geometry(session);const card=cardBy(geo,cardId);const from=point(card,mobile);let pointer=thresholdPoint(geo);
  await start(session,mobile,from);
  for(let i=1;i<=12;i+=1){const u=i/12;await move(session,mobile,{x:from.x+(pointer.x-from.x)*u,y:from.y+(pointer.y-from.y)*u});await sleep(8);}
  await waitFor(`${cardId} intent`,async()=>{const s=await snapshot(session);return s.materialPhase==='intent'&&Boolean(s.armedThreshold);});
  for(let i=0;i<3;i+=1){const pose=await controlledPose(session);assert(pose,`${cardId}: held pose missing`);const dx=pose.threshold.x-pose.held.x;const dy=pose.threshold.y-pose.held.y;if(Math.hypot(dx,dy)<2.5)break;pointer={x:pointer.x+dx,y:pointer.y+dy};await move(session,mobile,pointer);await sleep(24);}
  const pose=await controlledPose(session);assert(pose,`${cardId}: release pose missing`);const objectThresholdError=dist(pose.held,pose.threshold);assert(objectThresholdError<7,`${cardId}: exact-grab cannot place object on threshold ${objectThresholdError.toFixed(2)}px`);
  return{release:pointer,releaseCardCenter:{x:pose.held.x,y:pose.held.y},objectThresholdError};
}

async function waitStablePending(session,label){
  await waitFor(`${label} stable pending`,async()=>{const s=await snapshot(session);return s.materialPhase==='pending'&&s.authorityThreshold&&s.authorityThreshold.thresholdError<2.5;});
  const pending=await snapshot(session);const t=pending.authorityThreshold;assert(t.thresholdError<2.5,`${label}: pending does not settle onto ingress ${t.thresholdError.toFixed(2)}px`);const s=t.shared;assert(t.held.x>s.left&&t.held.x<s.right&&t.held.y>s.top&&t.held.y<s.bottom,`${label}: pending outside shared field`);return pending;
}

async function rejectProbe(session,mobile,label){
  await navigate(session);await execute(session,`window.__livingSliceV74.setTimingScale(4);window.__livingSliceV74.rejectNext();return true;`);
  const{release,releaseCardCenter,objectThresholdError}=await enterThresholdIntent(session,mobile,'JH');await end(session,mobile,release);
  const pending=await waitStablePending(session,label);const releaseError=dist(releaseCardCenter,pending.authorityThreshold.held);assert(releaseError<12,`${label}: object snaps on release ${releaseError.toFixed(2)}px`);
  assert(!pending.identityHandoff,`${label}: reject path created authority handoff before authority result`);
  await screenshot(session,`${label}-pending`);
  await waitFor(`${label} reject`,async()=>(await snapshot(session)).materialReject===true);await screenshot(session,`${label}-reject`);
  await waitFor(`${label} return`,async()=>{const s=await snapshot(session);return s.phase==='ready'&&s.hand.includes('JH');});const settled=await snapshot(session);
  assert(settled.capturedValue===40&&settled.matchScore===340,`${label}: reject changed truth`);assert(!settled.residue,`${label}: reject left residue`);assert(!settled.identityHandoff,`${label}: reject fabricated accepted identity`);
  return{objectThresholdError,releaseError};
}

async function acceptProbe(session,mobile,label){
  await navigate(session);await execute(session,`window.__livingSliceV74.setTimingScale(4);return true;`);
  const{release,releaseCardCenter,objectThresholdError}=await enterThresholdIntent(session,mobile,'AH');await end(session,mobile,release);
  const pending=await waitStablePending(session,label);const pendingCenter={x:pending.authorityThreshold.held.x,y:pending.authorityThreshold.held.y};const releaseError=dist(releaseCardCenter,pendingCenter);assert(releaseError<12,`${label}: object snaps on release ${releaseError.toFixed(2)}px`);
  await screenshot(session,`${label}-pending`);

  await waitFor(`${label} moving handoff`,async()=>{const s=await snapshot(session);return s.materialPhase==='accepted'&&s.identityHandoff?.phase==='moving';});
  const moving=await snapshot(session);const h=moving.identityHandoff;
  assert(h.card==='AH',`${label}: handoff identity changed ${h.card}`);assert(h.startGap<2,`${label}: carrier does not start at pending geometry ${h.startGap.toFixed(2)}px`);
  assert(dist(pendingCenter,h.startRect)<3,`${label}: handoff source differs from stable pending ${dist(pendingCenter,h.startRect).toFixed(2)}px`);
  assert(h.authorityTravel>42,`${label}: authority accept travel too weak ${h.authorityTravel.toFixed(2)}px`);assert(h.authorityTravel<190,`${label}: authority accept travel too detached ${h.authorityTravel.toFixed(2)}px`);
  assert(h.visibleCopies===1,`${label}: duplicate visible identity during handoff ${h.visibleCopies}`);assert(moving.handoffCarrierVisible,`${label}: moving carrier missing`);
  await screenshot(session,`${label}-authority-handoff`);

  await waitFor(`${label} handoff settled`,async()=>{const s=await snapshot(session);return s.materialPhase==='accepted'&&s.identityHandoff?.phase==='settled'&&!s.handoffCarrierVisible;});
  const accepted=await snapshot(session);const settledHandoff=accepted.identityHandoff;
  assert(settledHandoff.revealGap<3,`${label}: carrier/canonical swap jumps ${settledHandoff.revealGap.toFixed(2)}px`);assert(settledHandoff.sizeGap<3,`${label}: carrier/canonical size swap jumps ${settledHandoff.sizeGap.toFixed(2)}px`);
  assert(settledHandoff.visibleCopies===1,`${label}: accepted identity duplicates after swap ${settledHandoff.visibleCopies}`);assert(accepted.acceptedCard,`${label}: canonical accepted card missing`);
  assert(dist(accepted.acceptedCard,settledHandoff.targetRect)<3,`${label}: canonical accepted card moved after handoff ${dist(accepted.acceptedCard,settledHandoff.targetRect).toFixed(2)}px`);
  await screenshot(session,`${label}-accepted`);

  await waitFor(`${label} resolving`,async()=>(await snapshot(session)).materialPhase==='resolving');await waitFor(`${label} ghosts`,async()=>{const s=await snapshot(session);return s.materialCaptureGhosts.length===3&&s.materialCaptureGhosts.every((g)=>g.material&&g.opacity>=.45);});await screenshot(session,`${label}-resolving`);
  await waitFor(`${label} settled residue`,async()=>{const s=await snapshot(session);return s.materialPhase==='settled'&&s.residue?.visible&&s.residue.cards.join(',')==='10H,KH,AH';});const settled=await snapshot(session);
  assert(settled.capturedValue===65&&settled.matchScore===340&&settled.initiative==='Prowadzisz',`${label}: wrong consequence truth`);assert(!settled.overflowX,`${label}: horizontal overflow`);await screenshot(session,`${label}-settled`);
  return{objectThresholdError,releaseError,authorityTravel:h.authorityTravel,startGap:h.startGap,revealGap:settledHandoff.revealGap,sizeGap:settledHandoff.sizeGap,residue:settled.residue.cards};
}

async function runViewport({label,width,height,mobile}){const session=await createSession();try{await setViewport(session,width,height,mobile);const reject=await rejectProbe(session,mobile,`${label}-reject`);const accept=await acceptProbe(session,mobile,`${label}-accept`);return{label,reject,accept};}finally{try{await webdriver(`/session/${session}`,{method:'DELETE'});}catch{}}}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4203']);const driver=startProcess('chromedriver',['--port=9544']);
try{await waitFor('Vite V7.4',async()=>(await fetch(BASE).catch(()=>null))?.ok);await waitFor('ChromeDriver V7.4',async()=>(await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);const desktop=await runViewport({label:'living-slice-v7-4-desktop',width:1440,height:900,mobile:false});const mobile=await runViewport({label:'living-slice-v7-4-mobile',width:390,height:844,mobile:true});console.log('experience living slice v7.4 browser smoke: PASS');console.log(JSON.stringify({desktop,mobile},null,2));}catch(error){console.error('experience living slice v7.4 browser smoke: FAIL');console.error(error);console.error('\n--- vite output ---\n',vite.getOutput());console.error('\n--- chromedriver output ---\n',driver.getOutput());throw error;}finally{stopProcess(driver.child);stopProcess(vite.child);}
