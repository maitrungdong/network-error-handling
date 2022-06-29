type RetrySchema = {
  maxRetries: number
  msBackoff: number
  errorCodes: number[]
}

export default RetrySchema
