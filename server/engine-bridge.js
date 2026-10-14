
let state;
const MONEY=n=>Number(n).toLocaleString("vi-VN")+"k";
const gameplay=new Set(["cup","ingredient","iceMode","topping","extraShot","lid","serve","discardConfirm","rejectConfirm","priority","tasteStop","espressoStop","confirmOrder","frontTakeover","ownerDismiss","ownerReturn","takeComplaint","remake","exchangeConfirm","cancelRecovery","discountComplaint","bakeSelect"]);
const handlers={
 openConfirm:s=>openDay(s),
 bakeSelect:(s,k)=>{if(s.order?.bakery?.id!==k)throw Error("Bánh không đúng đơn.");startBake(s)},
 nextDay:s=>{nextDay(s);prepareMorning(s);prepareOwnerOpportunity(s)},
 cup:(s,k)=>chooseCup(s,k),
 ingredient:(s,k)=>{if(!Object.hasOwn(A,k))throw Error("Nguyên liệu không hợp lệ.");if(Object.hasOwn(TASTE_TIMING,k))startTasteSkill(s,k);else startIngredient(s,k)},
 iceMode:(s,k)=>{if(!["normal","less","none"].includes(k))throw Error("Lượng đá không hợp lệ.");s.nextIceMode=k;startIngredient(s,"ice")},
 topping:(s,k)=>topping(s,k),extraShot:s=>extraShot(s),lid:s=>closeCup(s),serve:s=>deliver(s),
 discardConfirm:s=>discardCup(s),rejectConfirm:s=>reject(s),priority:(s,k)=>priorityCustomer(s,k),
 tasteStop:s=>stopTasteSkill(s),espressoStop:s=>stopTasteSkill(s),confirmOrder:s=>confirmOrder(s),
 frontTakeover:s=>ownerTakeover(s),ownerDismiss:s=>dismissOwnerAlert(s),ownerReturn:s=>ownerReturn(s),
 takeComplaint:s=>takeComplaint(s),remake:s=>beginRecovery(s),exchangeConfirm:(s,k)=>beginRecovery(s,k),
 cancelRecovery:s=>cancelRecovery(s),discountComplaint:s=>discountComplaint(s),
 buy:(s,k)=>buyStock(s,k),cartBuy:(s,k,p)=>buyCart(s,p.items),
 cartBuyBrew:(s,k,p)=>buyAndPrepareCold(s,p.items),brew:s=>brewBatch(s),brewReserve:s=>prepareColdReserve(s),
 clean:s=>cleanShop(s),repair:s=>repairShop(s),advertise:s=>advertise(s),
 upgrade:(s,k)=>buyUpgrade(s,k),hire:(s,k)=>hireStaff(s,k),staffToggle:(s,k)=>toggleStaff(s,k),
 unlockDrink:(s,k)=>unlockDrink(s,k),toggleDrink:(s,k)=>toggleDrink(s,k),
 unlockTopping:(s,k)=>unlockTopping(s,k),toggleTopping:(s,k)=>toggleTopping(s,k),
 seasonBuy:(s,k)=>buySeasonPackage(s,k),decorBuy:(s,k)=>buyDecor(s,k),
 tablet:s=>buyTablet(s),toggleOnline:s=>{prepOnly(s);s.online.enabled=!s.online.enabled},
 takeOnline:s=>takeOnline(s),closeOnlineConfirm:s=>closeOnlineDay(s),
 stockCloseConfirm:s=>closeShop(s),shortShiftConfirm:s=>closeTraining(s),
 shortShiftFinish:(s,k)=>finishOwnerShift(s,k==="handoff"),
 eventAck:s=>{s.events.notice=null},bike:(s,k)=>resolveBike(s,k),
 resolveOperation:(s,k)=>resolveOperation(s,k),ownerOpportunity:(s,k)=>decideOpportunity(s,k),
 expedite:s=>expediteDelivery(s),cancelDelivery:s=>cancelDelivery(s),
 setPrice:(s,k,p)=>setPrice(s,k,p.value),
 businessApply:(s,k,p)=>applyBusinessPlan(s,p.counter,p.online),
 brandSave:(s,k,p)=>brandChange(s,p.name,p.slogan,p.accent)
};
globalThis.engine={
 actions:Object.keys(handlers),gameplay:[...gameplay],
 create(){const s=newGame();s.brand.name="BEAN AROUND · CO-OP";s.sound=false;prepareMorning(s);prepareOwnerOpportunity(s);return s},
 load:s=>migrateSave(s),
 apply(s,action,key,payload={}){
  if(!Object.hasOwn(handlers,action))throw Error("Chức năng này chưa hỗ trợ trong co-op.");
  if(typeof key!=="string"||key.length>120)throw Error("Tham số không hợp lệ.");
  if(gameplay.has(action)){
   if(s.phase!=="open")throw Error("Quán chưa mở cửa.");
   if(s.cadence?.awaiting)throw Error("Ca đã đủ 4 phút, chờ chủ phòng kết ca.");
   if(s.job&&!["tasteStop","espressoStop"].includes(action))throw Error("Máy đang pha, chờ hoàn tất.");
  }
  state=s;return handlers[action](s,key,payload);
 },
 tick(s,dt){state=s;clockStep(s,dt)},
 fingerprint(s){return JSON.stringify([s.day,s.phase,s.order?.uid,s.cup,s.job?.key,s.frontJob?.complete,s.events.active,s.ops.active,s.cadence?.awaiting])},
 check:s=>validCore(s)
};
