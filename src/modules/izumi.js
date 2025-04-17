import { Contract, parseEther, formatEther, solidityPacked } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { izumiABI } from '../abi/izumiABI.js'

export default async function izumi(provider, wallet, contract, channel) {
  const dex = new Contract(contract.router, izumiABI, wallet)
  const { min, max } = config.amount
  const amount = parseEther((Math.random() * (max - min) + min).toFixed(5))
  const amountStr = formatEther(amount)
  const { min: delayMin, max: delayMax } = config.delay
  const wmon = config.tokens.WMON.address
  const symbols = ['USDC', 'USDT', 'WSOL', 'WETH', 'WBTC', 'DAK', 'YAKI', 'COG']
  const deadline = Math.floor(Date.now() / 1000) + 600

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)
    let first = true

    for (const symbol of symbols) {
      const token = config.tokens[symbol]
      if (!token) continue

      if (!first) {
        const wait = config.randomDelay(delayMin, delayMax, `for SWAP MON → ${symbol}`)
        await channel.send(wait.message)
        await wait.promise
      }

      const path = solidityPacked(['address', 'uint24', 'address'], [wmon, 10000, token.address])
      const swapParams = {
        path,
        recipient: wallet.address,
        amount,
        minAcquired: 0,
        deadline
      }

      const swapCall = [
        dex.interface.encodeFunctionData('swapAmount', [swapParams]),
        dex.interface.encodeFunctionData('unwrapWETH9', [0, wallet.address]),
        dex.interface.encodeFunctionData('refundETH')
      ]

      let swapTx
      let swapHash = { value: null }

      for (let retry = 0; retry < config.retry; retry++) {
        const gasLimit = config.gas.swap[retry % config.gas.swap.length]

        if (retry > 0) {
          const wait = config.randomDelay(delayMin, delayMax, `retrying SWAP MON → ${symbol} (${retry})`)
          await channel.send(wait.message)
          await wait.promise
        }

        try {
          swapTx = await dex.multicall(swapCall, {
            value: amount,
            gasLimit,
            maxPriorityFeePerGas: 2e9,
            maxFeePerGas: 102e9
          })

          const receipt = await swapTx.wait()
          if (!receipt || receipt.status !== 1) {
            throw {
              message: 'Transaction nonce too low | Another transaction has higher priority',
              transactionHash: swapTx.hash
            }
          }

          const short = swapTx.hash.slice(0, 7) + '...' + swapTx.hash.slice(-7)
          await channel.send(`SWAP ${amountStr} MON → ${symbol} → TX [${short}](<${config.explorer}${swapTx.hash}>)`)
          if (config.rawInfo) await rawInfo(provider, swapTx.hash, channel)
          break
        } catch (err) {
          const action = await handleError({ err, phase: `SWAP MON → ${symbol}`, gasLimit, hashRef: swapHash, channel })
          if (action === 'fatal') return
          if (action === 'skip') break
          if (action === 'delay') {
            await config.randomDelay(delayMin, delayMax).promise
            continue
          }
          if (action === 'retry') continue
        }
      }

      if (!swapTx) {
        await channel.send(`SWAP MON → ${symbol} failed after (${config.retry}) retries`)
        continue
      }

      const tokenContract = new Contract(token.address, izumiABI, wallet)
      const balance = await tokenContract.balanceOf(wallet.address)
      if (balance === 0n) {
        await channel.send(`Skip reverse SWAP: 0 ${symbol}`)
        first = false
        continue
      }

      const approveTx = await tokenContract.approve(contract.router, balance)
      await approveTx.wait()

      const wait2 = config.randomDelay(delayMin, delayMax, `for reverse SWAP ${symbol} → MON`)
      await channel.send(wait2.message)
      await wait2.promise

      const reversePath = solidityPacked(['address', 'uint24', 'address'], [token.address, 10000, wmon])
      const reverseParams = {
        path: reversePath,
        recipient: wallet.address,
        amount: balance,
        minAcquired: 0,
        deadline
      }

      const reverseCall = [
        dex.interface.encodeFunctionData('swapAmount', [reverseParams]),
        dex.interface.encodeFunctionData('unwrapWETH9', [0, wallet.address]),
        dex.interface.encodeFunctionData('refundETH')
      ]

      let reverseTx
      let reverseHash = { value: null }

      for (let retry = 0; retry < config.retry; retry++) {
        const gasLimit = config.gas.swap[retry % config.gas.swap.length]

        if (retry > 0) {
          const wait = config.randomDelay(delayMin, delayMax, `retrying Reverse SWAP ${symbol} → MON (${retry})`)
          await channel.send(wait.message)
          await wait.promise
        }

        try {
          reverseTx = await dex.multicall(reverseCall, {
            gasLimit,
            maxPriorityFeePerGas: 2e9,
            maxFeePerGas: 102e9
          })

          const receipt = await reverseTx.wait()
          if (!receipt || receipt.status !== 1) {
            throw {
              message: 'Transaction nonce too low | Another transaction has higher priority',
              transactionHash: reverseTx.hash
            }
          }

          const short = reverseTx.hash.slice(0, 7) + '...' + reverseTx.hash.slice(-7)
          await channel.send(`Reverse SWAP ${symbol} → MON → TX [${short}](<${config.explorer}${reverseTx.hash}>)`)
          if (config.rawInfo) await rawInfo(provider, reverseTx.hash, channel)
          break
        } catch (err) {
          const action = await handleError({ err, phase: `Reverse SWAP ${symbol} → MON`, gasLimit, hashRef: reverseHash, channel })
          if (action === 'fatal') return
          if (action === 'skip') break
          if (action === 'delay') {
            await config.randomDelay(delayMin, delayMax).promise
            continue
          }
          if (action === 'retry') continue
        }
      }

      if (!reverseTx) {
        await channel.send(`Reverse SWAP ${symbol} → MON failed after (${config.retry}) retries`)
      }

      first = false
    }
  }

  return `Cycle complete for ${wallet.address}`
}
