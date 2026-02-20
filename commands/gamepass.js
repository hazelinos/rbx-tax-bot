const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const fetch = require("node-fetch");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get all gamepasses from a Roblox username")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {

    const username = interaction.options.getString("username");

    await interaction.deferReply();

    try {

      // STEP 1: Username → UserId
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

      const userData = await userRes.json();

      if (!userData.data.length)
        return interaction.editReply("User not found.");

      const userId = userData.data[0].id;

      // STEP 2: UserId → Games
      const gamesRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`
      );

      const gamesData = await gamesRes.json();

      if (!gamesData.data.length)
        return interaction.editReply("User has no games.");

      let allPasses = [];

      // STEP 3: Games → Gamepasses
      for (const game of gamesData.data) {

        const universeId = game.id;

        const passRes = await fetch(
          `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`
        );

        const passData = await passRes.json();

        for (const pass of passData.data) {

          allPasses.push({
            name: pass.name,
            price: pass.price,
            link: `https://www.roblox.com/game-pass/${pass.id}`
          });

        }
      }

      if (!allPasses.length)
        return interaction.editReply("No gamepasses found.");

      // LIMIT DISPLAY
      const display = allPasses.slice(0, 10);

      const embed = new EmbedBuilder()
        .setTitle(`Gamepasses for ${username}`)
        .setColor("#5865F2")
        .setDescription(
          display.map(p =>
            `**${p.name}**\nPrice: ${p.price} Robux\n${p.link}`
          ).join("\n\n")
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.log(err);
      interaction.editReply("Error fetching gamepasses.");

    }

  }

};