import { Wallet, formatEther } from 'ethers'
import { getProvider } from './provider.js'
import { logDebug, logError } from './info.js'
import { config } from '../../config/config.js'

export const initWallet = async (pk, projectKey, username) => {
  const provider = getProvider()
  let wallet

  try {
    wallet = new Wallet(pk, provider)
  } catch {
    logError(new Error(`${username} started ${projectKey} → Invalid private key.`))
    return { wallet: null, stop: true }
  }

  let mon = '0.000000'
  try {
    mon = await provider.getBalance(wallet.address).then(formatEther)
  } catch (err) {
    logError(`${username} started ${projectKey} → Failed to fetch balance (RPC limit?)`)
    return {
      wallet,
      provider,
      embed: [
        '```',
        `Wallet Info — ${projectKey}`,
        `Address           : ${wallet.address}`,
        'MON               : unknown',
        'Status            : Failed to fetch balance — skip cycle',
        '```',        
      ].join('\n'),
      stop: true
    }
  }

  logDebug(`${username} started ${projectKey} → ${wallet.address} MON: ${mon}`)

  if (mon === '0.000000') {
    return {
      wallet,
      provider,
      embed: [
        '```',        
        `Wallet Info — ${projectKey}`,
        `Address           : ${wallet.address}`,
        'MON               : 0.000000',
        'Status            : No balance — stop cycle',
        '```',        
      ].join('\n'),
      stop: true
    }
  }

  return {
    wallet,
    provider,
    embed: [
      '```',      
      `Wallet Info — ${projectKey}`,
      `Address           : ${wallet.address}`,
      `MON               : ${mon}`,
      `Status            : Starting ${config.cycle} cycle(s)`,
      '```',      
    ].join('\n')
  }
}
