var EventEmitter = require('events').EventEmitter
var mkdirp = require('mkdirp')
var getDirectory = require('path').dirname
var glob = require('glob')
var join = require('path').join
var CacheStream = require('cache-stream')
var fs = require('fs')
var crypto = require('crypto')

module.exports = function(baseDir){
  var self = new EventEmitter()
  mkdirp.sync(baseDir)

  var pending = {}
  var fileList = glob.sync("**/*", {root: baseDir})

  self.has = function(key){
    var file = getFilePath(key)
    return !!~fileList.indexOf(file)
  }

  self.remove = function(key){
    var file = getFilePath(key)
    var index = fileList.indexOf(file)
    if (~index){
      fs.unlink(file)
      fileList.splice(index)
    }
  }

  self.createWriteStream = function(key){
    var file = getFilePath(key)
    if (!pending[file]){
      pending[file] = []
    }

    var stream = fs.createWriteStream(file)
    if (!~fileList.indexOf(file)){
      fileList.push(file)
    }

    stream.on('finish', function(){
      // send to anyone waiting for file
      if (pending[file]){
        var readStream = fs.createReadStream(file)
        for (var i=0;i<pending[file].length;i++){
          pending[file].waiting = false
          readStream.pipe(pending[file])
        }
        pending[file] = null
      }
    })

    return stream
  }

  self.createReadStream = function(key){
    var file = getFilePath(key)
    if (pending[file]){
      // if the file is still being written to, wait until finished then send contents
      var pendingStream = CacheStream()
      pendingStream.waiting = true
      pending[file].push(pendingStream)
      return pendingStream
    } else {
      return fs.createReadStream(file)
    }
  }

  return self


  //// scoped instance functions

  function getFilePath(key){
    //var hash = crypto.createHash('sha1').update(key).digest('hex')
    return join(baseDir, key)
  }
}