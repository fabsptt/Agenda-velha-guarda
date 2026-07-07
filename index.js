require('dotenv').config();

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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const eventos = new Map();
const eventosAvaloniana = new Map();

const tiers = [
    "4", "4.1", "4.2", "4.3", "4.4",
    "5", "5.1", "5.2", "5.3", "5.4",
    "6", "6.1", "6.2", "6.3", "6.4",
    "7", "7.1", "7.2", "7.3", "7.4",
    "8.0", "8.1", "8.2", "8.3", "8.4"
];

const command = new SlashCommandBuilder()
    .setName('conteudo')
    .setDescription('Criar conteúdo Albion')

const avalonianaCommand = new SlashCommandBuilder()
    .setName('avaloniana')
    .setDescription('Criar uma Dungeon Avaloniana')
    .addStringOption(option =>
        option.setName('saida')
            .setDescription('Cidade de saída')
            .setRequired(true)
            .addChoices(
                { name: 'Lymhurst', value: 'Lymhurst' },
                { name: 'Lymhurst Portal', value: 'Lymhurst Portal' },
                { name: 'Brecilien', value: 'Brecilien' }
            ))
    .addStringOption(option =>
        option.setName('data')
            .setDescription('Ex: 07/07/2026')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('hora')
            .setDescription('Ex: 21:00')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('tier')
            .setDescription('Tier obrigatório')
            .setRequired(true)
            .addChoices(
                ...tiers.map(t => ({ name: t, value: t }))
            ));

    .addStringOption(option =>
        option.setName('tipo')
            .setDescription('Tipo de conteúdo')
            .setRequired(true)
            .addChoices(
                { name: 'AvaRoads', value: 'AvaRoads' },
                { name: 'DgGrupo', value: 'DgGrupo' },
                { name: 'Estática', value: 'Estática' },
                { name: 'Mundo Aberto (Fama/Pve)', value: 'Mundo Aberto (Fama/Pve)' },
                { name: 'Mundo Aberto (PVP/Roaming)', value: 'Mundo Aberto (PVP/Roaming)' },
                { name: 'Cofres/Aranhas (Objetivos)', value: 'Cofres/Aranhas (Objetivos)' },
                { name: 'Hellgate 2v2', value: 'Hellgate 2v2' },
                { name: 'Hellgate 5v5', value: 'Hellgate 5v5' },
                { name: 'Arena de Cristal', value: 'Arena de Cristal' },
                { name: 'Liga de Cristal 5v5', value: 'Liga de Cristal 5v5' },
                { name: 'Liga de Cristal 20v20', value: 'Liga de Cristal 20v20' },
                { name: 'Depths', value: 'Depths' },
                { name: 'Gank', value: 'Gank' },
                { name: 'Caçadas', value: 'Caçadas' },
                { name: 'Transporte de Facção', value: 'Transporte de Faccão' },
                { name: 'Facção', value: 'Facção' },
                { name: 'HCE', value: 'HCE' },
                { name: 'ZvZ', value: 'ZvZ' }
            ))

    .addStringOption(option =>
        option.setName('saida')
            .setDescription('Cidade de saída')
            .setRequired(true)
            .addChoices(
                { name: 'Lymhurst', value: 'Lymhurst' },
                { name: 'Lymhurst Portal', value: 'Lymhurst Portal' },
                { name: 'Brecilien', value: 'Brecilien' }
            ))

    .addStringOption(option =>
        option.setName('data')
            .setDescription('Ex: 28/05/2026')
            .setRequired(true))

    .addStringOption(option =>
        option.setName('hora')
            .setDescription('Ex: 21:00')
            .setRequired(true))

    .addStringOption(option =>
        option.setName('tier')
            .setDescription('Tier obrigatório')
            .setRequired(true)
            .addChoices(
                ...tiers.map(t => ({ name: t, value: t }))
            ))

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
            .setRequired(true));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [
    command.toJSON(),
    avalonianaCommand.toJSON()
] }
        );

        console.log('Slash command registado.');
    } catch (error) {
        console.error(error);
    }
})();

client.once(Events.ClientReady, () => {
    console.log(`Bot online: ${client.user.tag}`);
});

function criarEmbed(evento) {
    return new EmbedBuilder()
        .setTitle(`⚔ ${evento.tipo}`)
        .setDescription(
`📍 Saída: ${evento.saida}
📅 Data: ${evento.data}
⏰ Hora: ${evento.hora}
🎯 Tier obrigatório: ${evento.tier}

🛡 Tanks (${evento.tanks.length}/${evento.maxTanks})
${evento.tanks.join('\n') || 'Nenhum'}

💚 Healers (${evento.healers.length}/${evento.maxHealers})
${evento.healers.join('\n') || 'Nenhum'}

⚔ DPS (${evento.dps.length}/${evento.maxDps})
${evento.dps.join('\n') || 'Nenhum'}
`
        )
        .setColor('Green');
}

