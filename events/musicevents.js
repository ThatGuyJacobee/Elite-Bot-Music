const { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { Player, QueryType } = require('discord-player');
const player = Player.singleton();

player.events.on("error", (queue, error) => {
    console.log(`[${queue.guild.name}] (ID:${queue.metadata.channel}) Error emitted from the queue: ${error.message}`);
})

player.events.on("playerError", (queue, error) => {
    console.log(`[${queue.guild.name}] (ID:${queue.metadata.channel}) Error emitted from the player: ${error.message}`);
    queue.metadata.channel.send({ content: '❌ | Failed to extract the following song... skipping to the next!' })
})

player.events.on("playerStart", async (queue, track) => {
    //queue.metadata.channel.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
    const progress = queue.node.createProgressBar();
    var create = progress.replace(/ 0:00/g, ' ◉ LIVE');

    const npembed = new EmbedBuilder()
    .setAuthor({ name: player.client.user.tag, iconURL: player.client.user.displayAvatarURL() })
    .setThumbnail(queue.currentTrack.thumbnail)
    .setColor(process.env.EMBED_COLOUR)
    .setTitle(`Starting next song... Now Playing 🎵`)
    .setDescription(`${queue.currentTrack.title} ([Link](${queue.currentTrack.url}))\n${create}`)
    //.addField('\u200b', progress.replace(/ 0:00/g, ' ◉ LIVE'))
    .setTimestamp()

    if (queue.currentTrack.requestedBy != null) {
        npembed.setFooter({ text: `Requested by: ${queue.currentTrack.requestedBy.tag}` })
    }

    var finalComponents = [
        actionbutton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("np-delete")
                .setStyle(4)
                .setLabel("🗑️"),
                //.addOptions(options)
            new ButtonBuilder()
                .setCustomId("np-back")
                .setStyle(1)
                .setLabel("⏮️ Previous"),
            new ButtonBuilder()
                .setCustomId("np-pauseresume")
                .setStyle(1)
                .setLabel("⏯️ Play/Pause"),
            new ButtonBuilder()
                .setCustomId("np-skip")
                .setStyle(1)
                .setLabel("⏭️ Skip"),
            new ButtonBuilder()
                .setCustomId("np-clear")
                .setStyle(1)
                .setLabel("🧹 Clear Queue")
        ),
        actionbutton2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("np-volumedown")
                .setStyle(1)
                .setLabel("🔈 Volume Down"),
            new ButtonBuilder()
                .setCustomId("np-volumeup")
                .setStyle(1)
                .setLabel("🔊 Volume Up"),
            new ButtonBuilder()
                .setCustomId("np-loop")
                .setStyle(1)
                .setLabel("🔂 Loop Once"),
            new ButtonBuilder()
                .setCustomId("np-shuffle")
                .setStyle(1)
                .setLabel("🔀 Shuffle Queue"),
            new ButtonBuilder()
                .setCustomId("np-stop")
                .setStyle(1)
                .setLabel("🛑 Stop Queue")
        )
    ];

    //Check if bot has message perms
    if (!queue.guild.members.me.permissionsIn(queue.metadata.channel).has(PermissionFlagsBits.SendMessages)) return console.log(`No Perms! (ID: ${queue.guild.id})`);
    var msg = await queue.metadata.channel.send({ embeds: [npembed], components: finalComponents })
    
    //----- Dyanmic Button Removal (main drawback being efficiency, but benefit being that it will only remove buttons once the next songs begins, ensuring they always stay) -----
    const filter = (collectorMsg) => {
        if (collectorMsg.embeds[0]) {
            if (collectorMsg.embeds[0].title == "Starting next song... Now Playing 🎵" || collectorMsg.embeds[0].title == "Stopped music 🛑" || collectorMsg.embeds[0].title == "Ending playback... 🛑") {
                return true;
            }
            
            else {
                return false;
            }
        }

        else {
            return false;
        }
    }
    const collector = queue.metadata.channel.createMessageCollector({ filter, limit: 1, time: queue.currentTrack.durationMS * 3 })

    //Remove the buttons if the next song event runs (due to song skip... etc)
    collector.on('collect', async () => {
        try {
            msg.edit({ components: [] })
        }

        catch (err) {
            console.log(`Now playing msg no longer exists! (ID: ${queue.guild.id})`);
        }
    })

    //Remove the buttons once it expires
    collector.on('end', async () => {
        try {
            msg.edit({ components: [] })
        }

        catch (err) {
            console.log(`Now playing msg no longer exists! (ID: ${queue.guild.id})`);
        }
    })
    
    //----- Regular Button Removal based on song duration (main drawback being that if user pauses etc. then the buttons will disappear before song end, but benefit of efficiency) -----
    /*.then((msg) => {
        setTimeout(() => {
            msg.edit({ components: [] });
        }, queue.currentTrack.durationMS)
    })*/
})

player.events.on("disconnect", (queue) => {
    //queue.metadata.channel.send("❌ | I was manually disconnected from the voice channel, clearing queue!");

    const disconnectedembed = new EmbedBuilder()
    .setAuthor({ name: player.client.user.tag, iconURL: player.client.user.displayAvatarURL() })
    .setThumbnail(queue.guild.iconURL({dynamic: true}))
    .setColor(process.env.EMBED_COLOUR)
    .setTitle(`Ending playback... 🛑`)
    .setDescription(`I've been manually disconnected from the voice channel, clearing queue...!`)
    .setTimestamp()

    //Check if bot has message perms
    if (!queue.guild.members.me.permissionsIn(queue.metadata.channel).has(PermissionFlagsBits.SendMessages)) return console.log(`No Perms! (ID: ${queue.guild.id})`);
    queue.metadata.channel.send({ embeds: [disconnectedembed] })
})

player.events.on("emptyChannel", (queue) => {
    //queue.metadata.channel.send("❌ | Nobody is in the voice channel, leaving...");

    const emptyembed = new EmbedBuilder()
    .setAuthor({ name: player.client.user.tag, iconURL: player.client.user.displayAvatarURL() })
    .setThumbnail(queue.guild.iconURL({dynamic: true}))
    .setColor(process.env.EMBED_COLOUR)
    .setTitle(`Ending playback... 🛑`)
    .setDescription(`Nobody is in the voice channel, disconnecting...!`)
    .setTimestamp()

    //Check if bot has message perms
    if (!queue.guild.members.me.permissionsIn(queue.metadata.channel).has(PermissionFlagsBits.SendMessages)) return console.log(`No Perms! (ID: ${queue.guild.id})`);
    queue.metadata.channel.send({ embeds: [emptyembed] })
})

player.events.on("emptyQueue", (queue) => {
    //queue.metadata.channel.send("✅ | Queue finished!");

    const endembed = new EmbedBuilder()
    .setAuthor({ name: player.client.user.tag, iconURL: player.client.user.displayAvatarURL() })
    .setThumbnail(queue.guild.iconURL({dynamic: true}))
    .setColor(process.env.EMBED_COLOUR)
    .setTitle(`Ending playback... 🛑`)
    .setDescription(`The music queue has been finished, disconnecting...!`)
    .setTimestamp()

    //Check if bot has message perms
    if (!queue.guild.members.me.permissionsIn(queue.metadata.channel).has(PermissionFlagsBits.SendMessages)) return console.log(`No Perms! (ID: ${queue.guild.id})`);
    queue.metadata.channel.send({ embeds: [endembed] })
})