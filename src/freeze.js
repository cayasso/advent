'use strict'

/**
 * Are we running in a production build?
 */

let production = false
try {
  production = process.env.NODE_ENV === 'production'
} catch (err) {}

/**
 * Is Freezable?
 *
 * @param {Object} object
 * @return {Boolean}
 */

function isFreezable(object) {
  if (object === null) {
    return false
  }
  return Array.isArray(object) ||
  typeof object === 'object'
}

/**
 * Check if we need to freeze this value.
 *
 * @param {Object} object
 * @return {Boolean}
 */

function needsFreezing(object) {
  return isFreezable(object) && !Object.isFrozen(object)
}

/**
 * Recurse
 *
 * @param {Object}
 * @return {Object}
 */

function recur(object) {
  Object.freeze(object)
  Object.keys(object).forEach(key => {
    const value = object[key]
    if (needsFreezing(value)) {
      recur(value)
    }
  })
  return object
}

/**
 * Deeply freeze a plain javascript object.
 *
 * If `process.env.NODE_ENV === 'production'`, this returns the original object
 * witout freezing.
 *
 * @param  {Object} object Object to freeze.
 * @return {Object} Frozen object, unless in production, then the same object.
 */

export default object => {
  if (production) {
    return object
  }
  if (needsFreezing(object)) {
    recur(object)
  }
  return object
}
