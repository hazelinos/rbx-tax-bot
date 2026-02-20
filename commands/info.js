const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get gamepass info from Roblox user")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {

      // username → userid
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

      if (!userJson.data.length)
        return interaction.editReply("Username tidak ditemukan.");

      const userId = userJson.data[0].id;


      // userid → games
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data.length)
        return interaction.editReply("User tidak memiliki game.");


      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");


      let totalGameWithPass = 0;


      for (const game of gamesJson.data) {

        const universeId = game.id;

        // universe → placeId
        const universeRes = await fetch(
          `https://games.roblox.com/v1/games?universeIds=${universeId}`
        );

        const universeJson = await universeRes.json();

        if (!universeJson.data.length)
          continue;

        const placeId = universeJson.data[0].rootPlaceId;


        // universe → gamepass
        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        if (!passJson.gamePasses || passJson.gamePasses.length === 0)
          continue;


        totalGameWithPass++;


        // buat text game ini
        let text = `Place ID:\n\`\`\`\n${placeId}\n\`\`\`\n`;

        for (const pass of passJson.gamePasses) {

          text += `${pass.price} Robux — \`${pass.id}\`\n`;

        }


        // tambahkan sebagai field baru
        embed.addFields({
          name: `Game ${totalGameWithPass}`,
          value: text,
          inline: false
        });

      }


      if (totalGameWithPass === 0)
        return interaction.editReply("Gamepass tidak ditemukan.");


      interaction.editReply({
        embeds: [embed]
      });

    }
    catch (err) {

      console.error(err);
      interaction.editReply("Error saat mengambil data.");

    }

  }
};