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

      // USERNAME → USER ID
      const userRes = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usernames: [username],
            excludeBannedUsers: false
          })
        }
      );

      const userJson = await userRes.json();

      if (!userJson.data || !userJson.data.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;


      // USER ID → GAMES
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data || !gamesJson.data.length)
        return interaction.editReply("User tidak memiliki game.");

      const games = gamesJson.data;


      // EMBED
      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");

      let description = "";


      // LOOP SEMUA GAME
      for (const game of games) {

        const universeId = game.id;

        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        const passes = passJson.gamePasses || [];

        if (!passes.length)
          continue;


        const placeId =
          game.rootPlace?.id ||
          game.rootPlaceId ||
          "Unknown";


        // PLACE ID
        description += `Place ID\n\`\`\`\n${placeId}\n\`\`\`\n`;


        // GAMEPASSES
        for (const pass of passes) {

          description += `${pass.price} Robux — \`${pass.id}\`\n`;

        }

        description += "\n";
      }


      if (!description)
        return interaction.editReply("Gamepass tidak ditemukan.");

      embed.setDescription(description);

      interaction.editReply({ embeds: [embed] });

    }
    catch (err) {

      console.error(err);

      interaction.editReply("Terjadi error saat mengambil data.");

    }

  }
};