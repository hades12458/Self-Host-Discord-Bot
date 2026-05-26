/**
 * utils/confirmation.js
 * Système de confirmation textuelle unifié
 */

/**
 * Envoie un embed de confirmation et attend la réponse "confirmer"
 * @returns {Promise<boolean>}
 */
async function awaitConfirmation(message, embed) {
  const confirmMsg = await message.channel.send({ embeds: [embed] });

  const filter = m => m.author.id === message.author.id;
  let collected;

  try {
    collected = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30_000,
      errors: ['time'],
    });
  } catch {
    await confirmMsg.edit({ embeds: [embed.setDescription('⏰ Délai expiré. Opération annulée.')] });
    return false;
  }

  const response = collected.first().content.toLowerCase().trim();
  // Nettoyage du message de réponse si possible
  collected.first().delete().catch(() => {});

  if (response === 'confirmer') {
    await confirmMsg.delete().catch(() => {});
    return true;
  }

  await confirmMsg.edit({ embeds: [embed.setDescription('❌ Opération annulée.')] });
  return false;
}

module.exports = { awaitConfirmation };
