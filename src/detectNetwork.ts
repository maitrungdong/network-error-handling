type DNOption = {
  urls: string[]
  timeout: number
  intervalTime: number
}

type Listener = (val?: string) => {}
;(function () {
  class DetectNetwork {
    private isOnline = true
    private options: DNOption = {
      urls: ['https://www.google.com', 'https://www.microsoft.com'],
      timeout: 3000,
      intervalTime: 10000,
    }
    private pingId?: number

    private onlineListeners: Listener[] = []
    private offlineListeners: Listener[] = []
    private onChangeListeners: Listener[] = []

    constructor(options: DNOption) {
      if (Array.isArray(options.urls)) {
        this.options.urls = options.urls
      }
      if (typeof options.timeout === 'number') {
        this.options.timeout = options.timeout
      }
      if (typeof options.intervalTime === 'number') {
        this.options.intervalTime = options.intervalTime
      }

      //TODO: start ping to servers to check internet.
      this.startPing()
    }

    addEventListener(event, listener) {
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

    removeEventListener(event, listener) {
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

    private ping({ urls, timeout }) {
      return new Promise((resolve) => {
        const isOnline = () => resolve(true)
        const isOffline = () => resolve(false)

        const fetchs = urls.map((url) => {
          const timeoutCtrl = new AbortController()
          const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeout)

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

  if (!window.ZlcaDetectNetwork) {
    const detectNetwork = new DetectNetwork()
    window.ZlcaDetectNetwork = detectNetwork
  }
})()
