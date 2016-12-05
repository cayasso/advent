'use strict'

import 'babel-polyfill'
import { EMPTY, LOADING } from './constants'
import isObject from 'lodash.isplainobject'
import createEngine from 'advent-memory'
import createContext from './context'
import { EventEmitter } from 'events'
import update from './update'
import freeze from './freeze'

/**
 * Create the store.
 *
 * @param {Function} commandReducer
 * @param {Function} eventReducer
 * @param {Object} [options]
 * @return {Function} store
 */

function store(commandReducer, eventReducer, options = {}) {
  const pk = options.idKey || 'id'
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new EventEmitter()
  const contexts = createContext({ engine, apply, resolve })

  if ('function' !== typeof commandReducer) {
    throw new Error('Command reducer must be a function.')
  } else if ('function' !== typeof eventReducer) {
    throw new Error('Event reducer must be a function.')
  }

  let state = {}

  /**
   * Save and resolve an action to update state.
   *
   * @param {Object} command
   * @return {Promise}
   */

  async function resolve(command) {
    const id = command.payload[pk]
    const events = await contexts(id).commit(execute(command))
    return apply(id, events)
  }

  /**
   * Emit events to the outside world.
   *
   * @param {String} type
   */

  function emit(type, ...args) {
    [type, '*'].forEach(t => emitter.emit(t, ...args))
  }

  /**
   * Execute command and return a lis of events.
   *
   * @param {Object} command
   * @return {Array} events
   */

  function execute(command) {
    const id = command.payload[pk]
    const context = contexts(id)
    const events = commandReducer(get(id), command, get)
    return events.map(context.toEvent)
  }

  /**
   * Apply a list of events to an specific state.
   *
   * @param {string} id
   * @param {Array} events
   * @param {Boolean} silent
   * @return {Mixed}
   */

  function apply(id, events, silent = false) {
    return state[id] = events.reduce((oldState, event) => {
      let newState = update(oldState, eventReducer(oldState, event))
      if (!silent) setImmediate(emit, event.type, event, newState, oldState)
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
    return freeze(id ? state[id] : state)
  }

  /**
   * Subscribe to changes from the store.
   *
   * @param {string} type
   * @param {Function} fn
   * @return {Function} off
   */

  function subscribe(type, fn) {
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

  async function dispatch(command) {
    if (Array.isArray(command)) {
      for (let cmd of command) await dispatch(cmd)
      return
    }

    if (!isObject(command)) {
      throw new Error('Command must be a plain object.')
    }

    const { type, payload } = command

    if (!type || 'string' !== typeof type) {
      throw new Error('Command must have a valid type.')
    } else if ('undefined' === typeof payload || !isObject(payload)) {
      throw new Error('Command must have a payload object.')
    } else if ('undefined' === typeof payload[pk]) {
      throw new Error('An entity id is required in command payload.')
    }

    return contexts(payload[pk]).execute({ type, payload })
  }

  return Object.assign(dispatch, { getState: get, subscribe, dispatch })
}

/**
 * Payload creator initializer.
 *
 * @param {String} type
 * @param {Function} [fn]
 * @return {Function}
 */

 function packer(type, fn, options = {}) {
   fn = ('function' === typeof fn) ? fn : f => f
   return (...args) => ({ type, payload: fn(...args) })
 }

export const createStore = store
export const createEvent = packer
export const createCommand = packer
