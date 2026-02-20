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

      if (!userJson.data?.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;

      // GET ALL GAMES WITH PAGINATION
      let cursor = "";
      let games = [];

      do {

        const res = await fetch(
          `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc&cursor=${cursor}`
        );

        const json = await res.json();

        if (!json.data) break;

        games.push(...json.data);

        cursor = json.nextPageCursor;

      } while (cursor);


      if (!games.length)
        return interaction.editReply("User tidak memiliki game.");

      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");

      let found = false;

      for (const game of games) {

        const universeId = game.id;
        const placeId = game.rootPlace?.id || "Unknown";

        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        if (!passJson.gamePasses?.length)
          continue;

        found = true;

        let text = "";

        for (const pass of passJson.gamePasses) {

          text += `${pass.price} Robux — \`${pass.id}\`\n`;

        }

        embed.addFields({
          name: `Place ID: \`${placeId}\``,
          value: text
        });

      }

      if (!found)
        return interaction.editReply("Gamepass tidak ditemukan.");

      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.error(err);
      interaction.editReply("Error mengambil data.");

    }

  }
};