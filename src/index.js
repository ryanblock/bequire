#! /usr/bin/env node
let chalk = require('chalk')
let glob = require('glob')
let {join} = require('path')
let loadOpts = require('./_load-opts')
let filterFiles = require('./_filter-files')
let waterfall = require('run-waterfall')

let hold = console.log
function suppress () {
  console.log = () => {}
}
function unsuppress () {
  console.log = hold
}

let files

waterfall([

  function loadOptions(callback) {
    loadOpts(callback)
  },

  function getFiles({options, pattern}, callback) {

    console.time('Test completed in')
    console.log(`Finding files to test...`)
    glob(pattern, options, function (err, files) {
      if (err) {
        console.log('Glob error')
        callback(err)
      }
      else if (!files.length) {
        console.log('No files found, all done!')
        console.timeEnd('Test completed in:')
        process.exit(0)
      }
      else {
        callback(null, {files, options})
      }
    })
  },

  function filterSelfExecutingFiles(result, callback) {
    filterFiles(result, callback)
  },

  function checkFiles({files, filtered}, callback) {
    let status =  `Found ${files.length + filtered.length} files${filtered.length ? `, skipping ${filtered.length} files` : ''}`
    console.log(status)
    console.log(`Testing require statements...`)
    let errors = []
    suppress()
    for (let file of files) {
      let filePath = join(process.cwd(), file)
      try {
        let load = require(filePath)
      }
      catch(err) {
        if (err.message.includes('Cannot find module') && err.requireStack) {
          let mod = err.message.match(/\'.*\'\n/)[0].trim()
          mod = mod.substr(1, mod.length - 2)
          // Don't print duplicates from lower in the require stack
          if (err.requireStack[0] === filePath) {
            errors.push({
              file,
              mod
            })
          }
        }
      }
    }
    unsuppress()
    callback(null, {files, filtered, errors})
  }

], function done(err, result) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  else {
    console.log(`Done!\n----------`)
    let {files, filtered, errors} = result
    console.log(`Files tested: ${files.length}`)
    if (filtered.length) {
      console.log(`Skipped testing ${filtered.length} files with self-executing statements:`)
      for (let file of filtered) {
        console.log(`- ${file}`)
      }
    }
    console.timeEnd('Test completed in')
    if (errors.length) {
      console.log('Failing require statements found!')
      for (let error of errors) {
        console.log('File:    ', error.file)
        console.log(`Failing: '${error.mod}'`)
      }
      process.exit(1)
    }
    else {
      console.log('No failing require statements found!')
      process.exit(0)
    }
  }
})
