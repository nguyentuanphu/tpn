// Local synthetic test peers only. No public broker or family service is contacted.
const http=require('node:http'),express=require('express');
const {ExpressPeerServer}=require('peer');
const {WebSocketServer,createWebSocketStream}=require('ws');
const broker=require('aedes')();
const app=express(),peer=http.createServer(app),mqtt=http.createServer();
app.use('/myapp',ExpressPeerServer(peer,{path:'/'}));
const ws=new WebSocketServer({server:mqtt,handleProtocols:protocols=>protocols.has('mqtt')?'mqtt':false});
ws.on('connection',socket=>broker.handle(createWebSocketStream(socket)));
for(const server of [peer,mqtt])server.on('error',error=>{console.error(error.message);process.exit(1);});
Promise.all([new Promise(resolve=>peer.listen(9000,'127.0.0.1',resolve)),new Promise(resolve=>mqtt.listen(9001,'127.0.0.1',resolve))]).then(()=>console.log('Local test services ready: PeerJS9000, MQTT9001'));
const stop=()=>{ws.close();broker.close();for(const server of [peer,mqtt]){server.closeAllConnections();server.close();}};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
