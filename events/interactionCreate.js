const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    if (!interaction.isButton()) return;

    // ===== RULES =====
    if (interaction.customId === "rules") {
      const embed = new EmbedBuilder()
        .setTitle("📕 Server Rules")
        .setDescription(
          `📖 Server Rules
1. Age Requirement (13+)
Wajib berusia 13 tahun ke atas untuk bergabung dan berpartisipasi di server ini.

2. No Spamming
Dilarang melakukan spam atau flood chat dalam bentuk pesan, emoji, gambar, atau mention berlebihan.

3. No Excessive Toxic Behavior
Bercanda diperbolehkan secukupnya, namun dilarang bersikap toxic atau berlebihan hingga mengganggu member lain.

4. No NSFW Content
Dilarang membagikan konten NSFW atau konten yang tidak pantas dalam bentuk apapun.

5. No Server Promotion
Dilarang mempromosikan atau membagikan link server lain tanpa izin.

6. Use Channels Properly
Gunakan setiap channel sesuai dengan fungsi dan kategorinya masing-masing.

7. Follow Discord ToS & Server Rules
Wajib mengikuti Discord Terms of Service serta seluruh peraturan server yang berlaku.

⚠️ Pelanggaran terhadap peraturan di atas akan dikenakan sanksi sesuai tingkat kesalahan, berupa peringatan, mute, kick, hingga ban permanen.`
        )
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== FAQ =====
    if (interaction.customId === "faq") {
      const embed = new EmbedBuilder()
        .setTitle("❓ FAQ")
        .setDescription(
          "**Q:** Cara bayar?\n" +
          "A: Ketik `bayar` untuk melihat QR.\n\n" +
          "**Q:** Cara hitung tax?\n" +
          "A: Gunakan `/tax jumlah`."
        )
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== PAYMENT =====
    if (interaction.customId === "payment") {
      const embed = new EmbedBuilder()
        .setTitle("💳 Payment Info")
        .setDescription(
          "Gunakan QR di channel pembayaran.\n" +
          "Setelah bayar kirim bukti ke admin."
        )
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== ROLE INFO =====
    if (interaction.customId === "roles") {
      const embed = new EmbedBuilder()
        .setTitle("🎭 Role Information")
        .setDescription(
          "🎖 Member → Default role\n" +
          "💎 VIP → Akses khusus\n" +
          "🛡 Admin → Staff"
        )
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== CREATE ORDER =====
    if (interaction.customId === "create_order") {
      return interaction.reply({
        content: "Please proceed to <#1448898303080009890> to create your order.",
        ephemeral: true
      });
    }

    // ===== CUSTOMER REVIEWS =====
    if (interaction.customId === "customer_reviews") {
      return interaction.reply({
        content: "You can view customer feedback in <#1448898315411259424>.",
        ephemeral: true
      });
    }
  }
};