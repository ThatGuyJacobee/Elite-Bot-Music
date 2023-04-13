const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Permissions } = require("discord.js");
const ebmusic = require("../../models/ebmusic.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song!"),
    async execute(interaction) {
        const guildid = interaction.guild.id;
        const DJCheck = await ebmusic.findOne({
            where: {
                GuildID: guildid
            }
        });

        if (DJCheck) {
            if (DJCheck.DJToggle == true && !interaction.member.roles.cache.has(DJCheck.DJRole)) return interaction.reply({ content: `❌ | DJ Mode is active! You must have the DJ role <@&${DJCheck.DJRole}> to use any music commands!`, ephemeral: true });
        }
        
        const queue = player.getQueue(interaction.guild);

        if (!queue || !queue.playing) return interaction.reply({ content: `❌ | No music is currently being played!` });
        if (!interaction.member.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in a voice channel!", ephemeral: true });
        if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in my voice channel!", ephemeral: true });
        queue.skip();

        const skipembed = new MessageEmbed()
        .setAuthor(interaction.client.user.tag, interaction.client.user.displayAvatarURL())
        .setThumbnail(queue.tracks[0].thumbnail)
        .setColor(0xFF0000)
        .setTitle(`Song skipped ⏭️`)
        .setDescription(`Now playing: ${queue.tracks[0]} ([Link](${queue.tracks[0].url}))`)
        .setTimestamp()
        .setFooter(`Requested by: ${interaction.user.tag}`)

        interaction.reply({ embeds: [skipembed] })
    }
}