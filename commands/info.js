const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get Roblox gamepass info")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {

      // USERNAME → USERID
      const userRes = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      const userJson = await userRes.json();

      if (!userJson.data.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;

      // GET GAMEPASSES DIRECTLY
      let cursor = "";
      let passes = [];

      do {

        const res = await fetch(
          `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=100&sortOrder=Asc&cursor=${cursor}`
        );

        const json = await res.json();

        passes.push(...json.data);

        cursor = json.nextPageCursor;

      } while (cursor);

      if (!passes.length)
        return interaction.editReply("Gamepass tidak ditemukan.");

      // GROUP BY PLACE ID
      const grouped = {};

      for (const pass of passes) {

        const placeId = pass.assetId;

        if (!grouped[placeId])
          grouped[placeId] = [];

        grouped[placeId].push(pass);

      }

      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");

      for (const placeId in grouped) {

        let text = "";

        for (const pass of grouped[placeId]) {

          text += `${pass.price || "Unknown"} Robux — \`${pass.id}\`\n`;

        }

        embed.addFields({
          name: `Gamepasses`,
          value: text
        });

      }

      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.error(err);
      interaction.editReply("Error mengambil gamepass.");

    }

  }
};