'use strict'

const { INCREMENTED, DECREMENTED } = require('./constants')

// Initial state
const initialState = { value: 0 }

// This reducer returns what would be merged
// with the current state and be returned as new state
module.exports = (state = initialState, event) => {
  switch (event.type) {
    case INCREMENTED:
      return {
        value: event.payload.value
      }

    case DECREMENTED:
      return {
        value: event.payload.value
      }

    default:
      return state
  }
}
