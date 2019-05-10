'use strict'

const should = require('should')
const advent = require('../src/index')

const decider = (state, command) => {
  switch (command.type) {
    case 'increment':
      return [
        {
          type: 'incremented',
          payload: { value: state.value + command.payload.value }
        }
      ]

    case 'decrement':
      return [
        {
          type: 'decremented',
          payload: { value: state.value - command.payload.value }
        }
      ]

    default:
      return []
  }
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

const initialState = { value: 0 }

const reducer = (state = initialState, event) => {
  switch (event.type) {
    case 'incremented':
      return {
        value: event.payload.value
      }

    case 'decremented':
      return {
        value: event.payload.value
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
    it('should throw error when creating a store without a decider', () => {
      ;(() => advent.createStore()).should.throw(/Decider must be a function/)
    })

    it('should throw error when creating a store without a reducer', () => {
      ;(() => advent.createStore(decider)).should.throw(/Reducer must be a function/)
    })

    it('should create a store that returns the right methods', () => {
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      entity.getState.should.be.a.Function
      entity.dispatch.should.be.a.Function
      entity.subscribe.should.be.a.Function
      entity.clearState.should.be.a.Function
    })
  })

  describe('dispatch', () => {
    it('should error on command without type', done => {
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      entity.dispatch({ payload: {} }).catch(e => {
        should(e).match(/must have a valid type/)
        done()
      })
    })

    it('should error on command without payload', done => {
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      entity.dispatch({ type: 'increment' }).catch(e => {
        should(e).match(/must have a payload object/)
        done()
      })
    })

    it('should dispatch a command to alter state', async () => {
      const payload = { value: 10 }
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      await entity.dispatch({ type: 'increment', payload })
      should(entity.getState()).containEql(payload)
    })

    it('should dispatch multiple commands to alter state', async () => {
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } },
        { type: 'increment', payload: { value: 15 } }
      ])
      should(entity.getState()).containEql({ value: 20 })
    })
  })

  describe('subscribe', () => {
    it('should subscribe to state changes', async () => {
      const changes = []
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')
      entity.subscribe((event, change) => changes.push(change))
      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } },
        { type: 'increment', payload: { value: 15 } }
      ])
      await sleep(10)
      should(changes.length).eql(3)
      should(changes[0].newState).containEql({ value: 10 })
      should(changes[1].newState).containEql({ value: 5 })
      should(changes[2].newState).containEql({ value: 20 })
    })

    it('should subscribe to specific event type of state changes', async () => {
      const changes = []
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')
      entity.subscribe('decremented', (event, change) => changes.push(change))
      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } },
        { type: 'increment', payload: { value: 15 } },
        { type: 'decrement', payload: { value: 3 } }
      ])
      await sleep(10)
      should(changes.length).eql(2)
      should(changes[0].newState).containEql({ value: 5 })
      should(changes[1].newState).containEql({ value: 17 })
    })

    it('should subscribe to all events of an entity', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      entity.subscribe((event, change) => {
        changes[event.entity.id] = changes[event.entity.id] || []
        changes[event.entity.id].push(change)
      })

      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } }
      ])

      await sleep(10)
      should(changes['1'].length).eql(2)
      should(changes['1'][0].newState).containEql({ value: 10 })
      should(changes['1'][1].newState).containEql({ value: 5 })
    })

    it('should subscribe to specific event type of an entity', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      entity.subscribe('decremented', (event, change) => {
        changes[event.entity.id] = changes[event.entity.id] || []
        changes[event.entity.id].push(change)
      })

      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } }
      ])

      await sleep(10)
      should(changes['1'].length).eql(1)
      should(changes['1'][0].newState).containEql({ value: 5 })
    })

    it('should subscribe to specific event type of state changes from store', async () => {
      const changes = []
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      store.subscribe('decremented', (event, change) => changes.push(change))
      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } },
        { type: 'increment', payload: { value: 15 } },
        { type: 'decrement', payload: { value: 3 } }
      ])
      await sleep(10)
      should(changes.length).eql(2)
      should(changes[0].newState).containEql({ value: 5 })
      should(changes[1].newState).containEql({ value: 17 })
    })

    it('should subscribe to state changes of multiple entities from store', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      const entity1 = store.get('1')
      const entity2 = store.get('2')

      store.subscribe((event, change) => {
        changes[event.entity.id] = changes[event.entity.id] || []
        changes[event.entity.id].push(change)
      })

      await entity1.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } }
      ])

      await entity2.dispatch([
        { type: 'increment', payload: { value: 15 } },
        { type: 'increment', payload: { value: 15 } }
      ])
      await sleep(10)
      should(changes['1'].length).eql(2)
      should(changes['1'][0].newState).containEql({ value: 10 })
      should(changes['1'][1].newState).containEql({ value: 5 })
      should(changes['2'].length).eql(2)
      should(changes['2'][0].newState).containEql({ value: 15 })
      should(changes['2'][1].newState).containEql({ value: 30 })
    })

    it('should subscribe to specific event type of changes for multiple entities of store', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      const entity1 = store.get('1')
      const entity2 = store.get('2')

      store.subscribe('decremented', (event, change) => {
        changes[event.entity.id] = changes[event.entity.id] || []
        changes[event.entity.id].push(change)
      })

      await entity1.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } }
      ])

      await entity2.dispatch([
        { type: 'increment', payload: { value: 15 } },
        { type: 'decrement', payload: { value: 10 } }
      ])

      await sleep(10)
      should(changes['1'].length).eql(1)
      should(changes['1'][0].newState).containEql({ value: 5 })
      should(changes['2'].length).eql(1)
      should(changes['2'][0].newState).containEql({ value: 5 })
    })
  })

  describe('clearState', () => {
    it('should clear an entity state', async () => {
      const store = advent.createStore(decider, reducer)
      const entity = store.get('1')

      await entity.dispatch([
        { type: 'increment', payload: { value: 10 } },
        { type: 'decrement', payload: { value: 5 } },
        { type: 'increment', payload: { value: 15 } }
      ])

      entity.clearState()
      should(entity.getState() === undefined).be.true()
    })
  })
})
