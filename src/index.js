'use strict'

import 'babel-polyfill'
import { EventEmitter } from 'events'
import isObject from 'lodash.isplainobject'
import createEngine from 'advent-memory'
import createContext from './context'
import update from './update'
import freeze from './freeze'
import { EMPTY, LOADING } from './constants'

/**
 * Create the store.
 *
 * @param {Function} decider
 * @param {Function} reducer
 * @param {Object} [options]
 * @return {Function} store
 */

function store(decider, reducer, options = {}) {
  if (typeof decider !== 'function') {
    throw new Error('Command reducer must be a function.')
  } else if (typeof reducer !== 'function') {
    throw new Error('Event reducer must be a function.')
  }

  const state = {}
  const pk = options.idKey || 'id'
  const entity = options.entity || ''
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new EventEmitter()
  const context = createContext({ engine, entity, apply, resolve })

  /**
   * Save and resolve an action to update state.
   *
   * @param {Object} command
   * @return {Promise}
   */

  async function resolve(command) {
    const id = command.payload[pk]
    const events = await execute(command)
    const savedEvents = await context(id).commit(events)
    return apply(id, savedEvents)
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

  async function execute(command) {
    const id = command.payload[pk]
    const events = await decider(getState(id), command, getState)
    return events.map(context(id).toEvent)
  }

  /**
   * Apply a list of events to an specific state.
   *
   * @param {String} id
   * @param {Array} events
   * @param {Boolean} silent
   * @return {Mixed}
   */

  function apply(id, events, silent = false) {
    state[id] = events.reduce((oldState, event) => {
      const newState = update(oldState, reducer(oldState, event))
      if (!silent) {
        setImmediate(emit, event.type, event, newState, oldState)
      }
      return newState
    }, getState(id))
    return state[id]
  }

  /**
   * Get state by id.
   *
   * @param {String} [id]
   * @return {Mixed}
   */

  function getState(id) {
    return freeze(id ? state[id] : state)
  }

  /**
   * Subscribe to changes from the store.
   *
   * @param {String} type
   * @param {Function} fn
   * @return {Function} off
   */

  function subscribe(type, fn) {
    if (typeof type === 'function') {
      fn = type
      type = '*'
    }
    emitter.on(type, fn)
    return () => emitter.removeListener(type, fn)
  }

  /**
   * Send a command to the store to be executed.
   *
   * @param {Object} command
   * @return {Promise}
   */

  async function dispatch(command) {
    if (Array.isArray(command)) {
      let _state = state
      for (const cmd of command) {
        _state = await dispatch(cmd)
      }
      return _state
    }

    const { type, payload, invalidate = false } = command

    if (!invalidate && (!type || typeof type !== 'string')) {
      throw new Error('Command must have a valid type.')
    } else if (typeof payload === 'undefined' || !isObject(payload)) {
      throw new Error('Command must have a payload object.')
    } else if (typeof payload[pk] === 'undefined') {
      throw new Error('An entity id is required in command payload.')
    }

    if (invalidate) {
      delete state[payload[pk]]
      if (!type) {
        return getState(payload[pk])
      }
    }

    return context(payload[pk]).resolve(command)
  }

  return Object.assign(dispatch, { getState, subscribe, dispatch })
}

/**
 * Payload creator initializer.
 *
 * @param {String} type
 * @param {Function} [fn]
 * @return {Function}
 */

function packer(type, fn, options = {}) {
  if (isObject(fn)) {
    options = fn
    fn = undefined
  }
  fn = (typeof fn === 'function') ? fn : f => f
  return (...args) => ({ ...options, type, payload: fn(...args) })
}

export const createStore = store
export const createEvent = packer
export const createCommand = packer
