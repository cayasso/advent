'use strict'

const EventEmitter = require('events')
const isObject = require('lodash.isplainobject')
const createEngine = require('advent-memory')
const uuid = require('uuid').v4
const createEntity = require('./entity')

class Emitter extends EventEmitter {}

const createStore = (decider, reducer, options = {}) => {
  if (typeof decider !== 'function') {
    throw new TypeError('Decider must be a function.')
  } else if (typeof reducer !== 'function') {
    throw new TypeError('Reducer must be a function.')
  }

  const name = options.entity || ''
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new Emitter()
  const entity = createEntity({ decider, reducer, engine, emitter })

  const get = id => {
    const toCommand = command => {
      if (!isObject(command)) {
        throw new TypeError('Command must be a plain object.')
      } else if (typeof command.type !== 'string') {
        throw new TypeError('Command must have a valid type.')
      } else if (typeof command.payload === 'undefined') {
        throw new TypeError('Command must have a payload.')
      }

      const { type, user = {}, meta = {}, payload } = command
      return { type, user, meta, payload, id: uuid(), ts: Date.now(), entity: { name, id } }
    }

    const dispatch = async data => {
      if (Array.isArray(data)) {
        let state
        for (const cmd of data) {
          state = await dispatch(cmd)
        }

        return state
      }

      return entity(id).execute(toCommand(data))
    }

    const subscribe = (type, fn) => {
      if (typeof type === 'function') {
        fn = type
        type = null
      }

      return listen(id, (event, ...args) => {
        if (!type || type === event.type) fn(event, ...args)
      })
    }

    const getState = () => entity(id).state
    const clearState = () => entity(id).clear()
    return { dispatch, subscribe, getState, clearState }
  }

  const clear = () => entity.clear()

  const listen = (type, fn) => {
    if (typeof type === 'function') {
      fn = type
      type = '*'
    }

    emitter.on(type, fn)
    return () => emitter.off(type, fn)
  }

  return { get, clear, subscribe: listen }
}

const packer = (type, fn, options = {}) => {
  if (isObject(fn)) {
    options = fn
    fn = undefined
  }

  fn = typeof fn === 'function' ? fn : f => f

  // Ko
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
