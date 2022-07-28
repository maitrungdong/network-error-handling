class Deferer {
  private timeoutId: any
  private promiseResolve?: (value?: unknown) => void

  constructor() {
    console.log('Cancel delaying in 5s...')
    setTimeout(() => {
      this.cancelDelay()
      console.log('Canceled delaying.')
    }, 5000)
  }

  cancelDelay() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      if (typeof this.promiseResolve === 'function') {
        this.promiseResolve()
      }
    }
  }

  delay(ms: number) {
    return new Promise((resolve) => {
      this.promiseResolve = resolve
      this.timeoutId = setTimeout(resolve, ms)
    })
  }
}

export default Deferer
