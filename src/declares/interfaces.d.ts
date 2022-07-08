import WaitRequestsManager from '../handlers/waitRequestsManager'
import { BlockedURL, RetrySchema, WaitRequest, ZPCRequest } from './types'

export declare interface IWaitRequestsManager {
  removeWaitRequestById(waitReqId: string): void
  createWaitRequest(
    request: ZPCRequest,
    retrySchemas: RetrySchema[],
    waitNetworkTime: number | 'infinite'
  ): WaitRequest
  networkStatusListener(status: string): void
}

export declare interface IDecryptor {
  decrypt(rawResponse): any
}

export declare interface IInterceptor {
  interceptReq(request: any): any
  interceptRes(response: any): any
  addBlockedURL(item: { url: string; blockTime: number | 'infinite' }): void
  getBlockedURL(url: string): BlockedURL | undefined
  removeBlockedURL(url: string): void
  isBlocked(url: string): boolean
  unBlockUrlListener(event): void
}

export declare interface ILogger {
  log(request): (response) => void
}

export declare interface IAxiosEngine {
  useWaitRequestsManager(waitRequestsManager: IWaitRequestsManager): void
  request(
    request: ZPCRequest,
    retrySchemas: RetrySchema[],
    waitNetworkConfig: WaitNetworkConfig
  )
}

export declare interface IAxiosCore {
  request(request: ZPCRequest): any
  useLogger(logger: ILogger): void
  useDecryptor(decryptor: IDecryptor): void
}
