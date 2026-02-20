const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get gamepasses from Roblox username")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    const username = interaction.options.getString("username");

    await interaction.deferReply();

    try {

      // STEP 1 — get user id
      const userRes = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usernames: [username]
          })
        }
      );

      const userJson = await userRes.json();

      if (!userJson.data.length)
        return interaction.editReply("User not found.");

      const userId = userJson.data[0].id;


      // STEP 2 — get universes
      const universeRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
      );

      const universeJson = await universeRes.json();

      if (!universeJson.data.length)
        return interaction.editReply("No games found.");

      let allPasses = [];


      // STEP 3 — get gamepasses
      for (const game of universeJson.data) {

        const universeId = game.id;

        const passRes = await fetch(
          `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`
        );

        const passJson = await passRes.json();

        for (const pass of passJson.data) {

          allPasses.push(
            `**${pass.name}** — ${pass.price} Robux\nhttps://www.roblox.com/game-pass/${pass.id}`
          );

        }

      }


      if (!allPasses.length)
        return interaction.editReply("No gamepasses found.");


      const embed = new EmbedBuilder()
        .setTitle(`Gamepasses for ${username}`)
        .setDescription(allPasses.slice(0,10).join("\n\n"))
        .setColor("#5865F2");


      interaction.editReply({
        embeds: [embed]
      });

    }
    catch (err) {

      console.log(err);

      interaction.editReply(
        "Failed to fetch gamepasses."
      );

    }

  }

};