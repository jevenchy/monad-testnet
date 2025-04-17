import { config } from '../../config/config.js'
import { contracts } from '../../config/contracts.js'
import { sendEmbedDropdown } from '../embed/embed.js'
import interactionHandler from './interactionCreate.js'
import { logInfo } from '../utils/info.js'

export default async function ready(client) {
  client.on('interactionCreate', interaction => interactionHandler.execute(interaction))

  const guild = await client.guilds.fetch(config.guildId).catch(() => null)
  if (!guild) {
    logInfo('Guild not found or bot is not in any server.')
    process.exit(1)
  }

  const tc = await guild.channels.fetch(config.embedChannelId).catch(() => null)
  if (!tc) {
    logInfo(`Failed to find embed/text channel in server: ${guild.name}`)
    process.exit(2)
  }

  await sendEmbedDropdown(client, config.embedChannelId)

  client.modals = new Map(Object.entries(contracts))

  logInfo(`Logged in as ${client.user.tag}`)
  logInfo(`Embed/Text channel: ${tc.name} (${tc.id})`)
  logInfo(`Cycle count: ${config.cycle}`)
  logInfo('Loaded modules:')

  for (const name of client.modals.keys()) {
    logInfo(`${name}`)
  }
}
