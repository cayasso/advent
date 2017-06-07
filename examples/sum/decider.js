'use strict'

import {
  INCREMENT, DECREMENT,
  incremented, decremented
} from './constants'

// This reducer returns an array of events to pass on
// to the event reducer
export default (state, command) => {
  switch (command.type) {

    case INCREMENT:
      return [incremented({ value: command.payload.value })]

    case DECREMENT:
      return [
        incremented({ value: 1500 }),
        decremented({ value: 1000 }),
        decremented({ value: command.payload.value })
      ]

    default:
      return []
  }
}
