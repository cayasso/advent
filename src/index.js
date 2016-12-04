'use strict'

/**
 * Module dependencies.
 */

import 'babel-polyfill'
import { EMPTY, LOADING } from './constants'
import isObject from 'lodash.isplainobject'
import createEngine from 'advent-memory'
import createContext from './context'
import { EventEmitter } from 'events'
import isEqual from 'lodash.isequal'
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
  const contexts = createContext({ engine, apply })

  if ('function' !== typeof commandReducer) {
    throw new Error('Command reducer must be a function.')
  } else if ('function' !== typeof eventReducer) {
    throw new Error('Event reducer must be a function.')
  }

  let currentState = {}

  /**
   * Save and resolve an action to update state.
   *
   * @param {Object} command
   * @return {Promise}
   */

  async function resolve(command) {
    const id = command.payload[pk]
    const context = contexts(id)
    const events = execute(command)
    const committedEvents = await context.commit(events)
    return apply(id, committedEvents)
  }

  /**
   * Emit events to the outside world.
   *
   * @param {String} type
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
    const id = command.payload[pk]
    const state = get(id)
    const context = contexts(id)
    const events = commandReducer(state, command, get)
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
    return currentState[id] = events.reduce((oldState, event) => {
      let state = eventReducer(oldState, event)
      let newState = update(oldState, state)
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
    return freeze(id ? currentState[id] : currentState)
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

    let { type, payload } = command

    if (!type || 'string' !== typeof type) {
      throw new Error('Command must have a valid type.')
    } else if ('undefined' === typeof payload || !isObject(payload)) {
      throw new Error('Command must have a payload object.')
    } else if ('undefined' === typeof payload.id) {
      throw new Error('An entity id is required in command payload.')
    }

    command = freeze({ type, payload })
    const context = contexts(payload[pk])

    if (EMPTY === context.status) {
      await context.load()
      await resolve(command)
      await context.drain()
      return true
    }

    if (LOADING === context.status) {
      let task = () => resolve(command)
      context.enqueue(task)
      return true
    }

    return await resolve(command)
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
  fn = ('function' === typeof fn) ? fn : identity
  return (...args) => {
    let payload = fn(...args)
    let packet = { type, payload }
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
