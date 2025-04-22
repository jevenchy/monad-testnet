import { Interface, Contract, parseEther, formatEther } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { shmonadABI } from '../ABI/shmonadABI.js'

export default async function shmonad(provider, wallet, contract, channel) {
  const iface = new Interface(shmonadABI)
  const { min, max } = config.amount
  const amount = parseEther((Math.random() * (max - min) + min).toFixed(5))
  const amountStr = formatEther(amount)
  const { min: delayMin, max: delayMax } = config.delay

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)

    let stakeTx
    let stakeHash = { value: null }

    for (let retry = 0; retry < config.retry; retry++) {
      const gasLimit = config.gas.stake[retry % config.gas.stake.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying STAKE (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const tx = await wallet.sendTransaction({
          to: contract.contract,
          data: iface.encodeFunctionData('deposit', [amount, wallet.address]),
          gasLimit,
          value: amount
        })

        const receipt = await tx.wait()
        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`STAKE ${amountStr} MON → shMONAD → TX [${short}](<${config.explorer}${tx.hash}>)`)
        stakeTx = tx
        if (config.rawInfo) await rawInfo(provider, tx.hash, channel, iface)
        break
      } catch (err) {
        const action = await handleError({ err, phase: 'STAKE', gasLimit, hashRef: stakeHash, channel })
        if (action === 'fatal') return
        if (action === 'skip') break
        if (action === 'delay') {
          await config.randomDelay(delayMin, delayMax).promise
          continue
        }
        if (action === 'retry') continue
      }
    }

    if (!stakeTx) {
      await channel.send(`STAKE failed after (${config.retry}) retries`)
    }

    const wait = config.randomDelay(delayMin, delayMax, 'for UNSTAKE')
    await channel.send(wait.message)
    await wait.promise

    const shToken = new Contract(contract.contract, shmonadABI, provider)
    const shares = await shToken.balanceOf(wallet.address)

    if (shares === 0n) {
      await channel.send('No shMONAD balance to redeem')
      continue
    }

    let unstakeTx
    let unstakeHash = { value: null }

    for (let retry = 0; retry < config.retry; retry++) {
      const gasLimit = config.gas.unstake[retry % config.gas.unstake.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying UNSTAKE (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const tx = await wallet.sendTransaction({
          to: contract.contract,
          data: iface.encodeFunctionData('redeem', [shares, wallet.address, wallet.address]),
          gasLimit
        })

        const receipt = await tx.wait()
        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`UNSTAKE ${formatEther(shares)} shMONAD → MON → TX [${short}](<${config.explorer}${tx.hash}>)`)
        unstakeTx = tx
        if (config.rawInfo) await rawInfo(provider, tx.hash, channel, iface)
        break
      } catch (err) {
        const action = await handleError({ err, phase: 'UNSTAKE', gasLimit, hashRef: unstakeHash, channel })
        if (action === 'fatal') return
        if (action === 'skip') break
        if (action === 'delay') {
          await config.randomDelay(delayMin, delayMax).promise
          continue
        }
        if (action === 'retry') continue
      }
    }

    if (!unstakeTx) {
      await channel.send(`UNSTAKE failed after (${config.retry}) retries`)
    }
  }

  return `Cycle complete for ${wallet.address}`
}
