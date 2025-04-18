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
    const key = type.toUpperCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(name)
    return acc
  }, {})

  const embed = new EmbedBuilder()
    .setTitle("Monad Testnet")
    .setDescription("Select a strategy to simulate DeFi behaviors on the Monad testnet.")
    .addFields(
      {
        name: 'DEX',
        value: grouped.DEX?.sort().map(n => `- ${n}`).join('\n') || '-',
        inline: true
      },
      {
        name: 'STAKE',
        value: grouped.STAKE?.sort().map(n => `- ${n}`).join('\n') || '-',
        inline: true
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true
      },
      {
        name: 'NFT',
        value: grouped.NFT?.sort().map(n => `- ${n}`).join('\n') || '-',
        inline: true
      },
      {
        name: 'WRAP',
        value: grouped.WRAP?.sort().map(n => `- ${n}`).join('\n') || '-',
        inline: true
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true
      }
    )
    .setColor(config.color)
    .setThumbnail("https://raw.githubusercontent.com/jevenchy/monad-testnet/main/img/bot_avatar.png")
    .setFooter({
      text: "Each task runs in a private thread.",
    })

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
