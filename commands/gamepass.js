const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get Roblox gamepasses from username (termasuk starter kalau terdeteksi)")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const username = interaction.options.getString("username");

    try {
      // STEP 1: Username → UserId
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });

      const userJson = await userRes.json();
      if (!userRes.ok || !userJson.data?.length) {
        return interaction.editReply("User tidak ditemukan atau error saat mencari ID.");
      }

      const userId = userJson.data[0].id;

      // STEP 2: Get universes (tanpa accessFilter strict)
      const gamesRes = await fetch(
        `https://games.roproxy.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
      );

      const gamesJson = await gamesRes.json();
      if (!gamesRes.ok || !gamesJson.data?.length) {
        return interaction.editReply(`User ${username} ditemukan (ID: ${userId}), tapi tidak ada experience/universe terdeteksi (mungkin starter place tidak terindeks atau belum publish).`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gamepasses dari ${username}`)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setTimestamp();

      let totalPasses = 0;

      for (const game of gamesJson.data) {
        const universeId = game.id;
        const gameName = game.name || "Starter Place / Unnamed";

        // Delay kecil untuk hindari rate limit (opsional, uncomment kalau sering error 429)
        // await new Promise(r => setTimeout(r, 400));

        const passRes = await fetch(
          `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        let passText = "";
        let passes = [];

        if (passRes.ok) {
          const passJson = await passRes.json();
          passes = passJson.gamePasses || passJson.data || [];
        } else {
          console.log(`Pass fetch skip untuk universe ${universeId} - status: ${passRes.status}`);
          passText = "Gagal ambil gamepass (API error).";
        }

        if (passes.length > 0) {
          totalPasses += passes.length;
          for (const pass of passes) {
            const name = pass.name || "Unnamed";
            const price = pass.price != null ? `${pass.price} Robux` : "Offsale/Free";
            const id = pass.id;
            const link = `https://www.roblox.com/game-pass/${id}`;
            passText += `• **${name}** — ${price}\n  [Link](${link})\n`;
          }
        } else if (passText === "") {
          passText = "Tidak ada gamepass terdeteksi.";
        }

        const placeId = game.rootPlace?.id || "Unknown";

        embed.addFields({
          name: `${gameName} (Universe: ${universeId} | Place: ${placeId})`,
          value: passText.trim(),
          inline: false
        });
      }

      embed.setDescription(`Ditemukan **${totalPasses}** gamepass dari **${gamesJson.data.length}** experience.`);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error fatal di /gamepass:", error);
      await interaction.editReply("Terjadi error internal saat mengambil data. Coba lagi nanti, atau cek apakah username benar.");
    }
  }
};