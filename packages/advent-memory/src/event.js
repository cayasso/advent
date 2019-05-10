'use strict'

/**
 * Creates an event model.
 *
 * @param {Object} options
 * @return {Object}
 * @public
 */

module.exports = () => {
  const events = {}
  const counts = {}

  /**
   * Load entity events.
   *
   * @param {String|Number} id
   * @return {Promise}
   * @public
   */

  const load = async (id, snap) => {
    events[id] = events[id] || []
    return snap && snap.version
      ? events[id].filter(event => event.revision > snap.version)
      : events[id]
  }

  /**
   * Save events.
   *
   * @param {Array} events
   * @return {Promise}
   * @public
   */

  const save = async data => {
    return Array.isArray(data) && data.length > 0
      ? data.filter(event => {
          event.entity = event.entity || {}
          const id = event.entity.id || event.id
          if (!id) return false
          events[id] = events[id] || []
          counts[id] = counts[id] || 1
          event.revision = counts[id]++
          events[id] = [...events[id], event]
          return true
        })
      : []
  }

  return { load, save }
}
