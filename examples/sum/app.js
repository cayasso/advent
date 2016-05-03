import 'babel-polyfill'

import { incrementCommand, decrementCommand } from './commands'
import { createStore } from '../../src/index'
import engine from './customEngine'
import commands from './commands'
import events from './events'

const noop = () => {}
const store = createStore(commands, events);

store.subscribe((data) => {
  console.log('event:', data);
});

function increment(data, fn = noop) {
  return store(incrementCommand(data))
}

function decrement(data, fn = noop) {
  return store(decrementCommand(data))
}

increment({ id: 123, count: 110 })
increment({ id: 123, count: 200 })
increment({ id: 123, count: 100 })

setTimeout(() => {
  decrement({ id: 123, count: 10 })
}, 500)
