const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// armazenamento simples
const events = {};

// 🔥 REGISTAR COMANDO AUTOMATICAMENTE
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('conteudo')
      .setDescription('Criar conteúdo Albion Online')
      .addStringOption(option =>
        option.setName('data')
          .setDescription('Data e hora do evento')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('tanks')
          .setDescription('Número de tanks')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('healers')
          .setDescription('Número de healers')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('dps')
          .setDescription('Número de DPS')
          .setRequired(true))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log('✅ Slash command registado');
}

client.once('ready', async () => {
  console.log(`Bot ligado como ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (err) {
    console.error('Erro ao registar comandos:', err);
  }
});

client.on(Events.InteractionCreate, async interaction => {

  // /conteudo
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'conteudo') {

      const data = interaction.options.getString('data');
      const tanks = interaction.options.getInteger('tanks');
      const healers = interaction.options.getInteger('healers');
      const dps = interaction.options.getInteger('dps');

      const embed = new EmbedBuilder()
        .setTitle('⚔ Conteúdo Albion Online')
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
          .setStyle(ButtonStyle.Danger)
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

client.login(TOKEN)
