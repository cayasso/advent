export default (state, event) => {
  const { type, data } = event

  switch (type) {

    case 'incremented':
      return {
        ...state,
        count: data.count
      }

    case 'decremented':
      return {
        ...state,
        count: data.count
      }

    default:
      return state
  }

}
