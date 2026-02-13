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
      .setTitle("◆ NICE BLOX SERVER GUIDE ◆")
      .setColor("#2B2D31")
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

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("payment")
        .setLabel("💳 Payment Methods")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("🎭 Role Information")
        .setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_order")
        .setLabel("📝 Create Order")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("customer_reviews")
        .setLabel("⭐ Customer Reviews")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3]
    });
  }
};