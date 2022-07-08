import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class DisconnectNetworkError extends BaseError {
  constructor(
    message = 'Network is disconnect!',
    data,
    statusCode = errorCodes.DISNETWORK_ERROR,
    name = 'DisconnectNetworkError'
  ) {
    super(name, message, statusCode, data)
  }
}

export default DisconnectNetworkError
