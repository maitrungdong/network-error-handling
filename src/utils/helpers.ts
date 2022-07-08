export const isEmptyObj = (obj) => {
  return (
    obj &&
    Object.keys(obj).length === 0 &&
    Object.getPrototypeOf(obj) === Object.prototype
  )
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
