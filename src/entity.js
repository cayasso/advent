'use strict'

import isObject from 'lodash.isplainobject'
import { v4 as uuid } from 'uuid'
import last from 'lodash.last'
import update from './update'

export default ({ engine, decider, reducer, emitter, entityName = '' }) => {
  const entities = {}

  function createEntity(id) {
    let state
    let stream = []
    let queue = []
    let version = 0
    let loading = false
    const init = [{ type: '__init__' }]

    function clear() {
      stream = []
      queue = []
      version = 0
      loading = false
      state = undefined
      return id
    }

    async function load(reload) {
      if (reload) clear()
      if (state) return state
      reduce(init, null, true)
      loading = true
      const events = append(await engine.load(id))
      loading = false
      return reduce(events, null, true)
    }

    function reduce(events = [], command, silent) {
      return state = events.reduce((oldState, event) => {
        const newState = update(oldState, reducer(oldState, event))
        if (!silent) {
          setImmediate(emit, event.type, { event, command, newState, oldState })
        }
        return newState
      }, state)
    }

    function emit(type, ...args) {
      [type, '*'].forEach(t => emitter.emit(t, ...args))
    }

    function append(events) {
      if (events.length < 1) return []
      stream = [...stream, ...events]
      const event = last(stream)
      version = 'version' in event ? event.version : version
      return events
    }

    async function execute(command) {
      return commit(await decider(await load(), command))
    }

    async function commit(events) {
      events = events.map(toEvent)
      await engine.save(events)
      return append(events)
    }

    async function decide(command) {
      if (loading) {
        return new Promise((resolve, reject) =>
          queue.push(() => execute(command).then(resolve, reject)))
      }
      const events = await execute(command)
      while (queue.length > 0) {
        await queue.shift()()
      }
      return events
    }

    function toEvent(event) {
      if (!isObject(event)) {
        throw new TypeError('Event must be a plain object.')
      } else if (!event.type || typeof event.type !== 'string') {
        throw new TypeError('Event must have a valid type.')
      } else if (typeof event.payload === 'undefined') {
        throw new TypeError('Event must have a payload.')
      }

      const { type, meta = {}, payload } = event

      payload.id = payload.id || id

      return {
        type,
        meta,
        payload,
        id: uuid(),
        entityId: id,
        ts: Date.now(),
        version: ++version,
        entity: event.entity || entityName
      }
    }

    return {
      clear,
      decide,
      reduce,
      get state() {
        return state
      }
    }
  }

  return id => (entities[id] = entities[id] || createEntity(id))
}
