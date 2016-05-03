'use strict';

/**
 * Module dependencies.
 */

import Promise from 'any-promise'

export default options => {
  let data = {}

  /**
   * Load entity events.
   *
   * @param {String|Number} id
   * @param {Function} fn
   * @api public
   */

  function load(id, fn) {
    data[id] = data[id] || []
    return new Promise((accept, reject) => {
      setImmediate(() => accept(data[id]))
    })
  }

  /**
   * Save events.
   *
   * @param {Object} event
   * @param {Function} fn
   * @api public
   */

  function save(events, fn) {
    return new Promise((accept, reject) => {
      events.map(event => {
        let id = event.id
        data[id] = [...data[id], event]
      })
      setImmediate(() => accept(events))
    })
  }

  return { load, save }
}
