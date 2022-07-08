import Deferer from '../classes/Deferer'

export declare type RetrySchema = {
  maxRetries: number
  msBackoff: number
  errorCodes: number[]
}

export declare type WaitRequest = {
  id: string
  requestConfig: {
    request
    retrySchemas
  }
  isInfinite: boolean
  expiredAt: Date
  deferer: Deferer
}

export declare type ZPCRequest = {
  headers?: Headers
  params?: object
  data?: object
  timeout?: number
  withCredentials?: boolean
  responseType?: string
}

export declare type ZPCRequestSchema = {
  requestConfig: ZPCRequest
  shouldHold?: boolean
  waitNetworkTime?: number | 'infinite'
  retrySchemas?: RetrySchema[] | 'default'
}

export declare type BlockedURL = {
  url: string
  expiredAt: Date | 'infinite'
}

export declare type WaitNetworkConfig = {
  waitNetworkTime: number | 'infinte'
  shouldHold: boolean
}
