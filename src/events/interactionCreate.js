import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
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

      await interaction.message.edit({ components: [resetRow] })
      return interaction.showModal(modal)
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
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
          await safeReply(interaction, `Failed to create thread`)
          return
        }

        await thread.members.add(interaction.user.id)
        await safeReply(interaction, `Thread created for ${project} → <#${thread.id}>`)
        await runProject(project, pk, thread, username)
      } catch (err) {
        logError(err)
        await safeReply(interaction, `Failed to initialize thread`)
      }
    }
  }
}
