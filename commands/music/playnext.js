require("dotenv").config();
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { Player, QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Add a song to the top of the queue!")
        .addStringOption((option) => option
            .setName("music")
            .setDescription("Either the name or URL of the song you want to play (no playlists).")
            .setRequired(true)
        ),
    async execute(interaction) {
        if (process.env.ENABLE_DJMODE == true) {
            if (!interaction.member.roles.cache.has(process.env.DJ_ROLE)) return interaction.reply({ content: `❌ | DJ Mode is active! You must have the DJ role <@&${process.env.DJ_ROLE}> to use any music commands!`, ephemeral: true });
        }

        await interaction.deferReply();
        if (!interaction.member.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in a voice channel!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.followUp({ content: "❌ | You are not in my voice channel!", ephemeral: true });
        
        const player = Player.singleton();
        const query = interaction.options.getString("music");
        var checkqueue = player.nodes.get(interaction.guild.id);

        if (!checkqueue) {
            player.nodes.create(interaction.guild.id, {
                leaveOnEmpty: client.config.leaveOnEmpty,
                leaveOnEmptyCooldown: client.config.leaveOnEmptyCooldown,
                leaveOnEnd: client.config.leaveOnEnd,
                leaveOnEndCooldown: client.config.leaveOnEndCooldown,
                leaveOnStop: client.config.leaveOnStop,
                leaveOnStopCooldown: client.config.leaveOnStopCooldown,
                selfDeaf: client.config.selfDeafen,
                skipOnNoStream: true,
				metadata: {
					channel: interaction.channel,
					requestedBy: interaction.user,
					client: interaction.guild.members.me,
				}
            })
        }
        
        var queue = player.nodes.get(interaction.guild.id);

        try {
            const search = await player.search(query, {
				requestedBy: interaction.user,
				searchEngine: QueryType.AUTO
			})

            if (!search || search.tracks.length == 0 || !search.tracks) {
                return interaction.followUp({ content: `❌ | Ooops... something went wrong, couldn't find the song with the requested query.`, ephemeral: true })
            }

            if (search.playlist) {
                return interaction.followUp({ content: `❌ | Ooops... you can only add single songs with this command. Use the regular **/play** command to add playlists to the queue.`, ephemeral: true })
            }

            try {
                if (!queue.connection) await queue.connect(interaction.member.voice.channel);
            }

            catch (err) {
                queue.delete();
                return interaction.followUp({ content: `❌ | Ooops... something went wrong, couldn't join your channel.`, ephemeral: true })
            }

            try {
                queue.insertTrack(search.tracks[0])
            }

            catch (err) {
                return interaction.followUp({ content: `❌ | Ooops... something went wrong, failed to add the track to the queue.`, ephemeral: true })
            }

            if (!queue.isPlaying()) {
                try {
                    await queue.node.play(queue.tracks[0]);
                    queue.node.setVolume(client.config.defaultVolume);
                }

                catch (err) {
                    return interaction.followUp({ content: `❌ | Ooops... something went wrong, there was a playback related error. Please try again.`, ephemeral: true })
                }
            }

            const playsongembed = new EmbedBuilder()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
            .setThumbnail(search.tracks[0].thumbnail)
            .setColor(process.env.EMBED_COLOUR)
            .setTitle(`Added to the top of the queue ⏱️`)
            .setDescription(`Added song **${search.tracks[0].title}** ([Link](${search.tracks[0].url})) to the top of the queue (playing next)!`)
            .setTimestamp()
            .setFooter({ text: `Requested by: ${interaction.user.tag}` })

            interaction.followUp({ embeds: [playsongembed] })
        }

        catch (err) {
            return interaction.followUp({ content: `❌ | Ooops... something went wrong whilst attempting to play the requested song. Please try again.`, ephemeral: true })
        }
    }
}