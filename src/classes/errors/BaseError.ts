import { IStandardResponse } from '../../declares/interfaces'

class BaseError extends Error implements IStandardResponse {
  constructor(
    public name: string,
    public message: string,
    public status: number,
    public data: any,
    public success: boolean = false
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export default BaseError
