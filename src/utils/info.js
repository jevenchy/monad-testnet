import { config } from '../../config/config.js'

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const label = config.label

export const log = (type, data) => {
  switch (type) {
    case 'info':
      console.log(`${now()} INFO     ${label} - ${data}`)
      break
    case 'error':
      console.log(`${now()} ERROR    ${label} - ${data.message || data}`)
      if (data.details) {
        console.log(`${now()} ERROR    ${label} - Details: ${data.details}`)
      }
      break
    case 'debug':
      console.log(`${now()} DEBUG    ${label} - ${data.message || data}`)
      break
    default:
      throw new Error(`Unknown log type: ${type}`)
  }
}

export const logInfo = (msg) => log('info', msg)
export const logError = (err) => log('error', err)
export const logDebug = (msg) => log('debug', { message: msg })
