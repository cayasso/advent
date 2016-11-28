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
  const pk = options.pk || 'id'
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
   * Send a command to the store to be executed.
   *
   * @param {Object} command
   */

  async function dispatch(command) {
    const context = contexts(command.payload[pk])

    if (EMPTY === context.status) {
      await context.load()
      await resolve(command)
      await context.drain()
      return true
    }

    if (LOADING === context.status) {
      let task = () => resolve(command)
      return context.enqueue(task)
    }

    return await resolve(command)
  }

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
   * Listen to changes to the store.
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

  async function instance(command) {
    if (!isObject(command)) {
      throw new Error('Command must be a plain object.')
    }

    let { type, payload } = command

    if (!type || 'string' !== typeof type) {
      throw new Error('Command must have a valid type.')
    } else if ('undefined' === typeof payload) {
      throw new Error('Command must have a payload.')
    }

    return await dispatch(freeze({ type, payload }))
  }

  return Object.assign(instance, { get, subscribe })
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
