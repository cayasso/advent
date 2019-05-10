const should = require('should')
const createEngine = require('../src')

let engine = null
const data = [
  { entity: { id: '1', name: 'test' }, type: 'created', payload: { a: 1 } },
  { entity: { id: '1', name: 'test' }, type: 'updated', payload: { a: 2 } },
  { entity: { id: '1', name: 'test' }, type: 'tested', payload: { a: 3 } },
  { entity: { id: '2', name: 'test' }, type: 'created', payload: { a: 1 } },
  { entity: { id: '3', name: 'test' }, type: 'created', payload: { a: 2 } },
  { entity: { id: '3', name: 'test' }, type: 'created', payload: { a: 3 } }
]

const clone = data => {
  return JSON.parse(JSON.stringify(data))
}

describe('advent-memory', () => {
  before(() => {
    engine = createEngine()
  })

  it('should be a function', () => {
    should(createEngine).be.a.Function()
  })

  it('should return an object', () => {
    should(engine).be.an.Object()
  })

  it('should export the right methods', () => {
    should(engine.save).be.a.Function()
    should(engine.load).be.a.Function()
  })

  describe('save', () => {
    it('should save events', async () => {
      const testEvents = clone(data)
      const { events } = await engine.save(testEvents)
      should(events.length).eql(testEvents.length)
      should(events).eql(testEvents)
    })

    it('should not save events with missing entity ids', async () => {
      const wrongEvents = [
        { type: 'updated', payload: { a: 2 } },
        { type: 'updated', payload: { a: 2 } }
      ]
      const { events } = await engine.save(wrongEvents)
      should(events.length).eql(0)
      should(events).eql([])
    })

    it('should not save events with missing entity name', async () => {
      const wrongEvents = [
        { type: 'updated', payload: { a: 2 } },
        { type: 'updated', payload: { a: 2 } }
      ]
      const { events } = await engine.save(wrongEvents)
      should(events.length).eql(0)
      should(events).eql([])
    })

    it('should alow saving snapshot', async () => {
      const snapshot = { id: '1', a: 1, b: 2, version: 1 }
      const { snap } = await engine.save(clone(data), snapshot)
      should(snapshot).eql(snap)
    })

    it('should not save snapshot with missing id', async () => {
      const snapshot = { a: 1, b: 2, version: 2 }
      const { snap } = await engine.save(clone(data), snapshot)
      should(snap).eql(undefined)
    })

    it('should not save snapshot with missing version', async () => {
      const snapshot = { id: '1', a: 1, b: 2 }
      const { snap } = await engine.save(clone(data), snapshot)
      should(snap).eql(undefined)
    })
  })

  describe('load', () => {
    it('should return a promise', () => {
      should(engine.load('1').then).be.a.Function()
    })

    it('should load events by id', async () => {
      engine = createEngine()

      const id = '1'
      const testEvents = clone(data)
      await engine.save(testEvents)
      const { events } = await engine.load(id)
      should(events.length).eql(3)
      should(events).eql(testEvents.filter(e => e.entity.id === id))
    })

    it('should load events from snapshot', async () => {
      //engine = createEngine()

      const testEvents = [
        { entity: { id: 'a1', name: 'test' }, type: 'created', payload: { a: 1 } },
        { entity: { id: 'a1', name: 'test' }, type: 'updated', payload: { a: 2 } },
        { entity: { id: 'a1', name: 'test' }, type: 'tested', payload: { a: 3 } },
        { entity: { id: 'a1', name: 'test' }, type: 'tested', payload: { a: 4 } },
        { entity: { id: 'a1', name: 'test' }, type: 'tested', payload: { a: 5 } }
      ]

      const snapshot = { id: 'a1', a: 3, version: 2, revision: 2 }

      const id = 'a1'
      await engine.save(testEvents, snapshot)
      const { events, snap } = await engine.load(id)

      should(snapshot).containEql(snap)
      should(events.length).eql(2)
      should(events[1]).containEql({ revision: 4 })
    })
  })
})
