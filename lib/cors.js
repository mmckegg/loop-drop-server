module.exports = function(req, res, next){
  console.log('appending cors headers')
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    res.statusCode = 204
    res.end()
  } else {
    next(req, res)
  }
}