const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// guardar eventos em memória
const events = {};

// 🔥 REGISTAR COMANDO AUTOMATICAMENTE
async function registerCommand() {
  const commands = [
    new SlashCommandBuilder()
      .setName('conteudo')
      .setDescription('Criar evento Albion')
      .addStringOption(o =>
        o.setName('data')
          .setDescription('Data e hora')
          .setRequired(true))
      .addIntegerOption(o =>
        o.setName('tanks')
          .setDescription('Tanks necessários')
          .setRequired(true))
      .addIntegerOption(o =>
        o.setName('healers')
          .setDescription('Healers necessários')
          .setRequired(true))
      .addIntegerOption(o =>
        o.setName('dps')
          .setDescription('DPS necessários')
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
  console.log(`Bot online como ${client.user.tag}`);

  try {
    await registerCommand();
  } catch (err) {
    console.error('Erro ao registar comandos:', err);
  }
});

// 🎮 /conteudo
client.on('interactionCreate', async interaction => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'conteudo') {

      const id = Date.now().toString();

      events[id] = {
        tanks: [],
        healers: [],
        dps: [],
        maxTanks: interaction.options.getInteger('tanks'),
        maxHealers: interaction.options.getInteger('healers'),
        maxDps: interaction.options.getInteger('dps')
      };

      const embed = new EmbedBuilder()
        .setTitle('⚔ Evento Albion Online')
        .setDescription(
`📅 ${interaction.options.getString('data')}

🛡 Tanks: 0/${events[id].maxTanks}
💚 Healers: 0/${events[id].maxHealers}
🗡 DPS: 0/${events[id].maxDps}`
        )
        .setColor('Green');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`tank_${id}`)
          .setLabel('🛡 Tank')
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`healer_${id}`)
          .setLabel('💚 Healer')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`dps_${id}`)
          .setLabel('🗡 DPS')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`leave_${id}`)
          .setLabel('❌ Sair')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // 🔘 BOTÕES
  if (interaction.isButton()) {

    const [type, id] = interaction.customId.split('_');

    const event = events[id];
    if (!event) return;

    const user = interaction.user.username;

    // remover primeiro
    event.tanks = event.tanks.filter(u => u !== user);
    event.healers = event.healers.filter(u => u !== user);
    event.dps = event.dps.filter(u => u !== user);

    if (type === 'tank' && event.tanks.length < event.maxTanks) {
      event.tanks.push(user);
    }

    if (type === 'healer' && event.healers.length < event.maxHealers) {
      event.healers.push(user);
    }

    if (type === 'dps' && event.dps.length < event.maxDps) {
      event.dps.push(user);
    }

    if (type === 'leave') {
      // já removido acima
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔ Evento Albion Online')
      .setDescription(
`🛡 Tanks: ${event.tanks.length}/${event.maxTanks}
💚 Healers: ${event.healers.length}/${event.maxHealers}
🗡 DPS: ${event.dps.length}/${event.maxDps}`
      )
      .setColor('Green');

    await interaction.update({
      embeds: [embed]
    });
  }
});

client.login(TOKEN);
