class BaseError extends Error {
  constructor(
    public name: string,
    public message: string,
    public statusCode: number,
    public data: any
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export default BaseError
