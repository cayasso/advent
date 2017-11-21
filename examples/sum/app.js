'use strict'

const { createStore } = require('../../lib/index')
const { increment, decrement } = require('./constants')
const decider = require('./decider')
const reducer = require('./reducer')

// Creating store
const store = createStore(decider, reducer)

// Subscribing to store events
store.subscribe((e, data) => {
  console.log('event:', e, data)
})

// Executing commands
store.dispatch(increment({id: 123, value: 110}))
store.dispatch(increment({id: 123, value: 200}))
store.dispatch(increment({id: 123, value: 100}))

// Delayed command
setTimeout(() => {
  store.dispatch(decrement({id: 123, value: 10}))
}, 500)
