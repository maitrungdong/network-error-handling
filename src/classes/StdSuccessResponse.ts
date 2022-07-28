import { IStandardResponse } from '../declares/interfaces'

class StdSuccessResponse implements IStandardResponse {
  constructor(
    public success: boolean,
    public status: number,
    public data: any,
    public message: string
  ) {}
}

export default StdSuccessResponse
