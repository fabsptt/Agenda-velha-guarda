const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`Bot online!`);
});

client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'evento') {

      const embed = new EmbedBuilder()
        .setTitle('⚔️ Velha Guarda Evento ⚔️')
        .setDescription(`
📍 Static T6
🕒 22:00

🛡️ Tank (0/2)

✚ Healer (0/1)

🗡️ DPS (0/5)
        `)
        .setColor('Gold');

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('tank')
            .setLabel('Tank')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('healer')
            .setLabel('Healer')
            .setEmoji('✚')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('dps')
            .setLabel('DPS')
            .setEmoji('🗡️')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }
});

client.login(process.env.TOKEN);
