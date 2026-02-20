const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

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
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      // STEP 1 — Username → UserId
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

      if (!userRes.ok) throw new Error(`User fetch failed: ${userRes.status}`);

      const userJson = await userRes.json();

      if (!userJson.data?.length) {
        return interaction.editReply("User tidak ditemukan.");
      }

      const userId = userJson.data[0].id;

      // STEP 2 — UserId → Universes (Public games)
      const gamesRes = await fetch(
        `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      if (!gamesRes.ok) throw new Error(`Games fetch failed: ${gamesRes.status}`);

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data?.length) {
        return interaction.editReply("Tidak ada game publik yang ditemukan.");
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gamepasses dari ${username}`)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setTimestamp();

      let totalPasses = 0;
      let fieldsAdded = false;

      // STEP 3 — Loop universes → Gamepasses via roproxy
      for (const game of gamesJson.data) {
        const universeId = game.id;
        const gameName = game.name || "Unnamed Game";

        const passRes = await fetch(
          `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        if (!passRes.ok) {
          console.log(`Gamepass fetch gagal untuk universe ${universeId} - status: ${passRes.status}`);
          continue;
        }

        const passJson = await passRes.json();

        // Struktur response biasanya { gamePasses: [...] } atau { data: [...] }
        const passes = passJson.gamePasses || passJson.data || [];

        if (passes.length === 0) continue;

        totalPasses += passes.length;
        fieldsAdded = true;

        let passText = "";

        for (const pass of passes) {
          const name = pass.name || "Unnamed Pass";
          const price = pass.price != null ? `${pass.price} Robux` : "Offsale/Free";
          const id = pass.id;
          const link = `https://www.roblox.com/game-pass/${id}`;

          passText += `• **${name}** — ${price}\n  [Link](${link})\n`;
        }

        // Tambah info universe & place jika ada
        const placeId = game.rootPlace?.id || "Unknown";

        embed.addFields({
          name: `${gameName} (Universe: ${universeId} | Place: ${placeId})`,
          value: passText || "No passes listed",
          inline: false
        });
      }

      if (!fieldsAdded || totalPasses === 0) {
        return interaction.editReply("Tidak ditemukan gamepass di game publik user ini.");
      }

      embed.setDescription(`Ditemukan **${totalPasses}** gamepass dari **${gamesJson.data.length}** game.`);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error di /gamepass:", error);
      await interaction.editReply("Gagal mengambil data. Coba lagi nanti atau username salah.");
    }
  }
};