'use strict'

const isObject = require('lodash.isplainobject')

const isArray = Array.isArray
const keys = Object.keys

module.exports = (original, update, ...args) => {
  update = args.reduce((o, n) => resolve(o, n, true), update)
  return resolve(original, update)
}

function resolve(original, updates, isNull) {
  return isObject(original) && isObject(updates) ?
    object(original, updates, isNull) :
    isArray(original) && isArray(updates) ?
    array(original, updates) :
    updates === undefined ? original : updates
}

function object(original, updates) {
  return keys(updates).reduce((obj, key) => {
    obj[key] = resolve(original[key], updates[key])
    return obj
  }, {...original})
}

function array(original, updates) {
  return [...updates]
}
