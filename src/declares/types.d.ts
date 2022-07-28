import { AxiosRequestConfig } from 'axios'
import Deferer from '../classes/Deferer'

import { StandardResponse } from './interfaces'

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

export declare type ZPCRequestSchema = {
  requestConfig: AxiosRequestConfig
  shouldHold?: boolean
  waitNetworkTime?: number | 'infinite'
  retrySchemas?: RetrySchema[] | 'default'
}

export declare type BlockedURL = {
  url: string
  expiredAt: Date | 'infinite'
}

export declare type WaitNetworkConfig = {
  waitNetworkTime: number | 'infinite'
  shouldHold: boolean
}
