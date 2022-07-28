import { IAxiosCore, IDecryptor, ILogger } from './declares/interfaces'

import Logger from './handlers/logger'
import Decryptor from './handlers/decryptor'

import axios, { AxiosRequestConfig } from 'axios'

class AxiosCore implements IAxiosCore {
  private logger!: ILogger
  private decryptor!: IDecryptor

  async request(request: AxiosRequestConfig) {
    console.log('>>>AXIOS_CORE_REQUEST_CONGFIG: ', request)
    const rawResponse = await axios.request(request)
    const response = this.decryptor.decrypt(rawResponse)
    this.logger.log(request)(response)
    return response
  }

  useLogger(logger: ILogger) {
    this.logger = logger
  }

  useDecryptor(decryptor: IDecryptor) {
    this.decryptor = decryptor
  }
}

const axiosCore = new AxiosCore()

//For dependency injection:
axiosCore.useLogger(new Logger())
axiosCore.useDecryptor(new Decryptor())

export default axiosCore
