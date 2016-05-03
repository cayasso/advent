import { createEvent } from '../../src/index'

export const incrementedEvent = createEvent('incremented')
export const decrementedEvent = createEvent('decremented')

export default (state = { count: 0 }, event) => {
  const { type, payload = {} } = event
  const { count } = payload

  switch(type) {

    case 'incremented':
      return {
        count: state.count + count
      }

    case 'decremented':
      return {
        count: state.count - count
      }

    default:
      return state
  }

}
