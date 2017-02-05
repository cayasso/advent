'use strict'

import uuid from 'uuid'
import last from 'lodash.last'
import isObject from 'lodash.isplainobject'
import { EMPTY, LOADING, LOADED, REPLAYING } from './constants'

export default ({ engine, entity, apply, resolve }) => {
  const contexts = {}

  function context(id) {
    let status = EMPTY
    let history = []
    let version = 0
    const queue = []

    async function load() {
      status = LOADING
      const events = await engine.load(id)
      if (events.length > 0) {
        history = [...history, ...events]
        const event = last(history)
        version = 'version' in event ? event.version : version
      }
      status = REPLAYING
      apply(id, events, true)
      status = LOADED
    }

    function commit(events) {
      return engine.save(events)
    }

    async function execute(command) {
      if (EMPTY === status) {
        await load()
        const state = await resolve(command)
        while (queue.length > 0) {
          await queue.shift()()
        }
        return state
      }

      if (LOADING === status) {
        return new Promise((accept, reject) =>
          queue.push(() => resolve(command).then(accept, reject)))
      }

      return await resolve(command)
    }

    function toEvent(event) {
      if (!isObject(event)) {
        throw new Error('Event must be a plain object.')
      } else if (!event.type || typeof event.type !== 'string') {
        throw new Error('Event must have a valid type.')
      } else if (typeof event.payload === 'undefined') {
        throw new Error('Event must have a payload.')
      }

      const { type, meta = {}, payload } = event

      payload.id = payload.id || id

      return {
        type,
        meta,
        payload,
        id: uuid.v4(),
        entityId: id,
        ts: Date.now(),
        version: ++version,
        entity: event.entity || entity
      }
    }

    return { commit, resolve: execute, toEvent }
  }

  return id => {
    contexts[id] = contexts[id] || context(id)
    return contexts[id]
  }
}
