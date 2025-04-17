export const randomDelay = (min, max, label = '') => {
  const wait = Math.floor(Math.random() * (max - min + 1)) + min
  const message = label ? `Waiting ${wait}s ${label}` : `Waiting ${wait}s`
  return { wait, promise: new Promise(r => setTimeout(r, wait * 1000)), message }
}
