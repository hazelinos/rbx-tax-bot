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
          body: JSON.stringify({
            usernames: [username],
            excludeBannedUsers: false
          })
        }
      );

      const userJson = await userRes.json();

      if (!userJson.data?.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;


      // USERID → GAMES
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data?.length)
        return interaction.editReply("User tidak memiliki game.");


      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");


      let found = false;
      let gameIndex = 1;


      for (const game of gamesJson.data) {

        const universeId = game.id;

        // UNIVERSE → PLACEID
        const uniRes = await fetch(
          `https://games.roblox.com/v1/games?universeIds=${universeId}`
        );

        const uniJson = await uniRes.json();

        if (!uniJson.data?.length)
          continue;

        const placeId = uniJson.data[0].rootPlaceId;


        // AMBIL SEMUA GAMEPASS (pagination)
        let passes = [];
        let nextToken = null;

        do {

          let url =
            `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`;

          if (nextToken)
            url += `&pageToken=${nextToken}`;

          const passRes = await fetch(url);
          const passJson = await passRes.json();

          if (passJson.gamePasses)
            passes.push(...passJson.gamePasses);

          nextToken = passJson.nextPageToken;

        } while (nextToken);


        if (!passes.length)
          continue;


        found = true;


        let text =
          `Place ID:\n\`\`\`\n${placeId}\n\`\`\`\n`;


        for (const pass of passes) {

          text += `${pass.price} Robux — \`${pass.id}\`\n`;

        }


        embed.addFields({
          name: `Game ${gameIndex}`,
          value: text,
          inline: false
        });


        gameIndex++;

      }


      if (!found)
        return interaction.editReply("Gamepass tidak ditemukan.");


      interaction.editReply({
        embeds: [embed]
      });

    }
    catch (err) {

      console.error(err);
      interaction.editReply("Error mengambil data.");

    }

  }
};