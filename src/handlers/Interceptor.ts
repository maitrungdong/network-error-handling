import BlockedUrlError from '../classes/errors/BlockedUrlError'
import { IInterceptor } from '../declares/interfaces'
import { BlockedURL } from '../declares/types'

const CLEAR_BLOCKED_URLS_TIME = 60 * 60 * 1000 // an hour

class Interceptor implements IInterceptor {
  private blackList: BlockedURL[] = []

  constructor() {
    //TODO: set interval to clear blockedUrl if it expires each one hour.
    setInterval(this.clearExpiredBlockedUrls, CLEAR_BLOCKED_URLS_TIME)
  }

  public interceptReq(request) {
    const { url } = request

    const isBlocked = this.isBlocked(url)
    if (isBlocked) {
      const blockedUrlItem = this.getBlockedURL(url)!
      throw new BlockedUrlError(
        `This url: ${blockedUrlItem.url} is blocked to ${blockedUrlItem.expiredAt}! Please try it later.`,
        null
      )
    }

    return request
  }

  public async interceptRes(response) {
    try {
      return await response
    } catch (err) {
      if (err instanceof BlockedUrlError) {
        this.addBlockedURL({
          url: err.data.url,
          blockTime: err.data.blockTime,
        })
      }
      throw err
    }
  }

  public addBlockedURL(item: { url: string; blockTime: number | 'infinite' }) {
    if (item.blockTime === 'infinite') {
      this.blackList.push({
        url: item.url,
        expiredAt: 'infinite',
      })
    } else {
      this.blackList.push({
        url: item.url,
        expiredAt: new Date(Date.now() + item.blockTime),
      })
    }
  }

  public getBlockedURL(url: string): BlockedURL | undefined {
    return this.blackList.find((item) => item.url === url)
  }

  public removeBlockedURL(url: string) {
    this.blackList = this.blackList.filter((item) => item.url !== url)
  }

  public isBlocked(url: string): boolean {
    const item = this.blackList.find((item) => item.url === url)

    if (!item) return true
    if (item.expiredAt === 'infinite') return false

    const remain = item.expiredAt.getTime() - Date.now()
    return remain > 0
  }

  /**
   * Event listener is to listen unblock event from server.
   * @param {object} event an event returned from server to unblock an url
   */
  public unBlockUrlListener(event) {
    const { unBlockUrl } = event
    this.removeBlockedURL(unBlockUrl)
  }

  private clearExpiredBlockedUrls() {
    this.blackList = this.blackList.reduce(
      (currBlockedUrls: BlockedURL[], bu: BlockedURL) => {
        const { expiredAt } = bu
        if (expiredAt === 'infinite') {
          currBlockedUrls.push(bu)
        } else if (expiredAt.getTime() > Date.now()) {
          currBlockedUrls.push(bu)
        }

        return currBlockedUrls
      },
      []
    )
  }
}

const interceptor = new Interceptor()
export default interceptor
