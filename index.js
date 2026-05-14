const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

  // COMANDO /conteudo
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'conteudo') {

      const data = interaction.options.getString('data');
      const tanks = interaction.options.getInteger('tanks');
      const healers = interaction.options.getInteger('healers');
      const dps = interaction.options.getInteger('dps');

      const embed = new EmbedBuilder()
        .setTitle('⚔ Conteúdo Albion')
        .setDescription(
`📅 ${data}

🛡 Tanks: 0/${tanks}

💚 Healers: 0/${healers}

🗡 DPS: 0/${dps}`
        )
        .setColor('Green');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('tank')
          .setLabel('🛡 Tank')
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId('healer')
          .setLabel('💚 Healer')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId('dps')
          .setLabel('🗡 DPS')
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // BOTÕES
  if (interaction.isButton()) {

    await interaction.reply({
      content: `${interaction.user.username} entrou como ${interaction.customId}`,
      ephemeral: true
    });
  }
});

client.login(TOKEN);
