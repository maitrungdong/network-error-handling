class BaseError extends Error {
  public success: boolean
  public name: string
  public statusCode: number
  public data: any

  constructor(name: string, message: string, statusCode: number, data: any) {
    super(message)

    Object.setPrototypeOf(this, new.target.prototype)
    this.success = false
    this.name = name
    this.statusCode = statusCode
    this.data = data
  }
}

export default BaseError
