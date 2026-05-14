const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
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

// memória dos eventos
const events = new Map();

/* ---------------- REGISTER COMMAND ---------------- */
const commands = [
    new SlashCommandBuilder()
        .setName('conteudo')
        .setDescription('Criar evento Albion')
        .addStringOption(opt =>
            opt.setName('tipo')
                .setDescription('Tipo de conteúdo')
                .setRequired(true)
                .addChoices(
                    { name: 'Avaroads', value: 'Avaroads' },
                    { name: 'DGS Grupo', value: 'DGS Grupo' },
                    { name: 'Gank', value: 'Gank' },
                    { name: 'Estática', value: 'Estática' },
                    { name: 'ZVZ', value: 'ZVZ' }
                )
        )
        .addStringOption(opt =>
            opt.setName('data').setDescription('Ex: 25/05/2026').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('hora').setDescription('Ex: 21:30').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('tanks').setDescription('Número de tanks').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('healers').setDescription('Número de healers').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('dps').setDescription('Número de DPS').setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
    );
    console.log("Slash commands registados!");
}

/* ---------------- EMBED CREATOR ---------------- */
function createEmbed(event) {
    return new EmbedBuilder()
        .setTitle(`📌 Evento Albion - ${event.tipo}`)
        .setColor(0x00AE86)
        .addFields(
            { name: "📅 Data", value: event.data, inline: true },
            { name: "⏰ Hora", value: event.hora, inline: true },
            { name: "🛡 Tanks", value: `${event.tanksLimit}`, inline: true },
            { name: "💚 Healers", value: `${event.healersLimit}`, inline: true },
            { name: "⚔ DPS", value: `${event.dpsLimit}`, inline: true },
            {
                name: "👥 Inscritos",
                value: event.players.length > 0 ? event.players.join("\n") : "Ninguém ainda"
            }
        );
}

/* ---------------- BUTTONS ---------------- */
client.on(Events.InteractionCreate, async interaction => {

    // Slash command
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "conteudo") {

            const id = Date.now().toString();

            const event = {
                id,
                tipo: interaction.options.getString("tipo"),
                data: interaction.options.getString("data"),
                hora: interaction.options.getString("hora"),
                tanksLimit: interaction.options.getInteger("tanks"),
                healersLimit: interaction.options.getInteger("healers"),
                dpsLimit: interaction.options.getInteger("dps"),
                players: [],
                creator: interaction.user.id
            };

            events.set(id, event);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`join_${id}`)
                    .setLabel("Participar")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`leave_${id}`)
                    .setLabel("Sair")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`delete_${id}`)
                    .setLabel("Apagar")
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.reply({
                embeds: [createEmbed(event)],
                components: [row]
            });
        }
    }

    // BUTTONS
    if (interaction.isButton()) {

        const [action, id] = interaction.customId.split("_");
        const event = events.get(id);
        if (!event) return;

        const userTag = interaction.user.tag;

        if (action === "join") {
            if (!event.players.includes(userTag)) {
                event.players.push(userTag);
            }
        }

        if (action === "leave") {
            event.players = event.players.filter(p => p !== userTag);
        }

        if (action === "delete") {
            if (interaction.user.id !== event.creator && !interaction.memberPermissions.has("Administrator")) {
                return interaction.reply({ content: "Sem permissão.", ephemeral: true });
            }
            events.delete(id);
            return interaction.message.delete();
        }

        const updatedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`join_${id}`)
                .setLabel("Participar")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`leave_${id}`)
                .setLabel("Sair")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`delete_${id}`)
                .setLabel("Apagar")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
            embeds: [createEmbed(event)],
            components: [updatedRow]
        });
    }
});

/* ---------------- START ---------------- */
client.once("ready", async () => {
    console.log(`Bot online como ${client.user.tag}`);
});

(async () => {
    await registerCommands();
    client.login(TOKEN);
})();
