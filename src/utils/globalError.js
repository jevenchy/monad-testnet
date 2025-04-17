import { logError } from './info.js'
import { WebhookClient } from 'discord.js'
import { config } from '../../config/config.js'

const webhook = config.webhookUrl
  ? new WebhookClient({ url: config.webhookUrl })
  : null

export function globalError() {
  process.on('uncaughtException', (err) => {
    const message =
      err?.error?.message ||
      err?.message ||
      (typeof err === 'string' ? err : 'unknown')

    const output = `UNCAUGHT EXCEPTION → ${message}`
    logError(output)
    if (webhook) webhook.send({ content: output.slice(0, 2000) }).catch(() => {})
  })

  process.on('unhandledRejection', (reason) => {
    const message =
      reason?.error?.message ||
      reason?.message ||
      (typeof reason === 'string' ? reason : 'unknown')

    const output = `UNHANDLED REJECTION → ${message}`
    logError(output)
    if (webhook) webhook.send({ content: output.slice(0, 2000) }).catch(() => {})
  })
}
