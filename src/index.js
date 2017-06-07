'use strict'

import 'babel-polyfill'
import { EventEmitter } from 'events'
import isObject from 'lodash.isplainobject'
import createEngine from 'advent-memory'
import createEntity from './entity'

export function createStore(decider, reducer, options = {}) {
  if (typeof decider !== 'function') {
    throw new Error('Decider must be a function.')
  } else if (typeof reducer !== 'function') {
    throw new Error('Reducer must be a function.')
  }

  const pk = options.idKey || 'id'
  const entityName = options.entity || ''
  const engine = options.engine || createEngine()
  const emitter = options.emitter || new EventEmitter()
  const entity = createEntity({ decider, reducer, engine, emitter, entityName })

  async function execute(command) {
    const id = command.payload[pk]
    const { decide, reduce } = entity(id)
    return reduce(await decide(command), command)
  }

  async function dispatch(command) {
    if (Array.isArray(command)) {
      let state
      for (const cmd of command) {
        state = await dispatch(cmd)
      }
      return state
    }

    const { type, payload } = command

    if (typeof type !== 'string') {
      throw new Error('Command must have a valid type.')
    } else if (!isObject(payload)) {
      throw new Error('Command must have a payload object.')
    } else if (typeof payload[pk] === 'undefined') {
      throw new Error('An entity id is required in command payload.')
    }

    return await execute(command)
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

  return { dispatch, subscribe, getState, clearState }
}

function packer(type, fn, options = {}) {
  if (isObject(fn)) {
    options = fn
    fn = undefined
  }
  fn = (typeof fn === 'function') ? fn : f => f
  return (...args) => ({ ...options, type, payload: fn(...args) })
}

export const createEvent = packer
export const createCommand = packer
