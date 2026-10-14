"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const start=html.indexOf('"use strict";'),end=html.indexOf('const $=id=>document.getElementById(id);');
if(start<0||end<start)throw Error("Gameplay extraction markers changed; review server adapter.");
const context=vm.createContext({window:{},document:{},console});
vm.runInContext(html.slice(start,end)+fs.readFileSync(path.join(__dirname,"engine-bridge.js"),"utf8"),context,{timeout:15000,filename:"bean-around-core.js"});
module.exports=context.engine;
