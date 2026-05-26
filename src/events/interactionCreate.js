/**
 * events/interactionCreate.js
 * Handler slash commands (architecture prête pour extension)
 */

const BlacklistService = require('../services/BlacklistService');
const logger = require('../services/LoggerService');
const { errorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.guild) return;

    // --- Vérification blacklist globale ---
    const isBlocked = await BlacklistService.enforceBlacklist(
      interaction.user.id,
      interaction.guild,
      interaction.member
    );

    if (isBlocked) {
      return interaction.reply({
        embeds: [errorEmbed('Accès refusé', 'Vous êtes blacklisté de ce bot.')],
        ephemeral: true,
      }).catch(() => {});
    }

    // --- Slash Commands (extensible) ---
    if (interaction.isChatInputCommand()) {
      const { slashCommands } = interaction.client;
      if (!slashCommands) return;

      const command = slashCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error('InteractionCreate', `Erreur slash command ${interaction.commandName}:`, err);
        const reply = { embeds: [errorEmbed('Erreur', 'Une erreur est survenue.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }
  },
};
