"use strict";
window.BeanAroundCoop=(()=>{
 const storageKey="bean-around-coop-session-v1";
 const local=new Set(["manage","manageTab","upgradeTab","home","intro","menu","stock","book","how","close","openingStock","start","shopReport","stationTab","ingredientPage","serviceTools","orderDetail","queueDetail","clarify","complaint","exchangeAsk","trash","reject","stockClose","shortShift","regulars","regular","ownerAlert","ownerContents","skillHelp","financePeriod","financePrev","financeNext","businessNav","businessStock","stockFilter","cartAdd","cartRemove","suggestCart","cartConfirm","reviewStars","reviewFilter","reviewPage","seasonPreview","brandDesign","operation"]);
 let hooks,session,room,connected=false,pending=false,stopped=false,streamAbort;
 const $=id=>document.getElementById(id);
 function text(id,value){$(id).textContent=value}
 function disconnected(message){connected=false;$("coopConnection").hidden=false;text("coopConnection",message+" · Đang kết nối lại…");text("coopStatus",message)}
 function show(snapshot){
  room=snapshot;connected=true;$("coopConnection").hidden=true;
  text("coopStatus","Phòng "+room.code+" · "+(room.fault?"Lưu quán gặp lỗi":room.paused?"Tạm dừng":"Đang cùng phục vụ"));
  $("coopPause").hidden=room.you!==room.host;$("coopPause").textContent=room.paused?"Tiếp tục ca":"Tạm dừng";
  const people=$("coopPeople");people.replaceChildren();
  for(const member of room.members){
   const span=document.createElement("span");span.textContent=(member.online?"● ":"○ ")+member.name+(member.id===room.host?" · chủ phòng":"");
   if(room.you===room.host&&!member.online){const b=document.createElement("button");b.textContent="Bỏ chỗ";b.onclick=()=>{if(confirm("Bỏ chỗ "+member.name+"? Người này cần vào lại bằng mã phòng."))command("removeMember",member.id)};span.append(b)}
   people.append(span);
  }
  hooks.apply(room.state);if(room.fault)hooks.message("Lưu server gặp lỗi; ca đã dừng để bảo vệ tiến trình.");
 }
 async function connect(){
  while(!stopped){
   streamAbort=new AbortController();let watchdog=setTimeout(()=>streamAbort.abort(),15000);
   try{
    const response=await fetch(session.server+"/api/coop/events",{headers:{Authorization:"Bearer "+session.token,"X-Room-Code":session.code},signal:streamAbort.signal});
    if(!response.ok)throw Error("Không vào được phòng. Trở lại sảnh để kiểm tra mã.");
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";
    while(!stopped){const {done,value}=await reader.read();if(done)break;
     clearTimeout(watchdog);watchdog=setTimeout(()=>streamAbort.abort(),15000);
     buffer+=decoder.decode(value,{stream:true});
     if(buffer.length>16*1024*1024)throw Error("Dữ liệu phòng quá lớn.");
     let end;while((end=buffer.indexOf("\n\n"))>=0){const chunk=buffer.slice(0,end);buffer=buffer.slice(end+2);if(chunk.startsWith("data: ")){const packet=JSON.parse(chunk.slice(6));if(packet.type==="state")show(packet)}}
    }
   }catch(e){if(!stopped)disconnected(e.name==="AbortError"?"Mất kết nối":e.message)}
   finally{clearTimeout(watchdog)}
   if(!stopped){disconnected("Đang nối lại phòng "+session.code);await new Promise(r=>setTimeout(r,1500))}
  }
 }
 async function command(action,key="",payload={}){
  if(!connected||!room){hooks.message("Chờ kết nối lại trước khi thao tác.");return}
  if(pending){hooks.message("Đang chờ server xác nhận thao tác trước.");return}
  pending=true;
  const seq=room.seq+1;
  try{
   const response=await fetch(session.server+"/api/coop/action",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.token,"X-Room-Code":session.code},body:JSON.stringify({action,key,payload,seq,revision:room.revision}),signal:AbortSignal.timeout(10000)});
   const result=await response.json();if(result.seq)room.seq=Math.max(room.seq,result.seq);
   if(!response.ok)throw Error(result.error||"Thao tác chưa thực hiện.");
   hooks.done(action,result);if(action==="cartBuy"||action==="cartBuyBrew")hooks.clearCart();
  }catch(e){
   hooks.message(e.message);
   if(e.name==="TimeoutError"||e instanceof TypeError){disconnected("Chưa rõ kết quả thao tác; đang đồng bộ lại");streamAbort.abort()}
  }finally{pending=false}
 }
 return {
  init(adapter){
   hooks=adapter;try{session=JSON.parse(localStorage.getItem(storageKey)||sessionStorage.getItem(storageKey)||"null")}catch{}
   if(!session?.token){location.replace("/coop/");return}
   session.server=(window.BEAN_COOP_SERVER||session.server||"").replace(/\/$/,"");
   const bar=document.createElement("aside");bar.id="coopBar";
   bar.innerHTML='<b>CO-OP</b><span id="coopStatus" role="status"></span><button id="coopCopy">Chép mã phòng</button><button id="coopPause" hidden>Tạm dừng</button><a href="/coop/">Rời quầy</a><div id="coopPeople"></div>';
   document.body.prepend(bar);const cover=document.createElement("div");cover.id="coopConnection";cover.setAttribute("role","status");cover.textContent="Đang tải quán co-op…";document.body.append(cover);
   $("coopCopy").onclick=async()=>{try{await navigator.clipboard.writeText(session.code);hooks.message("Đã chép mã phòng "+session.code)}catch{hooks.message("Mã phòng: "+session.code)}};
   $("coopPause").onclick=()=>command(room.paused?"resume":"pause");
   window.addEventListener("pagehide",()=>{stopped=true;streamAbort?.abort()});
   connect();
  },
  intercept(action,key){
   if(local.has(action))return false;
   if(!room?.actions.includes(action)){hooks?.message("Chức năng này chưa hỗ trợ trong bản co-op. Quán chơi một mình vẫn đầy đủ.");return true}
   let payload={};
   if(action==="cartBuy"||action==="cartBuyBrew")payload.items=hooks.cart();
   if(action==="setPrice")payload.value=Number($("price-"+key)?.value.replace(",","."));
   if(action==="businessApply")payload={counter:$("planCounter")?.value,online:$("planOnline")?.value};
   if(action==="brandSave")payload={name:$("brandName")?.value,slogan:$("brandSlogan")?.value,accent:$("brandAccent")?.value};
   command(action,key||"",payload);return true;
  }
 };
})();
