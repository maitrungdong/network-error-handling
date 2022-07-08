import axiosEngine from './axioEngine'
import AbortablePendingRequest from './classes/AbortablePendingRequest'
import interceptor from './handlers/interceptor'
import { IAxiosEngine, IInterceptor } from './declares/interfaces'
import { RetrySchema, ZPCRequestSchema } from './declares/types'

type ZPCRequestOptions = {
  baseURL: string
  headers: any
  timeout: number
  withCredentials: boolean
  responseType: string
  maxContentLength: number
  maxBodyLength: number
}

declare type RestMethod = (
  url: string,
  requestSchema: ZPCRequestSchema
) => AbortablePendingRequest

const BASE_API_URL = 'http://localhost:8080'
/**
 * Prepare configs and set up default configs
 * Intercept request parameters before passing them to AxiosEngine
 */
class ZpcClient {
  //Default retrySchema setting:
  private defaultRetrySchema: RetrySchema = {
    maxRetries: 3,
    msBackoff: 200,
    errorCodes: [408, 500, 502, 503, 504],
  }

  private requestOptions: ZPCRequestOptions = {
    baseURL: `${BASE_API_URL}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 1000,
    withCredentials: false,
    responseType: 'json',
    maxContentLength: 2000,
    maxBodyLength: 2000,
  }

  private engine!: IAxiosEngine
  private interceptor!: IInterceptor

  public post: RestMethod
  public get: RestMethod
  public put: RestMethod
  public delete: RestMethod

  constructor(retrySchema: RetrySchema, requestOptions: ZPCRequestOptions) {
    this.configRequestOptions(requestOptions)
    this.configRetrySchema(retrySchema)

    this.post = this.generateRestMethod('post').bind(this)
    this.get = this.generateRestMethod('get').bind(this)
    this.put = this.generateRestMethod('put').bind(this)
    this.delete = this.generateRestMethod('delete').bind(this)
  }

  useInterceptor(interceptor: IInterceptor) {
    this.interceptor = interceptor
  }

  useAxiosEngine(engine: IAxiosEngine) {
    this.engine = engine
  }

  private configRequestOptions = (options: ZPCRequestOptions) => {
    this.requestOptions = {
      ...this.requestOptions,
      ...options,
    }
  }

  private configRetrySchema = (schema: RetrySchema) => {
    this.defaultRetrySchema = {
      ...this.defaultRetrySchema,
      ...schema,
    }
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
      let { headers, params, data, ...restRequestConfig } = requestConfig

      headers = {
        ...this.requestOptions.headers,
        ...headers,
      }

      restRequestConfig = {
        ...this.requestOptions,
        ...restRequestConfig,
      }

      const abortCtrl = new AbortController()
      const url = this.getAPIUrl(route, params).toString()

      const request = Object.assign(
        {
          url,
          headers,
          method: method.toUpperCase(),
          ...restRequestConfig,
          signal: abortCtrl?.signal,
        },

        method !== 'get' && { data }
      )

      //TODO: check if it's in blacklist.
      this.interceptor.interceptReq(request)

      let retrySchemas: RetrySchema[] = []
      if (retrySchms) {
        retrySchemas =
          retrySchms === 'default'
            ? [{ ...this.defaultRetrySchema }]
            : [...retrySchms]
      }

      //TODO: Thêm một cái wrapper (đánh chặn cho thằng interceptor ở đây!)
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
    if (this._isAbsoluteURL(route)) {
      url = new URL(route)
    } else {
      url = new URL(this.requestOptions.baseURL)
      url.pathname = `${route}`
    }

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value.toString())
        }
      })
    }

    return url
  }

  _isAbsoluteURL(url: string) {
    const http = /^https?:\/\//i
    const https = /^https?:\/\/|^\/\//i
    return http.test(url) || https.test(url)
  }
}

const zpcClient = new ZpcClient()

zpcClient.useAxiosEngine(axiosEngine)
zpcClient.useInterceptor(interceptor)

export default zpcClient
