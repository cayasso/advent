import {
  INCREMENT, DECREMENT,
  incremented, decremented
} from './constants'

// This reducer returns an array of events to pass on
// to the event reducer
export default (state, command) => {

  switch(command.type) {

    case INCREMENT:
      return [incremented({ count: command.payload.count })]

    case DECREMENT:
      return [
        incremented({ count: 1500 }),
        decremented({ count: 1000 }),
        decremented({ count: command.payload.count })
      ]

    default:
      return []
  }
}