function criarEmbedAvaloniana(evento) {

    return new EmbedBuilder()
        .setTitle("⚔ Dungeon Avaloniana")
        .setDescription(`
📍 Saída: ${evento.saida}
📅 Data: ${evento.data}
⏰ Hora: ${evento.hora}
🎯 Tier: ${evento.tier}

🛡 Tank (${evento.tank.length}/1)
${evento.tank.join("\n") || "Nenhum"}

🛡 Off Tank (${evento.offtank.length}/1)
${evento.offtank.join("\n") || "Nenhum"}

💚 Main Healer (${evento.mainhealer.length}/1)
${evento.mainhealer.join("\n") || "Nenhum"}

🌑 Shadow Caller (${evento.shadowcaller.length}/1)
${evento.shadowcaller.join("\n") || "Nenhum"}

💎 Crystal Reaper (${evento.crystal.length}/99)
${evento.crystal.join("\n") || "Nenhum"}

💚⚔ Healer DPS (${evento.healerdps.length}/1)
${evento.healerdps.join("\n") || "Nenhum"}

✨ Great Arcane (${evento.arcane.length}/1)
${evento.arcane.join("\n") || "Nenhum"}

⚔ Other DPS (${evento.otherdps.length}/99)
${evento.otherdps.join("\n") || "Nenhum"}
`)
.setColor("DarkBlue");

}

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        const evento = {
            tipo: interaction.options.getString('tipo'),
            saida: interaction.options.getString('saida'),
            data: interaction.options.getString('data'),
            hora: interaction.options.getString('hora'),
            tier: interaction.options.getString('tier'),

            maxTanks: interaction.options.getInteger('tanks'),
            maxHealers: interaction.options.getInteger('healers'),
            maxDps: interaction.options.getInteger('dps'),

            tanks: [],
            healers: [],
            dps: []
        };

        const buttons = new ActionRowBuilder().addComponents(
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
                .setLabel('⚔ DPS')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('sair')
                .setLabel('❌ Sair')
                .setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({
            embeds: [criarEmbed(evento)],
            components: [buttons],
            fetchReply: true
        });

        eventos.set(msg.id, evento);
    }

if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "avaloniana"
) {

    const evento = {

        saida: interaction.options.getString("saida"),
        data: interaction.options.getString("data"),
        hora: interaction.options.getString("hora"),
        tier: interaction.options.getString("tier"),

        tank: [],
        offtank: [],
        mainhealer: [],
        shadowcaller: [],
        crystal: [],
        healerdps: [],
        arcane: [],
        otherdps: []

    };

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("tank").setLabel("Tank").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("offtank").setLabel("Off Tank").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("mainhealer").setLabel("Main Healer").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("shadowcaller").setLabel("Shadow Caller").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("crystal").setLabel("Crystal Reaper").setStyle(ButtonStyle.Danger)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("healerdps").setLabel("Healer DPS").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("arcane").setLabel("Great Arcane").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("otherdps").setLabel("Other DPS").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("sairava").setLabel("Sair").setStyle(ButtonStyle.Secondary)
        );

    const msg = await interaction.reply({

        embeds: [criarEmbedAvaloniana(evento)],
        components: [row1, row2],
        fetchReply: true

    });

    eventosAvaloniana.set(msg.id, evento);

}

// ===============================
// BOTÕES DA AVALONIANA
// ===============================

if (interaction.isButton()) {

    const evento = eventosAvaloniana.get(interaction.message.id);

    if (evento) {

        const nome = interaction.member.displayName || interaction.user.username;

        // Remove o jogador de todas as funções
        evento.tank = evento.tank.filter(x => x !== nome);
        evento.offtank = evento.offtank.filter(x => x !== nome);
        evento.mainhealer = evento.mainhealer.filter(x => x !== nome);
        evento.shadowcaller = evento.shadowcaller.filter(x => x !== nome);
        evento.crystal = evento.crystal.filter(x => x !== nome);
        evento.healerdps = evento.healerdps.filter(x => x !== nome);
        evento.arcane = evento.arcane.filter(x => x !== nome);
        evento.otherdps = evento.otherdps.filter(x => x !== nome);

        switch (interaction.customId) {

            case "tank":
                if (evento.tank.length < 1)
                    evento.tank.push(nome);
                break;

            case "offtank":
                if (evento.offtank.length < 1)
                    evento.offtank.push(nome);
                break;

            case "mainhealer":
                if (evento.mainhealer.length < 1)
                    evento.mainhealer.push(nome);
                break;

            case "shadowcaller":
                if (evento.shadowcaller.length < 1)
                    evento.shadowcaller.push(nome);
                break;

            case "crystal":
                if (evento.crystal.length < 99)
                    evento.crystal.push(nome);
                break;

            case "healerdps":
                if (evento.healerdps.length < 1)
                    evento.healerdps.push(nome);
                break;

            case "arcane":
                if (evento.arcane.length < 1)
                    evento.arcane.push(nome);
                break;

            case "otherdps":
                if (evento.otherdps.length < 99)
                    evento.otherdps.push(nome);
                break;

            case "sairava":
                // Já foi removido de todas as listas acima
                break;
        }

        await interaction.update({
            embeds: [criarEmbedAvaloniana(evento)]
        });

        return;
    }
}

if (interaction.isButton()) {

    const evento = eventos.get(interaction.message.id);

    if (!evento) return;

    ...
}
    if (interaction.isButton()) {

        const evento = eventos.get(interaction.message.id);

        if (!evento) return;

        const nome = interaction.member.displayName || interaction.user.username;

        evento.tanks = evento.tanks.filter(x => x !== nome);
        evento.healers = evento.healers.filter(x => x !== nome);
        evento.dps = evento.dps.filter(x => x !== nome);

        if (interaction.customId === 'tank') {
            if (evento.tanks.length < evento.maxTanks)
                evento.tanks.push(nome);
        }

        if (interaction.customId === 'healer') {
            if (evento.healers.length < evento.maxHealers)
                evento.healers.push(nome);
        }

        if (interaction.customId === 'dps') {
            if (evento.dps.length < evento.maxDps)
                evento.dps.push(nome);
        }

        await interaction.update({
            embeds: [criarEmbed(evento)]
        });
    }
});

client.login(process.env.TOKEN);
