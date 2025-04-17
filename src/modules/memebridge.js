import { Contract, parseEther, formatEther } from 'ethers'
import { config } from '../../config/config.js'
import { rawInfo } from '../utils/rawInfo.js'
import { handleError } from '../utils/handleError.js'
import { memebridgeABI } from '../abi/memebridgeABI.js'

export default async function memebridge(provider, wallet, contract, channel) {
  const mintContract = new Contract(contract.contract, memebridgeABI, wallet)
  const value = parseEther('0.1')
  const amountStr = formatEther(value)
  const { min: delayMin, max: delayMax } = config.delay

  for (let i = 0; i < config.cycle; i++) {
    await channel.send(`Starting cycle ${i + 1}/${config.cycle}`)

    let mintTx
    let mintHash = { value: null }

    for (let retry = 0; retry < config.retry; retry++) {
      const gasList = config.gas.mint
      const gasLimit = gasList[retry % gasList.length]

      if (retry > 0) {
        const wait = config.randomDelay(delayMin, delayMax, `retrying MINT (${retry})`)
        await channel.send(wait.message)
        await wait.promise
      }

      try {
        const tx = await mintContract.publicMint(1, { value, gasLimit })
        const receipt = await tx.wait()

        if (!receipt || receipt.status !== 1) {
          throw {
            message: 'Transaction nonce too low | Another transaction has higher priority',
            transactionHash: tx.hash
          }
        }

        const short = tx.hash.slice(0, 7) + '...' + tx.hash.slice(-7)
        await channel.send(`Minted MemeBridge Access Pass ${amountStr} MON → TX [${short}](<${config.explorer}${tx.hash}>)`)
        mintTx = tx
        if (config.rawInfo) await rawInfo(provider, tx.hash, channel)
        break
      } catch (err) {
        const action = await handleError({ err, phase: 'MINT', gasLimit, hashRef: mintHash, channel })
        if (action === 'fatal') return
        if (action === 'skip') break
        if (action === 'delay') {
          await config.randomDelay(delayMin, delayMax).promise
          continue
        }
        if (action === 'retry') continue
      }
    }

    if (!mintTx) {
      await channel.send(`MINT failed after (${config.retry}) retries`)
    }

    await config.randomDelay(delayMin, delayMax).promise
  }

  return `Mint complete for ${wallet.address}`
}
