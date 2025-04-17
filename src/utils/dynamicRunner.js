import { contracts } from '../../config/contracts.js'
import { initWallet } from './wallet.js'
import { logError } from './info.js'

const modules = {
  apriori: () => import('../modules/apriori.js'),
  bean: () => import('../modules/bean.js'),
  bebop: () => import('../modules/bebop.js'),
  izumi: () => import('../modules/izumi.js'),
  kintsu: () => import('../modules/kintsu.js'),
  kuru: () => import('../modules/kuru.js'),
  lilchogstars: () => import('../modules/lilchogstars.js'),
  madness: () => import('../modules/madness.js'),
  magma: () => import('../modules/magma.js'),
  memebridge: () => import('../modules/memebridge.js'),
  moncock: () => import('../modules/moncock.js'),
  octo: () => import('../modules/octo.js'),
  rubic: () => import('../modules/rubic.js'),
  shmonad: () => import('../modules/shmonad.js'),
  uniswap: () => import('../modules/uniswap.js')
}

export const runProject = async (projectKey, pk, channel, username) => {
  try {
    const contract = contracts[projectKey]
    const runnerModule = await modules[projectKey]?.()
    if (!runnerModule) throw new Error(`Runner not found for ${projectKey}`)

    const runner = runnerModule.default
    const { wallet, provider, embed, stop } = await initWallet(pk, projectKey, username)

    if (!wallet) {
      if (channel?.send) await channel.send('Invalid private key format.')
      return
    }

    if (embed && channel?.send) await channel.send({ content: embed })
    if (stop) return

    const result = await runner(provider, wallet, contract, channel, username)

    if (result?.embed && channel?.send) {
      await channel.send({ content: result.embed })
    } else if (typeof result === 'string' && channel?.send) {
      await channel.send(result)
    }
  } catch (err) {
    logError(err)
    if (channel?.send) await channel.send(err.message)
  }
}
