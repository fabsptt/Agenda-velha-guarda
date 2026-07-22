require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

// -----------------------------------------------------------------------
// ESTATÍSTICAS (persistência em ficheiro)
// -----------------------------------------------------------------------
// Guarda: (1) quem criou cada evento e em que semana, e (2) cada
// participação confirmada (1ª vez que alguém entra numa vaga de um evento).
// Isto permite calcular "quem puxou mais conteúdo" e o "top participantes"
// por semana ou no geral, mesmo depois de reiniciar o bot.
const STATS_FILE = path.join(__dirname, 'stats.json');

function loadStats() {
    try {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        const data = JSON.parse(raw);
        return {
            eventos: Array.isArray(data.eventos) ? data.eventos : [],
            participacoes: Array.isArray(data.participacoes) ? data.participacoes : []
        };
    } catch (err) {
        return { eventos: [], participacoes: [] };
    }
}

function saveStats() {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error('Erro ao gravar stats.json:', err);
    }
}

// Devolve a semana ISO (ex: "2026-W30") de uma data, para agrupar por semana.
function getSemanaISO(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

const stats = loadStats();

function registarEventoCriado(criadorId, criadorNome, tipo) {
    const agora = new Date();
    stats.eventos.push({
        criadorId,
        criadorNome,
        tipo,
        semana: getSemanaISO(agora),
        timestamp: agora.toISOString()
    });
    saveStats();
}

function registarParticipacao(userId, nome) {
    const agora = new Date();
    stats.participacoes.push({
        userId,
        nome,
        semana: getSemanaISO(agora),
        timestamp: agora.toISOString()
    });
    saveStats();
}

// -----------------------------------------------------------------------
// DEFINIÇÃO DAS FUNÇÕES (ROLES) POR TIPO DE CONTEÚDO
// -----------------------------------------------------------------------
// Para "Dg Avaloniana" as vagas são fixas (não pedimos tanks/healers/dps
// ao criar o evento), e o total de participantes está limitado a 20.
const ROLE_SETS = {
    'Dg Avaloniana': {
        globalCap: 20,
        // Estas são as 5 classes fixas que têm de estar todas preenchidas
        // para a dungeon poder avançar.
        rolesObrigatorios: ['caller', 'offtank', 'mainhealer', 'shadowcaller', 'greatarcane'],
        roles: [
            { id: 'caller',        label: 'Caller',         emoji: '<:Truebolt:1512491138039287958>', max: 1,  style: ButtonStyle.Primary },
            { id: 'offtank',       label: 'Offtank',        emoji: '<:Incubus:1512491042891497642>',  max: 1,  style: ButtonStyle.Primary },
            { id: 'mainhealer',    label: 'MainHealer',     emoji: '<:Hallowfall:1512491167952932936>', max: 1,  style: ButtonStyle.Success },
            { id: 'shadowcaller',  label: 'ShadowCaller',   emoji: '<:Shadowcaller:1512491101968404631>', max: 1,  style: ButtonStyle.Primary },
            { id: 'greatarcane',   label: 'GreatArcane',    emoji: '<:Great_Arcane:1513526429667688458>', max: 1,  style: ButtonStyle.Primary },
            { id: 'crystalreaper', label: 'Crystal Reaper', emoji: '<:Crystal_Reaper:1513526314429190184>', max: 10, style: ButtonStyle.Danger },
            { id: 'outrosdps',     label: 'Outros Dps',     emoji: '<:Blazing:1512491011220443327>',  max: 10, style: ButtonStyle.Danger },
            { id: 'dpshealer',     label: 'Dps Healer',     emoji: '<:Hallowfall:1512491167952932936>', max: 1,  style: ButtonStyle.Success }
        ]
    }
};

// Todos os outros tipos usam o esquema genérico Tank / Healer / DPS,
// com os máximos definidos pelas opções do comando.
function criarRolesPorDefeito(interaction) {
    return [
        { id: 'tank',   label: 'Tank',   emoji: '🛡',  max: interaction.options.getInteger('tanks'),   style: ButtonStyle.Primary },
        { id: 'healer', label: 'Healer', emoji: '💚', max: interaction.options.getInteger('healers'), style: ButtonStyle.Success },
        { id: 'dps',    label: 'DPS',    emoji: '⚔',  max: interaction.options.getInteger('dps'),     style: ButtonStyle.Danger }
    ];
}

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

    // Nota: estas 3 opções ficam opcionais porque "Dg Avaloniana" usa
    // vagas fixas e não precisa delas. Para os restantes tipos continuam
    // a ser validadas como obrigatórias no momento da execução.
    .addIntegerOption(option =>
        option.setName('tanks')
            .setDescription('Número de tanks (não aplicável a Dg Avaloniana)')
            .setRequired(false))

    .addIntegerOption(option =>
        option.setName('healers')
            .setDescription('Número de healers (não aplicável a Dg Avaloniana)')
            .setRequired(false))

    .addIntegerOption(option =>
        option.setName('dps')
            .setDescription('Número de DPS (não aplicável a Dg Avaloniana)')
            .setRequired(false));

// Novo comando: ranking semanal de criadores de conteúdo e top participantes.
const rankingCommand = new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Ver quem mais criou conteúdo e o top 10 de participantes')
    .addStringOption(option =>
        option.setName('periodo')
            .setDescription('Período do ranking')
            .setRequired(false)
            .addChoices(
                { name: 'Semana atual', value: 'semana' },
                { name: 'Geral (todas as semanas)', value: 'geral' }
            ));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [command.toJSON(), rankingCommand.toJSON()] }
        );

        console.log('Slash commands registados.');
    } catch (error) {
        console.error(error);
    }
})();

