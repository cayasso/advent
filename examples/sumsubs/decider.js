export default (state, command) => {
  const { type, data } = command


  return {
    [increment]: incemented
  }

  switch (type) {

    case 'increment':
      return [{
        ...command,
        type: 'incremented',
        data: {
          count: state.count + data.count
        }
      }]

    case 'decrement':
      return [{
        ...command,
        type: 'decremented',
        data: {
          count: state.count - data.count
        }
      }]

    default:
      return []
  }

}


function deciders() {
  return {
    [increment]: incremented,
    [decrement]: decremented
  }
}

function increment(state, command) {
  return [{}]
}

function incremented(state, events) {
  return state
}

store.push(increment, { count: 1 })
