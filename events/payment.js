const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    // ===== TRIGGERS =====
    const triggers = ["qr", "bayar", "qris", "payment", "pay"];

    if (!triggers.some(t => msg.includes(t))) return;

    // ===== LINK QR =====
    const qrLink = "https://cdn.discordapp.com/attachments/1443358605188534273/1469974670425198612/qr_ID1025454859550_23.12.25_176646784_1766467845652.jpg";

    // ===== EMBED =====
    const embed = new EmbedBuilder()
      .setTitle("💸 Pembayaran Nice Blox")
      .setDescription(
        "Silakan scan QR di bawah atau klik tombol link untuk melakukan pembayaran.\n\n" +
        "Setelah transfer, kirim bukti ke admin ya ✅"
      )
      .setImage(qrLink)
      .setColor("Green");

    // ===== BUTTON LINK =====
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Bayar via Link")
        .setStyle(ButtonStyle.Link)
        .setURL(qrLink)
    );

    // ===== REPLY =====
    await message.reply({
      embeds: [embed],
      components: [row]
    });
  }
};