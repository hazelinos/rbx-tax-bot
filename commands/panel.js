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
      .setTitle("═══════ SERVER GUIDE ═══════")
      .setColor("#5865F2")
      .setDescription(
        "This server provides various Roblox services. Before conducting any transactions or activities on the server, all members are required to read and comply with the applicable rules."
      )
      .addFields({
        name: "__**Discord Official Guidelines & TOS**__",
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
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("terms")
        .setLabel("📜 Terms & Conditions")
        .setStyle(ButtonStyle.Primary)
    );

    // ===== ROW 2 =====
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("🎭 Role Information")
        .setStyle(ButtonStyle.Primary)
    );

    // ===== ROW 3 =====
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

    await interaction.deferReply({ ephemeral: true });

    await interaction.channel.send({
      embeds: [embed],
      components: [row1, row2, row3]
    });

    await interaction.deleteReply();
  }
};