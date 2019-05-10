'use strict'

/**
 * Creates an snapshot model.
 *
 * @param {Object} options
 * @return {Object}
 * @public
 */

module.exports = async () => {
  const snapshots = {}

  /**
   * Load snapshots.
   *
   * @param {String} id
   * @return {Promise}
   * @public
   */

  const load = async id => {
    snapshots[id] = snapshots[id] || []
    const snap = snapshots[id][snapshots[id].length - 1]
    return Promise.resolve(snap)
  }

  /**
   * Commit a single entity `snapshot`.
   *
   * @param {Object} snap
   * @return {Promise}
   * @public
   */

  const save = async snap => {
    if (!snap || !snap.id || !snap.version) return
    const { id } = snap

    if (id) {
      snapshots[id] = snapshots[id] || []
      snapshots[id].push(snap)
    }

    return snap
  }

  return { load, save }
}
