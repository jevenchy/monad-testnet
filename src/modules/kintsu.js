import { Contract, Interface, parseEther, formatEther, ZeroAddress, AbiCoder } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { kintsuABI } from '../abi/kintsuABI.js'

export default async function kintsu(provider, wallet, contract, channel) {
  const iface = new Interface(kintsuABI)
  const { min, max } = config.amount
  let randomAmount = (Math.random() * (max - min) + min)
  const baseAmount = randomAmount < 0.01 ? 0.01 : randomAmount
  const amount = parseEther(baseAmount.toFixed(5))
  const amountStr = formatEther(amount)
  const { min: delayMin, max: delayMax } = config.delay

  const router = new Contract(contract.router, kintsuABI, wallet)
  const token = new Contract(config.tokens.sMON.address, kintsuABI, wallet)

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
        const selector = '0x1c3477dd'
        const encoded = AbiCoder.defaultAbiCoder().encode(['address', 'address'], [ZeroAddress, wallet.address])
        const tx = await wallet.sendTransaction({
          to: contract.contract,
          data: selector + encoded.replace(/^0x/, ''),
          value: amount,
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
        await channel.send(`STAKE ${amountStr} MON → sMON → TX [${short}](<${config.explorer}${tx.hash}>)`)
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
      continue
    }

    const wait = config.randomDelay(delayMin, delayMax, 'for UNSTAKE')
    await channel.send(wait.message)
    await wait.promise

    let unstakeTx
    let unstakeHash = { value: null }

    const balance = await token.balanceOf(wallet.address)
    if (balance === 0n) {
      await channel.send(`No sMON balance to unstake`)
      continue
    }

    const approveTx = await token.approve(contract.router, balance)
    await approveTx.wait()

    for (let retry = 0; retry < config.retry; retry++) {
      const gasLimit = config.gas.unstake[retry % config.gas.unstake.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying UNSTAKE (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const deadline = Math.floor(Date.now() / 1000) + 600
        const tx = await router.swapExactTokensForETH(
          balance,
          0,
          [config.tokens.sMON.address, config.tokens.WMON.address],
          wallet.address,
          deadline,
          { gasLimit }
        )

        const receipt = await tx.wait()
        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`UNSTAKE ${amountStr} sMON → MON → TX [${short}](<${config.explorer}${tx.hash}>)`)
        unstakeTx = tx
        if (config.rawInfo) await rawInfo(provider, tx.hash, channel)
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
