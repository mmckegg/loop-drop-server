var server = require('http').createServer()

var WebSocketServer = require('ws').Server
var websocket = require('websocket-stream')
var wss = new WebSocketServer({server: server})

var clients = []
var clientLookup = {}

var nextId = 1

function broadcast(message){
  for (var i=0;i<clients.length;i++){
    var client = clients[i]
    if (message.from !== client.clientId){ // prevent feedback
      clients[i].write(JSON.stringify(message))
    }
  }
}

function direct(message, to){
  if (Array.isArray(to)){
    for (var i=0;i<to.length;i++){
      clientLookup[i]&&clientLookup[i].write(JSON.stringify(message))
    }
  } else {
    clientLookup[to]&&clientLookup[to].write(JSON.stringify(message))
  }
}

wss.on('connection', function(ws) {
  var socket = websocket(ws)
  socket.clientId = nextId++
  console.log('client connect', socket.clientId)

  // let client know their ID
  process.nextTick(function(){
    direct({
      from: 'server', 
      clientId: socket.clientId
    }, socket.clientId)
  })

  // listen for messages
  socket.on('data', function(data){
    var message = JSON.parse(data)
    message.from = socket.clientId
    if (message.to){
      direct(message, message.to)
    } else {
      broadcast(message)
    }
  })

  function cleanUp(){
    var index = clients.indexOf(socket)
    if (~index){
      clients.splice(index, 1)
      clientLookup[socket.clientId] = null
      console.log('client disconnect', socket.clientId)

      broadcast({
        from: 'server',
        clientDisconnect: socket.clientId
      })
    }
  }

  // handle disconnect
  socket.on('close', cleanUp)

  socket.on('error', function(err){
    console.log(err)
  })

  // store the connection for later
  clients.push(socket)
  clientLookup[socket.clientId] = socket
})

server.listen(7777)
console.log('Listening on ws://localhost:7777')