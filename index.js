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

/* =========================
   SLASH COMMAND
========================= */

const commands = [
    new SlashCommandBuilder()
        .setName('conteudo')
        .setDescription('Criar conteúdo Albion')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de conteúdo')
                .setRequired(true)
                .addChoices(
                    { name: 'Roads', value: 'Roads' },
                    { name: 'DGGrupo', value: 'DGGrupo' },
                    { name: 'Estatica', value: 'Estatica' },
                    { name: 'Gank', value: 'Gank' },
                    { name: 'ZvZ', value: 'ZvZ' }
                )
        )
        .addStringOption(option =>
            option.setName('data')
                .setDescription('Ex: 16/05/2026')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('hora')
                .setDescription('Ex: 21:30')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('tanks')
                .setDescription('Número de tanks')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('healers')
                .setDescription('Número de healers')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('dps')
                .setDescription('Número de DPS')
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

/* =========================
   BOT ONLINE + REGISTER COMMANDS
========================= */

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Online: ${c.user.tag}`);

    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Slash commands registados');

    } catch (err) {
        console.error('Erro ao registar commands:', err);
    }
});

/* =========================
   EMBED
========================= */

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
        )
        .setFooter({ text: 'Velha Guarda • Albion Online' });
}

/* =========================
   INTERAÇÕES
========================= */

client.on(Events.InteractionCreate, async interaction => {

    /* -------------------------
       /conteudo
    ------------------------- */
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'conteudo') {

            const evento = {
                criador: interaction.user.id,

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
                    .setLabel('🛡 Tank')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('healer')
                    .setLabel('✚ Healer')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('dps')
                    .setLabel('🔪 DPS')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('sair')
                    .setLabel('❌ Sair')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('apagar')
                    .setLabel('🗑 Apagar')
                    .setStyle(ButtonStyle.Danger)
            );

            const mensagem = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            eventos.set(mensagem.id, evento);
        }
    }

    /* -------------------------
       BOTÕES
    ------------------------- */

    if (!interaction.isButton()) return;

    const evento = eventos.get(interaction.message.id);
    if (!evento) return;

    const nome = interaction.member.displayName;

    /* -------------------------
       APAGAR
    ------------------------- */
    if (interaction.customId === 'apagar') {

        if (interaction.user.id !== evento.criador) {
            return interaction.reply({
                content: '❌ Só o criador pode apagar.',
                ephemeral: true
            });
        }

        eventos.delete(interaction.message.id);
        await interaction.message.delete();
        return;
    }

    /* -------------------------
       REMOVER DE TODAS LISTAS
    ------------------------- */
    evento.tanksUsers = evento.tanksUsers.filter(x => x !== nome);
    evento.healersUsers = evento.healersUsers.filter(x => x !== nome);
    evento.dpsUsers = evento.dpsUsers.filter(x => x !== nome);

    /* -------------------------
       TANK
    ------------------------- */
    if (interaction.customId === 'tank') {

        if (evento.tanksUsers.length >= evento.maxTanks) {
            return interaction.reply({
                content: '❌ Tanks cheios.',
                ephemeral: true
            });
        }

        evento.tanksUsers.push(nome);
    }

    /* -------------------------
       HEALER
    ------------------------- */
    if (interaction.customId === 'healer') {

        if (evento.healersUsers.length >= evento.maxHealers) {
            return interaction.reply({
                content: '❌ Healers cheios.',
                ephemeral: true
            });
        }

        evento.healersUsers.push(nome);
    }

    /* -------------------------
       DPS
    ------------------------- */
    if (interaction.customId === 'dps') {

        if (evento.dpsUsers.length >= evento.maxDps) {
            return interaction.reply({
                content: '❌ DPS cheios.',
                ephemeral: true
            });
        }

        evento.dpsUsers.push(nome);
    }

    /* -------------------------
       SAIR
    ------------------------- */
    if (interaction.customId === 'sair') {

        evento.tanksUsers = evento.tanksUsers.filter(x => x !== nome);
        evento.healersUsers = evento.healersUsers.filter(x => x !== nome);
        evento.dpsUsers = evento.dpsUsers.filter(x => x !== nome);
    }

    /* -------------------------
       UPDATE EMBED
    ------------------------- */
    const novoEmbed = criarEmbed(evento);

    await interaction.update({
        embeds: [novoEmbed]
    });
});

/* =========================
   LOGIN
========================= */

client.login(TOKEN);
