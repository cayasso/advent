'use strict'

/**
 * Creates an event model.
 *
 * @param {Object} options
 * @return {Object}
 * @public
 */

module.exports = async ({ db, collections = {} } = {}) => {
  const counts = await db.get(collections.counts || 'counts')
  const events = await db.get(collections.events || 'events')

  await events.createIndex({ 'entity.id': 1, revision: 1 })
  await events.createIndex({ revision: 1 })
  await counts.createIndex({ entity: 1 })

  /**
   * Get sequence number for versioning.
   *
   * @param {String} name
   * @return {Promise}
   * @public
   */

  const seq = entity => {
    const update = { $inc: { seq: 1 }, $set: { entity } }
    return counts.updateOne({ entity }, update, { upsert: true })
  }

  /**
   * Load events.
   *
   * @param {Object} id
   * @param {Object} snap
   * @return {Promise}
   * @public
   */

  const load = (id, snap) => {
    const query =
      snap && snap.version
        ? { 'entity.id': id, revision: { $gt: snap.version } }
        : { 'entity.id': id }
    return events.findMany(query, { sort: 'revision' })
  }

  /**
   * Save events.
   *
   * @param {Array} events
   * @return {Promise}
   * @public
   */

  const save = async data => {
    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    const _events = []

    for (const event of data) {
      const { entity } = event

      if (entity && entity.name && entity.id) {
        const { seq: revision } = await seq(`${entity.name}:${entity.id}`)
        _events.push(Object.assign(event, { revision }))
      }
    }

    if (_events.length === 0) return []
    return events.insertMany(_events)
  }

  return { load, save }
}
