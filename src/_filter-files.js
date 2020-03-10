let read = require('fs').readFileSync
let esprima = require('esprima')

module.exports = function filterSelfExecutingFiles ({files=[], options={}}, callback) {
  let filtered = []
  let tried
  try {
    files = files.filter(file => {
      tried = file
      // TODO add check for fs executable test
      let js = read(file).toString()
      let parsed = esprima.parse(js)
      let exe = parsed.body && parsed.body.some(s => {
        if (s.type === 'ExpressionStatement' &&
            s.expression && s.expression.type === 'CallExpression') {
          filtered.push(file)
          return true
        }
        if (options.testExports &&
            s.type === 'ExpressionStatement' &&
            s.expression && s.expression.right &&
            s.expression.right.type === 'CallExpression') {
          filtered.push(file)
          return true
        }
      })
      return !exe
    })
    callback(null, {files, filtered})
  }
  catch(err) {
    console.log(`Parsing error in ${tried}`)
    callback(err)
  }
}
