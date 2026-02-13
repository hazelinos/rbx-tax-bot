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
          "1. No toxic\n" +
          "2. No spam\n" +
          "3. Respect all members\n" +
          "4. Follow Discord TOS"
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