'use strict'

const { createCommand, createEvent } = require('../../src/index')

// Command creators
const INCREMENT = 'increment'
const DECREMENT = 'decrement'
const increment = createCommand(INCREMENT)
const decrement = createCommand(DECREMENT)

// Event creators
const INCREMENTED = 'incremented'
const DECREMENTED = 'decremented'
const incremented = createEvent(INCREMENTED)
const decremented = createEvent(DECREMENTED)

module.exports = {
  INCREMENT,
  DECREMENT,
  INCREMENTED,
  DECREMENTED,
  increment,
  decrement,
  incremented,
  decremented
}
