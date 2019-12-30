'use strict'

const isObject = require('lodash.isplainobject')
const uuid = require('uuid').v4
const update = require('./update')

module.exports = ({ engine, decider, reducer, emitter, snapRate = 0 }) => {
  const cache = {}

  const getEntity = id => {
    let state
    let queue = []
    let stream = []
    let loading = false

    const init = [{ type: '__init__', payload: {} }]

    const clear = () => {
      stream = []
      queue = []
      loading = false
      state = undefined
      delete cache[id]
      return id
    }

    const load = async reload => {
      if (reload) clear()
      if (state) return state
      reduce(init, null, true)
      loading = true
      const { events, snap } = await engine.load(id)
      loading = false
      return reduce(events, "load", true, snap)
    }

    const reduce = (events = [], command, silent, snap) => {
      if(command === "load" && events.length === 0 && snap){
        state = snap
        return snap
      }
      return events.reduce((oldState, event) => {
        state = update(oldState, reducer(oldState, event))
        state.id = id
        state.version = state.version || 0
        state.revision = event.revision || 0
        if (silent) return state
        const change = { command, oldState, newState: state }
        ;['*', id, event.type].forEach(type => emitter.emit(type, event, change))
        return state
      }, snap || state)
    }

    const run = async command => {
      const { user, meta, entity } = command
      let events = await decider(await load(), command)
      events = events || []
      events = Array.isArray(events) ? events : [events]
      events = events.map(event => toEvent({ ...command, ...event, user, meta, entity }))
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

      await run(command)

      setImmediate(async () => {
        while (queue.length > 0) await queue.shift()()
      })
      return state
    }

    const commit = async (events = []) => {
      stream.push(...events)

      let snap

      if (
        typeof state.version === 'number' &&
        snapRate &&
        state.revision >= state.version + snapRate
      ) {
        state.version = state.revision
        snap = clone({ ...state, version: state.revision })
      }

      await engine.save(stream, snap)
      stream = []
      return events
    }

    const clone = data => {
      return JSON.parse(JSON.stringify(data))
    }

    const getState = () => {
      return state
    }

    const toEvent = event => {
      if (!isObject(event)) {
        throw new TypeError('Event must be a plain object.')
      } else if (!event.type || typeof event.type !== 'string') {
        throw new TypeError('Event must have a valid type.')
      } else if (typeof event.payload === 'undefined') {
        throw new TypeError('Event must have a payload.')
      }

      return { ...event, id: uuid(), cid: event.id, ts: Date.now() }
    }

    return { clear, execute, commit, getState }
  }

  return id => (cache[id] = cache[id] || getEntity(id))
}
