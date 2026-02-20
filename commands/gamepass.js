const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// ===== FETCH WITH RETRY (ANTI FAIL & RATE LIMIT) =====
async function fetchWithRetry(url, options = {}, retries = 3, delay = 700) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      console.log(`Fetch retry ${i+1}/${retries} - status ${res.status} - ${url}`);

    } catch (err) {
      console.log(`Fetch error retry ${i+1}/${retries} - ${url}`);
    }

    await new Promise(r => setTimeout(r, delay));
  }

  return null;
}

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
    await interaction.deferReply({ ephemeral: false }); // atau true kalau moderator-only

    const username = interaction.options.getString("username");

    let replyContent = "";

    try {
      // User ID
      const userRes = await fetchWithRetry("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });
      const userJson = await userRes.json();

      if (!userRes.ok || !userJson.data?.length) {
        return interaction.editReply(`User "${username}" tidak ditemukan.`);
      }
      const userId = userJson.data[0].id;

      // Games list
      let gamesJson = { data: [] };
      try {
        const gamesRes = await fetchWithRetry(
  `https://games.roproxy.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
);
        );
        if (gamesRes.ok) {
          gamesJson = await gamesRes.json();
        } else {
          console.log(`Games fetch gagal: status ${gamesRes.status} untuk ${username}`);
        }
      } catch (e) {
        console.error("Games fetch exception:", e);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gamepass milik ${username}`)
        .setColor("#5865F2")
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setTimestamp();

      let totalPasses = 0;

      if (!gamesJson.data?.length) {
        embed.setDescription("Tidak ada experience terdeteksi (mungkin starter place tidak terindeks atau belum publish apa pun).");
      } else {
        for (const game of gamesJson.data) {
          await new Promise(r => setTimeout(r, 600)); // delay anti-rate limit

          const universeId = game.id;
          const gameName = game.name || "Tempat / Starter Place";

          let passText = "Tidak ada gamepass.";
          try {
            const passRes = await fetchWithRetry(
  `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
);
            );
            if (passRes.ok) {
              const passJson = await passRes.json();
              const passes = passJson.gamePasses || passJson.data || [];
              if (passes.length > 0) {
                totalPasses += passes.length;
                passText = "";
                for (const pass of passes) {
                  const name = pass.name || "Unnamed";
                  const price = pass.price != null ? `${pass.price} Robux` : "Offsale/Free";
                  const link = `https://www.roblox.com/game-pass/${pass.id}`;
                  passText += `• **${name}** — ${price}\n  [Link](${link})\n`;
                }
              }
            } else {
              passText = `Gagal ambil pass (status ${passRes.status}).`;
              console.log(`Pass fail universe ${universeId}: ${passRes.status}`);
            }
          } catch (passErr) {
            passText = "Error saat ambil gamepass.";
            console.error("Pass fetch error:", passErr);
          }

          const placeId = game.rootPlace?.id || "Unknown";

          // SPLIT TEXT AGAR TIDAK LEBIH 1024 CHAR

    const chunks = [];
   let currentChunk = "";

for (const line of passText.split("\n")) {

  if ((currentChunk + line + "\n").length > 1000) {
    chunks.push(currentChunk);
    currentChunk = "";
  }

  currentChunk += line + "\n";
}

if (currentChunk) chunks.push(currentChunk);

// kirim per chunk
chunks.forEach((chunk, index) => {
  embed.addFields({
    name: index === 0
      ? `${gameName} (Universe: ${universeId} | Place: ${placeId})`
      : "‎", // invisible title
    value: chunk,
    inline: false
  });
});

        }

        embed.setDescription(`Ditemukan **${totalPasses}** gamepass dari **${gamesJson.data.length}** experience.`);
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (fatalErr) {
      console.error("Fatal error /gamepass untuk", username, ":", fatalErr);
      await interaction.editReply("Error internal saat proses data. Coba lagi dalam 1-2 menit (mungkin rate limit atau proxy sibuk).");
    }
  }
};