client.once(Events.ClientReady, () => {
    console.log(`Bot online: ${client.user.tag}`);
});

function totalParticipantes(evento) {
    return evento.roles.reduce((total, role) => total + role.members.length, 0);
}

function classesObrigatoriasCompletas(evento) {
    if (!evento.rolesObrigatorios) return true;
    return evento.rolesObrigatorios.every(id => {
        const role = evento.roles.find(r => r.id === id);
        return role && role.members.length >= role.max;
    });
}

function criarEmbed(evento) {
    const secoes = evento.roles
        .map(role => `${role.emoji} ${role.label} (${role.members.length}/${role.max})\n${role.members.join('\n') || 'Nenhum'}`)
        .join('\n\n');

    const rodape = evento.globalCap
        ? `\n\n👥 Total: ${totalParticipantes(evento)}/${evento.globalCap}`
        : '';

    const avisoClassesFixas = evento.rolesObrigatorios
        ? (classesObrigatoriasCompletas(evento)
            ? '\n\n✅ Classes fixas completas — a dungeon segue!'
            : '\n\n⚠️ Sem as 5 classes fixas completas, a dungeon não segue.')
        : '';

    return new EmbedBuilder()
        .setTitle(`⚔ ${evento.tipo}`)
        .setDescription(
`📍 Saída: ${evento.saida}
📅 Data: ${evento.data}
⏰ Hora: ${evento.hora}
🎯 Tier obrigatório: ${evento.tier}
🙋 Criado por: ${evento.criadorNome}

${secoes}${rodape}${avisoClassesFixas}`
        )
        .setColor(evento.rolesObrigatorios && !classesObrigatoriasCompletas(evento) ? 'Yellow' : 'Green');
}

function criarBotoes(evento) {
    const botoesRoles = evento.roles.map(role =>
        new ButtonBuilder()
            .setCustomId(role.id)
            .setEmoji(role.emoji)
            .setStyle(role.style)
    );

    const botaoSair = new ButtonBuilder()
        .setCustomId('sair')
        .setLabel('❌ Sair')
        .setStyle(ButtonStyle.Secondary);

    const todosBotoes = [...botoesRoles, botaoSair];

    // Discord permite no máximo 5 botões por linha.
    const linhas = [];
    for (let i = 0; i < todosBotoes.length; i += 5) {
        linhas.push(new ActionRowBuilder().addComponents(todosBotoes.slice(i, i + 5)));
    }
    return linhas;
}

