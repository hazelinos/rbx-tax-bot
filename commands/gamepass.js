const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Get Roblox gamepasses from username (termasuk private/starter kalau terdeteksi)")
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

      if (!userRes.ok) throw new Error(`User API error: ${userRes.status}`);

      const userJson = await userRes.json();
      if (!userJson.data?.length) return interaction.editReply("User tidak ditemukan.");

      const userId = userJson.data[0].id;

      // STEP 2: UserId → All Universes (tanpa accessFilter strict biar ambil starter/private kalau ada)
      const gamesRes = await fetch(
        `https://games.roproxy.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
      );

      if (!gamesRes.ok) throw new Error(`Games API error: ${gamesRes.status}`);

      const gamesJson = await gamesRes.json();

      if (!gamesJson.data?.length) {
        return interaction.editReply(`User ${username} ditemukan, tapi tidak ada experience/universe terdeteksi sama sekali (mungkin belum pernah buka Roblox Studio atau semuanya dihapus).`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gamepass milik ${username}`)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setTimestamp();

      let totalPasses = 0;
      let hasAny = false;

      // STEP 3: Loop universes → Gamepasses
      for (const game of gamesJson.data) {
        const universeId = game.id;
        const gameName = game.name || "Unnamed / Starter Place";

        // Optional: Tambah delay kalau rate limit sering (500ms)
        // await new Promise(r => setTimeout(r, 500));

        const passRes = await fetch(
          `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
        );

        if (!passRes.ok) {
          console.log(`Pass API skip universe ${universeId} - status ${passRes.status}`);
          continue;
        }

        const passJson = await passRes.json();
        const passes = passJson.gamePasses || passJson.data || [];

        if (passes.length === 0) {
          // Masih tampilkan game-nya biar tahu ada universe
          embed.addFields({
            name: `${gameName} (Universe: ${universeId})`,
            value: "Tidak ada gamepass terdeteksi (mungkin private, starter place, atau offsale).",
            inline: false
          });
          continue;
        }

        hasAny = true;
        totalPasses += passes.length;

        let passText = "";
        for (const pass of passes) {
          const name = pass.name || "Unnamed";
          const price = pass.price != null ? `${pass.price} Robux` : "Offsale/Free";
          const id = pass.id;
          const link = `https://www.roblox.com/game-pass/${id}`;

          passText += `• **${name}** — ${price}\n  [Link](${link})\n`;
        }

        const placeId = game.rootPlace?.id || "Unknown";

        embed.addFields({
          name: `${gameName} (Universe: ${universeId} | Place: ${placeId})`,
          value: passText.trim() || "No passes listed",
          inline: false
        });
      }

      if (totalPasses === 0 && !hasAny) {
        embed.setDescription("Tidak ditemukan gamepass sama sekali, tapi ada universe (kemungkinan starter place default tanpa pass).");
      } else if (totalPasses > 0) {
        embed.setDescription(`Ditemukan **${totalPasses}** gamepass dari **${gamesJson.data.length}** experience/universe.`);
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error /gamepass:", error);
      await interaction.editReply("Gagal ambil data. Coba lagi atau cek console untuk detail error.");
    }
  }
};