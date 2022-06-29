import Deferer from '../types/Deferer'
import WaitRequest from '../types/WaitRequest'

const CLEAR_WAIT_REQUESTS_TIME = 60 * 60 * 1000 // an hour
const INFINITE_TIME = 365 * 24 * 60 * 60 * 1000 // a year

class WaitRequestsManager {
  private waitRequests: WaitRequest[] = []
  private isOnline: boolean = true

  constructor() {
    //TODO: add network change listener.
    // window.ZlcaDetectNetwork.addEventListener(
    //   'change',
    //   this.networkStatusListener
    // )

    //TODO: set interval to clear waitRequest if it expires each one hour.
    setInterval(this.clearExpiredWaitRequests, CLEAR_WAIT_REQUESTS_TIME)
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

  public removeWaitRequestById(waitReqId: string) {
    this.waitRequests = this.waitRequests.filter((wr) => wr.id !== waitReqId)
  }

  //Helper
  static getRemainTime(waitRequest: WaitRequest) {
    let remainTime: string | number
    if (waitRequest.isInfinite) {
      remainTime = 'infinite'
    } else {
      remainTime = Date.now() - waitRequest.expiredAt.getTime()
      remainTime = remainTime < 0 ? 0 : remainTime
    }
    return remainTime
  }

  //Helper
  static getTimeToDelay(waitRequest: WaitRequest): number {
    const timeToDelay = Date.now() - waitRequest.expiredAt.getTime()
    return timeToDelay < 0 ? 0 : timeToDelay
  }

  public createWaitRequest(request, retrySchemas, waitNetworkTime) {
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

  private networkStatusListener(status: string) {
    if (!this.isOnline && status === 'online') {
      this.waitRequests.forEach((wr) => wr.deferer.cancelDelay())
      this.isOnline = true
    } else {
      this.isOnline = false
    }
  }
}

export default WaitRequestsManager
