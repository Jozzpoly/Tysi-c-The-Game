import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE='http://127.0.0.1:4201/lab/experience/living-slice-v7-3.html?geometry=c';
const WEBDRIVER='http://127.0.0.1:9542';
const OUTPUT='artifacts/experience';
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
function assert(condition,message){if(!condition)throw new Error(message);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
async function waitFor(label,probe,timeoutMs=15000){const end=Date.now()+timeoutMs;let last;while(Date.now()<end){try{const value=await probe();if(value)return value;}catch(error){last=error;}await sleep(30);}throw new Error(`${label} timed out${last?`: ${last}`:''}`);}
function startProcess(command,args){let output='';const child=spawn(command,args,{detached:true,stdio:['ignore','pipe','pipe'],env:process.env});const capture=(chunk)=>{output+=chunk.toString();if(output.length>30000)output=output.slice(-30000);};child.stdout.on('data',capture);child.stderr.on('data',capture);return{child,getOutput:()=>output};}
function stopProcess(child){if(!child?.pid||child.exitCode!==null)return;try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}}
async function webdriver(path,init={}){const response=await fetch(`${WEBDRIVER}${path}`,{...init,headers:{'content-type':'application/json',...(init.headers??{})}});const body=await response.json().catch(()=>({}));if(!response.ok||body?.value?.error)throw new Error(`WebDriver ${init.method??'GET'} ${path}: ${JSON.stringify(body)}`);return body.value;}
async function execute(session,script){return webdriver(`/session/${session}/execute/sync`,{method:'POST',body:JSON.stringify({script,args:[]})});}
async function cdp(session,cmd,params={}){return webdriver(`/session/${session}/goog/cdp/execute`,{method:'POST',body:JSON.stringify({cmd,params})});}
async function screenshot(session,name){const data=await webdriver(`/session/${session}/screenshot`);await writeFile(`${OUTPUT}/${name}.png`,Buffer.from(data,'base64'));}
async function createSession(){const value=await webdriver('/session',{method:'POST',body:JSON.stringify({capabilities:{alwaysMatch:{browserName:'chrome','goog:chromeOptions':{args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900']}}}})});return value.sessionId;}
async function setViewport(session,width,height,mobile){await cdp(session,'Emulation.setDeviceMetricsOverride',{width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile,positionX:0,positionY:0,dontSetVisibleSize:false});await cdp(session,'Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:mobile?5:1});}
async function navigate(session){await webdriver(`/session/${session}/url`,{method:'POST',body:JSON.stringify({url:BASE})});await waitFor('V7.3 ready',()=>execute(session,`return Boolean(window.__livingSliceV73) && window.__livingSliceV73.snapshot().version===7.3;`));}
async function snapshot(session){return execute(session,`return window.__livingSliceV73.snapshot();`);}
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

async function enterThresholdIntent(session,mobile,cardId){
  const geo=await geometry(session);const card=cardBy(geo,cardId);const from=point(card,mobile);const target=thresholdPoint(geo);
  await start(session,mobile,from);
  for(let i=1;i<=12;i+=1){const u=i/12;await move(session,mobile,{x:from.x+(target.x-from.x)*u,y:from.y+(target.y-from.y)*u});await sleep(8);}
  await waitFor(`${cardId} threshold intent`,async()=>(await snapshot(session)).materialPhase==='intent');
  return{release:target};
}

function assertThreshold(label,pending,release){
  const t=pending.authorityThreshold;
  assert(t,`${label}: missing authority threshold`);
  assert(t.thresholdError<10,`${label}: pending misses computed threshold ${t.thresholdError.toFixed(2)}px`);
  assert(t.authorityTravel>42,`${label}: pending still reads like accepted trick ${t.authorityTravel.toFixed(2)}px`);
  assert(t.authorityTravel<155,`${label}: threshold too detached from trick ${t.authorityTravel.toFixed(2)}px`);
  assert(t.verticalAuthorityTravel>35,`${label}: accept does not travel inward/upward ${t.verticalAuthorityTravel.toFixed(2)}px`);
  const releaseError=dist(release,{x:t.held.x,y:t.held.y});
  assert(releaseError<18,`${label}: release->pending discontinuity too large ${releaseError.toFixed(2)}px`);
  const s=t.shared;
  assert(t.held.x>s.left&&t.held.x<s.right&&t.held.y>s.top&&t.held.y<s.bottom,`${label}: pending is outside shared field`);
  return releaseError;
}

async function rejectProbe(session,mobile,label){
  await navigate(session);await execute(session,`window.__livingSliceV73.setTimingScale(4);window.__livingSliceV73.rejectNext();return true;`);
  const{release}=await enterThresholdIntent(session,mobile,'JH');await end(session,mobile,release);
  await waitFor(`${label} pending`,async()=>{const s=await snapshot(session);return s.materialPhase==='pending'&&Boolean(s.authorityThreshold);});
  const pending=await snapshot(session);const releaseError=assertThreshold(label,pending,release);
  const opacity=await execute(session,`return Number(getComputedStyle(document.querySelector('.hand-card.held.pending')).opacity);`);
  assert(opacity>.92,`${label}: pending lost object identity ${opacity}`);
  await screenshot(session,`${label}-threshold-pending`);
  await waitFor(`${label} reject`,async()=>(await snapshot(session)).materialReject===true);await screenshot(session,`${label}-reject`);
  await waitFor(`${label} return`,async()=>{const s=await snapshot(session);return s.phase==='ready'&&s.hand.includes('JH');});
  const settled=await snapshot(session);
  assert(settled.capturedValue===40&&settled.matchScore===340,`${label}: reject changed authority truth`);
  assert(!settled.residue,`${label}: reject left consequence residue`);
  return{authorityTravel:pending.authorityThreshold.authorityTravel,releaseError,opacity};
}

async function acceptProbe(session,mobile,label){
  await navigate(session);await execute(session,`window.__livingSliceV73.setTimingScale(4);return true;`);
  const{release}=await enterThresholdIntent(session,mobile,'AH');await end(session,mobile,release);
  await waitFor(`${label} pending`,async()=>{const s=await snapshot(session);return s.materialPhase==='pending'&&Boolean(s.authorityThreshold);});
  const pending=await snapshot(session);const releaseError=assertThreshold(label,pending,release);const pendingCenter={x:pending.authorityThreshold.held.x,y:pending.authorityThreshold.held.y};
  await screenshot(session,`${label}-threshold-pending`);
  await waitFor(`${label} accepted`,async()=>{const s=await snapshot(session);return s.materialPhase==='accepted'&&Boolean(s.acceptedCard);});await sleep(250);
  const accepted=await snapshot(session);const acceptedCenter={x:accepted.acceptedCard.x,y:accepted.acceptedCard.y};const settleDistance=dist(pendingCenter,acceptedCenter);
  assert(settleDistance>42,`${label}: threshold->accepted settle too weak ${settleDistance.toFixed(2)}px`);
  assert(Math.abs(accepted.acceptedCard.x-pending.authorityThreshold.final.x)<12,`${label}: accepted card misses canonical x plane`);
  assert(Math.abs(accepted.acceptedCard.y-pending.authorityThreshold.final.y)<18,`${label}: accepted card misses canonical y plane`);
  await screenshot(session,`${label}-accepted-inward`);
  await waitFor(`${label} resolving`,async()=>(await snapshot(session)).materialPhase==='resolving');
  await waitFor(`${label} ghosts`,async()=>{const s=await snapshot(session);return s.materialCaptureGhosts.length===3&&s.materialCaptureGhosts.every((g)=>g.material&&g.opacity>=.45);});
  await screenshot(session,`${label}-resolving`);
  await waitFor(`${label} settled`,async()=>(await snapshot(session)).materialPhase==='settled');const settled=await snapshot(session);
  assert(settled.residue?.visible&&settled.residue.cards.join(',')==='10H,KH,AH',`${label}: wrong residue ${JSON.stringify(settled.residue)}`);
  assert(settled.capturedValue===65&&settled.matchScore===340&&settled.initiative==='Prowadzisz',`${label}: wrong consequence truth`);
  assert(!settled.overflowX,`${label}: horizontal overflow`);
  await screenshot(session,`${label}-settled`);
  return{authorityTravel:pending.authorityThreshold.authorityTravel,releaseError,settleDistance,residue:settled.residue.cards};
}

async function runViewport({label,width,height,mobile}){const session=await createSession();try{await setViewport(session,width,height,mobile);const reject=await rejectProbe(session,mobile,`${label}-reject`);const accept=await acceptProbe(session,mobile,`${label}-accept`);return{label,reject,accept};}finally{try{await webdriver(`/session/${session}`,{method:'DELETE'});}catch{}}}

await mkdir(OUTPUT,{recursive:true});
const vite=startProcess('npm',['run','dev','--','--host','127.0.0.1','--port','4201']);
const driver=startProcess('chromedriver',['--port=9542']);
try{
  await waitFor('Vite V7.3',async()=>(await fetch(BASE).catch(()=>null))?.ok);await waitFor('ChromeDriver V7.3',async()=>(await fetch(`${WEBDRIVER}/status`).catch(()=>null))?.ok);
  const desktop=await runViewport({label:'living-slice-v7-3-desktop',width:1440,height:900,mobile:false});
  const mobile=await runViewport({label:'living-slice-v7-3-mobile',width:390,height:844,mobile:true});
  console.log('experience living slice v7.3 browser smoke: PASS');console.log(JSON.stringify({desktop,mobile},null,2));
}catch(error){console.error('experience living slice v7.3 browser smoke: FAIL');console.error(error);console.error('\n--- vite output ---\n',vite.getOutput());console.error('\n--- chromedriver output ---\n',driver.getOutput());throw error;}finally{stopProcess(driver.child);stopProcess(vite.child);}
