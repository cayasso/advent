import { createCommand, createEvent } from '../../src/index'

// Constants
export const INCREMENT = 'increment'
export const DECREMENT = 'decrement'
export const INCREMENTED = 'incremented'
export const DECREMENTED = 'decremented'

// Command creators
export const increment = createCommand(INCREMENT)
export const decrement = createCommand(DECREMENT)

// Event creators
export const incremented = createEvent(INCREMENTED)
export const decremented = createEvent(DECREMENTED)
