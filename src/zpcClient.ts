import axiosEngine from './axiosEngine.js'
import interceptor from './handlers/interceptor.js'

import { IAxiosEngine, IInterceptor } from './declares/interfaces'
import { RetrySchema, ZPCRequestSchema } from './declares/types'

import { AxiosRequestConfig } from 'axios'
import AbortablePendingRequest from './classes/AbortablePendingRequest.js'

declare type RestMethod = (
  url: string,
  requestSchema: ZPCRequestSchema
) => AbortablePendingRequest

const BASE_API_URL = 'http://localhost:8080/api/'
/**
 * Set up default configs and prepair configs.
 * Intercept request before passing them to AxiosEngine.
 * Intercept response before returning them to Outer.
 */
class ZpcClient {
  private defaultRetrySchema: RetrySchema = {
    maxRetries: 3,
    msBackoff: 1000,
    errorCodes: [408, 500, 502, 503, 504],
  }
  private defaultReqConfig: AxiosRequestConfig = {
    baseURL: `${BASE_API_URL}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 3000,
    responseType: 'json',
  }

  private engine!: IAxiosEngine
  private interceptor!: IInterceptor

  public post: RestMethod
  public get: RestMethod
  public put: RestMethod
  public delete: RestMethod

  constructor(retrySchema?: RetrySchema, reqConfig?: AxiosRequestConfig) {
    if (reqConfig) {
      this.defaultReqConfig = {
        ...this.defaultReqConfig,
        ...reqConfig,
      }
    }
    if (retrySchema) {
      this.defaultRetrySchema = {
        ...this.defaultRetrySchema,
        ...retrySchema,
      }
    }

    this.post = this.generateRestMethod('post').bind(this)
    this.get = this.generateRestMethod('get').bind(this)
    this.put = this.generateRestMethod('put').bind(this)
    this.delete = this.generateRestMethod('delete').bind(this)
  }

  public useInterceptor(interceptor: IInterceptor) {
    this.interceptor = interceptor
  }

  public useAxiosEngine(engine: IAxiosEngine) {
    this.engine = engine
  }

  private generateRestMethod(method: string) {
    return (
      route: string,
      requestSchema: ZPCRequestSchema
    ): AbortablePendingRequest => {
      const {
        requestConfig,
        shouldHold,
        waitNetworkTime,
        retrySchemas: retrySchms,
      } = requestSchema

      const abortCtrl = new AbortController()
      const url = this.getAPIUrl(route, requestConfig.params).toString()

      const request: AxiosRequestConfig = Object.assign(
        {},
        this.defaultReqConfig,
        requestConfig,
        {
          headers: {
            ...this.defaultReqConfig.headers,
            ...requestConfig.headers,
          },
          signal: abortCtrl.signal,
          url: route,
          method: method,
        }
      )
      //TODO: check if it's in blacklist.
      this.interceptor.interceptReqUrl(url)

      let retrySchemas: RetrySchema[] = []
      if (retrySchms) {
        retrySchemas =
          retrySchms === 'default'
            ? [{ ...this.defaultRetrySchema }]
            : [...retrySchms]
      }

      const response = this.engine.request(request, retrySchemas, {
        shouldHold,
        waitNetworkTime,
      })
      const pendingResponse = this.interceptor.interceptRes(response)

      return new AbortablePendingRequest(pendingResponse, abortCtrl)
    }
  }

  private getAPIUrl(route: string, params: any) {
    //TODO: check if route is absolute url
    let url: URL
    if (this.isAbsoluteURL(route)) {
      url = new URL(route)
    } else {
      url = new URL(this.defaultReqConfig.baseURL!)
      url.pathname = `${route}`
    }

    if (params) {
      Object.entries<any>(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value.toString())
        }
      })
    }

    return url
  }

  private isAbsoluteURL(url: string) {
    const http = /^https?:\/\//i
    const https = /^https?:\/\/|^\/\//i
    return http.test(url) || https.test(url)
  }
}

const zpcClient = new ZpcClient()

zpcClient.useAxiosEngine(axiosEngine)
zpcClient.useInterceptor(interceptor)

export default zpcClient
