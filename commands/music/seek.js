require("dotenv").config();
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { Player, QueryType } = require('discord-player');
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek to another time in the current song!")
        .addStringOption((option) => option
            .setName("time")
            .setDescription("The time to seek the current song (Examples: 1s, 1m, 1h)!")
            .setRequired(true)
        ),
    async execute(interaction) {
        if (process.env.ENABLE_DJMODE == true) {
            if (!interaction.member.roles.cache.has(process.env.DJ_ROLE)) return interaction.reply({ content: `❌ | DJ Mode is active! You must have the DJ role <@&${process.env.DJ_ROLE}> to use any music commands!`, ephemeral: true });
        }

        if (!interaction.member.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in a voice channel!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in my voice channel!", ephemeral: true });

        const player = Player.singleton();
        var queue = player.nodes.get(interaction.guild.id);
        if (!queue || !queue.isPlaying()) return interaction.reply({ content: `❌ | No music is currently being played!`, ephemeral: true });

        const removeamount = ms(interaction.options.getString("time"));
        
        const seekembed = new EmbedBuilder()
        .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
        .setThumbnail(interaction.guild.iconURL({dynamic: true}))
        .setColor(process.env.EMBED_COLOUR)
        .setTitle(`Seek song ↪️`)
        .setDescription(`Seeked the current song to ${ms(removeamount)}! Currently playing ${queue.currentTrack.title} ([Link](${queue.currentTrack.url})).`)
        .setTimestamp()
        .setFooter({ text: `Requested by: ${interaction.user.tag}` })

        try {
            queue.node.seek(removeamount);
            interaction.reply({ embeds: [seekembed] })
        }

        catch (err) {
            interaction.reply({ content: `❌ | Ooops... something went wrong, there was an error seeking the song. Please try again.`, ephemeral: true });
        }
    }
}