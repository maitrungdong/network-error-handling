import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { ILogger } from '../declares/interfaces'

class Logger implements ILogger {
  log(request: AxiosRequestConfig) {
    return (response: AxiosResponse) => {
      console.log('>>>LOGGER: running...')
      console.log('>>>REQUEST:')
      console.log(request)
      console.log('>>>RESPONSE:')
      console.log(response)
      console.log('>>>LOGGER: ended...')
    }
  }
}

export default Logger
