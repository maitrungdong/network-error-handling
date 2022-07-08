import { ILogger } from '../declares/interfaces'

class Logger implements ILogger {
  log(request) {
    return (response) => {
      console.log('>>>LOGGER: running...')
      console.log('>>>REQUEST:')
      console.log(request)
      console.log('>>>RESPONSE:')
      console.log(response)
      console.log('>>>LOGGER: ended...')
    }
  }
}

const logger = new Logger()
