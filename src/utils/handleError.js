export async function handleError({ err, phase, gasLimit, hashRef, channel }) {
  let raw = ''
  let message = ''

  try {
    message =
      (err?.error?.message ||
        err?.error?.data?.message ||
        err?.error?.data?.originalError?.message ||
        err?.message ||
        err?.reason ||
        err?.stack ||
        err?.shortMessage ||
        '')?.toString()

    raw = message.toLowerCase()

    if (!raw || raw.trim() === '') {
      raw = JSON.stringify(err).toLowerCase()
    }
  } catch {
    raw = JSON.stringify(err || {}).toLowerCase()
    message = 'unknown'
  }

  const txHash = err?.transactionHash || err?.hash
  if (txHash) {
    hashRef.value = txHash
  }

  if (raw.includes('insufficient balance')) {
    await channel.send(`Signer had insufficient balance — stop this cycle`)
    return 'fatal'
  }

  if (raw.includes('25/second request limit reached')) {
    await channel.send(`RPC rate limit hit — stop this cycle`)
    return 'fatal'
  }

  if (raw.includes('gas limit too low')) {
    await channel.send(`Retry ${phase} with higher gasLimit: ${gasLimit}`)
    return 'retry'
  }

  if (raw.includes('transaction execution reverted')) {
    await channel.send(`Transaction execution reverted — retrying after delay`)
    return 'delay'
  }

  if (raw.includes('missing revert data')) {
    await channel.send(`Missing revert data — retrying after delay`)
    return 'delay'
  }

  if (
    raw.includes('could not coalesce error') ||
    raw.includes('another transaction has higher priority') ||
    raw.includes('higher priority')
  ) {
    await channel.send(`Another transaction has higher priority — retrying after delay`)
    return 'delay'
  }

  if (
    raw.includes('nonce has already been used') ||
    raw.includes('transaction nonce too low') ||
    raw.includes('nonce too low')
  ) {
    await channel.send(`Transaction nonce too low during ${phase} — retrying after delay`)
    return 'delay'
  }

  if (raw.includes('transaction was replaced')) {
    await channel.send(`Transaction was replaced during ${phase} — retrying after delay`)
    return 'delay'
  }

  await channel.send(`Unhandled error during ${phase}: ${message}`)
  return 'skip' 
}
