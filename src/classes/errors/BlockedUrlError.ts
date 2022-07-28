import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class BlockedUrlError extends BaseError {
  constructor(
    message = 'URL is blocked!',
    data,
    status = errorCodes.BLOCKED_URL,
    name = 'BlockedUrlError'
  ) {
    super(name, message, status, data)
  }
}

export default BlockedUrlError
