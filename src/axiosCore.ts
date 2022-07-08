import axios from 'axios'
import { IAxiosCore, IDecryptor, ILogger } from './declares/interfaces'
import logger from './handlers/logger'
import decryptor from './handlers/decryptor'

class AxiosCore implements IAxiosCore {
  private logger!: ILogger
  private decryptor!: IDecryptor

  async request(request) {
    const response = await axios.request(request)
    if (this.decryptor) {
      const decryptedRes = this.decryptor.decrypt(response)
      this.logger.log(request)(decryptedRes)
    }

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
axiosCore.useLogger(logger)
axiosCore.useDecryptor(decryptor)

export default axiosCore
