const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get gamepass information from a Roblox user")
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

      // USERID → GAMES
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data.length)
        return interaction.editReply("User tidak memiliki game.");

      const embed = new EmbedBuilder()
        .setTitle(`Informasi milik ${username}`)
        .setColor("#5865F2");

      let foundAny = false;

      for (const game of gamesJson.data) {

        const universeId = game.id;
        const placeId = game.rootPlaceId;

        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        if (!passJson.data || passJson.data.length === 0)
          continue;

        foundAny = true;

        let text = "";

        for (const pass of passJson.data) {

          text += `${pass.price} Robux — ${pass.id}\n`;

        }

        embed.addFields({
          name: `Place ID: ${placeId}`,
          value: text,
          inline: false
        });

      }

      if (!foundAny)
        return interaction.editReply("Tidak ada gamepass ditemukan.");

      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.error(err);
      interaction.editReply("Terjadi error saat mengambil data.");

    }

  }
};