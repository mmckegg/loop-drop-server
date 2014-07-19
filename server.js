var server = require('http').createServer()

var WebSocketServer = require('ws').Server
var websocket = require('websocket-stream')
var wss = new WebSocketServer({server: server})

var clients = []

wss.on('connection', function(ws) {
  var socket = websocket(ws)
  console.log('client connect')
  clients.forEach(function(s){
    socket.pipe(s).pipe(socket)
  })
  socket.on('end', function(){
    var index = clients.indexOf(socket)
    if (index){
      clients.splice(index, 1)
      console.log('client disconnect')
    }
  })
  socket.on('error', function(err){
    console.log(err)
  })
  clients.push(socket)
})

server.listen(7777)