import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'
import { config } from '../../config/config.js'
import { contracts } from '../../config/contracts.js'
import { logError } from '../utils/info.js'
import { runProject } from '../utils/dynamicRunner.js'

const safeReply = async (interaction, content) => {
  const payload = { content, flags: MessageFlags.Ephemeral }
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload)
  } else {
    await interaction.reply(payload)
  }
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_project') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_${interaction.values[0]}`)
        .setTitle(`Enter Private Key`)

      const pk = new TextInputBuilder()
        .setCustomId('private_key')
        .setLabel('Private Key')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)

      modal.addComponents(new ActionRowBuilder().addComponents(pk))

      const resetRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_project')
          .setPlaceholder('Select a project')
          .addOptions(
            Object.entries(contracts).map(([key, { name }]) =>
              new StringSelectMenuOptionBuilder().setLabel(name).setValue(key)
            )
          )
      )

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_wallet')
          .setLabel('Create Wallet')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('request_faucet')
          .setLabel('Faucet')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('swap_all_to_mon')
          .setLabel('Swap All to MON')
          .setStyle(ButtonStyle.Secondary)
      )

      await interaction.message.edit({ components: [resetRow, buttonRow] })
      return interaction.showModal(modal)
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_') && interaction.customId !== 'modal_create_wallet' && interaction.customId !== 'modal_request_faucet') {
      const project = interaction.customId.replace('modal_', '')
      const pk = interaction.fields.getTextInputValue('private_key')
      const username = interaction.user.username
      const randomId = Math.random().toString(36).substring(2, 7)
      const threadName = `${username.toLowerCase()}-${project}-${randomId}`

      try {
        const thread = await interaction.channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: 'User initialized project',
          type: ChannelType.PrivateThread
        })

        if (!thread || typeof thread.send !== 'function') {
          await safeReply(interaction, `Failed to create thread.`)
          return
        }

        await thread.members.add(interaction.user.id)
        await safeReply(interaction, `Thread created for ${project} → <#${thread.id}>`)
        await runProject(project, pk, thread, username)
      } catch (err) {
        logError(err)
        await safeReply(interaction, `Failed to initialize project.`)
      }
    }

    if (interaction.isButton() && interaction.customId === 'create_wallet') {
      const modal = new ModalBuilder()
        .setCustomId('modal_create_wallet')
        .setTitle('Generate Wallet')

      const countInput = new TextInputBuilder()
        .setCustomId('wallet_count')
        .setLabel('How many wallets do you want to generate?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 3')
        .setRequired(true)

      modal.addComponents(new ActionRowBuilder().addComponents(countInput))

      return interaction.showModal(modal)
    }

    if (interaction.isButton() && interaction.customId === 'request_faucet') {
      return await safeReply(interaction, 'Faucet is not implemented yet.')
    }

    if (interaction.isButton() && interaction.customId === 'swap_all_to_mon') {
      return await safeReply(interaction, 'Swap All to MON is not implemented yet.')
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_create_wallet') {
      const countRaw = interaction.fields.getTextInputValue('wallet_count')
      const count = parseInt(countRaw)

      if (isNaN(count) || count <= 0 || count > 10) {
        return await safeReply(interaction, 'Please enter a valid number between 1 and 10.')
      }

      const Wallet = (await import('ethers')).Wallet
      const wallets = Array.from({ length: count }, () => Wallet.createRandom())

      const lines = wallets.flatMap((w, i) => [
        `#${i + 1}`,
        `Address           : ${w.address}`,
        `PrivateKey        : ${w.privateKey}`,
        ''
      ])

      await safeReply(interaction, `\`\`\`\n${lines.join('\n')}\`\`\``)
    }
  }
}
