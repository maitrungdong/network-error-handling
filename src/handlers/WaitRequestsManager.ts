import { AxiosRequestConfig } from 'axios'
import Deferer from '../classes/Deferer'

import { RetrySchema, WaitRequest } from '../declares/types'
import { IWaitRequestsManager } from '../declares/interfaces'

import detectNetwork from '../detectNetwork'

const CLEAR_WAIT_REQUESTS_TIME = 60 * 60 * 1000 // an hour
const INFINITE_TIME = 365 * 24 * 60 * 60 * 1000 // a year

export class WaitRequestsManager implements IWaitRequestsManager {
  private waitRequests: WaitRequest[] = []
  private isOnline: boolean = true

  constructor() {
    //TODO: set interval to clear waitRequest if it expires each one hour.
    setInterval(this.clearExpiredWaitRequests, CLEAR_WAIT_REQUESTS_TIME)
  }

  //Helper
  static getRemainTime(waitRequest: WaitRequest): number | 'infinite' {
    let remainTime: number | 'infinite'
    if (waitRequest.isInfinite) {
      remainTime = 'infinite'
    } else {
      remainTime = waitRequest.expiredAt.getTime() - Date.now()
      remainTime = remainTime < 0 ? 0 : remainTime
    }
    return remainTime
  }

  //Helper
  static getTimeToDelay(waitRequest: WaitRequest): number {
    const timeToDelay = waitRequest.expiredAt.getTime() - Date.now()
    return timeToDelay < 0 ? 0 : timeToDelay
  }

  public removeWaitRequestById(waitReqId: string) {
    this.waitRequests = this.waitRequests.filter((wr) => wr.id !== waitReqId)
  }

  public createWaitRequest(
    request: AxiosRequestConfig,
    retrySchemas: RetrySchema[],
    waitNetworkTime: number | 'infinite'
  ) {
    const waitRequest: WaitRequest = {
      id: Date.now().toString(),
      requestConfig: {
        request: { ...request },
        retrySchemas: { ...retrySchemas },
      },
      expiredAt:
        waitNetworkTime === 'infinite'
          ? new Date(Date.now() + INFINITE_TIME)
          : new Date(Date.now() + waitNetworkTime),
      isInfinite: waitNetworkTime === 'infinite',
      deferer: new Deferer(),
    }

    this.waitRequests.push(waitRequest)
    return waitRequest
  }

  public networkStatusListener(status?: string): void {
    if (!this.isOnline && status === 'online') {
      this.waitRequests.forEach((wr) => wr.deferer.cancelDelay())
      this.isOnline = true
    } else {
      this.isOnline = false
    }
  }

  private clearExpiredWaitRequests() {
    this.waitRequests = this.waitRequests.reduce(
      (currWaitReqs: WaitRequest[], wr: WaitRequest) => {
        const { expiredAt, isInfinite } = wr
        if (isInfinite) {
          currWaitReqs.push(wr)
        } else if (expiredAt.getTime() > Date.now()) {
          currWaitReqs.push(wr)
        }

        return currWaitReqs
      },
      []
    )
  }
}

const waitRequestsManager = new WaitRequestsManager()
//TODO: add network status listener
detectNetwork.addEventListener(
  'change',
  waitRequestsManager.networkStatusListener
)
export default waitRequestsManager
