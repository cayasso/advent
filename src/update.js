'use strict'

const isObject = require('lodash.isplainobject')

const {isArray} = Array
const {keys} = Object

const array = (original, updates) => {
  return [...updates]
}

const object = (original, updates) => {
  return keys(updates).reduce(
    (obj, key) => {
      obj[key] = resolve(original[key], updates[key])
      return obj
    },
    { ...original }
  )
}

const resolve = (original, updates, isNull) => {
  return isObject(original) && isObject(updates)
    ? object(original, updates, isNull)
    : isArray(original) && isArray(updates)
    ? array(original, updates)
    : updates === undefined
    ? original
    : updates
}

const update = (original, update, ...args) => {
  update = args.reduce((o, n) => resolve(o, n, true), update)
  return resolve(original, update)
}

module.exports = update
