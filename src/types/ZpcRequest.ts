export type ZpcRequestConfig = {
  headers: Headers
  params
  data
  timeout: number
  withCredentials: boolean
  responseType: string
  maxContentLength: number
  maxBodyLength: number
}
