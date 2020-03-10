let exists = require('fs').existsSync
let {join} = require('path')

module.exports = function loadOptions(callback) {
  // Default: test all js files, and ignore node_modules
  let pattern = '**/*.js'
  let ignore = [
    '**/node_modules/**'
  ]
  let root = process.cwd()
  let options = {
    root,
    ignore
  }

  // Maybe load user config
  let configFile = join(root, '.bequirerc.js')
  let config
  if (exists(configFile)) {
    config = require(configFile)
  }
  if (config.ignore) {
    options.ignore = options.ignore.concat(config.ignore)
  }
  if (config.testExports) {
    options.testExports = true
  }
  if (config.pattern) {
    pattern = config.pattern
  }
  callback(null, {options, pattern})
}
