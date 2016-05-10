'use strict'

/**
 * Module dependencies.
 */

import 'babel-polyfill'
import { EMPTY, LOADING, REPLAYING } from './constants'
import createContext from './context'
import isEqual from 'lodash.isequal'
import createEngine from './engine'
import Promise from 'any-promise'
import update from './update'
import evts from 'events'

/**
* Create the store.
*
* @param {Function} reducer
* @param {Object} [options]
* @return {Function} store
*/

function store(commandReducer, eventReducer, options = {}) {
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new evts.EventEmitter()
  const contexts = createContext({ engine, apply })

  if ('function' !== typeof commandReducer) {
    throw new Error('Command reducer must be a function.')
  }

  if ('function' !== typeof eventReducer) {
    throw new Error('Event reducer must be a function.')
  }

  let currentState = {}

  /**
   * Send a command to the store to be executed.
   *
   * @param {object} command
   * @param {Function} fn
   */

  async function dispatch(command, fn) {
    try {
      const { id } = command
      const context = contexts(id)

      if (EMPTY === context.status) {
        await context.load()
        return context.drain(resolve(command, fn))
      }

      if (LOADING === context.status) {
        let task = () => resolve(command, fn)
        return context.enqueue(task)
      }

      resolve(command, fn)
    } catch(e) {
      fn(e)
    }
  }

  /**
   * Save and resolve an action to update state.
   *
   * @param {Object} command
   * @param {Function} fn
   */

  async function resolve(command, fn) {

    try {
      const { id, type } = command
      let context = contexts(id)
      let preevents = execute(command)
      let events = await context.save(preevents)
      let state = apply(id, events)
      fn(null, state)
    } catch(e) {
      //console.log(e.stack)
      fn(e)
    }
  }

  /**
   * Emit events to the outside world.
   *
   * @param {String} type
   * @return {Object} data
   */

  function emit(type, ...args) {
    [type, '*'].map(t => {
      emitter.emit(t, ...args)
    })
  }

  /**
   * Execute command and return a lis of events.
   *
   * @param {Object} command
   * @return {Array} events
   */

  function execute(command) {
    let state = get(command.id)
    return commandReducer(state, command)
  }

  /**
   * Apply a list of events to an specific state.
   *
   * @param {string} id
   * @param {Array} events
   * @param {Boolean} silent
   * @return {Mixed}
   */

  function apply(id, events, silent) {
    return currentState[id] = events.reduce((oldState, event) => {
      let state = eventReducer(oldState, event)
      let newState = update(oldState, state)
      if (!silent) {
        setImmediate(emit, event.type, newState, oldState, event)
      }
      return newState
    }, get(id))
  }

  /**
   * Get state by id.
   *
   * @param {String} [id]
   * @return {Mixed}
   */

  function get(id) {
    return id
    ? currentState[id]
    : currentState
  }

  /**
   * Listen to changes to the store.
   *
   * @param {string} type
   * @param {Function} fn
   * @return {Function} off
   */

  function on(type, fn) {
    if ('function' === typeof type) {
      fn = type
      type = '*'
    }
    emitter.on(type, fn)
    return () => emitter.removeListener(type, fn)
  }

  /**
   * Send a command to the store to be executed.
   *
   * @param {object} command
   * @return {Promise}
   */

  function instance(command, fn) {
    const promise = new Promise(function(accept, reject) {
      try {
        if (!command) {
          throw new Error('Action parameter is required.')
        }

        if (!command.id) {
          throw new Error('Id property of command is required and must be a string.')
        }

        if ('string' !== typeof command.type) {
          throw new Error('Type property of command is required and must be a string.')
        }

        dispatch(command, (err, state) => {
          !err ? accept(state) : reject(err)
        })
      } catch(e) {
        //console.log(e.stack)
        reject(e)
      }
    })

    if ('function' === typeof fn) {
      promise
        .then(state => fn(null, state))
        .catch(fn)
    }

    return promise
  }

  instance.getState = get
  instance.subscribe = on

  return instance
}

/**
 * Payload creator initializer.
 *
 * @param {String} type
 * @param {Function} [fn]
 * @return {Function}
 */

function packer(type, fn) {
  fn = ('function' === typeof fn) ? fn : identity
  return (...args) => {
    let payload = fn(...args)
    let packet = { type, payload }
    if (payload.id) packet.id = payload.id
    if (args.length === 1 && args[0] instanceof Error) {
      packet.error = true;
    }
    return packet
  }
}

/**
 * Identity function for action type.
 */

function identity(type) {
  return type
}

export const createStore = store
export const createEvent = packer
export const createCommand = packer
