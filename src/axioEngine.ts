import axiosCore from './axiosCore'
import delay from './utils/delay'

import WaitRequestsManager from './handlers/WaitRequestsManager'

import { isEmptyObj } from './utils/helpers'

import { errorCodes } from './utils/constants'
import BadRequestError from './types/errors/BadRequestError'
import BlockedUrlError from './types/errors/BlockedUrlError'
import Api404Error from './types/errors/Api404Error'
import DisconnectNetworkError from './types/errors/DisconnectNetworkError'
import RetrySchema from './types/RetrySchema'
import BaseError from './types/errors/BaseError'

class AxiosEngine {
  NETWORK_ERROR = {
    statusCode: errorCodes.DISNETWORK_ERROR,
    contentType: 'application/json',
    body: {
      success: false,
      data: null,
      message: 'Disconnect network! Please, try again later.',
    },
  }

  private waitRequestsManager!: WaitRequestsManager

  useWaitRequestsManager(waitRequestsManager: WaitRequestsManager) {
    this.waitRequestsManager = waitRequestsManager
  }

  request = async (request, retrySchemas, waitNetworkConfig) => {
    //STEP01: thực hiện request đầu tiên để kiểm tra xem mình cần dùng retrySchema nào
    //dựa trên mã lỗi.
    let response = this.standardResponse(await this.tryRequest(request))
    if (response.success) return response

    //STEP02: nếu không thành công thì sẽ đi tìm một retrySchema phù hợp để retry.
    //Nếu không có thì throw response
    const retrySchema = Array.isArray(retrySchemas)
      ? {
          ...retrySchemas.find((rtSchm) =>
            rtSchm.errorCodes.includes(response.statusCode)
          ),
        }
      : { ...retrySchemas }
    if (isEmptyObj(retrySchema)) throw response

    response = await this.requestWithRetries(request, retrySchema)
    if (response.success) return response

    //STEP03: nếu response không thành công, kiểm tra nếu không thành công là do network.
    //Thì ta sẽ xem có cần hold lại để đợi network xong rồi thực hiện lại một lần nữa hay không.
    //(Thực hiện với retrySchema như ban đầu luôn!)
    if (
      response.statusCode === this.NETWORK_ERROR.statusCode &&
      waitNetworkConfig.shouldHold
    ) {
      const waitRequest = this.waitRequestsManager.createWaitRequest(
        request,
        retrySchemas,
        waitNetworkConfig.waitNetworkTime
      )

      await waitRequest.deferer.delay(
        WaitRequestsManager.getTimeToDelay(waitRequest)
      )

      //Sau khi đợi xong, hoặc không đợi nữa thì mình sẽ xóa cái waitRequest này bên trong waitRequests.
      this.waitRequestsManager.removeWaitRequestById(waitRequest.id)

      //Thực hiện lần cuối hoặc cái lần có internet (bởi vì mình sẽ xóa cái setTimeout thì nó sẽ nhảy vào đây!)
      //để kiểm tra xem được không?
      /**
       * [ISSUE]: Hơi đệ quy 1 tí, giờ nghĩ cách xóa cái đệ quy đi.
       */
      const remainTime = WaitRequestsManager.getRemainTime(waitRequest)

      return await this.request(request, retrySchemas, {
        waitNetworkTime: remainTime,
        shouldHold: remainTime === 'infinite' || remainTime > 0,
      })
    } else {
      throw response
    }
  }

  private tryRequest = async (request) => {
    try {
      const response = await axiosCore.request(request)

      return {
        statusCode: response.status,
        body: response.data,
      }
    } catch (err) {
      return this.NETWORK_ERROR
    }
  }

  public requestWithRetries = async (request, retrySchema: RetrySchema) => {
    const stack: RetrySchema[] = []
    stack.push(retrySchema)

    while (stack.length > 0) {
      const retrySchema = stack.pop()
      if (!retrySchema) break

      const response = this.standardResponse(await this.tryRequest(request))
      if (
        !response.success &&
        !request.signal.aborted &&
        retrySchema.maxRetries > 0 &&
        retrySchema.errorCodes.includes(response.statusCode)
      ) {
        await delay(retrySchema.msBackoff)

        stack.push({
          ...retrySchema,
          maxRetries: --retrySchema.maxRetries,
          msBackoff: 2 * retrySchema.msBackoff,
        })
      } else {
        return response
      }
    }
  }

  private standardResponse = ({ statusCode, body }) => {
    let error: BaseError | undefined

    if (statusCode < 200 || statusCode >= 300) {
      error = this.createError(statusCode, body)
    }

    if (error) {
      return error
    } else {
      return this.createSuccess(statusCode, body)
    }
  }

  private createSuccess(statusCode, body) {
    return {
      success: body.success,
      statusCode: statusCode,
      data: body.data,
      message: body.message,
    }
  }

  private createError(statusCode: number, body) {
    let error: BaseError
    const errMsg = body?.success !== false ? body.message : JSON.stringify(body)

    switch (statusCode) {
      case errorCodes.BAD_REQUEST: {
        error = new BadRequestError(errMsg, body)
        break
      }
      case errorCodes.BLOCKED_URL: {
        error = new BlockedUrlError(errMsg, body)
        break
      }
      case errorCodes.NOT_FOUND: {
        error = new Api404Error(errMsg, body)
        break
      }
      case errorCodes.DISNETWORK_ERROR: {
        error = new DisconnectNetworkError(errMsg, body)
        break
      }
      default: {
        error = new BaseError(
          'BaseError',
          'Error happened! Please, try it later.',
          statusCode,
          body
        )
        break
      }
    }

    return error
  }
}

const axiosEngine = new AxiosEngine()
axiosEngine.useWaitRequestsManager(new WaitRequestsManager())

export default axiosEngine
