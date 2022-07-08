class AbortablePendingRequest {
  private pendingRequest: Promise<any>
  private abortCtrl: AbortController

  constructor(pendingRequest: Promise<any>, abortCtrl: AbortController) {
    this.pendingRequest = pendingRequest
    this.abortCtrl = abortCtrl
  }

  abort(afterMs: number = 0) {
    if (this.abortCtrl) {
      setTimeout(() => this.abortCtrl.abort(), afterMs)
    }
  }

  then(onFulfilled: (response: any) => {}) {
    return this.pendingRequest.then(onFulfilled)
  }

  catch(onRejected: (reason?: any) => {}) {
    return this.pendingRequest.catch(onRejected)
  }
}

export default AbortablePendingRequest
