"use strict";
(()=>{
 const base=(window.BEAN_COOP_SERVER||"").replace(/\/$/,""),key="bean-around-coop-session-v1";
 const $=id=>document.getElementById(id);let saved;
 try{saved=JSON.parse(localStorage.getItem(key)||sessionStorage.getItem(key)||"null")}catch{}
 if(saved?.code){$("resumeRoom").hidden=false;$("resumeRoom").textContent="TRỞ LẠI PHÒNG "+saved.code;$("playerName").value=saved.name||""}
 $("resumeRoom").onclick=()=>location.assign("/?coop=1");
 async function enter(kind){
  const name=$("playerName").value.trim(),code=$("roomCode").value.trim().toUpperCase();
  if(!name)return $("lobbyMessage").textContent="Anh nhập tên hiển thị nhé.";
  document.querySelectorAll("button").forEach(b=>b.disabled=true);$("lobbyMessage").textContent="Đang kết nối quán…";
  try{
   const res=await fetch(base+"/api/coop/"+kind,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,code}),signal:AbortSignal.timeout(15000)});
   let data;try{data=await res.json()}catch{throw Error("Server co-op chưa được kết nối. Quán chơi một mình vẫn sử dụng bình thường.")}
   if(!res.ok)throw Error(data.error||"Không vào được phòng.");
   data.name=name;data.server=base;
   try{localStorage.setItem(key,JSON.stringify(data))}catch{sessionStorage.setItem(key,JSON.stringify(data))}
   location.assign("/?coop=1");
  }catch(e){$("lobbyMessage").textContent=e.message;document.querySelectorAll("button").forEach(b=>b.disabled=false)}
 }
 $("createRoom").onclick=()=>enter("create");$("joinRoom").onclick=()=>enter("join");
})();
