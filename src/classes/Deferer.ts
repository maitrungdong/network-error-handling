class Deferer {
  private timeoutId?: number
  private promiseResolve?: (value?: unknown) => void

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
