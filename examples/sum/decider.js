'use strict'

import {
  INCREMENT, DECREMENT,
  incremented, decremented
} from './constants'

// This reducer returns an array of events to pass on
// to the event reducer
export default (state, command, push) => {
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