// Constrói o embed de ranking (criadores + participantes) para um período.
function criarEmbedRanking(periodo) {
    const semanaAtual = getSemanaISO(new Date());

    let eventosFiltrados = stats.eventos;
    let participacoesFiltradas = stats.participacoes;
    let tituloPeriodo = 'Geral (todas as semanas)';

    if (periodo === 'semana') {
        eventosFiltrados = stats.eventos.filter(e => e.semana === semanaAtual);
        participacoesFiltradas = stats.participacoes.filter(p => p.semana === semanaAtual);
        tituloPeriodo = `Semana atual (${semanaAtual})`;
    }

    const contagemCriadores = {};
    eventosFiltrados.forEach(e => {
        contagemCriadores[e.criadorNome] = (contagemCriadores[e.criadorNome] || 0) + 1;
    });
    const rankingCriadores = Object.entries(contagemCriadores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const contagemParticipantes = {};
    participacoesFiltradas.forEach(p => {
        contagemParticipantes[p.nome] = (contagemParticipantes[p.nome] || 0) + 1;
    });
    const rankingParticipantes = Object.entries(contagemParticipantes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const medalhas = ['🥇', '🥈', '🥉'];
    const formatarLista = (lista, unidade) => {
        if (lista.length === 0) return 'Sem dados ainda.';
        return lista
            .map(([nome, count], i) => {
                const posicao = medalhas[i] || `**${i + 1}.**`;
                const rotulo = count === 1 ? unidade.singular : unidade.plural;
                return `${posicao} ${nome} — ${count} ${rotulo}`;
            })
            .join('\n');
    };

    return new EmbedBuilder()
        .setTitle(`📊 Ranking — ${tituloPeriodo}`)
        .addFields(
            {
                name: '🎯 Quem mais puxou conteúdo (criadores)',
                value: formatarLista(rankingCriadores, { singular: 'evento criado', plural: 'eventos criados' })
            },
            {
                name: '🏆 Top 10 Participantes',
                value: formatarLista(rankingParticipantes, { singular: 'participação', plural: 'participações' })
            }
        )
        .setColor('Blue');
}

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'ranking') {
            const periodo = interaction.options.getString('periodo') || 'semana';
            await interaction.reply({ embeds: [criarEmbedRanking(periodo)] });
            return;
        }

        if (interaction.commandName !== 'conteudo') return;

        const tipo = interaction.options.getString('tipo');
        const roleSet = ROLE_SETS[tipo];

        let roles;
        let globalCap;
        let rolesObrigatorios;

        if (roleSet) {
            // Tipo com vagas fixas (ex: Dg Avaloniana)
            roles = roleSet.roles.map(r => ({ ...r, members: [] }));
            globalCap = roleSet.globalCap;
            rolesObrigatorios = roleSet.rolesObrigatorios;
        } else {
            // Tipo genérico: tanks/healers/dps são obrigatórios aqui
            const tanks = interaction.options.getInteger('tanks');
            const healers = interaction.options.getInteger('healers');
            const dps = interaction.options.getInteger('dps');

            if (tanks === null || healers === null || dps === null) {
                await interaction.reply({
                    content: 'Para este tipo de conteúdo tens de indicar o número de tanks, healers e dps.',
                    ephemeral: true
                });
                return;
            }

            roles = criarRolesPorDefeito(interaction).map(r => ({ ...r, members: [] }));
            globalCap = undefined;
            rolesObrigatorios = undefined;
        }

        const criadorNome = interaction.member.displayName || interaction.user.username;

        const evento = {
            tipo,
            saida: interaction.options.getString('saida'),
            data: interaction.options.getString('data'),
            hora: interaction.options.getString('hora'),
            tier: interaction.options.getString('tier'),
            roles,
            globalCap,
            rolesObrigatorios,
            criadorId: interaction.user.id,
            criadorNome
        };

        const msg = await interaction.reply({
            embeds: [criarEmbed(evento)],
            components: criarBotoes(evento),
            fetchReply: true
        });

        eventos.set(msg.id, evento);

        // Regista para efeitos de ranking semanal de criadores.
        registarEventoCriado(interaction.user.id, criadorNome, tipo);
    }

    if (interaction.isButton()) {

        const evento = eventos.get(interaction.message.id);

        if (!evento) return;

        const nome = interaction.member.displayName || interaction.user.username;
        const jaInscritoEm = evento.roles.find(role => role.members.includes(nome));

        if (interaction.customId !== 'sair') {
            const role = evento.roles.find(r => r.id === interaction.customId);

            if (role && !(jaInscritoEm && jaInscritoEm.id === role.id)) {
                // Se o utilizador mudar de vaga, o total global não sobe,
                // por isso não conta a vaga antiga ao verificar o limite.
                const totalAtual = totalParticipantes(evento) - (jaInscritoEm ? 1 : 0);
                const abaixoDoLimiteGlobal = !evento.globalCap || totalAtual < evento.globalCap;

                if (role.members.length < role.max && abaixoDoLimiteGlobal) {
                    const eraNovoParticipante = !jaInscritoEm;

                    if (jaInscritoEm) {
                        jaInscritoEm.members = jaInscritoEm.members.filter(x => x !== nome);
                    }
                    role.members.push(nome);

                    // Só conta para o ranking de participantes na 1ª vez que
                    // entra neste evento (trocar de vaga não conta de novo).
                    if (eraNovoParticipante) {
                        registarParticipacao(interaction.user.id, nome);
                    }
                } else {
                    // Vaga cheia ou limite global atingido: avisa o utilizador
                    // sem alterar o embed (a interação só pode ter uma resposta).
                    await interaction.reply({
                        content: evento.globalCap && totalAtual >= evento.globalCap
                            ? 'O evento já atingiu o limite de 20 participantes.'
                            : 'Essa vaga já está preenchida.',
                        ephemeral: true
                    });
                    return;
                }
            }
        } else if (jaInscritoEm) {
            jaInscritoEm.members = jaInscritoEm.members.filter(x => x !== nome);
        }

        await interaction.update({
            embeds: [criarEmbed(evento)]
        });
    }
});

client.login(process.env.TOKEN);
