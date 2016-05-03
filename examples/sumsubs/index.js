import createHandler from '../../src/index'
import reducer from './reducer'
import decider from './decider'

const handler = createHandler(decider, reducer, { initialState: { count: 0 }})

handler.subscribe((state) {
  console.log(state);
})

handler({ id: 1, type: 'increment', data: { count: 1 } })
handler({ id: 1, type: 'increment', data: { count: 10 }})
handler({ id: 1, type: 'increment', data: { count: 3 }})
handler({ id: 1, type: 'decrement', data: { count: 6 }})
