import { errorCodes } from '../../utils/constants'
import BaseError from './BaseError'

class BadRequestError extends BaseError {
  constructor(
    message = 'API: Bad request!',
    data,
    statusCode = errorCodes.BAD_REQUEST,
    name = 'BadRequestError'
  ) {
    super(name, message, statusCode, data)
  }
}

export default BadRequestError
