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
const types={".html":"text/html; charset=utf-8",".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png",".js":"text/javascript",".css":"text/css"};
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
 await page.waitForFunction(()=>typeof storageBooting==="undefined"||!storageBooting);
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
  closeSheet();document.getElementById("toast").classList.remove("show");managementVisible=false;stationPanelCache=null;paint();
 },{recipe,working});
 await page.waitForLoadState("networkidle");
 await page.evaluate(()=>document.fonts.ready);
 await page.locator(".cafe-atmosphere img").evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await waitCafeArtwork(page);
}
async function waitCafeArtwork(page){
 await page.evaluate(async()=>{
  if(typeof SeasonTheme==="undefined")return; // Older comparison baseline predates the theme system.
  const theme=SeasonTheme[document.getElementById("game").dataset.cafeTheme];if(!theme?.uiArtwork)return;
  await Promise.all(Object.values(theme.uiArtwork).map(src=>{const im=new Image();im.src=src;return im.decode()}));
 });
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
 // Offline asset preparation only, never part of the game's runtime.
 // Preserve the imagegen source, derive four individually cached mobile WebPs.
 // CSS uses three slices so only the quiet central region changes its width.
 const artPage=await browser.newPage();
 const atlasPath=path.join(root,"assets/bean-around/sources/winter-ui-atlas-2026.png");
 if(fs.existsSync(atlasPath)){
  const atlas="data:image/png;base64,"+fs.readFileSync(atlasPath).toString("base64");
  const strips=await artPage.evaluate(async source=>{
   const im=new Image();im.src=source;await im.decode();
   const bounds=[[0,260],[260,511],[511,769],[769,1024]];
   return bounds.map(([a,b])=>{
    const c=document.createElement("canvas");c.width=1170;c.height=Math.round(1170*(b-a)/1536);
    c.getContext("2d").drawImage(im,0,a,1536,b-a,0,0,c.width,c.height);
    return c.toDataURL("image/webp",.93);
   });
  },atlas);
  for(let i=0;i<strips.length;i++){
   const name=["header","order","deliver","footer"][i],target=path.join(root,"assets/bean-around/winter-ui-"+name+".webp");
   // Once checked-in, test the actual committed derivative rather than regenerate it.
   if(!fs.existsSync(target))fs.writeFileSync(target,Buffer.from(strips[i].split(",")[1],"base64"));
   if(process.env.BROWSER!=="webkit")console.log("WINTER_UI_ASSET_"+name.toUpperCase()+"=data:image/webp;base64,"+fs.readFileSync(target).toString("base64"));
  }
 }

 const springSource=path.join(root,"assets/bean-around/sources/spring-ui-atlas-2026.png");
 if(fs.existsSync(springSource)){
  const source="data:image/png;base64,"+fs.readFileSync(springSource).toString("base64");
  const strips=await artPage.evaluate(async source=>{
   const im=new Image();im.src=source;await im.decode();
   return [[0,247],[248,498],[501,743],[746,1000]].map(([a,b])=>{
    const c=document.createElement("canvas");c.width=1170;c.height=Math.round(1170*(b-a)/1536);
    c.getContext("2d").drawImage(im,0,a,1536,b-a,0,0,c.width,c.height);
    return c.toDataURL("image/webp",.93);
   });
  },source);
  for(let i=0;i<strips.length;i++){
   const name=["header","deliver","order","footer"][i],target=path.join(root,"assets/bean-around/spring-ui-"+name+".webp");
   if(!fs.existsSync(target))fs.writeFileSync(target,Buffer.from(strips[i].split(",")[1],"base64"));
   if(process.env.BROWSER!=="webkit")console.log("SPRING_UI_ASSET_"+name.toUpperCase()+"=data:image/webp;base64,"+fs.readFileSync(target).toString("base64"));
  }
 }


 const redSource=path.join(root,"assets/bean-around/sources/winter-red-ui-atlas-2026.png");
 if(fs.existsSync(redSource)){
  const source="data:image/png;base64,"+fs.readFileSync(redSource).toString("base64");
  const strips=await artPage.evaluate(async source=>{
   const im=new Image();im.src=source;await im.decode();
   return [[0,267],[268,500],[502,745],[748,1018]].map(([a,b])=>{
    const c=document.createElement("canvas");c.width=1170;c.height=Math.round(1170*(b-a)/1536);
    c.getContext("2d").drawImage(im,0,a,1536,b-a,0,0,c.width,c.height);
    return c.toDataURL("image/webp",.93);
   });
  },source);
  for(let i=0;i<strips.length;i++){
   const name=["header","deliver","order","footer"][i],target=path.join(root,"assets/bean-around/winter-red-ui-"+name+".webp");
   if(!fs.existsSync(target))fs.writeFileSync(target,Buffer.from(strips[i].split(",")[1],"base64"));
   if(process.env.BROWSER!=="webkit")console.log("WINTER_RED_ASSET_"+name.toUpperCase()+"=data:image/webp;base64,"+fs.readFileSync(target).toString("base64"));
  }
 }


 for(const [file,crops]of [
  ["season-rooms-2026.png",[[0,520,"tet-2026-cafe-room"],[521,1041,"summer-2026-cafe-room"],[1042,1536,"autumn-2026-cafe-room"]]],
  ["summer-autumn-bars-2026.png",[[0,193,"summer-2026-ui-header"],[194,355,"summer-2026-ui-deliver"],[356,545,"summer-2026-ui-order"],[546,732,"summer-2026-ui-footer"],[733,930,"autumn-2026-ui-header"],[931,1089,"autumn-2026-ui-deliver"],[1090,1277,"autumn-2026-ui-order"],[1278,1536,"autumn-2026-ui-footer"]]],
  ["tet-bars-2026.png",[[0,443,"tet-2026-ui-header"],[444,739,"tet-2026-ui-deliver"],[740,1086,"tet-2026-ui-order"],[1087,1456,"tet-2026-ui-footer"]]]
 ]){
  const source="data:image/png;base64,"+fs.readFileSync(path.join(root,"assets/bean-around/sources",file)).toString("base64");
  const out=await artPage.evaluate(async({source,crops})=>{const im=new Image();im.src=source;await im.decode();return crops.map(([a,b,name])=>{const c=document.createElement("canvas");c.width=name.includes("room")?780:1170;c.height=Math.round(c.width*(b-a)/im.width);c.getContext("2d").drawImage(im,0,a,im.width,b-a,0,0,c.width,c.height);return {name,data:c.toDataURL("image/webp",.91)}})},{source,crops});
  for(const a of out){const target=path.join(root,"assets/bean-around",a.name+".webp");if(!fs.existsSync(target))fs.writeFileSync(target,Buffer.from(a.data.split(",")[1],"base64"));if(process.env.BROWSER!=="webkit")console.log("PACKAGE_ASSET_"+a.name+"="+a.data)}
 }


 const pourSource="data:image/png;base64,"+fs.readFileSync(path.join(root,"assets/bean-around/sources/red-pour-2026.png")).toString("base64");
 const pourAsset=await artPage.evaluate(async source=>{const im=new Image();im.src=source;await im.decode();const c=document.createElement("canvas");c.width=640;c.height=Math.round(640*im.height/im.width);const ctx=c.getContext("2d");ctx.drawImage(im,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let alpha=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)alpha++;if(alpha<pixels.length/4*.1)throw Error("pour asset lacks transparent background");return c.toDataURL("image/webp",.94)},pourSource);
 const pourTarget=path.join(root,"assets/bean-around/bean-around-red-pour.webp");if(!fs.existsSync(pourTarget))fs.writeFileSync(pourTarget,Buffer.from(pourAsset.split(",")[1],"base64"));
 console.log("POUR_OPTIMIZED_ASSET="+pourAsset);

 await artPage.close();

 try{

  const opsContext=await browser.newContext();
  const opsPage=await opsContext.newPage();await opsPage.goto(url+"/index.html");
  await opsPage.waitForFunction(()=>typeof storageBooting!=="undefined"&&!storageBooting);
  report.operations=await opsPage.evaluate(()=>{
   const checks=[],check=(name,fn)=>{try{checks.push({name,ok:true,result:fn()})}catch(e){checks.push({name,ok:false,error:e.message})}},assert=(v,m)=>{if(!v)throw Error(m||"assertion")};
   const stock=s=>{for(const[k,g]of Object.entries(G))s.stock[k]=[{n:1000000,expiry:s.day+99,unitCost:g.unitCost}];for(const[k,g]of Object.entries(BAKES))s.bakery.stock[k]=[{n:10000,expiry:s.day+99,unitCost:g.cost}]};
   const full=()=>{const s=chainTestShop(63);for(const k of Object.keys(EQUIPMENT))s.upgrades[k]=true;for(const k of Object.keys(STAFF))Object.assign(s.employees[k],{hired:true,workingToday:true});s.online.tablet=s.online.enabled=true;s.online.quotaUnit="orders";s.bakery.owned=true;stock(s);Object.assign(s.events,{preparedDay:s.day,active:null,broken:null});s.ops.active=s.ops.scheduled=null;return s};

   check("sixty-cup ticket reload, one receipt and duplicate guards survive compaction",()=>{
    const s=full();s.online.quotaUnit="orders";const first=nextDeliveryOrder(s,1,()=>.2),items=[first];while(s.delivery.pending.length)items.push(nextDeliveryOrder(s,0,()=>.2));
    assert(items.length===60,"group size");const before=s.cash,cups=quantity(s,"cup");
    for(const o of items.slice(0,30))assert(autoFulfil(s,o,()=>.2).ok,"prepare");
    assert(s.cash===before&&s.stats.onlineReceipts===0,"premature charge");
    const restored=migrateSave(clone(s)),ticket=restored.delivery.tickets[first.deliveryGroup];
    for(const o of ticket.waiting.slice())assert(autoFulfil(restored,o,()=>.2).ok,"finish");
    assert(restored.stats.onlineReceipts===1&&restored.stats.onlineOrders===60&&restored.reviews.length===1,"receipt/cup/review count");
    assert(quantity(restored,"cup")===cups-60,"cup stock");
    const cash=restored.cash;let rejected=false;try{autoFulfil(restored,first,()=>.2)}catch(e){rejected=true}
    assert(rejected&&restored.cash===cash,"duplicate after compaction");
    assert(validCore(migrateSave(clone(restored))),"settled save");
    return {cups:restored.stats.onlineOrders,receipts:restored.stats.onlineReceipts};
   });
   check("bulk stock suggestion can purchase sixty-cup parcel inventory without truncated packs",()=>{
    const s=full();s.cash=100000000;
    for(const k of Object.keys(G))s.stock[k]=[];
    const cups=forecastOnlineCups(s),cart=suggestedCartUncapped(s);
    assert(cups===onlineVolume(s)*60,"cup forecast");
    buyCart(s,cart);
    assert(quantity(s,"cup")>=Math.ceil(cups*1.4),"cup procurement clipped");
    assert(s.stock.cup.length===1,"bulk procurement produced thousands of tiny lots");
    const plan=coldPreparationPlan(s);prepareColdReserve(s,plan);
    assert(quantity(s,"brew")>=plan.target&&quantity(s,"bean")>=plan.beanService,"cold brew starves service beans");
   });
   check("five-star reward matches the visible numeric rating without changing reviews",()=>{
    const root=full();root.day=150;root.cash=9000000;root.financialHistory=clone(chainTestShop(150).financialHistory);networkBind(root);
    for(const no of BRANCH_NUMBERS)maxTestBranch(root,openBranch(root,no));
    const reviews=(s,five,four)=>{s.reviews=[];s.reviewCounts=[0,0,0,0,four,five]};
    for(const shop of networkShops(root)){
     shop.reputation=100;shop.customersServed=100000;shop.events.deliveryAdDay=shop.day;shop.events.advertising=1;
     // Deliberately different legacy aggregate: the bonus must follow the header.
     shop.ratingSummary={sum:480,count:100};
     reviews(shop,0,0);assert(fiveStarOnlineFactor(shop)===1,"unreviewed shop rewarded");
     reviews(shop,94,6);const normalBase=basePromotedOnlineCapacity(shop),normalForecast=onlineVolumeBase(shop);
     assert(fiveStarOnlineFactor(shop)===1,"4.9 rewarded");
     for(const [five,four] of [[95,5],[99,1],[100,0]]){
      reviews(shop,five,four);const before=JSON.stringify(shop),r=reviewSummary(shop);
      assert(r.average.toLocaleString("vi-VN",{minimumFractionDigits:1,maximumFractionDigits:1})==="5,0","fixture");
      assert(fiveStarOnlineFactor(shop)===1.5,"visible 5.0 not rewarded");
      assert(onlineCapacity(shop)===Math.floor(normalBase*1.5+1e-7),"capacity bonus");
      assert(onlineVolumeBase(shop)===Math.floor(normalForecast*1.5+1e-7),"forecast bonus");
      assert(JSON.stringify(shop)===before,"reward mutated ratings/state");
     }
     reviews(shop,95,5);shop.reviewCounts[4]++;assert(fiveStarOnlineFactor(shop)===1,"reward survives displayed drop to 4.9");
     assert(onlineCapacity(shop)===normalBase,"capacity did not revert");
    }
    reviews(root,100,0);assert(branches(root).every(b=>fiveStarOnlineFactor(b)===1),"rating leaked to branches");
    const b=root.chain.branch5;reviews(b,99,1);root.contest.promoStart=root.day;root.contest.promoEnd=root.day+14;syncContestPromotion(root);
    b.seasonPackage={id:"summer",start:b.day,end:b.day+29,paid:30000};
    assert(onlineCapacity(b)===3824,"stacking");
    const count=branchForecast(root,5).online;assert(count>0&&count<=3824,"branch forecast");
    b.business.onlineLimit=100;assert(branchForecast(root,5).online===100,"admission limit ignored");
    const restored=migrateSave(clone(root));assert(fiveStarOnlineFactor(restored.chain.branch5)===1.5,"reload lost eligibility");
    return {maxCapacity:3824,branchForecast:count};
   });
   check("five shops open sequentially with independent capital, saves and visits",()=>{
    const root=chainTestShop(150);root.cash=6000000;networkBind(root);
    for(const no of BRANCH_NUMBERS){
     const before=root.cash,cfg=LOCATION_CONFIG[no],b=openBranch(root,no);
     assert(root.cash===before-cfg.setup-cfg.capital&&b.cash===cfg.capital,"capital "+no);
     assert(b.branchAge===0&&Object.values(b.stock).every(v=>v.length===0),"fresh branch");
     maxTestBranch(root,b);
    }
    assert(branches(root).length===4&&networkShops(root).length===5,"missing shops");
    const m=migrateSave(clone(root));assert(validCore(m)&&branches(m).length===4,"save five shops");
    for(const no of SHOP_NUMBERS)assert(locationNumber(selectVisitedShop(m,no))===no,"visit "+no);
    const bad=clone(m);bad.chain.branch4.chain.branch5=clone(m.chain.branch5);let rejected=false;try{migrateSave(bad)}catch(e){rejected=true}assert(rejected,"nested branch accepted");
    networkBind(root);
    return {shops:5,prices:BRANCH_NUMBERS.map(n=>LOCATION_CONFIG[n].setup+LOCATION_CONFIG[n].capital)};
   });
   check("new shops reject early opening and unhealthy chain",()=>{
    for(const no of [4,5]){
     const root=chainTestShop(LOCATION_CONFIG[no].day-1);root.cash=6000000;networkBind(root);
     for(let n=2;n<no;n++)maxTestBranch(root,openBranch(root,n));
     assert(branchRequirements(root,no).some(x=>!x.done),"early unlock");
     root.day++;for(const shop of networkShops(root)){shop.day=root.day;shop.financialHistory=clone(chainTestShop(root.day).financialHistory)}
     assert(branchRequirements(root,no).every(x=>x.done),"eligible chain");
     root.chain.branch.financialHistory[0].profit=-1;
     assert(branchRequirements(root,no).some(x=>!x.done),"loss ignored");
    }
   });
   check("paid staffing, training and equipment reach full online by shift eleven",()=>{
    const results=[];
    for(const no of BRANCH_NUMBERS){
     const root=chainTestShop(150);root.cash=9000000;networkBind(root);
     for(let n=2;n<no;n++)maxTestBranch(root,openBranch(root,n));
     const b=openBranch(root,no);branchTransfer(root,500000,no);
     for(const k of Object.keys(STAFF))if(!b.employees[k].hired)hireStaff(b,k);
     upgradeBranch(root,"tabletPro",no);upgradeBranch(root,"onlineLaunch",no);
     for(const id of ["delivery","speedBrew","packingLine","dispatchLead","batchDispatch","machineWorkflow"])enrollCourse(b,id);
     for(let age=0;age<=10;age++){
      b.phase=root.phase="prep";
      for(const id of ["counter","branding","prepLine","packingCounter","dualGroup","dispatchBelt","multiStation"])if(!b.upgrades[id]&&BRANCH_GEAR[id].age<=b.branchAge)upgradeBranch(root,id,no);
      if(trained(b,"delivery")&&!b.training.courses.fulfillmentLead)enrollCourse(b,"fulfillmentLead");
      branchAdvertise(root,no);
      if(age===10)break;
      chargeOperating(b);advanceTraining(b);b.branchAge++;root.day++;b.day=root.day;b.stats=blankDay();expandState(b);
     }
     assert(onlineCapacityBase(b)===500,"full capacity "+no);
     assert(b.cash<LOCATION_CONFIG[no].capital+500000,"unpaid path");
     results.push({branch:no,shift:b.branchAge+1,capacity:onlineCapacityBase(b),cash:b.cash});
    }
    return results;
   });
   check("championship applies to every branch and survives reload without duplicate trophies",()=>{
    const root=full();networkBind(root);const b2=maxTestBranch(root,openBranch(root,2));
    root.contest.promoStart=root.day;root.contest.promoEnd=root.day+14;syncContestPromotion(root);
    const b3=maxTestBranch(root,openBranch(root,3));
    for(const b of [b2,b3]){assert(contestBoost(b)===1.7,"branch bonus missing");assert(b.contest.wins===0,"duplicated trophy");assert(contestBoost({...b})===1.7,"forecast copy lost bonus");}
    const saved=migrateSave(clone(root));networkBind(saved);assert(branches(saved).every(b=>contestBoost(b)===1.7),"reload lost chain bonus");
    for(const s of networkShops(saved))s.day=saved.contest.promoEnd+1;
    assert(networkShops(saved).every(s=>contestBoost(s)===1),"bonus did not expire");
   });
   check("branch forecast stacks shared championship and local seasonal package only once",()=>{
    const root=full();networkBind(root);const b=maxTestBranch(root,openBranch(root,2));branchAdvertise(root,2);
    root.contest.promoStart=root.contest.promoEnd=0;syncContestPromotion(root);const normal=branchForecast(root,2).online;
    root.contest.promoStart=root.day;root.contest.promoEnd=root.day+14;syncContestPromotion(root);const won=branchForecast(root,2).online;
    assert(won>normal*1.65&&won<normal*1.75,"shared bonus applied incorrectly");
    b.seasonPackage={id:"tet",start:b.day,end:b.day+29,paid:30000};
    assert(branchForecast(root,2).online===won*2,"season/contest duplicate or missing multiplier");
    b.business.onlineLimit=100;assert(branchForecast(root,2).online===100,"branch admission cap ignored");
    return {normal,championship:won,withPackage:won*2};
   });
   check("equivalent branches have independent location advantages and shared daily variation",()=>{
    const root=full();root.reputation=100;root.customersServed=100000;root.contest.promoStart=0;root.contest.promoEnd=0;root.business.onlineLimit=null;
    const ratios=[];
    for(const day of [63,64,65,66,67,68,69]){
     root.day=day;root.events.deliveryAdDay=day;root.events.advertising=1;
     const main=onlineVolumeBase(root);
     for(const no of [2,3,4,5]){const peer=clone(root);peer.isBranch=true;peer.branchNo=no;peer.upgrades.onlineLaunch=false;
      const count=onlineVolumeBase(peer);assert(main>0&&Math.abs(count-main*onlineLocationFactor(peer))<=1.1,"unbalanced "+main+"/"+count);assert(onlineCapacity(peer)===Math.floor(500*onlineLocationFactor(peer)+1e-7),"capacity bonus");ratios.push(count/main);
      peer.business.onlineLimit=100;assert(onlineVolumeBase(peer)<=100,"ignored admission limit");
     }
    }
    return {min:Math.min(...ratios),max:Math.max(...ratios)};
   });
   for(const quota of [1,500,3825])check("complete "+quota+" parcels by 240 active seconds",()=>{
    let s=full();s.phase="open";s.dayGoal=60;s.served=0;s.order=makeOrder(s,()=>.5);s.online.dayQuota=quota;s.online.remaining=quota;s.online.issued=0;s.online.queue=[];deliveryDefaults(s);beginOnlinePacing(s);let halfway=0;
    const oldRandom=gameRandom;let seed=47;gameRandom=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    try{for(let t=0;t<1200;t++){advanceOnlinePacing(s,.2);clockDelta=.2;tickOnline(s);if(t===599){halfway=s.stats.onlineReceipts;s=migrateSave(clone(s))}}
    }finally{gameRandom=oldRandom}
    assert(s.stats.onlineOrders===quota*60,"every parcel has 60 cups");assert(s.stats.onlineReceipts===quota,"served "+s.stats.onlineReceipts+"/"+quota+" remaining "+s.online.remaining+" queue "+s.online.queue.length);
    assert((quota===1||halfway>0)&&halfway<Math.max(2,quota*.7),"bad pacing");assert(s.stats.failedReceipts===0,"failed parcels");assert(s.stats.ingredientsUsed>0&&s.stats.onlineFees>0,"free revenue");assert(s.cleanliness>=95,"dirty counter");assert(!s.reviews.some(r=>r.outcome?.errors?.includes("quầy chưa sạch")),"dirty reviews");
    return {receipts:s.stats.onlineReceipts,cups:s.stats.onlineOrders,halfway,cleanliness:s.cleanliness,bytes:JSON.stringify(s).length};
   });
   check("missing stock never creates free sales",()=>{const s=full();s.phase="open";s.stock.cup=[];s.online.dayQuota=s.online.remaining=10;s.online.issued=0;s.online.queue=[];beginOnlinePacing(s);s.online.pacing.progress=1;for(let i=0;i<30;i++){clockDelta=.2;tickOnline(s)}assert(s.stats.grossRevenue===0,"free sales")});
   check("network actions charge each wallet once and preserve branch identities",()=>{
    const root=full(),b=maxTestBranch(root,openBranch(root,2));stock(b);state=networkBind(root);root.events.advertising=0;b.events.deliveryAdDay=0;const r=root.cash,c=b.cash;
    networkOperation("advertise");assert(root.cash===r-1000&&b.cash===c-1000,"ad wallets");networkOperation("advertise");assert(root.cash===r-1000&&b.cash===c-1000,"duplicate charge");
    root.cleanliness=20;b.cleanliness=30;networkOperation("clean");assert(root.cleanliness===100&&b.cleanliness===100&&root.chain.branch===b,"clean/reference");
    root.condition=50;b.condition=40;networkOperation("repair");assert(root.condition===100&&b.condition===100,"maintenance");
    const before=root.cash,bc=b.cash;b.cash=0;for(const k of Object.keys(G))b.stock[k]=[];const message=networkOperation("stock",{bean:1});assert(root.cash<before&&b.cash===0&&message.includes("chưa áp dụng"),"partial wallet rollback");b.cash=bc;
    assert(validCore(root),"invalid root");
   });
   check("package purchase months and legacy entitlement",()=>{const expected={tet:[1,2],summer:[5,6],autumn:[8,9],xmas:[11,12]};for(const[k,v]of Object.entries(expected))assert(JSON.stringify(SEASON_PACKAGES[k].months)===JSON.stringify(v),k);const s=full();s.seasonPackage={id:"midautumn",start:s.day,end:s.day+29,paid:30000};assert(activeDecoration(s)&&onlineDecorationFactor(s)===2,"legacy package lost")});

   check("managed network completes online in each shop within four-minute active shift",()=>{
    const root=full();root.day=150;root.cash=9000000;root.events.preparedDay=root.day;root.financialHistory=clone(chainTestShop(150).financialHistory);networkBind(root);for(const no of BRANCH_NUMBERS)stock(maxTestBranch(root,openBranch(root,no)));
    state=networkBind(root);openDay(state);setManagerDuty(state,true);for(const s of networkShops(root)){s.ops.active=null;s.ops.scheduled=null;s.events.active=null;}
    let ticks=0;while(root.phase==="open"&&!root.cadence.awaiting&&ticks++<1600){clockStep(root,.2);if(root.order?.needsClarification)confirmOrder(root)}
    const results=networkShops(root).map(s=>({shop:locationNumber(s),target:s===root?s.online.dayQuota:s.branchControl.onlineGoal,receipts:s.stats.onlineReceipts,phase:s.phase,clean:s.cleanliness,condition:s.condition,repair:s.stats.repair,pending:s.online.remaining}));
    for(const row of results){assert(row.receipts===row.target,"network "+JSON.stringify(results));assert(row.clean>=94,"network dirty");assert(row.condition>=74,"managed machine neglected")}
    return results;
   });

   return checks;
  });
  assert(report.operations.every(x=>x.ok),"operations failed: "+JSON.stringify(report.operations.filter(x=>!x.ok)));
  // Simulate localStorage quota/security denial, then prove IndexedDB restores the complete save.
  await opsPage.evaluate(async()=>{state=networkBind(newGame(()=>.5));state.cash=123456;state.day=9;Storage.prototype.setItem=function(){throw new DOMException("quota","QuotaExceededError")};save(true);while(saveWriting||saveQueue)await new Promise(r=>setTimeout(r,10));});
  await opsPage.reload();await opsPage.waitForFunction(()=>!storageBooting);
  assert(await opsPage.evaluate(()=>state.cash===123456&&state.day===9&&!saveBlocked),"IndexedDB did not restore after localStorage failure");
  report.saveFallback="localStorage quota failure -> IndexedDB -> reload passed";
  report.regression=await opsPage.evaluate(()=>{
   const before=state,root=visitRoot,rows=[];try{
    for(const[k,v]of Object.entries(window))if(/^BeanAround.*Checks$/.test(k)&&typeof v?.run==="function"){try{const result=v.run();if(Array.isArray(result))rows.push(...result.map(x=>({...x,suite:k})))}catch(e){rows.push({suite:k,ok:false,error:e.message})}}
    const d=BeanAroundDiagnostics.run();rows.push(...d.tests.map(x=>({...x,suite:"diagnostics"})));
   }finally{state=before;visitRoot=root}
   return {count:rows.length,failed:rows.filter(x=>x.ok===false||x.passed===false)};
  });

  assert(report.regression.failed.length===0,"regression: "+JSON.stringify(report.regression.failed));
  await opsContext.close();

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
    const expectedColors={spring:"rgb(142, 24, 32)",summer:"rgb(22, 90, 70)",autumn:"rgb(126, 31, 40)",winter:"rgb(132, 28, 35)"};
    assert(visual.header===expectedColors[theme],"season header color missing "+JSON.stringify(visual));
    assert(visual.room===visual.expectedRoom,"wrong seasonal environment");
    const cropped=await page.evaluate(()=>["header","order","nav"].every(part=>{
     const el=document.querySelector('[data-skin="'+part+'"] .cafe-skin-slices');
     return el&&getComputedStyle(el).backgroundSize==="cover"&&getComputedStyle(el.firstElementChild).display==="none";
    }));
    assert(cropped,"season artwork must crop without distorting intrinsic proportions");
    assert(visual.note==="show","simple order should show safe note");
    if(["winter","spring","summer","autumn"].includes(theme)){
     const art=await page.evaluate(()=>({parts:Array.from(document.querySelectorAll(".cafe-component-skin")).map(el=>el.dataset.skin).sort(),note:getComputedStyle(document.querySelector(".compact-order"),"::after").content,props:document.querySelector(".cafe-winter-counter-props")?getComputedStyle(document.querySelector(".cafe-winter-counter-props")).display:"none"}));
     assert(JSON.stringify(art.parts)===JSON.stringify(["cta","header","nav","order"]),"missing winter component art: "+JSON.stringify(art));
     assert(art.note==="none","old decorative note overlaps the approved order design");
     if(theme==="winter")assert(art.props==="none","wide espresso must not compete with tree/chalkboard");
     if(theme==="winter"){
      const palette=await page.evaluate(()=>({text:getComputedStyle(document.querySelector(".compact-order b")).color,art:SeasonTheme.winter.uiArtwork}));
      assert(palette.text==="rgb(255, 245, 221)","winter order labels must contrast with red artwork");
      assert(Object.values(palette.art).every(src=>src.includes("winter-red-ui-")),"winter still references old blue banners");
     }
    }else assert(await page.locator(".cafe-component-skin").count()===0,"winter art leaked into another season");
    await page.waitForLoadState("networkidle");
    await page.locator(".cafe-atmosphere img").evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    await waitCafeArtwork(page);
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
    await page.evaluate(()=>window.BeanAroundSeasonTheme.setPreview("winter"));
    for(const recipe of ["latte","apple","mangoCoconut"])for(const working of [false,true]){
     await setup(page,recipe,working);
     const file="equipment-"+recipe+"-"+(working?"working":"idle")+".png";
     await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file);
     await page.locator(".bar-bench").screenshot({path:path.join(output,"stage-"+file)});
     const active=await page.locator(".bar-machine").getAttribute("data-machine");
     assert(active===(recipe==="latte"?"espresso":recipe==="apple"?"press":"blend"),"wrong machine");
     const visibleProps=await page.evaluate(()=>getComputedStyle(document.querySelector(".cafe-winter-counter-props")).display!=="none");
     assert(visibleProps===(recipe!=="latte"),"winter props must adapt to equipment silhouette");
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
    const activeBranch=await page.evaluate(()=>{
     const root=chainTestShop(31);root.visitPlan={selected:1,activeDay:0,activeNo:1};const b=openBranch(root,2);branchTransfer(root,70000,2);
     root.visitPlan.selected=2;state=networkBind(root);managementVisible=true;paint();showSheet("onlineQA","Online chi nhánh",onlineMarkup());
     return {main:root.cash,branch:b.cash};
    });
    await page.locator('button[data-action="branchUpgrade"][data-key="tabletPro"]').last().click();
    const purchased=await page.evaluate(()=>state.isBranch&&state.upgrades.tabletPro&&state.online.tablet);
    assert(purchased,"selected branch online purchase button failed");
    await page.evaluate(()=>{hireStaff(state,"online");showSheet("onlineQA","Online chi nhánh",onlineMarkup())});
    await page.locator('button[data-action="advertise"]').last().click();
    const ownAd=await page.evaluate(()=>({active:deliveryCampaign(state),cash:state.cash,main:networkOwner(state).cash}));
    assert(ownAd.active&&ownAd.cash===activeBranch.branch-6500-250-1000&&ownAd.main===activeBranch.main-1000,"selected branch advertising UI charged wrong shop or flag");
    report.branchOnlineUI="purchase and advertising buttons passed";
    await setup(page,"latte");
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
   // A completed real recipe enables the decorated CTA. Clicking it must still
   // settle exactly one real order and not consume the illustration as an action.
   await setup(page,"latte");
   await page.evaluate(()=>{
    state.order.bakery=null;
    for(let n=0;n<20;n++){
     const step=expectedStep(state);
     if(step==="serve")break;
     if(step==="lid")closeCup(state);else if(step.startsWith("topping-"))topping(state,step.slice(8));else if(step==="extraShot")extraShot(state);else ingredient(state,step);
    }
    paint();
   });
   await waitCafeArtwork(page);
   assert(await page.locator(".deliver-art").isEnabled(),"finished recipe must enable delivery");
   await page.screenshot({path:path.join(output,"winter-ready-"+viewport.width+".png"),fullPage:true});
   for(const[part,selector]of [["header",".topbar"],["order",".compact-order"],["deliver",".deliver-art"],["footer",".navbar"]]){
    await page.locator(selector).screenshot({path:path.join(output,"winter-component-"+part+"-"+viewport.width+".png")});
   }
   await page.evaluate(()=>window.BeanAroundSeasonTheme.setPreview("spring"));
   await waitCafeArtwork(page);
   await page.screenshot({path:path.join(output,"spring-ready-"+viewport.width+".png"),fullPage:true});
   for(const[part,selector]of [["header",".topbar"],["order",".compact-order"],["deliver",".deliver-art"],["footer",".navbar"]]){
    await page.locator(selector).screenshot({path:path.join(output,"spring-component-"+part+"-"+viewport.width+".png")});
   }
   const saleBefore=await page.evaluate(()=>({uid:state.order.uid,revenue:state.lifetimeRevenue}));
   await page.locator(".deliver-art").click();
   const saleAfter=await page.evaluate(()=>({uid:state.order?.uid,revenue:state.lifetimeRevenue}));
   assert(saleAfter.uid!==saleBefore.uid&&saleAfter.revenue>saleBefore.revenue,"decorated delivery CTA failed to settle order");
   await page.evaluate(()=>window.BeanAroundSeasonTheme.setPreview("off"));
   assert(await page.locator(".cafe-component-skin").count()===0,"component art did not unmount");
   report.liveLabels=await page.evaluate(()=>Object.fromEntries(["#headerStars","#rating",".navbar button:nth-child(4) svg"].map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),s=getComputedStyle(el);return [selector,{text:el.textContent,display:s.display,opacity:s.opacity,visibility:s.visibility,zIndex:s.zIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height}}]})));
   report.viewports.push({viewport,geometry:"unchanged",touch:"passed",delivery:"real completed recipe served"});

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
   const responsiveSamples=[["winter",375,812],["winter",390,844],["winter",430,932]].map(([id,w,h])=>({id,w,h,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,id+"-"+w+"x"+h+".png")).toString("base64")}));
   const responsive=await sheet.evaluate(async samples=>{
    const canvas=document.getElementById("review");canvas.width=1195;canvas.height=962;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,1195,962);ctx.font="bold 16px sans-serif";let x=0;
    for(const s of samples){const im=new Image();im.src=s.data;await im.decode();ctx.fillStyle="#762020";ctx.fillText(s.id+" / "+s.w,x+10,21);ctx.drawImage(im,x,30,s.w,s.h);x+=s.w}
    return canvas.toDataURL("image/jpeg",.85);
   },responsiveSamples);
   console.log("CAFE_RESPONSIVE_REVIEW_IMAGE="+responsive);
   fs.writeFileSync(path.join(output,"responsive-contact-sheet.jpg"),Buffer.from(responsive.split(",")[1],"base64"));
   const parts=["header","order","deliver","footer"].map(id=>({id,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,"winter-component-"+id+"-390.png")).toString("base64")}));
   const componentReview=await sheet.evaluate(async parts=>{
    const c=document.getElementById("review");c.width=780;c.height=740;const ctx=c.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,c.width,c.height);ctx.font="bold 18px sans-serif";
    let y=0;for(const p of parts){const im=new Image();im.src=p.data;await im.decode();ctx.fillStyle="#18344c";ctx.fillText(p.id,12,y+23);ctx.drawImage(im,0,y+32,im.width*2,im.height*2);y+=im.height*2+43}
    return c.toDataURL("image/jpeg",.95);
   },parts);
   console.log("WINTER_COMPONENT_REVIEW_IMAGE="+componentReview);

   const springParts=["header","order","deliver","footer"].map(id=>({id,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,"spring-component-"+id+"-390.png")).toString("base64")}));
   const springReview=await sheet.evaluate(async parts=>{
    const c=document.getElementById("review");c.width=780;c.height=740;const ctx=c.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,c.width,c.height);ctx.font="bold 18px sans-serif";
    let y=0;for(const p of parts){const im=new Image();im.src=p.data;await im.decode();ctx.fillStyle="#762C37";ctx.fillText(p.id,12,y+23);ctx.drawImage(im,0,y+32,im.width*2,im.height*2);y+=im.height*2+43}
    return c.toDataURL("image/jpeg",.95);
   },springParts);
   console.log("SPRING_COMPONENT_REVIEW_IMAGE="+springReview);
   const springSamples=[[375,812],[390,844],[430,932]].map(([w,h])=>({w,h,data:"data:image/png;base64,"+fs.readFileSync(path.join(output,"spring-"+w+"x"+h+".png")).toString("base64")}));
   const springResponsive=await sheet.evaluate(async samples=>{
    const c=document.getElementById("review");c.width=1195;c.height=962;const ctx=c.getContext("2d");ctx.fillStyle="#fff4e6";ctx.fillRect(0,0,1195,962);let x=0;
    for(const s of samples){const im=new Image();im.src=s.data;await im.decode();ctx.drawImage(im,x,0,s.w,s.h);x+=s.w}return c.toDataURL("image/jpeg",.91);
   },springSamples);
   console.log("SPRING_RESPONSIVE_REVIEW_IMAGE="+springResponsive);

   const ready="data:image/png;base64,"+fs.readFileSync(path.join(output,"winter-ready-390.png")).toString("base64");
   console.log("WINTER_READY_REVIEW_IMAGE="+ready);

   // Derive a mobile-sized WebP from the untouched generated source; no runtime dependency.
   const artSource=path.join(root,"assets/bean-around/sources/winter-cafe-2026.png");
   if(fs.existsSync(artSource)){
    const source="data:image/png;base64,"+fs.readFileSync(artSource).toString("base64");
    const webp=await sheet.evaluate(async source=>{
     const im=new Image();im.src=source;await im.decode();
     const c=document.createElement("canvas");c.width=780;c.height=Math.round(780*im.height/im.width);
     c.getContext("2d").drawImage(im,0,0,c.width,c.height);return c.toDataURL("image/webp",.9);
    },source);
    console.log("WINTER_OPTIMIZED_ASSET="+webp);
    fs.writeFileSync(path.join(output,"winter-cafe-room.webp"),Buffer.from(webp.split(",")[1],"base64"));
   }
   await sheet.close();
  }
  if(process.env.REVIEW_IMAGE_LOG==="1"&&process.env.BROWSER==="webkit")console.log("WINTER_WEBKIT_REVIEW_IMAGE=data:image/png;base64,"+fs.readFileSync(path.join(output,"winter-ready-390.png")).toString("base64"));
  if(process.env.REVIEW_IMAGE_LOG==="1")console.log("SPRING_READY_REVIEW_IMAGE=data:image/png;base64,"+fs.readFileSync(path.join(output,"spring-ready-390.png")).toString("base64"));

  const stabilityContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const stabilityPage=await stabilityContext.newPage();await stabilityPage.goto(url+"/index.html?season-theme=winter");
  await setup(stabilityPage,"latte");
  report.renderStability=await stabilityPage.evaluate(()=>{
   const bench=document.querySelector(".bar-bench"),room=bench.querySelector(".cafe-room"),skin=document.querySelector(".deliver-art .cafe-component-skin"),order=document.querySelector(".compact-order"),header=document.querySelector(".topbar"),cup=bench.querySelector(".cup-position");
   const observer=new MutationObserver(()=>{});observer.observe(header,{subtree:true,childList:true,characterData:true});
   headerPaint();observer.takeRecords();
   for(let i=0;i<50;i++)headerPaint();
   const headerTextMutations=observer.takeRecords().filter(m=>m.target.closest?.(".hud-left,.brand,.hud-rating")).length;observer.disconnect();
   for(const id of ["americano","apple","mangoCoconut","americano","latte"]){
    setRecipeOnOrder(state,state.order,id);state.job=null;state.cup.steps=id==="americano"?["espresso"]:[];state.cup.sealed=false;paint();
    if(document.querySelector(".bar-bench")!==bench||bench.querySelector(".cafe-room")!==room||document.querySelector(".deliver-art .cafe-component-skin")!==skin||document.querySelector(".compact-order")!==order||bench.querySelector(".cup-position")!==cup)throw Error("persistent stage or component was remounted");
   }
   if(headerTextMutations)throw Error("unchanged header text was rewritten "+headerTextMutations);
   setRecipeOnOrder(state,state.order,"americano");state.cup.steps=["espresso"];paint();
   if(!document.querySelector(".bar-machine use[href='#kettle']"))throw Error("water stage missing kettle");
   return {switches:5,persistentRoom:true,persistentCupHost:true,persistentDecor:true,headerTextMutations};
  });
  await stabilityPage.waitForTimeout(500);
  await stabilityPage.screenshot({path:path.join(output,"kettle-water-stage.png")});
  console.log("KETTLE_GAME_REVIEW_IMAGE=data:image/png;base64,"+fs.readFileSync(path.join(output,"kettle-water-stage.png")).toString("base64"));
  await stabilityPage.evaluate(()=>{managementVisible=true;managementTab="stock";paint()});
  await stabilityPage.evaluate(()=>window.scrollTo(0,0));
  const headerStart=await stabilityPage.locator(".topbar").evaluate(el=>el.getBoundingClientRect().top);
  await stabilityPage.evaluate(()=>window.scrollTo(0,120));await stabilityPage.waitForTimeout(150);
  const headerScroll=await stabilityPage.locator(".topbar").evaluate(el=>({top:el.getBoundingClientRect().top,scroll:window.scrollY,position:getComputedStyle(el).position}));
  assert(headerScroll.scroll>0&&Math.abs(headerStart-headerScroll.top-headerScroll.scroll)<1&&headerScroll.position==="relative","header must scroll naturally with the document: "+JSON.stringify(headerScroll));
  report.renderStability.headerScroll=headerScroll;
  for(const y of [0,120,300,100,0]){await stabilityPage.evaluate(y=>window.scrollTo(0,y),y);await stabilityPage.waitForTimeout(80)}
  assert(await stabilityPage.locator(".topbar .cafe-component-skin").count()===1,"scroll recreated header skin");
  report.renderStability.scroll="management scroll up/down completed";
  await stabilityContext.close();


  const pourContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const pourPage=await pourContext.newPage();await pourPage.goto(url+"/index.html?season-theme=autumn");await setup(pourPage,"latte");
  await pourPage.evaluate(()=>{setRecipeOnOrder(state,state.order,"pour");state.order.needsClarification=false;state.job=null;state.cup.steps=["espresso"];state.cup.sealed=false;paint();});
  assert(await pourPage.locator(".bar-machine use[href='#pour']").count()===1,"red pour-over not at active filter stage");
  await pourPage.waitForTimeout(400);await pourPage.screenshot({path:path.join(output,"red-pour-stage.png")});
  console.log("POUR_GAME_REVIEW_IMAGE=data:image/png;base64,"+fs.readFileSync(path.join(output,"red-pour-stage.png")).toString("base64"));
  report.pourArtwork="active filter stage uses red dripper and glass server; unchanged control layout";
  await pourContext.close();

  report.status="passed";
 }catch(error){report.status="failed";report.failure=error.message;process.exitCode=1}
 finally{await browser.close();server.close();fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
})().catch(error=>{server.close();console.error(error);process.exitCode=1});
