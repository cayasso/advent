'use strict'

const createSnapshotModel = require('./snapshot')
const createEventModel = require('./event')
const createDatabase = require('./db')

/**
 * Creates engine.
 *
 * @param {String} conn
 * @param {Object} options
 * @return {Object}
 * @public
 */

module.exports = (conn, options = {}) => {
  const db = createDatabase(conn || 'mongodb://localhost:27017/eventstream')

  let ready = false
  let event = null
  let snapshot = null

  options.db = db

  /**
   * Initialize models.
   *
   * @return {Promise}
   * @private
   */

  const init = async () => {
    if (ready) return
    event = await createEventModel(options)
    snapshot = await createSnapshotModel(options)
    ready = true
  }

  /**
   * Get a single or multiple entities.
   *
   * @param {String} id
   * @return {Object}
   * @public
   */

  const load = async id => {
    await init()
    const snap = await snapshot.load(id)
    const events = await event.load(id, snap)
    return { snap, events }
  }

  /**
   * Save snapshot and events.
   *
   * @param {Array} events
   * @param {Object} [snap]
   * @return {Void}
   * @public
   */

  const save = async (events, snap) => {
    await init()
    snap = await snapshot.save(snap)
    events = await event.save(events)
    return { snap, events }
  }

  return { load, save, db }
}
