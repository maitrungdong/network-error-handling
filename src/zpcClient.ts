import axiosEngine from './AxiosEngine.js'
import AbortablePendingRequest from './helpers/Types/AbortablePendingRequest.js'
import 'utils/networkStatus.js'
import interceptor from './helpers/interceptor.js'

const BASE_API_URL = 'http://localhost:8080'
/**
 * Prepare configs and set up default configs
 * Intercept requests before pass them to AxiosEngine
 */
class ZlcaClient {
  //Default retrySchema setting:
  _defaultRetrySchema = {
    maxRetries: 3,
    msBackoff: 200,
    errorCodes: [408, 500, 502, 503, 504], //Các mã lỗi cho cái retry schema này!
  }

  _requestOptions = {
    baseURL: `${BASE_API_URL}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 1000,
    withCredentials: false,
    responseType: 'json',
    maxContentLength: 2000,
    maxBodyLength: 2000,
  }

  _engine = null
  _interceptor = null

  constructor(retrySchema = {}, requestOptions = {}) {
    this._configRequestOptions(requestOptions)
    this._configRetrySchema(retrySchema)

    this.post = this._generateRestMethod('post').bind(this)
    this.get = this._generateRestMethod('get').bind(this)
    this.put = this._generateRestMethod('put').bind(this)
    this.delete = this._generateRestMethod('delete').bind(this)
  }

  useInterceptor(interceptor) {
    if (typeof interceptor === 'object') {
      this._interceptor = interceptor
    }
  }

  useAxiosEngine(engine) {
    if (typeof engine === 'object') {
      this._engine = engine
    }
  }

  _configRequestOptions = (options = {}) => {
    if (typeof options.baseApiURL === 'string') {
      this._requestOptions.baseApiURL = options.baseApiURL
    }
    if (typeof options.headers === 'object') {
      this._requestOptions.headers = options.headers
    }
  }

  _configRetrySchema = (schema = {}) => {
    if (typeof schema.maxRetries === 'number') {
      this._defaultRetrySchema.maxRetries = schema.maxRetries
    }
    if (typeof schema.shouldRetry === 'boolean') {
      this._defaultRetrySchema.shouldRetry = schema.shouldRetry
    }
    if (typeof schema.msBackoff === 'number') {
      this._defaultRetrySchema.msBackoff = schema.msBackoff
    }
    if (Array.isArray(schema.retryableErrors)) {
      this._defaultRetrySchema.retryableErrors = [...schema.retryableErrors]
    }
  }

  _generateRestMethod(method) {
    return (route, requestSchema = {}) => {
      const {
        requestConfig,
        isAbortable,
        shouldHold,
        waitNetworkTime,
        retrySchemas: retrySchms,
      } = requestSchema
      let { headers, params, data, ...restRequestConfig } = requestConfig || {}

      headers = {
        ...this._requestOptions.headers,
        ...headers,
      }

      restRequestConfig = {
        ...this._requestOptions,
        ...restRequestConfig,
      }

      delete restRequestConfig.baseURL
      delete restRequestConfig.headers

      const abortCtrl = isAbortable ? new AbortController() : null
      const url = this._getAPIUrl(route, params).toString()

      const request = Object.assign(
        {
          url,
          headers,
          method: method.toUpperCase(),
          ...restRequestConfig,
        },
        isAbortable && { signal: abortCtrl.signal },
        method !== 'get' && { data }
      )

      //TODO: check if it's in blacklist.
      this._interceptor.interceptRequest(request)

      let retrySchemas = null
      if (retrySchms) {
        retrySchemas =
          retrySchms === 'default'
            ? { ...this._defaultRetrySchema }
            : [...retrySchms]
      }

      //TODO: Thêm một cái wrapper (đánh chặn cho thằng interceptor ở đây!)
      const response = this._engine.request(request, retrySchemas, {
        shouldHold,
        waitNetworkTime,
      })

      const pendingResponse = this._interceptor.interceptResponse(response)
      if (isAbortable) {
        return new AbortablePendingRequest(pendingResponse, abortCtrl)
      } else {
        return pendingResponse
      }
    }
  }

  _getAPIUrl(route, params) {
    //TODO: check if route is absolute url
    let url = null
    if (this._isAbsoluteURL(route)) {
      url = new URL(route)
    } else {
      url = new URL(this._requestOptions.baseApiURL)
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

  _isAbsoluteURL(url) {
    const http = /^https?:\/\//i
    const https = /^https?:\/\/|^\/\//i
    return http.test(url) || https.test(url)
  }
}

const zlcaClient = new ZlcaClient()
zlcaClient.useAxiosEngine(axiosEngine)
zlcaClient.useInterceptor(interceptor)

export default zlcaClient
