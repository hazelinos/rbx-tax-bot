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
    .setDescription("Create server information panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("◈  NICE BLOX SERVER GUIDE  ◈")
      .setColor("#2B2D31")

      .setDescription(
        "This server that offers various Roblox-related services including Robux, items, and other in-game needs. " +
        "Before making any transactions or participating in this server, all members are required to read and understand the rules and applicable terms. " +
        "By remaining in this server, you agree to comply with all established regulations."
      )

      .addFields({
  name: "Discord Official Guidelines & TOS",
  value:
    "[Discord Guidelines](https://discord.com/guidelines) — [Discord Terms of Service](https://discord.com/terms)",
  inline: false
});

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rules")
        .setLabel("Rules")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("faq")
        .setLabel("FAQ")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("payment")
        .setLabel("Payment Info")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("Role Info")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};