const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    const triggers = ["qr", "bayar", "qris", "payment", "pay", "transfer" , "tf", "norek", "rekening"];

    if (!triggers.some(t => msg.includes(t))) return;

    const embed = new EmbedBuilder()
      .setTitle("💳 Metode Pembayaran")
      .setDescription(
        "Silakan scan QR di bawah untuk melakukan pembayaran.\n\n" +
        "Setelah transfer, mohon kirimkan bukti transfer"
      )
      .setImage("https://cdn.discordapp.com/attachments/1443358605188534273/1469974670425198612/qr_ID1025454859550_23.12.25_176646784_1766467845652.jpg")
      .setColor("Blue");

    await message.reply({ embeds: [embed] });
  }
};