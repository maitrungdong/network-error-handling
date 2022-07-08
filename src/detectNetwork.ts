type DetectNetworkOption = {
  urls: string[]
  timeout: number
  intervalTime: number
}

type ListenerFn = (val?: string) => void

class DetectNetwork {
  private isOnline = true
  private options: DetectNetworkOption = {
    urls: ['https://www.google.com', 'https://www.microsoft.com'],
    timeout: 3000,
    intervalTime: 10000,
  }
  private pingId?: number

  private onlineListeners: ListenerFn[] = []
  private offlineListeners: ListenerFn[] = []
  private onChangeListeners: ListenerFn[] = []

  constructor(option?: DetectNetworkOption) {
    if (option?.urls) {
      this.options.urls = option.urls
    }
    if (option?.timeout) {
      this.options.timeout = option.timeout
    }
    if (option?.intervalTime) {
      this.options.intervalTime = option.intervalTime
    }

    //TODO: start ping to servers to check internet.
    this.startPing()
  }

  public addEventListener(event: string, listener: ListenerFn) {
    switch (event) {
      case 'online': {
        this.onlineListeners.push(listener)
        break
      }
      case 'offline': {
        this.offlineListeners.push(listener)
        break
      }
      case 'change': {
        this.onChangeListeners.push(listener)
        break
      }
      default: {
        break
      }
    }
  }

  public removeEventListener(event: string, listener: ListenerFn) {
    switch (event) {
      case 'online': {
        this.onlineListeners = this.onlineListeners.filter(
          (l) => l !== listener
        )
        break
      }
      case 'offline': {
        this.offlineListeners = this.offlineListeners.filter(
          (l) => l !== listener
        )
        break
      }
      case 'change': {
        this.onChangeListeners = this.onChangeListeners.filter(
          (l) => l !== listener
        )
        break
      }
      default: {
        break
      }
    }
  }

  private ping(settings: { urls: string[]; timeout: number }) {
    return new Promise((resolve) => {
      const isOnline = () => resolve(true)
      const isOffline = () => resolve(false)

      const fetchs = settings.urls.map((url) => {
        const timeoutCtrl = new AbortController()
        const timeoutId = setTimeout(
          () => timeoutCtrl.abort(),
          settings.timeout
        )

        const fetcher = fetch(url, {
          mode: 'no-cors',
          signal: timeoutCtrl.signal,
        })
        fetcher
          .catch((_) => {})
          .finally(() => timeoutId && clearTimeout(timeoutId))

        return fetcher
      })

      Promise.any(fetchs).then(isOnline).catch(isOffline)
    })
  }

  private startPing() {
    const { intervalTime } = this.options

    this.pingId = setInterval(() => {
      const { urls, timeout } = this.options
      this.ping({ urls, timeout }).then((online) => {
        if (online) {
          if (!this.isOnline) {
            this.isOnline = true

            //TODO: notify that network status is online
            this.onlineListeners.forEach((listener) => listener())
            this.onChangeListeners.forEach((listener) => listener('online'))

            //TODO: reset ping more slowly.
            this.options.intervalTime = 10000
            this.stopPing()
            this.startPing()
          }
        } else {
          if (this.isOnline) {
            this.isOnline = false

            //TODO: notify that network status is offline
            this.offlineListeners.forEach((listener) => listener())
            this.onChangeListeners.forEach((listener) => listener('offline'))

            //TODO: reset ping more quickly.
            this.options.intervalTime = 3000
            this.stopPing()
            this.startPing()
          }
        }
      })
    }, intervalTime)
  }

  private stopPing() {
    if (this.pingId) {
      clearInterval(this.pingId)
    }
  }
}

const detectNetwork = new DetectNetwork()

export default detectNetwork
