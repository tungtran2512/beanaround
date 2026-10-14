"use strict";
const {chromium,webkit}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs");
const {createServer}=require("../server/server.cjs");
(async()=>{
 const server=createServer({dbPath:":memory:"});await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await (process.env.BROWSER==="webkit"?webkit:chromium).launch({headless:true});const contexts=[],pages=[],errors=[];
 try{
  for(let i=0;i<4;i++){
   const context=await browser.newContext({viewport:{width:390,height:844}});contexts.push(context);
   const p=await context.newPage();p.on("pageerror",e=>errors.push(e.message));pages.push(p);
   await p.goto(base+"/coop/");await p.evaluate(()=>localStorage.setItem("bean-around-cafe-v13","SOLO_KEEP_ME"));
   await p.locator("#playerName").fill("Bạn "+(i+1));
   if(i===0){await p.locator("#createRoom").click()}else{await p.locator("#roomCode").fill(await pages[0].evaluate(()=>JSON.parse(localStorage.getItem("bean-around-coop-session-v1")).code));await p.locator("#joinRoom").click()}
   await p.waitForURL(/coop=1/);await p.waitForFunction(()=>document.getElementById("coopConnection")?.hidden);
  }
  const [a,b,c,d]=pages;await a.waitForFunction(()=>document.querySelectorAll("#coopPeople span").length===4);
  await a.evaluate(()=>actV8("start"));await a.locator('[data-action="openConfirm"]').click();await a.waitForFunction(()=>state.phase==="open");
  for(const p of pages)await p.waitForFunction(()=>state.phase==="open");
  await b.evaluate(()=>actV8("home"));
  const size=await b.evaluate(()=>state.order.size);await b.locator('[data-action="cup"][data-key="'+size+'"]').first().click();
  for(const p of pages)await p.waitForFunction(()=>!!state.cup);
  assert.equal(await a.evaluate(()=>state.cash),await d.evaluate(()=>state.cash));
  const before=await b.evaluate(()=>JSON.stringify(state.stock));
  // Disconnect a peer and reload: room state comes from server, never local solo progress.
  await b.reload();await b.waitForFunction(()=>document.getElementById("coopConnection")?.hidden&&!!state.cup);
  assert.equal(await b.evaluate(()=>JSON.stringify(state.stock)),before);
  await a.locator("#coopPause").click();await a.waitForFunction(()=>document.getElementById("coopStatus").textContent.includes("Tạm dừng"));
  for(const p of pages){
   assert.equal(await p.evaluate(()=>localStorage.getItem("bean-around-cafe-v13")),"SOLO_KEEP_ME");
   assert.equal(await p.evaluate(async()=> (await indexedDB.databases()).some(d=>d.name==="bean-around-saves")),false);
  }
  fs.mkdirSync("artifacts/coop",{recursive:true});
  for(const width of [375,390,430]){
   await a.setViewportSize({width,height:width===375?812:width===390?844:932});
   await a.screenshot({path:"artifacts/coop/"+(process.env.BROWSER||"chromium")+"-"+width+".png",fullPage:true});
   assert.ok(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"no horizontal overflow");
  }
  assert.deepEqual(errors,[]);
  const shot=await a.screenshot({type:"jpeg",quality:65,fullPage:true});console.log("COOP_REVIEW_IMAGE=data:image/jpeg;base64,"+shot.toString("base64"));
  console.log(JSON.stringify({status:"passed",browser:process.env.BROWSER||"chromium",players:4,checks:["room join","shared cup and wallet","reload reconnect","solo localStorage untouched","no solo IndexedDB","375/390/430 widths","no page errors"]}));
 }finally{await browser.close();await server.shutdown()}
})().catch(e=>{console.error(e);process.exitCode=1});
