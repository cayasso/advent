'use strict'

import 'should'
import * as advent from '../src/index'

function decider(state, command) {
  switch (command.type) {

    case 'increment':
      return [{
        type: 'incremented',
        payload: {value: command.payload.value}
      }]

    case 'decrement':
      return [{
        type: 'decremented',
        payload: {value: command.payload.value}
      }]

    default:
      return []
  }
}

const sleep = time =>
  new Promise(resolve => setTimeout(resolve, time))

const initialState = {value: 0}

function reducer(state = initialState, event) {
  switch (event.type) {

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
    it('should throw error when creating a store without a decider', () => {
      (() => advent.createStore()).should.throw(/Decider must be a function/)
    })

    it('should throw error when creating a store without a reducer', () => {
      (() => advent.createStore(decider)).should.throw(/Reducer must be a function/)
    })

    it('should create a store with the right methods', () => {
      const store = advent.createStore(decider, reducer)
      store.getState.should.be.a.Function
      store.dispatch.should.be.a.Function
      //store.subscribe.should.be.a.Function
      store.clearState.should.be.a.Function
    })
  })

  describe('dispatch', () => {
    it('should error on command without type', done => {
      const store = advent.createStore(decider, reducer)
      store.dispatch({payload: {}}).catch(e => {
        e.should.match(/must have a valid type/)
        done()
      })
    })

    it('should error on command without payload', done => {
      const store = advent.createStore(decider, reducer)
      store.dispatch({type: 'increment'}).catch(e => {
        e.should.match(/must have a payload object/)
        done()
      })
    })

    it('should error on command without entity id in payload', done => {
      const store = advent.createStore(decider, reducer)
      store.dispatch({type: 'increment', payload: {value: 1}}).catch(e => {
        e.should.match(/entity id is required/)
        done()
      })
    })

    it('should dispatch a command to alter state', async () => {
      const payload = {id: '1', value: 10}
      const store = advent.createStore(decider, reducer)
      await store.dispatch({type: 'increment', payload})
      store.getState(1).should.be.eql(payload)
    })

    it('should dispatch multiple commands to alter state', async () => {
      const store = advent.createStore(decider, reducer)
      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '1', value: 15}}
      ])
      store.getState(1).should.be.eql({id: '1', value: 20})
    })
  })

  describe('subscribe', () => {
    it('should subscribe to state changes', async () => {
      const changes = []
      const store = advent.createStore(decider, reducer)
      store.subscribe(change => changes.push(change))
      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '1', value: 15}}
      ])
      await sleep(10)
      changes.length.should.eql(3)
      changes[0].newState.should.be.eql({ id: '1', value: 10 })
      changes[1].newState.should.be.eql({ id: '1', value: 5 })
      changes[2].newState.should.be.eql({ id: '1', value: 20 })
    })

    it('should subscribe to specific event type of state changes', async () => {
      const changes = []
      const store = advent.createStore(decider, reducer)
      store.subscribe('decremented', change => changes.push(change))
      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '1', value: 15}},
        {type: 'decrement', payload: {id: '1', value: 3}},
      ])
      await sleep(10)
      changes.length.should.eql(2)
      changes[0].newState.should.be.eql({ id: '1', value: 5 })
      changes[1].newState.should.be.eql({ id: '1', value: 17 })
    })

    it('should subscribe to state changes of multiple entities', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      store.subscribe(change => {
        changes[change.event.entityId] = changes[change.event.entityId] || []
        changes[change.event.entityId].push(change)
      })

      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '2', value: 15}},
        {type: 'increment', payload: {id: '2', value: 15}}
      ])
      await sleep(10)
      changes['1'].length.should.eql(2)
      changes['1'][0].newState.should.be.eql({ id: '1', value: 10 })
      changes['1'][1].newState.should.be.eql({ id: '1', value: 5 })
      changes['2'].length.should.eql(2)
      changes['2'][0].newState.should.be.eql({ id: '2', value: 15 })
      changes['2'][1].newState.should.be.eql({ id: '2', value: 30 })
    })

    it('should subscribe to specific event type of state changes for multiple entities', async () => {
      const changes = {}
      const store = advent.createStore(decider, reducer)
      store.subscribe('decremented', change => {
        changes[change.event.entityId] = changes[change.event.entityId] || []
        changes[change.event.entityId].push(change)
      })

      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '2', value: 15}},
        {type: 'decrement', payload: {id: '2', value: 10}}
      ])
      await sleep(10)
      changes['1'].length.should.eql(1)
      changes['1'][0].newState.should.be.eql({ id: '1', value: 5 })
      changes['2'].length.should.eql(1)
      changes['2'][0].newState.should.be.eql({ id: '2', value: 5 })
    })
  })

  describe('clearState', () => {
    it('should clear an entity state', async () => {
      const store = advent.createStore(decider, reducer)
      await store.dispatch([
        {type: 'increment', payload: {id: '1', value: 10}},
        {type: 'decrement', payload: {id: '1', value: 5}},
        {type: 'increment', payload: {id: '1', value: 15}}
      ])

      const id = store.clearState('1');

      id.should.be.eql('1');
      (store.getState('1') === undefined).should.be.true()
    })
  })
})
