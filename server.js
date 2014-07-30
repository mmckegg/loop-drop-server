var FileTransfer = require('./lib/file-transfer')
var Sockets = require('./lib/sockets')

var router = require('routes-router')()
var cors = require('./lib/cors')

var server = require('http').createServer(handleRequest)
var fileTransfer = FileTransfer(__dirname + '/file-cache', sendFileRequest)
var sockets = Sockets(server)

function handleRequest(req, res){
  cors(req, res, router)
}

router.addRoute('/files/:clientId/:fileName.wav', {
  GET: function(req, res, opts){
    var src = opts.params.fileName + '.wav'
    fileTransfer.getFile(req, res, src, parseInt(opts.params.clientId))
  },
  POST: function(req, res, opts){
    var src = opts.params.fileName + '.wav'
    console.log('RECEIVING FILE:', src)
    fileTransfer.postFile(req, res, src)
  }
})

function sendFileRequest(path, clientId){
  var message = {
    from: 'server',
    requestFile: path,
    to: clientId
  }
  console.log(message)
  sockets.direct(message, message.to)
}

server.listen(7777)
console.log('Listening on localhost:7777')