/**
 * utils/permissions.js
 * Gestion centralisée des permissions
 */

const { PermissionFlagsBits } = require('discord.js');

/**
 * Vérifie si un membre possède les permissions requises
 * @param {GuildMember} member
 * @param {bigint[]} permissions - PermissionFlagsBits[]
 * @returns {{ ok: boolean, missing: string[] }}
 */
function checkPermissions(member, permissions) {
  if (!member || !permissions.length) return { ok: true, missing: [] };

  const missing = permissions.filter(p => !member.permissions.has(p));
  return {
    ok: missing.length === 0,
    missing: missing.map(p => Object.keys(PermissionFlagsBits).find(k => PermissionFlagsBits[k] === p) || String(p)),
  };
}

/**
 * Vérifie si le bot possède les permissions requises dans un channel
 */
function checkBotPermissions(channel, permissions) {
  const botMember = channel.guild.members.me;
  return checkPermissions(botMember, permissions);
}

/**
 * Vérifie la hiérarchie des rôles (le bot doit être au-dessus de la cible)
 */
function checkHierarchy(executor, target) {
  if (!target.manageable) return { ok: false, reason: 'Ce membre ne peut pas être géré (rôle supérieur ou égal au bot).' };
  if (executor.roles.highest.position <= target.roles.highest.position) {
    return { ok: false, reason: 'Votre rôle doit être supérieur à celui de la cible.' };
  }
  return { ok: true };
}

/**
 * Vérifie si l'utilisateur est owner du bot
 */
function isBotOwner(userId) {
  const owners = (process.env.BOT_OWNERS || '').split(',').map(s => s.trim()).filter(Boolean);
  return owners.includes(userId);
}

module.exports = { checkPermissions, checkBotPermissions, checkHierarchy, isBotOwner };
