'use strict'

import { createCommand, createEvent } from '../../src/index'

// Command creators
export const INCREMENT = 'increment'
export const DECREMENT = 'decrement'
export const increment = createCommand(INCREMENT)
export const decrement = createCommand(DECREMENT)

// Event creators
export const INCREMENTED = 'incremented'
export const DECREMENTED = 'decremented'
export const incremented = createEvent(INCREMENTED)
export const decremented = createEvent(DECREMENTED)
