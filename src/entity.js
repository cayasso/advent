'use strict'

const isObject = require('lodash.isplainobject')
const uuid = require('uuid').v4
const update = require('./update')

const createEntity = ({ engine, decider, reducer, emitter }) => {
  const entities = {}

  const getEntity = id => {
    let state
    let stream = []
    let queue = []
    let loading = false

    const init = [{ type: '__init__', payload: {} }]

    const clear = () => {
      stream = []
      queue = []
      loading = false
      state = undefined
      return id
    }

    const load = async reload => {
      if (reload) clear()
      if (state) return state
      reduce(init, null, true)
      loading = true
      const events = append(await engine.load(id))
      loading = false
      return reduce(events, null, true)
    }

    const reduce = (events = [], command, silent) => {
      return events.reduce((oldState, event) => {
        state = update(oldState, reducer(oldState, event))
        if (silent) return state
        const change = { command, oldState, newState: state }
        emitter.emit('*', event, change)
        emitter.emit(id, event, change)
        emitter.emit(event.type, event, change)
        return state
      }, state)
    }

    const append = events => {
      if (events.length === 0) return []
      stream = [...stream, ...events]
      return events
    }

    const run = async command => {
      const { user, meta, entity } = command
      let events = await decider(await load(), command)
      events = events || []
      events = Array.isArray(events) ? events : [events]
      events = events.map(event => ({ ...command, ...event, user, meta, entity }))
      return reduce(await commit(events), command)
    }

    const execute = async command => {
      if (loading && command.payload) {
        return new Promise((resolve, reject) => {
          queue.push(() =>
            run(command)
              .then(resolve)
              .catch(reject)
          )
        })
      }

      const events = await run(command)
      setImmediate(async () => {
        while (queue.length > 0) await queue.shift()()
      })
      return events
    }

    const commit = async events => {
      events = events.map(toEvent)
      await engine.save(events)
      return append(events)
    }

    const toEvent = event => {
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

  return id => (entities[id] = entities[id] || getEntity(id))
}

module.exports = createEntity
