import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class Api404Error extends BaseError {
  constructor(
    message: string = 'API: Not found!',
    data: any,
    status: number = errorCodes.NOT_FOUND,
    name: string = 'Api404Error'
  ) {
    super(name, message, status, data)
  }
}

export default Api404Error
