import axios from 'axios'

import Decryptor from './handlers/Decryptor'
import Logger from './handlers/Logger'

class AxiosCore {
  private logger?: Logger
  private decryptor?: Decryptor

  async request(request) {
    const response = await axios.request(request)
    if (this.decryptor) {
      const decryptedRes = this.decryptor.decrypt(response)
      if (this.logger) {
        this.logger.log(request)(decryptedRes)
      }
    }

    return response
  }

  useLogger(logger: Logger) {
    this.logger = logger
  }

  useDecryptor(decryptor: Decryptor) {
    this.decryptor = decryptor
  }
}

const axiosCore = new AxiosCore()

//For dependency injection:
axiosCore.useLogger(new Logger())
axiosCore.useDecryptor(new Decryptor())

export default axiosCore
