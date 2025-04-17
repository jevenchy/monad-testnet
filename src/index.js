import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js'
import readyEvent from './events/ready.js'
import { logError } from './utils/info.js'
import { config } from '../config/config.js'
import { globalError } from './utils/globalError.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

globalError()

const start = async () => {
  try {
    if (!config.token) throw new Error()
    await client.login(config.token)
    await readyEvent(client)
  } catch {
    logError(new Error('Discord token is invalid or missing.'))
    process.exit(1)
  }
}

start()
