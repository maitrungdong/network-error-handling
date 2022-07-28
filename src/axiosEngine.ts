import { delay } from './utils/helpers'
import { errorCodes } from './utils/constants'
import { RetrySchema, WaitNetworkConfig } from './declares/types'

import waitRequestsManager from './handlers/waitRequestsManager'
import { WaitRequestsManager } from './handlers/waitRequestsManager'

import BadRequestError from './classes/errors/BadRequestError'
import BlockedUrlError from './classes/errors/BlockedUrlError'
import Api404Error from './classes/errors/Api404Error'
import DisconnectNetworkError from './classes/errors/DisconnectNetworkError'
import BaseError from './classes/errors/BaseError'

import {
  IAxiosEngine,
  IStandardResponse,
  IWaitRequestsManager,
} from './declares/interfaces'

import { AxiosRequestConfig, AxiosResponse } from 'axios'

import StdSuccessResponse from './classes/StdSuccessResponse'

import axiosCore from './axiosCore'

class AxiosEngine implements IAxiosEngine {
  private NETWORK_ERROR_RESPONSE: AxiosResponse = {
    status: errorCodes.DISNETWORK_ERROR,
    statusText: 'FAILED',
    data: {
      success: false,
      data: null,
      message: 'Disconnect network! Please, try again later.',
    },
    headers: { 'Content-Type': 'application/json' },
    config: null!,
    request: null,
  }

  private waitRequestsManager!: IWaitRequestsManager

  public useWaitRequestsManager(waitRequestsManager: IWaitRequestsManager) {
    this.waitRequestsManager = waitRequestsManager
  }

  public request = async (
    request: AxiosRequestConfig,
    retrySchemas: RetrySchema[],
    waitNetworkConfig: WaitNetworkConfig
  ) => {
    debugger
    console.log(
      '>>>Perform request: ',
      request,
      retrySchemas,
      waitNetworkConfig
    )
    //STEP01: thực hiện request đầu tiên để kiểm tra xem mình
    //cần dùng retrySchema nào (dựa trên mã lỗi).
    let response: IStandardResponse = this.standardResponse(
      await this.tryRequest(request)
    )
    if (response.success) return response

    //[ISSUE]: Mình có nên hold request luôn nếu như đó là mã lỗi network??
    //STEP02: nếu không thành công thì sẽ đi tìm một retrySchema phù hợp để retry.
    //Nếu không có thì throw response.
    const retrySchema = retrySchemas.find((rtSchm) =>
      rtSchm.errorCodes.includes(response.status)
    )
    if (!retrySchema) throw response

    response = await this.requestWithRetries(request, retrySchema!)
    if (response.success) return response

    //STEP03: nếu response không thành công, kiểm tra nếu không thành công là do network.
    //Thì ta sẽ xem có cần hold lại để đợi network xong rồi thực hiện lại một lần nữa hay không.
    //(Thực hiện với retrySchema như ban đầu luôn!)
    if (
      response.status === this.NETWORK_ERROR_RESPONSE.status &&
      waitNetworkConfig.shouldHold
    ) {
      const waitRequest = this.waitRequestsManager.createWaitRequest(
        request,
        retrySchemas,
        waitNetworkConfig.waitNetworkTime
      )
      debugger
      console.log(
        'Wait internet connection in ' +
          WaitRequestsManager.getTimeToDelay(waitRequest)
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
      debugger

      return await this.request(request, retrySchemas, {
        waitNetworkTime: remainTime,
        shouldHold: remainTime === 'infinite' || remainTime > 0,
      })
    } else {
      throw response
    }
  }

  private tryRequest = async (request: AxiosRequestConfig) => {
    try {
      return await axiosCore.request(request)
    } catch (err) {
      console.log({ err })
      const networkErrorRes: AxiosResponse = {
        ...this.NETWORK_ERROR_RESPONSE,
        config: request,
      }
      return networkErrorRes
    }
  }

  private requestWithRetries = async (
    request: AxiosRequestConfig,
    retrySchema: RetrySchema
  ) => {
    const stack: RetrySchema[] = []
    stack.push({ ...retrySchema })

    let response!: IStandardResponse
    while (stack.length > 0) {
      const rtShm = stack.pop()
      console.log('Request with retries: ', rtShm?.maxRetries)
      if (!rtShm) break
      if (rtShm.maxRetries <= 0) break

      response = this.standardResponse(await this.tryRequest(request))
      if (
        !response.success &&
        !request.signal!.aborted &&
        rtShm.errorCodes.includes(response.status)
      ) {
        await delay(rtShm.msBackoff)

        stack.push({
          ...rtShm,
          maxRetries: --rtShm.maxRetries,
          msBackoff: 2 * rtShm.msBackoff,
        })
      } else {
        break
      }
    }

    return response
  }

  private standardResponse = (response: AxiosResponse): IStandardResponse => {
    console.log('>>>Standard response: ', response)
    if (response.status < 200 || response.status >= 300) {
      return this.createErrorRes(response)
    }
    return this.createSuccessRes(response)
  }

  private createSuccessRes(response: AxiosResponse): IStandardResponse {
    const { status, data } = response
    const successRes = new StdSuccessResponse(
      data.success,
      status,
      data.data,
      data.message
    )

    return successRes
  }

  private createErrorRes(response: AxiosResponse): IStandardResponse {
    const { status, data } = response

    let error: BaseError
    const errMsg = data.success === false ? data.message : JSON.stringify(data)

    switch (status) {
      case errorCodes.BAD_REQUEST: {
        error = new BadRequestError(errMsg, data)
        break
      }
      case errorCodes.BLOCKED_URL: {
        error = new BlockedUrlError(errMsg, data)
        break
      }
      case errorCodes.NOT_FOUND: {
        error = new Api404Error(errMsg, data)
        break
      }
      case errorCodes.DISNETWORK_ERROR: {
        error = new DisconnectNetworkError(errMsg, data)
        break
      }
      default: {
        error = new BaseError(
          'BaseError',
          'Error happened! Please, try it later.',
          status,
          data
        )
        break
      }
    }

    return error
  }
}

const axiosEngine = new AxiosEngine()
axiosEngine.useWaitRequestsManager(waitRequestsManager)

export default axiosEngine
