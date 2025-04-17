import { JsonRpcProvider } from 'ethers'
import { config } from '../../config/config.js'

export const getProvider = () => {
  const provider = new JsonRpcProvider(config.rpc)

  const originalSend = provider.send.bind(provider)
  provider.send = async (method, params) => {
    await new Promise(res => setTimeout(res, 100))
    return originalSend(method, params)
  }

  return provider
}
