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
    .setName("rbxtax")
    .setDescription("Open Robux Tax Calculator Panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("Robux Tax Calculator")
      .setDescription(
        `This calculator helps you determine the exact Robux amount before or after Roblox marketplace tax.


Select your preferred calculation type below to continue.`
      )
      .setColor("#00A86B");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("before_tax")
        .setLabel("🟢 Robux Before Tax")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("after_tax")
        .setLabel("⚫ Robux After Tax")
        .setStyle(ButtonStyle.Secondary)
    );

    // 🔥 Supaya slash command tidak kelihatan lama
    await interaction.deferReply({ ephemeral: true });

    // Kirim panel ke channel
    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    // Hapus notifikasi slash command
    await interaction.deleteReply();
  }
};