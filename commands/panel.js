async execute(interaction) {

  const embed = new EmbedBuilder()
    .setTitle("━━━━━━━━━━  NICE BLOX SERVER GUIDE  ━━━━━━━━━━")
    .setColor("#2B2D31")
    .setDescription(
      "Nice Blox is a server that offers various Roblox-related services, including Robux, items, and other in-game needs.\n\n" +
      "Before making any transactions or participating in this server, all members are required to read and understand the rules and applicable terms.\n\n" +
      "By remaining in this server, you are considered to have agreed to all established regulations.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields({
      name: "Discord Official Policies",
      value:
        "[Discord Community Guidelines](https://discord.com/guidelines)\n" +
        "[Discord Terms of Service](https://discord.com/terms)",
      inline: false
    })
    .setFooter({
      text: "Nice Blox • Official Server Information"
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