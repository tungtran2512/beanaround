"use strict";
const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {DatabaseSync}=require("node:sqlite");
const engine=require("./engine.cjs");
const ROOT=path.resolve(__dirname,".."),hash=t=>crypto.createHash("sha256").update(t).digest("hex");
const clone=x=>JSON.parse(JSON.stringify(x));
function createServer({dbPath=process.env.COOP_DB||path.join(ROOT,"data/coop.sqlite"),allowedOrigins=(process.env.COOP_ORIGINS||"").split(",").filter(Boolean),maxRooms=200,tickMs=200,hostGraceMs=30000}={}){
 if(dbPath!==":memory:")fs.mkdirSync(path.dirname(dbPath),{recursive:true});
 const db=new DatabaseSync(dbPath);db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY, payload TEXT NOT NULL)");
 const get=db.prepare("SELECT payload FROM rooms WHERE code=?"),put=db.prepare("INSERT OR REPLACE INTO rooms VALUES(?,?)");
 const rooms=new Map(),limits=new Map();
 const persist=r=>put.run(r.code,JSON.stringify(r.data));
 function room(code){
  if(!/^[A-Z2-9]{8}$/.test(code||""))throw Error("Mã phòng không hợp lệ.");
  if(rooms.has(code))return rooms.get(code);
  const row=get.get(code);if(!row)throw Error("Không tìm thấy phòng.");
  const data=JSON.parse(row.payload);data.state=engine.load(data.state);data.paused=true;
  const r={code,data,clients:new Map(),fault:false};rooms.set(code,r);return r;
 }
 function wire(r,m){
  const s=clone(r.data.state);
  // Render-only history projection. Durable authoritative state retains all accounting.
  s.orderResults=s.orderResults?.slice(-100);s.reviews=s.reviews?.slice(-100);s.financialHistory=s.financialHistory?.slice(-90);
  return {type:"state",code:r.code,revision:r.data.revision,frame:r.data.frame,seq:m.seq,you:m.id,host:r.data.host,paused:r.data.paused||r.clients.size<2||r.fault,
   members:r.data.members.map(x=>({id:x.id,name:x.name,online:r.clients.has(x.id)})),state:s,
   actions:engine.actions,gameplay:engine.gameplay,lastAction:r.data.lastAction||"",fault:r.fault};
 }
 function send(res,msg){if(!res.destroyed&&!res.writableEnded){if(res.writableLength>2*1024*1024){res.destroy();return}res.write("data: "+JSON.stringify(msg)+"\n\n")}}
 function broadcast(r){for(const [id,res] of r.clients){const m=r.data.members.find(x=>x.id===id);if(m)send(res,wire(r,m))}}
 function auth(req){
  const code=req.headers["x-room-code"],token=(req.headers.authorization||"").replace(/^Bearer /,"");
  if(!/^[a-f0-9]{64}$/.test(token))throw Error("Phiên chơi không hợp lệ.");
  const r=room(code),m=r.data.members.find(x=>x.token===hash(token));if(!m)throw Error("Phiên chơi không còn quyền vào phòng.");
  return {r,m};
 }
 function rate(req,kind,max){
  // Use the socket peer, not untrusted X-Forwarded-For. Configure limits at the edge too.
  const key=(req.socket.remoteAddress||"unknown")+":"+kind,now=Date.now();
  if(limits.size>5000)for(const [k,v]of limits)if(v.until<now)limits.delete(k);
  let v=limits.get(key);if(!v||v.until<now){v={until:now+60000,n:0};limits.set(key,v)}
  if(++v.n>max)throw Error("Thao tác quá nhanh, vui lòng thử lại sau.");
 }
 const json=(res,status,data)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data))};
 async function body(req){let data="";for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>16384)throw Error("Yêu cầu quá lớn.")}return JSON.parse(data||"{}")}
 function originOK(req){const o=req.headers.origin;return !o||allowedOrigins.includes(o)||o==="http://"+req.headers.host||o==="https://"+req.headers.host}
 function member(name){if(typeof name!=="string"||!name.trim()||name.trim().length>24)throw Error("Tên cần từ 1–24 ký tự.");const token=crypto.randomBytes(32).toString("hex");return {token,record:{id:crypto.randomUUID(),name:name.trim(),token:hash(token),seq:0}}}
 const server=http.createServer(async(req,res)=>{
  res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","no-referrer");
  const url=new URL(req.url,"http://localhost");
  if(url.pathname.startsWith("/api/coop")){
   if(!originOK(req))return json(res,403,{error:"Nguồn truy cập không được phép."});
   if(req.headers.origin){res.setHeader("Access-Control-Allow-Origin",req.headers.origin);res.setHeader("Vary","Origin")}
   if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Headers","Authorization,Content-Type,X-Room-Code");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");res.writeHead(204);return res.end()}
   try{
    if(req.method==="GET"&&url.pathname==="/api/coop/health")return json(res,200,{ok:true,protocol:1});
    if(req.method==="POST"&&["/api/coop/create","/api/coop/join"].includes(url.pathname)){
     rate(req,url.pathname,url.pathname.endsWith("create")?5:30);const b=await body(req),m=member(b.name);
     let r;
     if(url.pathname.endsWith("create")){
      if(db.prepare("SELECT count(*) AS n FROM rooms").get().n>=maxRooms)throw Error("Server đã đủ phòng. Liên hệ chủ server.");
      let code;do{code=Array.from(crypto.randomBytes(8),v=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[v%32]).join("")}while(get.get(code));
      r={code,data:{state:engine.create(),members:[m.record],host:m.record.id,revision:0,frame:0,paused:true},clients:new Map(),fault:false};
      persist(r);rooms.set(code,r);
     }else{
      r=room(String(b.code||"").toUpperCase().replace(/\s/g,""));if(r.data.members.length>=4)throw Error("Phòng đã đủ 4 người. Chủ phòng có thể bỏ chỗ người đã rời.");
      const old=clone(r.data);try{r.data.members.push(m.record);persist(r)}catch(e){r.data=old;throw e}
     }
     broadcast(r);return json(res,200,{code:r.code,token:m.token,id:m.record.id});
    }
    const {r,m}=auth(req);
    if(req.method==="GET"&&url.pathname==="/api/coop/events"){
     rate(req,"connect",120);
     res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"});
     res.flushHeaders();
     const previous=r.clients.get(m.id);r.clients.set(m.id,res);if(previous)previous.end();
     m.offlineAt=null;broadcast(r);
     req.on("close",()=>{if(r.clients.get(m.id)===res){r.clients.delete(m.id);m.offlineAt=Date.now();broadcast(r)}});
     return;
    }
    if(req.method==="POST"&&url.pathname==="/api/coop/action"){
     rate(req,"actions",900);const b=await body(req);
     if(!Number.isSafeInteger(b.seq)||b.seq<1)throw Error("Số thao tác không hợp lệ.");
     if(b.seq<=m.seq)return json(res,200,{duplicate:true,seq:m.seq});
     if(b.seq!==m.seq+1)throw Error("Phiên đã đổi. Kết nối lại để đồng bộ.");
     if(!r.clients.has(m.id))throw Error("Kết nối lại phòng trước khi thao tác.");
     if(r.fault)throw Error("Lưu quán gặp lỗi. Ca đã tạm dừng để bảo vệ tiến trình.");
     const before=clone(r.data);let result,error;
     try{
      if(b.revision!==r.data.revision)throw Error("Bạn cùng phòng vừa thao tác. Hãy kiểm tra quầy rồi thử lại.");
      const host=r.data.host===m.id;
      if(b.action==="pause"||b.action==="resume"){
       if(!host)throw Error("Chỉ chủ phòng được tạm dừng/mở ca.");
       if(b.action==="resume"&&r.clients.size<2)throw Error("Cần ít nhất 2 người kết nối.");
       r.data.paused=b.action==="pause";
      }else if(b.action==="removeMember"){
       if(!host||b.key===m.id||r.clients.has(b.key))throw Error("Chỉ bỏ chỗ người đang ngoại tuyến.");
       if(!r.data.members.some(x=>x.id===b.key))throw Error("Không tìm thấy người chơi.");
       r.data.members=r.data.members.filter(x=>x.id!==b.key);
      }else{
       if(!engine.gameplay.includes(b.action)&&!host)throw Error("Chủ phòng phụ trách mua sắm và quản lý quán.");
       if(engine.gameplay.includes(b.action)&&(r.data.paused||r.clients.size<2))throw Error("Ca đang tạm dừng; cần 2 người và chủ phòng tiếp tục.");
       if(b.action==="openConfirm"){
        if(r.clients.size<2)throw Error("Cần ít nhất 2 người để mở ca co-op.");r.data.paused=false;
       }
       result=engine.apply(r.data.state,b.action,b.key||"",b.payload||{});
      }
      r.data.revision++;r.data.lastAction=m.name+" · "+b.action;
     }catch(e){r.data=before;error=e.message}
     const current=r.data.members.find(x=>x.id===m.id);current.seq=b.seq;
     try{persist(r)}catch(e){r.data=before;r.fault=true;broadcast(r);return json(res,503,{error:"Chưa lưu được thao tác; ca đã dừng. Không tự thực hiện lại."})}
     broadcast(r);return json(res,error?409:200,{seq:b.seq,error,result:typeof result==="object"?result:undefined});
    }
    return json(res,404,{error:"Không tìm thấy thao tác."});
   }catch(e){return json(res,400,{error:e.message})}
  }
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);return res.end()}
  let name=url.pathname==="/"?"index.html":url.pathname==="/coop/"?"coop/index.html":decodeURIComponent(url.pathname).slice(1);
  // Serve only public gameplay assets, never server code, saves, repository metadata or source maps.
  if(!["index.html","coop/index.html","coop/client.js","coop/lobby.js","coop/config.js","coop/style.css"].includes(name)&&!/^assets\/[a-zA-Z0-9_./-]+\.(svg|png|webp|jpg|avif)$/.test(name)){res.writeHead(404);return res.end("Not found")}
  const file=path.resolve(ROOT,name);if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end()}
  try{const stat=fs.statSync(file);if(!stat.isFile())throw Error();res.setHeader("Content-Type",({".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg"})[path.extname(file)]||"application/octet-stream");res.setHeader("Cache-Control","no-cache");if(req.method==="HEAD")return res.end();fs.createReadStream(file).pipe(res)}catch{res.writeHead(404);res.end("Not found")}
 });
 const timer=setInterval(()=>{
  for(const r of rooms.values()){
   if(!r.clients.size||r.fault)continue;
   const before=clone(r.data);
   try{
    const host=r.data.members.find(m=>m.id===r.data.host);
    if(!r.clients.has(r.data.host)){
     host.offlineAt=host.offlineAt||Date.now();
     if(Date.now()-host.offlineAt>hostGraceMs){r.data.host=r.clients.keys().next().value;r.data.paused=true;r.data.revision++}
    }
    if(r.clients.size>=2&&!r.data.paused&&r.data.state.phase==="open"){
     const key=engine.fingerprint(r.data.state);engine.tick(r.data.state,tickMs/1000);
     if(key!==engine.fingerprint(r.data.state))r.data.revision++;
    }
    r.data.frame++;persist(r);broadcast(r);
   }catch{r.data=before;r.fault=true;broadcast(r)}
  }
 },tickMs);
 server.shutdown=()=>{clearInterval(timer);for(const r of rooms.values())for(const res of r.clients.values())res.end();return new Promise(resolve=>server.close(()=>{db.close();resolve()}))};
 return server;
}
module.exports={createServer};
if(require.main===module){const server=createServer();server.listen(Number(process.env.PORT)||3000,"0.0.0.0",()=>console.log("BEAN AROUND co-op listening"));for(const signal of ["SIGTERM","SIGINT"])process.on(signal,()=>server.shutdown().then(()=>process.exit(0)))}
