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
      .setTitle("════════ SERVER GUIDE ════════")
      .setColor("#5865F2")
      .setDescription(
        "Nice Blox is a server that offers various Roblox-related services including Robux, items, and other in-game needs. " +
        "Before making any transactions or participating in this server, all members are required to read and understand the rules and applicable terms. " +
        "By remaining in this server, you agree to comply with all established regulations."
      )
      .addFields({
        name: "Discord Official Policies",
        value:
          "[Discord Community Guidelines](https://discord.com/guidelines) — " +
          "[Discord Terms of Service](https://discord.com/terms)",
        inline: false
      });

    // ===== ROW 1 =====
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rules")
        .setLabel("📖 Server Rules")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("faq")
        .setLabel("❓ FAQ")
        .setStyle(ButtonStyle.Primary)
    );

    // ===== ROW 2 =====
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("🎭 Role Information")
        .setStyle(ButtonStyle.Primary)
    );

    // ===== ACTION BUTTONS =====
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🛒 Buy")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/channels/1425182368326488106/1448898303080009890"),

      new ButtonBuilder()
        .setLabel("⭐ Customer Reviews")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/channels/1425182368326488106/1448898315411259424")
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3]
    });
  }
};