'use strict'

/**
 * Module dependencies.
 */

import isPlainObject from 'lodash.isplainobject'
import freeze from './freeze'

/**
 * Module constants.
 */

const isArray = Array.isArray
const keys = Object.keys

/**
 * Update the object or array
 *
 * @param {Mixed} original
 * @param {Mixed, ...} updates
 * @return {Mixed}
 */

export default (original, update, ...args) => {
  update = args.reduce((o, n) => resolve(o, n, true), update)
  return freeze(resolve(original, update))
}

/**
 * Resolve the updates
 *
 * @param {Mixed} original
 * @param {Array} updates
 */

function resolve(original, updates, isNull) {
  return isPlainObject(original) && isPlainObject(updates) ?
    object(original, updates, isNull) :
    isArray(original) && isArray(updates) ?
    array(original, updates) :
    updates === undefined ? original : updates
}

/**
 * Update objects
 *
 * @param {Object} original
 * @param {Array} updates
 * @return {Object}
 */

function object(original, updates, isNull) {
  return keys(updates).reduce((obj, key, i) => {
    obj[key] = resolve(original[key], updates[key])
    return obj
  }, {...original})
}

/**
 * Update arrays
 *
 * @param {Array} original
 * @param {Array} updates
 * @return {Array}
 */

function array(original, updates) {
  return [...updates]
}
