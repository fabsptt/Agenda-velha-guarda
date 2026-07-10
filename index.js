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
                { name: 'Dg Avaloniana', value: 'Dg Avaloniana' },
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
            .setRequired(False))

    .addIntegerOption(option =>
        option.setName('healers')
            .setDescription('Número de healers')
            .setRequired(False))

    .addIntegerOption(option =>
        option.setName('dps')
            .setDescription('Número de DPS')
            .setRequired(False));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [command.toJSON()] }
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
    let descricao = `📍 Saída: ${evento.saida}\n📅 Data: ${evento.data}\n⏰ Hora: ${evento.hora}\n🎯 Tier obrigatório: ${evento.tier}\n\n`;

    if (evento.tipo === 'Dg Avaloniana') {
        descricao += `🛡 Tank (${evento.tank.length}/1)\n${evento.tank.join('\n') || 'Nenhum'}\n\n`;
        descricao += `🛡 Off Tank (${evento.offTank.length}/1)\n${evento.offTank.join('\n') || 'Nenhum'}\n\n`;
        descricao += `💚 Main Healer (${evento.mainHealer.length}/1)\n${evento.mainHealer.join('\n') || 'Nenhum'}\n\n`;
        descricao += `💚 Healer Dps (${evento.healerDps.length}/1)\n${evento.healerDps.join('\n') || 'Nenhum'}\n\n`;
        descricao += `🧙‍♂️ Great Arcane Staff (${evento.greatArcane.length}/1)\n${evento.greatArcane.join('\n') || 'Nenhum'}\n\n`;
        descricao += `💀 Shadow Caller (${evento.shadowCaller.length}/1)\n${evento.shadowCaller.join('\n') || 'Nenhum'}\n\n`;
        descricao += `🌾 Crystal Reaper (${evento.crystalReaper.length}/99)\n${evento.crystalReaper.join('\n') || 'Nenhum'}\n\n`;
        descricao += `⚔ Other Dps (${evento.otherDps.length}/99)\n${evento.otherDps.join('\n') || 'Nenhum'}\n`;
    } else {
        descricao += `🛡 Tanks (${evento.tanks.length}/${evento.maxTanks})\n${evento.tanks.join('\n') || 'Nenhum'}\n\n`;
        descricao += `💚 Healers (${evento.healers.length}/${evento.maxHealers})\n${evento.healers.join('\n') || 'Nenhum'}\n\n`;
        descricao += `⚔ DPS (${evento.dps.length}/${evento.maxDps})\n${evento.dps.join('\n') || 'Nenhum'}\n`;
    }

    return new EmbedBuilder()
        .setTitle(`⚔ ${evento.tipo}`)
        .setDescription(descricao)
        .setColor('Green');
}

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {
        const tipoConteudo = interaction.options.getString('tipo');

        const evento = {
            tipo: tipoConteudo,
            saida: interaction.options.getString('saida'),
            data: interaction.options.getString('data'),
            hora: interaction.options.getString('hora'),
            tier: interaction.options.getString('tier'),
        };

        const components = [];

        if (tipoConteudo === 'Dg Avaloniana') {
            // Inicializa listas específicas da Ava
            evento.tank = [];
            evento.offTank = [];
            evento.mainHealer = [];
            evento.healerDps = [];
            evento.greatArcane = [];
            evento.shadowCaller = [];
            evento.crystalReaper = [];
            evento.otherDps = [];

            // Linha 1 de botões (Máximo 5 botões por linha)
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ava_tank').setLabel('🛡 Tank').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ava_offTank').setLabel('🛡 Off Tank').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ava_mainHealer').setLabel('💚 Main Healer').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ava_healerDps').setLabel('💚 Healer Dps').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ava_greatArcane').setLabel('🧙‍♂️ Great Arcane').setStyle(ButtonStyle.Primary)
            );

            // Linha 2 de botões
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ava_shadowCaller').setLabel('💀 Shadow Caller').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ava_crystalReaper').setLabel('🌾 Crystal Reaper').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ava_otherDps').setLabel('⚔ Other Dps').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('sair').setLabel('❌ Sair').setStyle(ButtonStyle.Secondary)
            );

            components.push(row1, row2);
        } else {
            // Lógica normal para outros conteúdos
            evento.maxTanks = interaction.options.getInteger('tanks') || 0;
            evento.maxHealers = interaction.options.getInteger('healers') || 0;
            evento.maxDps = interaction.options.getInteger('dps') || 0;
            evento.tanks = [];
            evento.healers = [];
            evento.dps = [];

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tank').setLabel('🛡 Tank').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('healer').setLabel('💚 Healer').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('dps').setLabel('⚔ DPS').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('sair').setLabel('❌ Sair').setStyle(ButtonStyle.Secondary)
            );

            components.push(row);
        }

        const msg = await interaction.reply({
            embeds: [criarEmbed(evento)],
            components: components,
            fetchReply: true
        });

        eventos.set(msg.id, evento);
    }

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

    if (interaction.isButton()) {
        const evento = eventos.get(interaction.message.id);
        if (!evento) return;

        const nome = interaction.member.displayName || interaction.user.username;

        // Limpa o utilizador de todas as listas possíveis (Normais e Avaloniana)
        if (evento.tanks) evento.tanks = evento.tanks.filter(x => x !== nome);
        if (evento.healers) evento.healers = evento.healers.filter(x => x !== nome);
        if (evento.dps) evento.dps = evento.dps.filter(x => x !== nome);
        
        if (evento.tank) evento.tank = evento.tank.filter(x => x !== nome);
        if (evento.offTank) evento.offTank = evento.offTank.filter(x => x !== nome);
        if (evento.mainHealer) evento.mainHealer = evento.mainHealer.filter(x => x !== nome);
        if (evento.healerDps) evento.healerDps = evento.healerDps.filter(x => x !== nome);
        if (evento.greatArcane) evento.greatArcane = evento.greatArcane.filter(x => x !== nome);
        if (evento.shadowCaller) evento.shadowCaller = evento.shadowCaller.filter(x => x !== nome);
        if (evento.crystalReaper) evento.crystalReaper = evento.crystalReaper.filter(x => x !== nome);
        if (evento.otherDps) evento.otherDps = evento.otherDps.filter(x => x !== nome);

        // Se clicar em Sair, apenas atualiza a embed (já foi removido acima)
        if (interaction.customId === 'sair') {
            return await interaction.update({ embeds: [criarEmbed(evento)] });
        }

        // Condições para conteúdo normal
        if (interaction.customId === 'tank' && evento.tanks.length < evento.maxTanks) evento.tanks.push(nome);
        if (interaction.customId === 'healer' && evento.healers.length < evento.maxHealers) evento.healers.push(nome);
        if (interaction.customId === 'dps' && evento.dps.length < evento.maxDps) evento.dps.push(nome);

        // Condições para DG Avaloniana (com limites pedidos)
        if (interaction.customId === 'ava_tank' && evento.tank.length < 1) evento.tank.push(nome);
        if (interaction.customId === 'ava_offTank' && evento.offTank.length < 1) evento.offTank.push(nome);
        if (interaction.customId === 'ava_mainHealer' && evento.mainHealer.length < 1) evento.mainHealer.push(nome);
        if (interaction.customId === 'ava_healerDps' && evento.healerDps.length < 1) evento.healerDps.push(nome);
        if (interaction.customId === 'ava_greatArcane' && evento.greatArcane.length < 1) evento.greatArcane.push(nome);
        if (interaction.customId === 'ava_shadowCaller' && evento.shadowCaller.length < 1) evento.shadowCaller.push(nome);
        if (interaction.customId === 'ava_crystalReaper' && evento.crystalReaper.length < 99) evento.crystalReaper.push(nome);
        if (interaction.customId === 'ava_otherDps' && evento.otherDps.length < 99) evento.otherDps.push(nome);

        await interaction.update({
            embeds: [criarEmbed(evento)]
        });
    }
});

client.login(process.env.TOKEN);
