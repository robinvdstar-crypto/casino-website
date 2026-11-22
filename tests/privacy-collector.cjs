// Closed local network receiver: never forwards requests or sends test events to Google.
const http=require('node:http'),tls=require('node:tls'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
let certificateDirectory;
function certificate(){
 if(!certificateDirectory){certificateDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'privacy-collector-'));fs.chmodSync(certificateDirectory,0o700);execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',path.join(certificateDirectory,'key.pem'),'-out',path.join(certificateDirectory,'cert.pem'),'-subj','/CN=localhost'],{stdio:'ignore'});fs.chmodSync(path.join(certificateDirectory,'key.pem'),0o600);process.once('exit',()=>fs.rmSync(certificateDirectory,{recursive:true,force:true}));}
 return tls.createSecureContext({key:fs.readFileSync(path.join(certificateDirectory,'key.pem')),cert:fs.readFileSync(path.join(certificateDirectory,'cert.pem'))});
}
module.exports=async function collector(record){
 const sockets=new Set(),secureContext=certificate();
 const receiver=http.createServer((req,res)=>{const chunks=[];req.on('data',b=>chunks.push(b));req.on('end',()=>{record(new URL(req.url,'https://www.google-analytics.com'),Buffer.concat(chunks).toString());res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'*'});res.end();});});
 const proxy=http.createServer((req,res)=>res.writeHead(403).end());
 proxy.on('connect',(req,socket,head)=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));if(!/^(?:[a-z0-9-]+\.)*(?:google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com):443$/.test(req.url)){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)socket.unshift(head);const secure=new tls.TLSSocket(socket,{isServer:true,secureContext});secure.on('error',()=>{});receiver.emit('connection',secure);});
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));return{url:'http://127.0.0.1:'+proxy.address().port,close:async()=>{for(const socket of sockets)socket.destroy();await new Promise(resolve=>proxy.close(resolve));receiver.close();}};
};
