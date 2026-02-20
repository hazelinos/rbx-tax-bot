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


      // ✅ GET ALL GAMES WITH CURSOR LOOP
      let cursor = null;
      let games = [];

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


      const embed = new EmbedBuilder()
        .setTitle(username)
        .setColor("#5865F2");


      let found = false;


      // LOOP ALL UNIVERSES
      for (const game of games) {

        const universeId = game.id;

        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        const passes = passJson.gamePasses || [];

        if (!passes.length)
          continue;


        found = true;

        const placeId = game.rootPlace?.id || game.rootPlaceId || "Unknown";


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


      if (!found)
        return interaction.editReply("Gamepass tidak ditemukan.");


      interaction.editReply({ embeds: [embed] });


    } catch (err) {

      console.error(err);

      interaction.editReply("Terjadi error.");

    }

  }
};