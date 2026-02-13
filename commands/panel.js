const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Buat panel info server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("· · ─ ·SERVER GUIDE· ─ · ·")
      .setDescription(
  "👋 Welcome to **Nice Blox** 💚\n\n" +
  "Nice Blox menyediakan berbagai kebutuhan Roblox seperti Robux, item, dll.\n\n" +
  "📌 Sebelum melakukan transaksi atau berpartisipasi di server, seluruh member **diwajibkan membaca dan memahami rules serta ketentuan yang berlaku**.\n\n" +
  "Dengan tetap berada di server ini, kamu dianggap telah menyetujui seluruh peraturan yang berlaku.\n\n" +
  "━━━━━━━━━━━━━━━━━━━━━━━━━━"
)
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rules")
        .setLabel("📕 Rules")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("faq")
        .setLabel("❓ FAQ")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("payment")
        .setLabel("💳 Payment Info")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("🎭 Role Info")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};