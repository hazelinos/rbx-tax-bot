module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    const replies = {
      "halo": "Halo juga 👋",
      "hai": "Haiii!",
      "thanks": "Sama-sama 😄",
      "makasih": "Sama-sama 😄",
      "pajak": "Gunakan `/tax` ya 💸"
    };

    for (const key in replies) {
      if (msg.includes(key)) {
        return message.reply(replies[key]);
      }
    }
  }
};