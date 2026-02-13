const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {

    // ================= RBX TAX BUTTON =================
    if (interaction.isButton()) {

      if (interaction.customId === "before_tax" || interaction.customId === "after_tax") {

        const modal = new ModalBuilder()
          .setCustomId(interaction.customId + "_modal")
          .setTitle("Robux Tax Calculator");

        const input = new TextInputBuilder()
          .setCustomId("robux_amount")
          .setLabel("Enter Robux Amount")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        return interaction.showModal(modal);
      }
    }

    // ================= RBX TAX MODAL =================
    if (interaction.isModalSubmit()) {

      const amount = parseInt(interaction.fields.getTextInputValue("robux_amount"));

      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "Please enter a valid number.",
          ephemeral: true
        });
      }

      if (interaction.customId === "before_tax_modal") {
        const result = Math.floor(amount * 0.7);

        return interaction.reply({
          content: `You would receive: **${result} Robux**`,
          ephemeral: true
        });
      }

      if (interaction.customId === "after_tax_modal") {
        const result = Math.ceil(amount / 0.7);

        return interaction.reply({
          content: `You must send: **${result} Robux**`,
          ephemeral: true
        });
      }
    }

    // ================= BUTTON ONLY BELOW =================
    if (!interaction.isButton()) return;

    // ===== RULES =====
    if (interaction.customId === "rules") {
      const embed = new EmbedBuilder()
        .setTitle("📕 Server Rules")
        .setDescription(`1. **Age Requirement (13+)**
Wajib berusia 13 tahun ke atas untuk bergabung dan berpartisipasi di server ini.

2. **No Spamming**
Dilarang melakukan spam atau flood chat.

3. **No Excessive Toxic Behavior**
Bercanda diperbolehkan secukupnya, namun dilarang berlebihan.

4. **No NSFW Content**
Dilarang membagikan konten NSFW.

5. **No Server Promotion**
Dilarang mempromosikan server lain.

6. **Use Channels Properly**
Gunakan channel sesuai fungsinya.

7. **Follow Discord ToS & Server Rules**
Wajib mengikuti semua peraturan server.

⚠️ Pelanggaran akan dikenakan sanksi.`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== TERMS =====
    if (interaction.customId === "terms") {
      const embed = new EmbedBuilder()
        .setTitle("📜 Terms & Conditions")
        .setDescription(`1. Product Status
Jika tidak terdapat keterangan "Clean", maka produk bukan clean.

2. RMT Risk
RMT memiliki risiko tertentu.

3. Transactions Are Final
Semua transaksi final.

4. Official Recommendation
Disarankan top up langsung melalui Roblox.

5. Agreement
Membeli = dianggap setuju.`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== FAQ =====
    if (interaction.customId === "faq") {
      const embed = new EmbedBuilder()
        .setTitle("❓ FAQ")
        .setDescription(`Before Tax = dipotong 30%
After Tax = diterima penuh
GIG = kirim langsung

Rate = harga per 1 Robux`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== ROLE =====
    if (interaction.customId === "roles") {
      const embed = new EmbedBuilder()
        .setTitle("Role List & Information")
        .setDescription(`<@&1469353777118314688>
<@&1448729347404988526>
<@&1448729340513747058>
<@&1448729350961631294>
<@&1441620125739520052>
<@&1449581791072751676>`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== ORDER =====
    if (interaction.customId === "create_order") {
      return interaction.reply({
        content: "Please proceed to <#1448898303080009890>",
        ephemeral: true
      });
    }

    // ===== REVIEWS =====
    if (interaction.customId === "customer_reviews") {
      return interaction.reply({
        content: "Check reviews in <#1448898315411259424>",
        ephemeral: true
      });
    }
  }
};