class Logger {
  log(request) {
    return (response) => {
      console.log('>>>LOGGER: running...')
      console.log('>>>REQUEST:')
      console.log(request)
      console.log('>>>RESPONSE:')
      console.log(response)
      console.log('>>>LOGGER: ended...')
      return response
    }
  }
}

export default Logger
