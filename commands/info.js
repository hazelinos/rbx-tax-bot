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
      // ========================
      // USERNAME → USERID
      // ========================
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

      if (!userRes.ok) {
        throw new Error(`User API error: ${userRes.status}`);
      }

      const userJson = await userRes.json();

      if (!userJson.data?.length) {
        return interaction.editReply("Username tidak ditemukan.");
      }

      const userId = userJson.data[0].id;

      // ========================
      // GET USER GAMES (Public experiences)
      // ========================
      const gamesRes = await fetch(
        `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`
      );

      if (!gamesRes.ok) {
        throw new Error(`Games API error: ${gamesRes.status}`);
      }

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data?.length) {
        return interaction.editReply("User tidak memiliki game publik.");
      }

      const embed = new EmbedBuilder()
        .setTitle(`${username}'s Gamepasses`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setTimestamp();

      let foundAny = false;
      let gameNumber = 1;

      // ========================
      // LOOP EACH GAME
      // ========================
      for (const game of gamesJson.data) {
        const universeId = game.id;

        // FIX PLACE ID (rootPlaceId)
        let placeId = "Unknown";
        try {
          const placeRes = await fetch(
            `https://games.roproxy.com/v1/games?universeIds=${universeId}`
          );
          const placeJson = await placeRes.json();
          if (placeJson.data?.length) {
            placeId = placeJson.data[0].rootPlaceId;
          }
        } catch (e) {
          console.log(`Gagal ambil placeId untuk universe ${universeId}: ${e}`);
        }

        // ========================
        // GET GAMEPASSES (pakai roproxy - working 2026)
        // ========================
        const passRes = await fetch(
          `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        if (!passRes.ok) {
          console.log(`Gamepass API gagal (status ${passRes.status}) untuk universe ${universeId}`);
          continue;
        }

        const passJson = await passRes.json();

        if (!passJson.data || passJson.data.length === 0) {
          continue;
        }

        foundAny = true;

        let text = `**Place ID:** \`${placeId}\`\n**Universe ID:** \`${universeId}\`\n\n**Gamepasses:**\n`;

        for (const pass of passJson.data) {
          const price = pass.price !== undefined && pass.price !== null ? `${pass.price} Robux` : "Offsale / Free";
          const id = pass.id;
          const name = pass.name ? pass.name : "Unnamed";

          text += `• ${price} — \`${id}\` (${name})\n`;
        }

        // Cek kalau ada pagination (jarang dibutuhkan)
        if (passJson.nextPageToken) {
          text += `\n*(Ada lebih dari 100 gamepass – pagination tidak di-handle full)*`;
        }

        embed.addFields({
          name: `Game ${gameNumber}: ${game.name}`,
          value: text,
          inline: false
        });

        gameNumber++;
      }

      if (!foundAny) {
        return interaction.editReply("Tidak ditemukan gamepass yang tersedia di game publik user ini.");
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("Error di command /info:", err);
      await interaction.editReply("Terjadi error saat mengambil data. Coba lagi nanti atau username salah.");
    }
  }
};