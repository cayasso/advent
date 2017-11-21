'use strict'

const {
  INCREMENT, DECREMENT,
  incremented, decremented
} = require('./constants')

// This reducer returns an array of events to pass on
// to the event reducer
module.exports = (state, command) => {
  switch (command.type) {

    case INCREMENT:
      return incremented({
        value: state.value + command.payload.value
      })

    case DECREMENT:
      return decremented({
        value: state.value - command.payload.value
      })

    default:
      return []
  }
}
