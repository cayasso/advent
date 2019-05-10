'use strict'

const { createStore } = require('../../src')
const createEngine = require('../../src/engine')
const { increment, decrement } = require('./constants')
const decider = require('./decider')
const reducer = require('./reducer')

// Creating store
const engine = createEngine()
const store = createStore(decider, reducer, { engine, entity: 'test' })

const entity = store.get('123')

// Subscribing to store events
entity.subscribe((e, data) => {
  console.log('event:', e, data)
})

// Executing commands
// entity.dispatch(increment({ value: 110 }))
// entity.dispatch(increment({ value: 200 }))
// entity.dispatch(increment({ value: 100 }))

// Delayed command
setTimeout(() => {
  entity.dispatch(decrement({ value: 10 }))
}, 2500)
