import { Contract, parseEther, formatEther } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { beanABI } from '../abi/beanABI.js'

export default async function bean(provider, wallet, contract, channel) {
  const dex = new Contract(contract.router, beanABI, wallet)
  const { min, max } = config.amount
  const amount = parseEther((Math.random() * (max - min) + min).toFixed(5))
  const amountStr = formatEther(amount)
  const { min: delayMin, max: delayMax } = config.delay
  const wmon = config.tokens.WMON.address
  const excluded = ['YAKI', 'MONDA', 'MOON', 'MUK', 'MAD', 'CHOG']
  const allTokens = Object.entries(config.tokens)
    .filter(([symbol]) => symbol !== 'WMON' && !excluded.includes(symbol))
  const deadline = Math.floor(Date.now() / 1000) + 600

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)
    let first = true

    for (const [symbol, { address }] of allTokens) {
      if (!first) {
        const wait = config.randomDelay(delayMin, delayMax, `for SWAP MON → ${symbol}`)
        await channel.send(wait.message)
        await wait.promise
      }

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
          const tx = await dex.swapExactETHForTokens(0, [wmon, address], wallet.address, deadline, {
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
          await channel.send(`SWAP ${amountStr} MON → ${symbol} → TX [${short}](<${config.explorer}${tx.hash}>)`)
          swapTx = tx
          if (config.rawInfo) await rawInfo(provider, tx.hash, channel)
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

      const token = new Contract(address, beanABI, wallet)
      const tokenBal = await token.balanceOf(wallet.address)
      if (tokenBal === 0n) {
        await channel.send(`Skip reverse SWAP: 0 ${symbol}`)
        first = false
        continue
      }

      const approveTx = await token.approve(contract.router, tokenBal)
      await approveTx.wait()

      const wait2 = config.randomDelay(delayMin, delayMax, `for reverse SWAP ${symbol} → MON`)
      await channel.send(wait2.message)
      await wait2.promise

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
          const tx = await dex.swapExactTokensForETH(tokenBal, 0, [address, wmon], wallet.address, deadline, {
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
          await channel.send(`Reverse SWAP ${amountStr} ${symbol} → MON → TX [${short}](<${config.explorer}${tx.hash}>)`)
          reverseTx = tx
          if (config.rawInfo) await rawInfo(provider, tx.hash, channel)
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
