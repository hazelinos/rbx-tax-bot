const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get Roblox gamepasses from username")
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
        return interaction.editReply("User tidak ditemukan.");

      const userId = userJson.data[0].id;


      // USERID → GAMES
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data?.length)
        return interaction.editReply("User tidak memiliki game publik.");


      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setTimestamp();


      let totalPasses = 0;
      let hasAny = false;


      for (const game of gamesJson.data) {

        const universeId = game.id;
        const gameName = game.name || "Unnamed";


        // FIX PLACE ID (100% reliable)
        let placeId = "Unknown";

        try {

          const placeRes = await fetch(
            `https://games.roblox.com/v1/games?universeIds=${universeId}`
          );

          const placeJson = await placeRes.json();

          if (placeJson.data?.length)
            placeId = placeJson.data[0].rootPlaceId;

        } catch {}



        // GET GAMEPASSES
        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        const passes = passJson.data || [];

        if (passes.length === 0)
          continue;


        hasAny = true;
        totalPasses += passes.length;


        let passText = "";


        for (const pass of passes) {

          const name = pass.name || "Unnamed";
          const price = pass.price ?? "Offsale";
          const id = pass.id;

          passText +=
            `• ${name}\n` +
            `  ${price} Robux — \`${id}\`\n\n`;

        }


        embed.addFields({
          name: `${gameName}`,
          value:
            `Place ID:\n\`${placeId}\`\n\n` +
            passText.trim(),
          inline: false
        });

      }


      if (!hasAny)
        return interaction.editReply("Tidak ditemukan gamepass.");


      embed.setFooter({
        text: `${totalPasses} total gamepass`
      });


      interaction.editReply({
        embeds: [embed]
      });


    } catch (err) {

      console.error(err);

      interaction.editReply("Terjadi error.");

    }

  }
};