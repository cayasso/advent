import { createStore, createCommand, createEvent } from '../src/index';
import engine from './customStore'

const incrementedEvent = createEvent('incremented')
const decrementedEvent = createEvent('decremented')
const removedEvent = createEvent('removed')

const incrementCommand = createCommand('increment')
const decrementCommand = createCommand('decrement')
const removeCommand = createCommand('remove')

function commandReducer(state, command) {
  const { id, type, payload } = command

  //console.log('COMMAND REDUCING', type)

  switch(type) {

    case 'increment':
      return [{ ...command, type: 'incremented' }]

    case 'decrement':
      return [
        incrementedEvent({ id, count: 1000 }),
        decrementedEvent({ id, count: 1000 }),
        decrementedEvent(payload)
      ]

    case 'remove':
      return [{ ...command, type: 'removed' }]

    default:
      return []
  }

}

function eventReducer(state = { count: 0 }, event) {
  const { type, payload = {} } = event
  const { count } = payload

  console.log('EVENT REDUCING', state.count, count, type)

  switch(type) {

    case 'incremented':
      return {
        count: state.count + count
      }

    case 'decremented':
      return {
        count: state.count - count
      }

    case 'removed':
      return null

    default:
      return state
  }

}

var store = createStore(commandReducer, eventReducer);

function increment(data) {
  return incrementCommand(data)
}

function decrement(data) {
  return decrementCommand(data)
}



var options = { store }

const dispatch = commandFn => (data, fn) => {
  var command = commandFn(data, options)

  store(command)
  .then(state => {
    console.log('RESULT ===>', state, data.id)
    return fn && fn(null, state)
  })
  .catch(err => {
    console.log('UBO UN ERROR', err.stack)
    fn({ message: err.message })
  })
}

store.subscribe((data) => {
  console.log('EVENT=>', data);
});

dispatch(increment)({ id: 123, count: 110 })
dispatch(increment)({ id: 123, count: 200 })
dispatch(increment)({ id: 123, count: 100 })

setTimeout(function () {
  dispatch(decrement)({ id: 123, count: 10 })
}, 500)
