'use strict'

import 'babel-polyfill'
import { createStore } from '../../src/index'
import { increment, decrement } from './constants'
import decider from './decider'
import reducer from './reducer'

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
