import * as advent from '../src/index'

let db = null
let engine = null
let testEvents = [
  { id: 1, type: 'created', payload: { a: 1 } },
  { id: 1, type: 'updated', payload: { a: 2 } },
  { id: 1, type: 'tested', payload: { a: 3 } },
  { id: 2, type: 'created', payload: { a: 1 } },
  { id: 3, type: 'created', payload: { a: 2 } },
  { id: 3, type: 'created', payload: { a: 3 } }
]

function commandReducer(state, command) {
  switch(command.type) {

    case 'increment':
      return [{
        type: 'incremented',
        payload: { value: command.payload.value }
      }]

    case 'decrement':
      return [{
        type: 'decremented',
        payload: { value: command.payload.value }
      }]

    default:
      return []
  }
}

const initialState = { value: 0 }

function eventReducer(state = initialState, event) {
  switch(event.type) {

    case 'incremented':
      return {
        id: event.payload.id,
        value: state.value + event.payload.value
      }

    case 'decremented':
      return {
        id: event.payload.id,
        value: state.value - event.payload.value
      }

    default:
      return state
  }
}

describe('advent', () => {

  it('should be a function', () => {
    advent.should.be.a.Function
  })

  it('should expose required methods', () => {
    advent.createStore.should.be.a.Function
    advent.createCommand.should.be.a.Function
    advent.createEvent.should.be.a.Function
  })

  describe('createStore', () => {
    it('should throw error when creating a store without a commandReducer', () => {
      (() => advent.createStore()).should.throw(/reducer must be a function/)
    })

    it('should throw error when creating a store without a eventReducer', () => {
      (() => advent.createStore(commandReducer)).should.throw(/reducer must be a function/)
    })

    it('should create a store with the right methods', () => {
      const store = advent.createStore(commandReducer, eventReducer)
      store.getState.should.be.a.Function
      store.dispatch.should.be.a.Function
      store.subscribe.should.be.a.Function
    })

    it('should error on command without type', done => {
      const store = advent.createStore(commandReducer, eventReducer)
      store.dispatch({ payload: {} }).catch(e => {
        e.should.match(/must have a valid type/)
        done()
      })
    })

    it('should error on command without payload', done => {
      const store = advent.createStore(commandReducer, eventReducer)
      store.dispatch({ type: 'increment' }).catch(e => {
        e.should.match(/must have a payload object/)
        done()
      })
    })

    it('should error on command without entity id in payload', done => {
      const store = advent.createStore(commandReducer, eventReducer)
      store.dispatch({ type: 'increment', payload: { value: 1 } }).catch(e => {
        e.should.match(/entity id is required/)
        done()
      })
    })

    it('should dispatch a command to alter state', async () => {
      const payload = { id: 1, value: 10 }
      const store = advent.createStore(commandReducer, eventReducer)
      await store.dispatch({ type: 'increment', payload })
      store.getState(1).should.be.eql(payload)
    })

    it('should dispatch multiple commands to alter state', async () => {
      const store = advent.createStore(commandReducer, eventReducer)
      await store.dispatch([
        { type: 'increment', payload: { id: 1, value: 10 } },
        { type: 'decrement', payload: { id: 1, value: 5 } },
        { type: 'increment', payload: { id: 1, value: 15 } }
      ])
      store.getState(1).should.be.eql({ id: 1, value: 20 })
    })

    it('should dispatch a command with store method shortcut', async () => {
      const payload = { id: 1, value: 10 }
      const store = advent.createStore(commandReducer, eventReducer)
      await store({ type: 'increment', payload })
      store.getState(1).should.be.eql(payload)
    })

    it('should dispatch multiple commands with store method shortcut', async () => {
      const store = advent.createStore(commandReducer, eventReducer)
      await store([
        { type: 'increment', payload: { id: 1, value: 10 } },
        { type: 'decrement', payload: { id: 1, value: 5 } },
        { type: 'increment', payload: { id: 1, value: 15 } }
      ])
      store.getState(1).should.be.eql({ id: 1, value: 20 })
    })
  })

})
