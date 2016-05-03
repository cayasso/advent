var history = [
  {
    id: 123,
    type: 'increment',
    version: 0,
    payload: {
      id: 123,
      count: 10
    }
  },{
    id: 123,
    type: 'increment',
    version: 1,
    payload: {
      id: 123,
      count: 25
    }
  },{
    id: 123,
    type: 'decrement',
    version: 2,
    payload: {
      id: 123,
      count: 15
    }
  }
]

export default {

  load(id, fn) {
    console.log('CALLING CUSTOM STORE LOAD', id)
    setTimeout(() => fn(null, history), 1000)
  },

  save(action, fn) {
    console.log('CALLING CUSTOM STORE SAVE')
    history = [...history, action]
    setTimeout(() => fn(null, action), 1000)
  }
}
