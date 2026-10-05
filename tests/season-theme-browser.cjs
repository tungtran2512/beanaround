/* Optional developer-only visual regression runner. No browser dependency ships
 * with the game. Run from a clone of this branch:
 * npm install --no-save playwright
 * npx playwright install chromium webkit
 * node tests/season-theme-browser.cjs
 * BROWSER=webkit node tests/season-theme-browser.cjs
 *
 * Writes REAL screenshots only after the game is running. Does not open a
 * production URL or touch a player's storage. Baseline is served from Git.
 */
"use strict";
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {execFileSync}=require("node:child_process");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const baseline=execFileSync("git",["show","578ef27013e71ac65ee658b09297ff6f1ac0b88d:index.html"],{cwd:root,maxBuffer:4*1024*1024});
const output=path.join(root,"artifacts","season-theme",process.env.BROWSER||"chromium");
fs.mkdirSync(output,{recursive:true});
const types={".html":"text/html; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".js":"text/javascript",".css":"text/css"};
const selectors=[".topbar",".customer-queue",".compact-order",".bar-bench",".bar-progress",".visual-tabs",".ingredient-drawer",".finish-tray",".visual-serve",".deliver-art",".navbar",".cup-rack",".bar-machine",".cup-position"];
function assert(value,message){if(!value)throw Error(message)}
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost");
 if(url.pathname==="/favicon.ico"){res.writeHead(204);res.end();return}
 if(url.pathname==="/__baseline.html"){res.setHeader("Content-Type",types[".html"]);res.end(baseline);return}
 const file=path.resolve(root,"."+decodeURIComponent(url.pathname==="/" ? "/index.html" : url.pathname));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return}res.setHeader("Content-Type",types[path.extname(file)]||"application/octet-stream");res.end(data)});
});
async function setup(page,recipe="latte",working=false){
 await page.evaluate(({recipe,working})=>{
  let qaSeed=123456789;gameRandom=()=>((qaSeed=(Math.imul(qaSeed,1664525)+1013904223)>>>0)/4294967296);
  const s=newGame(()=>.5);
  for(const[k,g]of Object.entries(G))s.stock[k]=[{n:1000,expiry:s.day+30,unitCost:g.unitCost}];
  s.events.preparedDay=s.day;s.events.active=null;s.events.broken=false;s.ops.active=null;s.ops.scheduled=null;
  s.online.enabled=false;state=networkBind(s);openDay(state);
  state.order.needsClarification=false;state.order.size="M";state.order.sweet=0;state.order.topping=null;state.order.extraShot=0;
  setRecipeOnOrder(state,state.order,recipe);
  chooseCup(state,"M");
  const device=recipe==="latte"?"espresso":recipe==="apple"?"press":"blend";
  const steps=recipeForOrder(state.order).steps,at=steps.indexOf(device);
  for(const key of steps.slice(0,Math.max(0,at)))ingredient(state,key);
  if(working){startIngredient(state,device);state.job.remaining=state.job.total/2}
  closeSheet();managementVisible=false;stationPanelCache=null;paint();
 },{recipe,working});
 await page.waitForLoadState("networkidle");
 await page.evaluate(()=>document.fonts.ready);
}
async function rects(page){
 return page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{
  const el=document.querySelector("#game "+selector);if(!el)return [selector,null];
  const r=el.getBoundingClientRect();return [selector,{x:r.x,y:r.y,width:r.width,height:r.height}];
 })),selectors);
}
function sameRects(before,after,label){
 for(const key of selectors){assert(before[key]&&after[key],label+": missing "+key);
  for(const field of ["x","y","width","height"])assert(Math.abs(before[key][field]-after[key][field])<=.75,label+": layout changed "+key+"."+field+" "+before[key][field]+" -> "+after[key][field]);
 }
}
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port;
 const browser=await (process.env.BROWSER==="webkit"?webkit:chromium).launch();
 const report={baseline:"578ef270",screenshots:[],viewports:[],errors:[]};
 try{
  for(const viewport of [{width:390,height:844},{width:375,height:812},{width:430,height:932}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
   const page=await context.newPage();
   page.on("pageerror",error=>report.errors.push(error.message));
   page.on("console",message=>{if(message.type()==="error")report.errors.push(message.text())});
   page.on("response",response=>{if(response.status()>=400)report.errors.push(response.status()+" "+response.url())});
   // Freeze only this isolated QA browser's clock for comparable order/timer text.
   await page.clock.install({time:new Date("2026-10-05T12:00:00Z")});
   await page.clock.pauseAt(new Date("2026-10-05T12:00:01Z"));
   await page.goto(url+"/__baseline.html");await setup(page);
   const before=await rects(page);
   await page.screenshot({path:path.join(output,"baseline-"+viewport.width+".png"),fullPage:true});
   await page.goto(url+"/index.html?season-theme=off");await setup(page);
   sameRects(before,await rects(page),"off/"+viewport.width);
   for(const theme of ["autumn","spring","summer","winter"]){
    const unchanged=await page.evaluate(theme=>{
     const before=JSON.stringify(state),storage=JSON.stringify({...localStorage});
     window.BeanAroundSeasonTheme.setPreview(theme);
     return JSON.stringify(state)===before&&JSON.stringify({...localStorage})===storage;
    },theme);
    assert(unchanged,"theme changed gameplay/save");
    const visual=await page.evaluate(()=>{
     const game=document.getElementById("game"),t=SeasonTheme[game.dataset.cafeTheme],order=game.querySelector(".compact-order");
     return {header:getComputedStyle(game.querySelector(".topbar")).backgroundColor,room:game.querySelector(".cafe-room").getAttribute("src"),note:order.dataset.cafeNote,expectedRoom:t.background};
    });
    const expectedColors={spring:"rgb(142, 32, 50)",summer:"rgb(22, 90, 70)",autumn:"rgb(126, 31, 40)",winter:"rgb(24, 52, 76)"};
    assert(visual.header===expectedColors[theme],"season header color missing "+JSON.stringify(visual));
    assert(visual.room===visual.expectedRoom,"wrong seasonal environment");
    assert(visual.note==="show","simple order should show safe note");
    await page.waitForLoadState("networkidle");
    sameRects(before,await rects(page),theme+"/"+viewport.width);
    const audit=await page.evaluate(()=>window.BeanAroundSeasonTheme.audit());
    assert(audit.every(x=>x.ok),"audit failed "+theme+": "+JSON.stringify(audit.filter(x=>!x.ok)));
    const touches=await page.evaluate(()=>Array.from(document.querySelectorAll("#station button,.navbar button")).filter(el=>{
     const r=el.getBoundingClientRect();return !el.disabled&&r.width&&r.height;
    }).every(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}));
    assert(touches,"decoration or another element intercepts touch");
    const file=theme+"-"+viewport.width+"x"+viewport.height+".png";
    await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file);
   }
   // Real recipe stages, idle and working, at the reference viewport.
   if(viewport.width===390){
    await page.evaluate(()=>window.BeanAroundSeasonTheme.setPreview("autumn"));
    for(const recipe of ["latte","apple","mangoCoconut"])for(const working of [false,true]){
     await setup(page,recipe,working);
     const file="equipment-"+recipe+"-"+(working?"working":"idle")+".png";
     await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file);
     await page.locator(".bar-bench").screenshot({path:path.join(output,"stage-"+file)});
     const active=await page.locator(".bar-machine").getAttribute("data-machine");
     assert(active===(recipe==="latte"?"espresso":recipe==="apple"?"press":"blend"),"wrong machine");
    }
    await setup(page,"latte");
    const noteSafety=await page.evaluate(()=>{
     const order=document.querySelector(".compact-order"),small=order.querySelector("small"),old=small.textContent;
     small.textContent="L · Không thêm đường · Ít đá · Kem cheese · Extra shot · Giao nhanh";
     syncCafeOrderNote();const hidden=order.dataset.cafeNote==="hide";small.textContent=old;syncCafeOrderNote();return hidden;
    });
    assert(noteSafety,"long order note was not hidden");
    const logic=await page.evaluate(()=>window.BeanAroundBranchLaunchChecks.run());
    assert(logic.every(x=>x.ok),"branch launch regression "+JSON.stringify(logic.filter(x=>!x.ok)));
    report.branchLaunch=logic;
    const retention=await page.evaluate(()=>{
     const room=document.querySelector(".cafe-room"),machine=document.querySelector(".bar-machine"),image=machine.querySelector("image");
     for(const id of ["apple","mangoCoconut","latte"]){
      state.job=null;state.cup=null;setRecipeOnOrder(state,state.order,id);chooseCup(state,"M");renderStation();
      if(document.querySelector(".cafe-room")!==room||document.querySelector(".bar-machine")!==machine||machine.querySelector("image")!==image)return false;
     }
     return true;
    });
    assert(retention,"device switch replaced room/equipment image");
   }
   report.viewports.push({viewport,geometry:"unchanged",touch:"passed"});
   await context.close();
  }
  assert(report.errors.length===0,"Browser errors: "+report.errors.join("\n"));
  if(process.env.REVIEW_IMAGE_LOG==="1"&&process.env.BROWSER!=="webkit"){
   const samples=["spring","summer","autumn","winter"].map(id=>({id,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,id+"-390x844.png")).toString("base64")}));
   const sheet=await browser.newPage({viewport:{width:1560,height:874}});
   await sheet.setContent('<canvas id="review" width="1560" height="874"></canvas>');
   const jpeg=await sheet.evaluate(async samples=>{
    const canvas=document.getElementById("review"),ctx=canvas.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,1560,874);ctx.font="bold 16px sans-serif";
    for(let i=0;i<samples.length;i++){const im=new Image();im.src=samples[i].data;await im.decode();ctx.fillStyle="#762020";ctx.fillText(samples[i].id.toUpperCase(),i*390+12,21);ctx.drawImage(im,i*390,30,390,844)}
    return canvas.toDataURL("image/jpeg",.82);
   },samples);
   fs.writeFileSync(path.join(output,"four-seasons-contact-sheet.jpg"),Buffer.from(jpeg.split(",")[1],"base64"));
   // Enables the assistant to inspect actual captured pixels through text-only CI tools.
   console.log("CAFE_VISUAL_REVIEW_IMAGE="+jpeg);
   const devices=["latte","apple","mangoCoconut"];
   const stages=devices.flatMap(id=>["idle","working"].map(work=>({id:id+" / "+work,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,"stage-equipment-"+id+"-"+work+".png")).toString("base64")})));
   const machineJpeg=await sheet.evaluate(async stages=>{
    const canvas=document.getElementById("review");canvas.width=1170;canvas.height=660;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,1170,660);ctx.font="bold 16px sans-serif";
    for(let i=0;i<stages.length;i++){const im=new Image();im.src=stages[i].data;await im.decode();const x=Math.floor(i/2)*390,y=i%2*330;ctx.fillStyle="#762020";ctx.fillText(stages[i].id,x+12,y+21);ctx.drawImage(im,x,y+30,390,Math.min(300,390*im.height/im.width))}
    return canvas.toDataURL("image/jpeg",.87);
   },stages);
   fs.writeFileSync(path.join(output,"equipment-contact-sheet.jpg"),Buffer.from(machineJpeg.split(",")[1],"base64"));
   console.log("CAFE_MACHINE_REVIEW_IMAGE="+machineJpeg);
   await sheet.close();
  }
  report.status="passed";
 }catch(error){report.status="failed";report.failure=error.message;process.exitCode=1}
 finally{await browser.close();server.close();fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
})().catch(error=>{server.close();console.error(error);process.exitCode=1});
