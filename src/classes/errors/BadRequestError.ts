import { errorCodes } from '../../utils/constants'
import BaseError from './BaseError'

class BadRequestError extends BaseError {
  constructor(
    message = 'API: Bad request!',
    data,
    status = errorCodes.BAD_REQUEST,
    name = 'BadRequestError'
  ) {
    super(name, message, status, data)
  }
}

export default BadRequestError
