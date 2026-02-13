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
`1. **Age Requirement (13+)**
Wajib berusia 13 tahun ke atas untuk bergabung dan berpartisipasi di server ini.

2. **No Spamming**
Dilarang melakukan spam atau flood chat dalam bentuk pesan, emoji, gambar, atau mention berlebihan.

3. **No Excessive Toxic Behavior**
Bercanda diperbolehkan secukupnya, namun dilarang bersikap toxic atau berlebihan hingga mengganggu member lain.

4. **No NSFW Content**
Dilarang membagikan konten NSFW atau konten yang tidak pantas dalam bentuk apapun.

5. **No Server Promotion**
Dilarang mempromosikan atau membagikan link server lain tanpa izin.

6. **Use Channels Properly**
Gunakan setiap channel sesuai dengan fungsi dan kategorinya masing-masing.

7. **Follow Discord ToS & Server Rules**
Wajib mengikuti Discord Terms of Service serta seluruh peraturan server yang berlaku.

⚠️ Pelanggaran terhadap peraturan di atas akan dikenakan sanksi sesuai tingkat kesalahan, berupa peringatan, mute, kick, hingga ban permanen.`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== TERMS & CONDITIONS =====
    if (interaction.customId === "terms") {
      const embed = new EmbedBuilder()
        .setTitle("📜 Terms & Conditions")
        .setDescription(
`1. **Product Status**
Apabila tidak terdapat keterangan "Clean", maka produk tersebut tidak termasuk kategori clean.

2. **Real Money Trading (RMT)**
Real Money Trading (RMT) dapat bertentangan dengan kebijakan game dan memiliki risiko tertentu.

3. **Transactions Are Final**
Semua transaksi bersifat final dan tidak dapat dibatalkan setelah diproses.

4. **Responsibility Disclaimer**
Segala risiko atau permasalahan di luar ketentuan garansi bukan menjadi tanggung jawab kami.

5. Official Top-Up Recommendation  
Untuk metode yang lebih aman dan resmi, disarankan melakukan top up langsung melalui Roblox.

6. **Agreement**
Dengan melakukan pembelian, pembeli dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.`)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== FAQ =====
    if (interaction.customId === "faq") {
      const embed = new EmbedBuilder()
        .setTitle("❓ FAQ")
        .setDescription(
`** Apa itu Before Tax, After Tax & GIG ? **

• **Before Tax**
Robux belum termasuk pajak Roblox (30%).  
Contoh: beli 100 Robux, terima 70 Robux.

• **After Tax**
Pajak ditanggung admin, Robux diterima penuh.  
Contoh: beli 100 Robux, terima 100 Robux bersih.

• **GIG (Gift In Game)**
Item atau gamepass dikirim langsung melalui dalam game.

━━━━━━━━━━━━━━━━━━

** Apa Itu Rate? **

Rate adalah harga per 1 Robux.  
Contoh: rate 75 berarti 1 Robux = 75 rupiah.  
Jika beli 100 Robux → 100 × 75 = 7.500 rupiah.

** Gimana caranya order? **

1. Buat tiket di <#1448898303080009890> lalu tag <@1122429462621978795>.
2. Sebutkan produk atau jumlah Robux yang ingin dibeli.
3. Lakukan pembayaran dan kirim bukti transfer.
4. Kirim username roblox kamu
5. Tunggu admin memproses pesanan.
`
)
        .setColor("#5865F2");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== ROLE INFO =====
    if (interaction.customId === "roles") {
  const embed = new EmbedBuilder()
    .setTitle("Role List & Information")
    .setDescription(
`<@&1469353777118314688>
<@&1448729347404988526> 
<@&1448729340513747058>  
<@&1448729350961631294> 
<@&1441620125739520052> 
<@&1449581791072751676>
`)
    .setColor("#5865F2");

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

    // ===== BUY =====
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