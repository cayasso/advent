'use strict';

/**
 * Module dependencies.
 */

import { EMPTY, LOADING, LOADED, REPLAYING } from './constants'
import last from 'lodash.last'

/**
 * Context creator initializer.
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

export default ({ engine, apply }) => {
  var contexts = {}

  /**
   * Create a new context.
   *
   * @param {String} id
   * @return {Object}
   * @api public
   */

  function context(id) {
    let status = EMPTY
    let history = []
    let counter = 0
    let queue = []

    /**
     * Load history of events of this context id.
     *
     * @param {Function} fn
     * @return {Promise}
     * @api public
     */

    async function load() {
      status = LOADING
      let events = await engine.load(id)

      if (events.length) {
        history = [...history, ...events]
        let event = last(history)
        counter = 'version' in event ? action.version : counter
      }

      status = REPLAYING
      apply(id, events)
      status = LOADED
    }

    /**
     * Persist an action.
     *
     * @param {Object} action
     * @param {Function} [fn]
     * @return {Promise}
     * @api public
     */

    function save(events, fn) {
      return engine.save(normalize(events))
    }

    /**
     * Add an action function to queue.
     *
     * @param {Function} fn
     * @return {Array}
     * @api public
     */

    function enqueue(fn) {
      return queue.push(fn)
    }

    /**
     * Drain queue.
     *
     * @return {Void}
     * @api private
     */

    function drain() {
      while (queue.length) queue.shift()()
    }

    /**
     * Normalize action.
     *
     * @param {Object} action
     * @return {Object}
     * @api private
     */

    function normalize(events) {
      return events.map(event => {
        event.id = id
        event.version = ++counter
        event.ts = Date.now()
        return event
      })
    }

    return {
      load,
      save,
      drain,
      enqueue,
      get status() {
        return status
      }
    }
  }

  // return context or create a new one and return it
  return id => contexts[id] = contexts[id] || context(id)
}
