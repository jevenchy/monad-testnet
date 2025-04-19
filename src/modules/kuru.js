import { Contract, ethers, parseEther, formatEther } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { kuruABI } from '../abi/kuruABI.js'

export default async function kuru(provider, wallet, contract, channel) {
  const dex = new Contract(contract.router, kuruABI.filter(f => f.name === 'anyToAnySwap'), wallet)
  const utils = new Contract(contract.utils, kuruABI.filter(f => f.name === 'calculatePriceOverRoute'), provider)
  const { min, max } = config.amount
  const amount = parseEther((Math.random() * (max - min) + min).toFixed(5))
  const amountStr = formatEther(amount)
  const { min: delayMin, max: delayMax } = config.delay
  const mon = ethers.ZeroAddress
  const symbols = ['BEAN', 'CHOG', 'DAK', 'YAKI']
  const tokens = symbols.map(symbol => ({ symbol, ...config.tokens[symbol] }))

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)
    for (const token of tokens) {
      const to = token.address

      let pool
      try {
        pool = await getPool(mon, to, contract.api)
      } catch {
        await channel.send(`No pool MON → ${token.symbol}`)
        continue
      }

      let expectedOut
      try {
        expectedOut = await getExpectedOut(utils, [pool], [false], amount)
      } catch {
        await channel.send(`Route MON → ${token.symbol} fail`)
        continue
      }

      let tx
      let hashRef = { value: null }

      for (let retry = 0; retry < config.retry; retry++) {
        const gasLimit = config.gas.swap[retry % config.gas.swap.length]

        if (retry > 0) {
          const wait = config.randomDelay(delayMin, delayMax, `retrying SWAP MON → ${token.symbol} (${retry})`)
          await channel.send(wait.message)
          await wait.promise
        }

        try {
          tx = await dex.anyToAnySwap(
            [pool],
            [true],
            [true],
            mon,
            to,
            amount,
            expectedOut,
            { value: amount, gasLimit }
          )

          const receipt = await tx.wait()
          if (!receipt || receipt.status !== 1) {
            throw {
              message: 'Transaction nonce too low | Another transaction has higher priority',
              transactionHash: tx.hash
            }
          }

          const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
          await channel.send(`SWAP ${amountStr} MON → ${token.symbol} → TX [${short}](<${config.explorer}${tx.hash}>)`)
          if (config.rawInfo) await rawInfo(provider, tx.hash, channel)
          break
        } catch (err) {
          const action = await handleError({ err, phase: `SWAP MON → ${token.symbol}`, gasLimit, hashRef, channel })
          if (action === 'fatal') return
          if (action === 'skip') break
          if (action === 'delay') {
            await config.randomDelay(delayMin, delayMax).promise
            continue
          }
          if (action === 'retry') continue
        }
      }

      if (!tx) {
        await channel.send(`SWAP MON → ${token.symbol} failed after (${config.retry}) retries`)
        continue
      }

      const wait = config.randomDelay(delayMin, delayMax, `for reverse SWAP ${token.symbol} → MON`)
      await channel.send(wait.message)
      await wait.promise

      let revPool
      try {
        revPool = await getPool(to, mon, contract.api)
      } catch {
        await channel.send(`No pool ${token.symbol} → MON`)
        continue
      }

      await approveIfNeeded(wallet, to, amount, contract.router)
 
      let reverseTx
      let reverseHash = { value: null }

      for (let retry = 0; retry < config.retry; retry++) {
        const gasLimit = config.gas.swap[retry % config.gas.swap.length]

        if (retry > 0) {
          const wait = config.randomDelay(delayMin, delayMax, `retrying Reverse SWAP ${token.symbol} → MON (${retry})`)
          await channel.send(wait.message)
          await wait.promise
        }

        try {
          const expected = await getExpectedOut(utils, [revPool], [true], amount)
          reverseTx = await dex.anyToAnySwap(
            [revPool],
            [false],
            [false],
            to,
            mon,
            amount,
            expected,
            { gasLimit }
          )

          const receipt = await reverseTx.wait()
          if (!receipt || receipt.status !== 1) {
            throw {
              message: 'Transaction nonce too low | Another transaction has higher priority',
              transactionHash: reverseTx.hash
            }
          }

          const short = reverseTx.hash.slice(0, 7) + '...' + reverseTx.hash.slice(-7)
          await channel.send(`Reverse SWAP ${amountStr} ${token.symbol} → MON → TX [${short}](<${config.explorer}${reverseTx.hash}>)`)
          if (config.rawInfo) await rawInfo(provider, reverseTx.hash, channel)
          break
        } catch (err) {
          const action = await handleError({ err, phase: `Reverse SWAP ${token.symbol} → MON`, gasLimit, hashRef: reverseHash, channel })
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
        await channel.send(`Reverse SWAP ${token.symbol} → MON failed after (${config.retry}) retries`)
      }

      await config.randomDelay(delayMin, delayMax).promise
    }
  }

  return `Cycle complete for ${wallet.address}`
}

const getPool = async (source, target, api) => {
  const url = `${api.base}${api.endpoints.markets.path}`
  const headers = { 'Content-Type': 'application/json' }

  const post = async (a, b) => {
    const body = JSON.stringify({ pairs: [{ baseToken: a, quoteToken: b }] })
    const res = await fetch(url, { method: api.endpoints.markets.method, headers, body })
    const json = await res.json()
    return json?.data?.[0]?.market
  }

  return (await post(source, target)) || (await post(target, source))
}

const getExpectedOut = async (utils, route, isBuy, amountIn) => {
  const price = await utils.calculatePriceOverRoute(route, isBuy)
  const rawOut = (amountIn * BigInt(price)) / ethers.WeiPerEther
  return (rawOut * 85n) / 100n
}

const approveIfNeeded = async (wallet, tokenAddress, amount, routerAddress) => {
  const token = new Contract(tokenAddress, kuruABI.filter(f => f.name === 'approve' || f.name === 'allowance'), wallet)
  const allowance = await token.allowance(wallet.address, routerAddress)
  if (BigInt(allowance) >= BigInt(amount)) return
  const tx = await token.approve(routerAddress, ethers.MaxUint256)
  await tx.wait()
}
