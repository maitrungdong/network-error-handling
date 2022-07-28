import { errorCodes } from '../../utils/constants'

import BaseError from './BaseError'

class DisconnectNetworkError extends BaseError {
  constructor(
    message = 'Network is disconnect!',
    data,
    status = errorCodes.DISNETWORK_ERROR,
    name = 'DisconnectNetworkError'
  ) {
    super(name, message, status, data)
  }
}

export default DisconnectNetworkError
