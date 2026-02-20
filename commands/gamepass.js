const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

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
    await interaction.deferReply({ ephemeral: false });

    const username = interaction.options.getString("username");

    let replyContent = "";

    try {
      // User ID
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
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
        const gamesRes = await fetch(
          `https://games.roproxy.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
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
       

      let totalPasses = 0;

      if (!gamesJson.data?.length) {
        embed.setDescription("Tidak ada experience terdeteksi (mungkin starter place tidak terindeks atau belum publish apa pun).");
      } else {

        let fullText = "";

        for (const game of gamesJson.data) {

          await new Promise(r => setTimeout(r, 600));

          const universeId = game.id;
          const placeId = game.rootPlace?.id || "Unknown";

          try {

            const passRes = await fetch(
              `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
            );

            if (!passRes.ok) {
              console.log(`Pass fail universe ${universeId}: ${passRes.status}`);
              continue;
            }

            const passJson = await passRes.json();
            const passes = passJson.gamePasses || passJson.data || [];

            if (!passes.length) continue;

            fullText += `\n**Place ID:** ${placeId}\n`;

for (const pass of passes) {

  const price = pass.price != null ? pass.price : "Offsale";
  const id = pass.id;

  fullText += `${price} Robux — ${id}\n`;

  totalPasses++;

}

          } catch (passErr) {
            console.error("Pass fetch error:", passErr);
          }

        }

        if (!fullText) {
          embed.setDescription("Tidak ada gamepass ditemukan.");
        } else {
          embed.setDescription(fullText.slice(0, 4000));
        }

      }

      await interaction.editReply({ embeds: [embed] });

    } catch (fatalErr) {
      console.error("Fatal error /gamepass untuk", username, ":", fatalErr);
      await interaction.editReply("Error internal saat proses data. Coba lagi dalam 1-2 menit (mungkin rate limit atau proxy sibuk).");
    }
  }
};