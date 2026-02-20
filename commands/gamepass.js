const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get Roblox gamepasses from username")
    .addStringOption(option =>
      option
        .setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    const username = interaction.options.getString("username");

    await interaction.deferReply();

    try {

      // STEP 1 — Username → UserId
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

      if (!userJson.data || userJson.data.length === 0) {
        return interaction.editReply("User not found.");
      }

      const userId = userJson.data[0].id;


      // STEP 2 — UserId → Universes
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data || gamesJson.data.length === 0) {
        return interaction.editReply("No games found.");
      }


      let allPasses = [];


      // STEP 3 — Universe → Gamepasses (NEW API)
      for (const game of gamesJson.data) {

        const universeId = game.id;

        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        const passJson = await passRes.json();

        if (!passJson.gamePasses) continue;

        for (const pass of passJson.gamePasses) {

          const name = pass.name;
          const price = pass.price;
          const id = pass.id;

          const link = `https://www.roblox.com/game-pass/${id}`;

          allPasses.push(
            `**${name}** — ${price} Robux\n${link}`
          );

        }

      }


      if (allPasses.length === 0) {
        return interaction.editReply("No gamepasses found.");
      }


      // LIMIT 10 biar gak terlalu panjang
      const embed = new EmbedBuilder()
        .setTitle(`Gamepasses milik ${username}`)
        .setColor("#5865F2")
        .setDescription(
          allPasses.slice(0, 10).join("\n\n")
        );


      await interaction.editReply({
        embeds: [embed]
      });

    }
    catch (error) {

      console.log(error);

      interaction.editReply(
        "Failed to fetch gamepasses."
      );

    }

  }

};