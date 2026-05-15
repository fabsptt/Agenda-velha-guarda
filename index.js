const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const eventos = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('conteudo')
        .setDescription('Criar conteúdo')
        .addStringOption(option =>
            option
                .setName('tipo')
                .setDescription('Tipo de conteúdo')
                .setRequired(true)
                .addChoices(
                    { name: 'Avaroads', value: 'Avaroads' },
                    { name: 'DGGrupo, value: 'DGGrupo' },
                    { name: 'Estatica, value: 'Estatica' },
                    { name: 'Gank', value: 'Gank' },
                    { name: 'ZvZ', value: 'ZvZ' }
                )
        )
        .addStringOption(option =>
            option
                .setName('data')
                .setDescription('Data')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('hora')
                .setDescription('Hora')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('tanks')
                .setDescription('Número tanks')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('healers')
                .setDescription('Número healers')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('dps')
                .setDescription('Número DPS')
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('Commands registados');

    } catch (error) {
        console.error(error);
    }
})();

client.once(Events.ClientReady, c => {
    console.log(`Online: ${c.user.tag}`);
});

function criarEmbed(evento) {

    return new EmbedBuilder()
        .setTitle('⚔️ Evento Velha Guarda')
        .setColor('#00b0f4')
        .addFields(
            {
                name: '📌 Conteúdo',
                value: evento.tipo
            },
            {
                name: '📅 Data',
                value: evento.data,
                inline: true
            },
            {
                name: '🕒 Hora',
                value: evento.hora,
                inline: true
            },
            {
                name: `🛡️ Tanks ${evento.tanksUsers.length}/${evento.maxTanks}`,
                value: evento.tanksUsers.join('\n') || 'vazio'
            },
            {
                name: `✚ Healers ${evento.healersUsers.length}/${evento.maxHealers}`,
                value: evento.healersUsers.join('\n') || 'vazio'
            },
            {
                name: `🔪 DPS ${evento.dpsUsers.length}/${evento.maxDps}`,
                value: evento.dpsUsers.join('\n') || 'vazio'
            }
        );
}

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'conteudo') {

            const evento = {
                tipo: interaction.options.getString('tipo'),
                data: interaction.options.getString('data'),
                hora: interaction.options.getString('hora'),

                maxTanks: interaction.options.getInteger('tanks'),
                maxHealers: interaction.options.getInteger('healers'),
                maxDps: interaction.options.getInteger('dps'),

                tanksUsers: [],
                healersUsers: [],
                dpsUsers: []
            };

            const embed = criarEmbed(evento);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('tank')
                    .setLabel('🛡️ Tank')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('healer')
                    .setLabel('✚ Healer')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('dps')
                    .setLabel('🔪 DPS')
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId('sair')
                    .setLabel('❌ Sair')
                    .setStyle(ButtonStyle.Secondary)
            );

            const mensagem = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            eventos.set(mensagem.id, evento);
        }
    }

    if (interaction.isButton()) {

        const evento = eventos.get(interaction.message.id);

        if (!evento) return;

        const nome = interaction.user.username;

        evento.tanksUsers =
            evento.tanksUsers.filter(x => x !== nome);

        evento.healersUsers =
            evento.healersUsers.filter(x => x !== nome);

        evento.dpsUsers =
            evento.dpsUsers.filter(x => x !== nome);

        if (interaction.customId === 'tank') {

            if (evento.tanksUsers.length < evento.maxTanks) {
                evento.tanksUsers.push(nome);
            }
        }

        if (interaction.customId === 'healer') {

            if (evento.healersUsers.length < evento.maxHealers) {
                evento.healersUsers.push(nome);
            }
        }

        if (interaction.customId === 'dps') {

            if (evento.dpsUsers.length < evento.maxDps) {
                evento.dpsUsers.push(nome);
            }
        }

        const novoEmbed = criarEmbed(evento);

        await interaction.update({
            embeds: [novoEmbed]
        });
    }
});

client.login(TOKEN);
