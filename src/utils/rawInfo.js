import { formatEther } from 'ethers'

export const rawInfo = async (provider, txHash, channel, iface = null) => {
  const tx = await provider.getTransaction(txHash)
  const receipt = await provider.getTransactionReceipt(txHash)

  const fee = receipt.gasUsed * tx.gasPrice
  const methodSig = tx.data.slice(0, 10)
  let methodInfo = methodSig

  if (iface) {
    try {
      const name = iface.parseTransaction({ data: tx.data })?.name
      if (name) methodInfo = `${methodSig} (${name})`
    } catch {
      methodInfo = methodSig
    }
  }

  const statusText = receipt.status === 1 ? 'Success' : 'Fail'

  const lines = [
    '```',
    `Transaction Hash  : ${tx.hash}`,
    `Block             : #${tx.blockNumber}`,
    `Status and Method : ${statusText} - ${methodInfo}`,
    `From              : ${tx.from}`,
    `To (Contract)     : ${tx.to}`,
    `Input Data        : ${tx.data}`,
    `Value             : ${formatEther(tx.value)} MON`,
    `Transaction Fee   : ${formatEther(fee)} MON`,
    `Gas Limit         : ${tx.gasLimit}`,
    '```'
  ]

  await channel.send(lines.join('\n'))
}
