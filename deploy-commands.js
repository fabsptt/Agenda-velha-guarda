const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('conteudo')
    .setDescription('Criar conteúdo Albion')
    .addStringOption(option =>
      option.setName('data')
        .setDescription('Dia e hora')
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
        .setDescription('Número de dps')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Slash commands registados.');

  } catch (error) {
    console.error(error);
  }
})();
