const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get Roblox gamepass info from username")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {

      // ================================
      // USERNAME → USER ID
      // ================================

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

      if (!userJson.data || !userJson.data.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;


      // ================================
      // GET ALL USER GAMES (pagination)
      // ================================

      let games = [];
      let cursor = null;

      do {

        const url =
          `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
          + (cursor ? `&cursor=${cursor}` : "");

        const res = await fetch(url);
        const json = await res.json();

        if (json.data)
          games.push(...json.data);

        cursor = json.nextPageCursor;

      } while (cursor);


      if (!games.length)
        return interaction.editReply("User tidak memiliki game.");


      // ================================
      // CREATE EMBED
      // ================================

      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");


      let foundAny = false;
      let gameNumber = 1;


      // ================================
      // LOOP ALL GAMES
      // ================================

      for (const game of games) {

        const universeId = game.id;


        // ================================
        // GET PLACE ID (FIX undefined)
        // ================================

        let placeId = "Unknown";

        try {

          const placeRes = await fetch(
            `https://games.roblox.com/v1/games?universeIds=${universeId}`
          );

          const placeJson = await placeRes.json();

          if (placeJson.data && placeJson.data.length)
            placeId = placeJson.data[0].rootPlaceId;

        } catch {}


        // ================================
        // GET GAMEPASSES
        // ================================

        let passCursor = null;
        let passes = [];

        do {

          const passUrl =
            `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
            + (passCursor ? `&pageToken=${passCursor}` : "");

          const passRes = await fetch(passUrl);
          const passJson = await passRes.json();

          if (passJson.data)
            passes.push(...passJson.data);

          passCursor = passJson.nextPageToken;

        } while (passCursor);


        if (!passes.length)
          continue;


        foundAny = true;


        // ================================
        // FORMAT TEXT
        // ================================

        let text = "";

        text += `Place ID:\n\`${placeId}\`\n\n`;

        for (const pass of passes) {

          const price = pass.price ?? "Offsale";

          text += `${price} Robux — \`${pass.id}\`\n`;

        }


        embed.addFields({
          name: `Game ${gameNumber}`,
          value: text,
          inline: false
        });


        gameNumber++;

      }


      // ================================
      // NO GAMEPASS FOUND
      // ================================

      if (!foundAny)
        return interaction.editReply("Gamepass tidak ditemukan.");


      // ================================
      // SEND EMBED
      // ================================

      interaction.editReply({
        embeds: [embed]
      });


    } catch (err) {

      console.error(err);

      interaction.editReply(
        "Terjadi error saat mengambil data."
      );

    }

  }
};