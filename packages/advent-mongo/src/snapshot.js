'use strict'

/**
 * Creates an snapshot model.
 *
 * @param {Object} options
 * @return {Object}
 * @api public
 */

module.exports = async ({ db, collections = {} } = {}) => {
  const snapshots = await db.get(collections.events || 'snapshots')

  await snapshots.createIndex({ id: 1, version: 1 })
  await snapshots.createIndex({ version: 1 })
  await snapshots.createIndex({ id: 1 })

  /**
   * Load snapshots.
   *
   * @param {String|Number|Array} id
   * @return {Promise}
   * @public
   */

  const load = async id => {
    const snap = await snapshots.findOne({ id }, { limit: -1, sort: '-version' })
    if (snap) delete snap._id
    return snap
  }

  /**
   * Commit a single entity `snapshot`.
   *
   * @param {Entity} entity
   * @param {Object} options
   * @return {Promise}
   * @public
   */

  const save = snap => {
    if (!snap || !snap.id || !snap.version) return
    return snapshots.insertOne(snap)
  }

  return { load, save }
}
