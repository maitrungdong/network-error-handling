import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class Api404Error extends BaseError {
  constructor(
    message = 'API: Not found!',
    data,
    statusCode = errorCodes.NOT_FOUND,
    name = 'Api404Error'
  ) {
    super(name, message, statusCode, data)
  }
}

export default Api404Error
