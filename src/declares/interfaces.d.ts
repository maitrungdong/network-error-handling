import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { BlockedURL, RetrySchema, WaitRequest } from './types'

export declare interface IWaitRequestsManager {
  removeWaitRequestById(waitReqId: string): void
  createWaitRequest(
    request: AxiosRequestConfig,
    retrySchemas: RetrySchema[],
    waitNetworkTime: number | 'infinite'
  ): WaitRequest
  networkStatusListener(status: string): void
}

export declare interface IDecryptor {
  decrypt(rawResponse): AxiosResponse
}

export declare interface IInterceptor {
  interceptReqUrl(reqUrl: string): any
  interceptRes(response: any): any
  addBlockedURL(item: { url: string; blockTime: number | 'infinite' }): void
  getBlockedURL(url: string): BlockedURL | undefined
  removeBlockedURL(url: string): void
  isBlocked(url: string): boolean
  unBlockUrlListener(event): void
}

export declare interface ILogger {
  log(request: AxiosRequestConfig): (response: AxiosResponse) => void
}

export declare interface IAxiosEngine {
  useWaitRequestsManager(waitRequestsManager: IWaitRequestsManager): void
  request(
    request: AxiosRequestConfig,
    retrySchemas: RetrySchema[],
    waitNetworkConfig: WaitNetworkConfig
  )
}

export declare interface IAxiosCore {
  request(request: AxiosRequestConfig): any
  useLogger(logger: ILogger): void
  useDecryptor(decryptor: IDecryptor): void
}

export declare interface IStandardResponse {
  success: boolean
  status: number
  data: any
  message: string
}
