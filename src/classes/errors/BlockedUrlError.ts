import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class BlockedUrlError extends BaseError {
  constructor(
    message = 'URL is blocked!',
    data,
    statusCode = errorCodes.BLOCKED_URL,
    name = 'BlockedUrlError'
  ) {
    super(name, message, statusCode, data)
  }
}

export default BlockedUrlError
