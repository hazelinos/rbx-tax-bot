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

      // GET USER GAMES
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data.length)
        return interaction.editReply("User tidak memiliki game.");

      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");

      let foundAny = false;

      for (const game of gamesJson.data) {

        const universeId = game.id;

        // GET PLACE ID
        const placeRes = await fetch(
          `https://games.roblox.com/v1/games?universeIds=${universeId}`
        );

        const placeJson = await placeRes.json();
        const placeId = placeJson.data?.[0]?.rootPlaceId || "Unknown";

        // PAGINATION SUPPORT
        let pageToken = "";
        let passes = [];

        do {

          const passRes = await fetch(
            `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100&pageToken=${pageToken}`
          );

          const passJson = await passRes.json();

          const newPasses = passJson.data || passJson.gamePasses || [];

          passes.push(...newPasses);

          pageToken = passJson.nextPageToken || "";

        } while (pageToken);

        if (!passes.length)
          continue;

        foundAny = true;

        let text =
`Place ID
\`\`\`
${placeId}
\`\`\`
`;

        for (const pass of passes) {

          text += `${pass.price} Robux — \`${pass.id}\`\n`;

        }

        embed.addFields({
          name: "Gamepasses",
          value: text
        });

      }

      if (!foundAny)
        return interaction.editReply("Gamepass tidak ditemukan.");

      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.error(err);
      interaction.editReply("Error mengambil data.");

    }

  }
};