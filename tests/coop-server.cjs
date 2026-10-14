"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createServer}=require("../server/server.cjs"),engine=require("../server/engine.cjs");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=10000){const end=Date.now()+ms;while(Date.now()<end){if(fn())return;await sleep(25)}throw Error("Timed out waiting for room state")}
test("authoritative 2–4 player room, conflicts, replay, persistence and isolation",async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"bean-coop-")),dbPath=path.join(dir,"rooms.sqlite");let server,base;const clients=[];
 async function launch(){server=createServer({dbPath});await new Promise(r=>server.listen(0,"127.0.0.1",r));base="http://127.0.0.1:"+server.address().port}
 async function post(route,body,session){const res=await fetch(base+"/api/coop/"+route,{method:"POST",headers:{"Content-Type":"application/json",...(session?{Authorization:"Bearer "+session.token,"X-Room-Code":session.code}:{})},body:JSON.stringify(body)});return {status:res.status,...await res.json()}}
 async function connect(session){
  const c={session,abort:new AbortController(),state:null};clients.push(c);
  const res=await fetch(base+"/api/coop/events",{headers:{Authorization:"Bearer "+session.token,"X-Room-Code":session.code},signal:c.abort.signal});assert.equal(res.status,200);
  c.loop=(async()=>{const reader=res.body.getReader(),decoder=new TextDecoder();let buf="";try{while(true){const x=await reader.read();if(x.done)break;buf+=decoder.decode(x.value,{stream:true});let p;while((p=buf.indexOf("\n\n"))>=0){const msg=buf.slice(0,p);buf=buf.slice(p+2);if(msg.startsWith("data: "))c.state=JSON.parse(msg.slice(6))}}}catch(e){if(e.name!=="AbortError")throw e}})();
  await until(()=>c.state);return c;
 }
 async function action(c,action,key="",payload={},overrides={}){
  const body={action,key,payload,seq:c.state.seq+1,revision:c.state.revision,...overrides};const result=await post("action",body,c.session);
  if(result.seq)await until(()=>c.state.seq>=result.seq);return result;
 }
 await launch();
 t.after(async()=>{for(const c of clients)c.abort.abort();await server.shutdown();fs.rmSync(dir,{recursive:true,force:true})});
 const host=await post("create",{name:"Anh"});assert.equal(host.status,200);assert.match(host.code,/^[A-Z2-9]{8}$/);
 const a=await connect(host);assert.equal(a.state.state.day,1);assert.equal(a.state.state.cash,10000);
 assert.equal((await action(a,"openConfirm")).status,409,"solo cannot open co-op shift");
 const guests=[];for(const name of ["Bạn 2","Bạn 3","Bạn 4"]){const s=await post("join",{name,code:host.code});assert.equal(s.status,200);guests.push(await connect(s))}
 const [b,c,d]=guests;assert.equal((await post("join",{name:"Fifth",code:host.code})).status,400);
 await until(()=>a.state.members.filter(m=>m.online).length===4);
 assert.equal((await action(b,"cartBuy","",{items:{cup:1}})).status,409,"guest cannot spend shared funds");
 assert.equal((await action(a,"openConfirm")).status,200);await until(()=>b.state.state.phase==="open");
 await until(()=>a.state.revision===b.state.revision);
 const rev=a.state.revision,before=a.state.state.stock.cup.reduce((n,x)=>n+x.n,0);
 const size=a.state.state.order.size;
 const results=await Promise.all([action(a,"cup",size,{}, {revision:rev}),action(b,"cup",size,{}, {revision:rev})]);
 assert.equal(results.filter(x=>x.status===200).length,1,"one cup wins competing actions");
 await until(()=>c.state.state.cup);
 assert.equal(a.state.state.stock.cup.reduce((n,x)=>n+x.n,0),before-1);
 const winner=results[0].status===200?a:b,seq=winner.state.seq;
 const replay=await post("action",{action:"cup",key:size,seq,revision:rev},winner.session);assert.equal(replay.duplicate,true);
 const rawBefore=JSON.stringify(a.state.state.stock);
 const invalid=await action(a,"cash","",{cash:999999999});assert.equal(invalid.status,409);
 assert.equal(JSON.stringify(a.state.state.stock),rawBefore,"client cannot send arbitrary state");
 const order=a.state.state.order,recipe=order.recipeOverride||a.state.state.menu[order.id].recipe;
 for(const step of recipe){
  await until(()=>!b.state.state.job&&b.state.revision===a.state.revision);
  assert.equal((await action(b,"ingredient",step)).status,200);
  await until(()=>!a.state.state.job&&a.state.state.cup.steps.length>0);
  // Ensure the latest job has finished, not the pre-command snapshot.
  await until(()=>!b.state.state.job);
 }
 // Optional sweetness/ice handled by another player using actual inventory.
 if(order.sweet){await until(()=>c.state.revision===a.state.revision);assert.equal((await action(c,"ingredient","sugar")).status,200);await until(()=>!c.state.state.job)}
 if(order.iced){await until(()=>c.state.revision===a.state.revision);assert.equal((await action(c,"iceMode",order.iceMode||"normal")).status,200);await until(()=>!c.state.state.job)}
 await until(()=>d.state.revision===a.state.revision);assert.equal((await action(d,"lid")).status,200);
 await until(()=>a.state.state.cup?.sealed&&b.state.state.cup?.sealed&&a.state.revision===b.state.revision);
 const deliveryRev=a.state.revision;
 const served=await Promise.all([action(a,"serve","",{}, {revision:deliveryRev}),action(b,"serve","",{}, {revision:deliveryRev})]);
 assert.equal(served.filter(x=>x.status===200).length,1,"delivery cannot be paid twice");
 assert.ok(a.state.state.stats.orders<=1);
 assert.equal(a.state.fault,false);
 // Falling below two connections freezes authoritative clock and cup state.
 for(const x of [b,c,d])x.abort.abort();
 await until(()=>a.state.members.filter(m=>m.online).length===1);
 const frozen=a.state.state.shift.elapsed;await sleep(700);assert.equal(a.state.state.shift.elapsed,frozen);
 const resumed=await connect(b.session);await until(()=>a.state.members.filter(m=>m.online).length===2);
 assert.equal(resumed.state.state.day,a.state.state.day);
 assert.equal((await action(a,"pause")).status,200);
 const checkpoint=clone(a.state.state),cash=checkpoint.cash;
 for(const x of clients)x.abort.abort();await sleep(50);await server.shutdown();await launch();
 const again=await connect(host);assert.equal(again.state.state.cash,cash);assert.deepEqual(again.state.state.stock,checkpoint.stock);assert.equal(again.state.paused,true);
 const outsider=await post("create",{name:"Other room"});const other=await connect(outsider);assert.equal(other.state.state.cash,10000);assert.equal(other.state.state.phase,"prep");
 const deny=await fetch(base+"/api/coop/events",{headers:{Authorization:"Bearer "+outsider.token,"X-Room-Code":host.code}});assert.equal(deny.status,400);
 for(const route of ["/server/server.cjs","/data/coop.sqlite","/.git/config"]){const res=await fetch(base+route);assert.equal(res.status,404)}
 const origin=await fetch(base+"/api/coop/create",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://evil.example"},body:'{"name":"bad"}'});assert.equal(origin.status,403);
});
function clone(s){return JSON.parse(JSON.stringify(s))}
test("engine bridge loads original rules and rolls through preparation",()=>{
 const s=engine.create();assert.equal(engine.check(s),true);const old=JSON.stringify(s);assert.throws(()=>engine.apply(s,"setCash",""));assert.equal(JSON.stringify(s),old);
 engine.apply(s,"openConfirm","");engine.apply(s,"cup",s.order.size);assert.equal(engine.check(s),true);
});
