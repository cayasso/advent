'use strict'

const isObject = require('lodash.isplainobject')
const uuid = require('uuid').v4
const update = require('./update')

module.exports = ({ engine, decider, reducer, emitter }) => {
  const entities = {}

  function createEntity(id) {
    let state
    let stream = []
    let queue = []
    let loading = false

    const init = [{ type: '__init__', payload: {} }]

    function clear() {
      stream = []
      queue = []
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
      return events.reduce((oldState, event) => {
        state = update(oldState, reducer(oldState, event))
        if (!silent) emit(event.type, event, { command, oldState, newState: state })
        return state
      }, state)
    }

    function emit(type, ...args) {
      [type, '*'].forEach(t => emitter.emit(t, ...args))
    }

    function append(events) {
      if (events.length < 1) return []
      stream = [...stream, ...events]
      return events
    }

    async function run(command) {
      let events = await decider(await load(), command)
      events = Array.isArray(events) ? events : [events]
      events = events.map(event => {
        event.payload.id = id
        return { ...command, ...event }
      })
      return reduce(await commit(events), command)
    }

    async function execute(command) {
      if (loading && command.payload) {
        return new Promise((resolve, reject) => {
          queue.push(() => run(command).then(resolve, reject))
        })
      }
      const events = await run(command)
      setImmediate(async () => {
        while (queue.length > 0) await queue.shift()()
      })
      return events
    }

    async function commit(events) {
      events = events.map(toEvent)
      await engine.save(events)
      return append(events)
    }

    function toEvent(event) {
      if (!isObject(event)) {
        throw new TypeError('Event must be a plain object.')
      } else if (!event.type || typeof event.type !== 'string') {
        throw new TypeError('Event must have a valid type.')
      } else if (typeof event.payload === 'undefined') {
        throw new TypeError('Event must have a payload.')
      }

      return {
        ...event,
        id: uuid(),
        cid: event.id,
        ts: Date.now()
      }
    }

    return {
      clear,
      execute,
      get state() {
        return state
      }
    }
  }

  return id => (entities[id] = entities[id] || createEntity(id))
}
