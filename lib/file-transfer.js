var EventEmitter = require('events').EventEmitter
var FileCache = require('./file-cache')

module.exports = function(cachePath, requestMissing){
  var self = new EventEmitter()
  var cache = FileCache(cachePath)
  var waiting = {}

  self.getFile = function(req, res, path, clientId){
    if (cache.has(path)){
      cache.createReadStream(path).pipe(res)
    } else {
      if (typeof requestMissing === 'function'){
        requestMissing(path, clientId)
        waitForFile(res, path)
      }
    }
  }

  self.postFile = function(req, res, path){
    var cacheStream = cache.createWriteStream(path)
    if (Array.isArray(waiting[path])){
      for (var i=0;i<waiting[path].length;i++){
        waiting[path][i].fileTransfer.success(req)
      }
    }
    req.pipe(cacheStream)
    req.on('end', function(){
      res.writeHead(200)
      res.end()
    })
  }

  return self

  function waitForFile(res, path){
    res.fileTransfer = {
      path: path,
      notFound: timeoutHandler.bind(res),
      success: resolveHandler.bind(res)
    }
    res.fileTransfer.timer = setTimeout(res.fileTransfer.notFound, 2000)

    waiting[path] = waiting[path] || []
    waiting[path].push(res)
  }

  function timeoutHandler(){
    var fileTransfer = this.fileTransfer
    clearTimeout(fileTransfer.timer)

    this.writeHead(404)
    this.end('not found')

    if (Array.isArray(waiting[fileTransfer.path])){
      var index = waiting[fileTransfer.path]
      waiting[fileTransfer.path].splice(index, 1)
    }
  }

  function resolveHandler(fileStream){
    var fileTransfer = this.fileTransfer
    clearTimeout(fileTransfer.timer)

    this.writeHead(200)

    if (Array.isArray(waiting[fileTransfer.path])){
      var index = waiting[fileTransfer.path]
      waiting[fileTransfer.path].splice(index, 1)
    }

    fileStream.pipe(this)
  }
}

