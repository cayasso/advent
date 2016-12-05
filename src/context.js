'use strict';

/**
 * Module dependencies.
 */

import { EMPTY, LOADING, LOADED, REPLAYING } from './constants'
import isObject from 'lodash.isplainobject'
import last from 'lodash.last'
import uuid from 'uuid'

/**
 * Context creator initializer.
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

export default ({ engine, apply, resolve }) => {
  let contexts = {}

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
    let version = 0
    let queue = []

    /**
     * Load history of events of this context id.
     *
     * @return {Promise}
     * @api private
     */

    async function load() {
      status = LOADING
      let events = await engine.load(id)
      if (events.length) {
        history = [...history, ...events]
        const event = last(history)
        version = 'version' in event ? event.version : version
      }
      status = REPLAYING
      apply(id, events, true)
      status = LOADED
    }

    /**
     * Persist an event.
     *
     * @param {Array} events
     * @return {Promise}
     * @api public
     */

    function commit(events) {
      return engine.save(events)
    }

    /**
     * Execute an event.
     *
     * @param {Object} command
     * @return {Promise}
     * @api public
     */

    async function execute(command) {
      if (EMPTY === status) {
        await load()
        const state = await resolve(command)
        while (queue.length) await queue.shift()()
        return state
      }

      if (LOADING === status) {
        return new Promise((accept, reject) =>
          queue.push(() => resolve(command).then(accept, reject)))
      }

      return await resolve(command)
    }

    /**
     * Create an event.
     *
     * @param {Object} event
     * @return {Object}
     * @api private
     */

    function toEvent(event) {
      if (!isObject(event)) {
        throw new Error('Event must be a plain object.')
      } else if (!event.type || 'string' !== typeof event.type) {
        throw new Error('Event must have a valid type.')
      } else if ('undefined' === typeof event.payload) {
        throw new Error('Event must have a payload.')
      }

      let { type, entity = '', meta = {}, payload } = event

      payload.id = payload.id || id

      return {
        type,
        meta,
        entity,
        payload,
        id: uuid.v4(),
        entityId: id,
        ts: Date.now(),
        version: ++version
      }
    }

    return { commit, execute, toEvent }
  }

  // return context or create a new one and return it
  return id => contexts[id] = contexts[id] || context(id)
}
