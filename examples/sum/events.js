import { INCREMENTED, DECREMENTED } from './constants'

// Initial state
const initialState = { count: 0 }

// This reducer returns what would be merged
// with the current state and be returned as new state
export default (state = initialState, event) => {

  switch(event.type) {

    case INCREMENTED:
      return {
        count: state.count + event.payload.count
      }

    case DECREMENTED:
      return {
        count: state.count - event.payload.count
      }

    default:
      return state
  }

}
