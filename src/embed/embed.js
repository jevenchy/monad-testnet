import {
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} from 'discord.js'
import { config } from '../../config/config.js'
import { contracts } from '../../config/contracts.js'

export const sendEmbedDropdown = async (client, channelId) => {
  const channel = await client.channels.fetch(channelId)
  if (!channel || channel.type !== ChannelType.GuildText) return

  const options = Object.entries(contracts).map(([key, { name }]) =>
    new StringSelectMenuOptionBuilder().setLabel(name).setValue(key)
  )

  const grouped = Object.entries(contracts).reduce((acc, [, { name, type }]) => {
    if (!acc[type]) acc[type] = []
    acc[type].push(name)
    return acc
  }, {})

  const moduleList = Object.entries(grouped)
    .sort()
    .map(([type, names]) =>
      `\n${type.toUpperCase()}\n - ${names.sort().join('\n - ')}`
    )
    .join('\n')

  const embed = new EmbedBuilder()
    .setTitle('Monad Testnet')
    .setDescription(
      [
        'Select a strategy to simulate DeFi behaviors on the Monad testnet.',
        moduleList,
        '\nEach task runs in a private thread and executes autonomously.'
      ].join('\n')
    )
    .setThumbnail('https://github.com/jevenchy/monad-testnet/raw/main/img/bot_avatar.png')
    .setColor(config.color)

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_project')
      .setPlaceholder('Select a project')
      .addOptions(options)
  )

  await channel.send({
    embeds: [embed],
    components: [row]
  })
}
