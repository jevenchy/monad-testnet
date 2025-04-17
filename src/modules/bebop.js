import { Contract, parseEther, formatEther } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { bebopABI } from '../abi/bebopABI.js'

export default async function bebop(provider, wallet, _, channel) {
  const token = new Contract(config.tokens.WMON.address, bebopABI, wallet)
  const { min, max } = config.amount
  const { min: delayMin, max: delayMax } = config.delay

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)

    const amount = parseEther((Math.random() * (max - min) + min).toFixed(5))
    const amountStr = formatEther(amount)

    let wrapTx
    let wrapHash = { value: null }

    for (let retry = 0; retry < config.retry; retry++) {
      const gasLimit = config.gas.wrap[retry % config.gas.wrap.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying WRAP (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const tx = await token.deposit({ value: amount, gasLimit })
        const receipt = await tx.wait()

        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`WRAP ${amountStr} MON → WMON → TX [${short}](<${config.explorer}${tx.hash}>)`)
        wrapTx = tx

        if (config.rawInfo) await rawInfo(provider, tx.hash, channel, token.interface)
        break
      } catch (err) {
        const action = await handleError({ err, phase: 'WRAP', gasLimit, hashRef: wrapHash, channel })
        if (action === 'fatal') return
        if (action === 'skip') break
        if (action === 'delay') {
          await config.randomDelay(delayMin, delayMax).promise
          continue
        }
        if (action === 'retry') continue
      }
    }

    if (!wrapTx) {
      await channel.send(`WRAP failed after (${config.retry}) retries`)
      continue
    }

    const wait = config.randomDelay(delayMin, delayMax, 'for UNWRAP')
    await channel.send(wait.message)
    await wait.promise

    let unwrapTx
    let unwrapHash = { value: null }

    for (let retry = 0; retry < config.retry; retry++) {
      const gasLimit = config.gas.unwrap[retry % config.gas.unwrap.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying UNWRAP (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const tx = await token.withdraw(amount, { gasLimit })
        const receipt = await tx.wait()

        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`UNWRAP ${amountStr} WMON → MON → TX [${short}](<${config.explorer}${tx.hash}>)`)
        unwrapTx = tx

        if (config.rawInfo) await rawInfo(provider, tx.hash, channel, token.interface)
        break
      } catch (err) {
        const action = await handleError({ err, phase: 'UNWRAP', gasLimit, hashRef: unwrapHash, channel })
        if (action === 'fatal') return
        if (action === 'skip') break
        if (action === 'delay') {
          await config.randomDelay(delayMin, delayMax).promise
          continue
        }
        if (action === 'retry') continue
      }
    }

    if (!unwrapTx) {
      await channel.send(`UNWRAP failed after (${config.retry}) retries`)
    }
  }

  return `Cycle complete for ${wallet.address}`
}
