import Deferer from './Deferer'

type WaitRequest = {
  id: string
  requestConfig: {
    request
    retrySchemas
  }
  isInfinite: boolean
  expiredAt: Date
  deferer: Deferer
}

export default WaitRequest
