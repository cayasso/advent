'use strict'

const { EventEmitter } = require('events')
const isObject = require('lodash.isplainobject')
const createEngine = require('advent-memory')
const uuid = require('uuid').v4
const createEntity = require('./entity')

function createStore(decider, reducer, options = {}) {
  if (typeof decider !== 'function') {
    throw new TypeError('Decider must be a function.')
  } else if (typeof reducer !== 'function') {
    throw new TypeError('Reducer must be a function.')
  }

  const pk = options.idKey || 'id'
  const name = options.entity || ''
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new EventEmitter()
  const entity = createEntity({ decider, reducer, engine, emitter })

  async function dispatch(data) {
    if (Array.isArray(data)) {
      let state
      for (const cmd of data) {
        state = await dispatch(cmd)
      }
      return state
    }
    const command = toCommand(data)
    return entity(command.payload[pk]).execute(command)
  }

  function subscribe(type, fn) {
    if (typeof type === 'function') {
      fn = type
      type = '*'
    }
    emitter.on(type, fn)
    return () => emitter.removeListener(type, fn)
  }

  function getState(id) {
    return entity(id).state
  }

  function clearState(id) {
    if (id) return entity(id).clear()
    return entity.clear()
  }

  function toCommand(command) {
    if (!isObject(command)) {
      throw new TypeError('Command must be a plain object.')
    } else if (typeof command.type !== 'string') {
      throw new TypeError('Command must have a valid type.')
    } else if (typeof command.payload === 'undefined') {
      throw new TypeError('Command must have a payload.')
    } else if (typeof command.payload[pk] === 'undefined') {
      throw new TypeError(`An entity ${pk} is required in command payload.`)
    }

    const { type, user = {}, meta = {}, payload } = command
    const entity = { name, id: payload.id }

    return {
      type,
      user,
      meta,
      entity,
      payload,
      id: uuid(),
      ts: Date.now()
    }
  }

  return { dispatch, subscribe, getState, clearState }
}

function packer(type, fn, options = {}) {
  if (isObject(fn)) {
    options = fn
    fn = undefined
  }

  fn = (typeof fn === 'function') ? fn : f => f

  return (...args) => {
    let data = fn(...args)

    if (isObject(data)) {
      let { user, meta, entity, ...payload } = data
      user = user || options.user
      meta = meta || options.meta
      entity = entity || options.entity
      data = { user, meta, entity, payload }
    } else {
      data = { payload: data }
    }
    return { ...options, ...data, type }
  }
}

module.exports = {
  createStore,
  createEvent: packer,
  createCommand: packer
}
