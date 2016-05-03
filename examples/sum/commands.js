import { createCommand } from '../../src/index'
import * as events from './events'

export const incrementCommand = createCommand('increment')
export const decrementCommand = createCommand('decrement')

export default (state, command) => {
  const { id, type, payload } = command

  switch(type) {

    case 'increment':
      return [{ ...command, type: 'incremented' }]

    case 'decrement':
      return [
        events.incrementedEvent({ id, count: 1500 }),
        events.decrementedEvent({ id, count: 1000 }),
        events.decrementedEvent(payload)
      ]

    default:
      return []
  }
}
