const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const TAX = 0.3;
const format = n => n.toLocaleString('id-ID');

const EMBED_COLOR = 0x1F6FEB;

module.exports = {

  data: new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')

    .addIntegerOption(o =>
      o.setName('jumlah')
        .setDescription('Jumlah robux')
        .setRequired(true))

    .addStringOption(o =>
      o.setName('jenis')
        .setDescription('After atau Before tax')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        )
        .setRequired(true))

    .addIntegerOption(o =>
      o.setName('rate')
        .setDescription('Harga per robux')
        .setRequired(true)),


  async execute(interaction) {

    const jumlah = interaction.options.getInteger('jumlah');
    const jenis  = interaction.options.getString('jenis'); // 🔥 pakai jenis aja
    const rate   = interaction.options.getInteger('rate');

    let gamepass, diterima;

    if (jenis === 'before') {
      gamepass = jumlah;
      diterima = Math.floor(jumlah * 0.7);
    } else {
      diterima = jumlah;
      gamepass = Math.ceil(jumlah / 0.7);
    }

    const harga = gamepass * rate;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Robux Tax Calculator')
      .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

Rate ${rate}`
      );

    interaction.reply({ embeds: [embed] });
  }
};