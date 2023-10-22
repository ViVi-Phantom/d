const client = require("../../index")
const { ChannelType, GuildVoice, Collection } = require("discord.js")
const schema = require("../../Models/join-to-create");
let voicManafer = new Collection();

module.exports = {
    name: "jointocreate",
}

client.on('voiceStateUpdate', async (oldState, newState) => {
    const { member, guild } = oldState;
    const newChannel = newState.channel;
    const oldChannel = oldState.channel;

    const data = await schema.findOne({ Guild: guild.id })
    if (!data) return;

    if (data) {
        const channelid = data.Channel;
        const channel = client.channels.cache.get(channelid)
        const userlimit = data.UserLimit;

        if(oldChannel !== newChannel && newChannel && newChannel.id === channel.id) {
            const voicChannel = await guild.channels.create({
                name: `${member.user.tag}`,
                type: ChannelType.GuildVoice,
                parent: newChannel.parent,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: ["Connect", "ManageChannels"],
                    },
                    {
                        id: guild.id,
                        allow: ["Connect"],
                    },
                ],
                userLimit: userlimit
            })

            voicManafer.set(member.id, voicChannel.id);

            await newChannel.permissionOverwrites.edit(member, {
                Connect: false
            });
            setTimeout(() => {
                newChannel.permissionOverwrites.delete(member);
            }, 3000)

            return setTimeout(() => {
                member.voice.setChannel(voicChannel)
            }, 500)
        }

        const jointocreate = voicManafer.get(member.id);
        const members = oldChannel?.members
        .filter((m) => !m.user.bot)
        .map((m) => m.id)

        if (
            jointocreate &&
            oldChannel.id === jointocreate &&
            (!newChannel || newChannel.id !== jointocreate)
        ) {
            if (members.length > 0) {
                let randomID = members[Math.floor(Math.random() * members.length)];
                let randomMember = guild.members.cache.get(randomID);
                randomMember.voice.setChannel(oldChannel).then((v) => {
                    oldChannel.setName(randomMember.user.username).catch((e) => null);
                    oldChannel.permissionOverwrites.edit(randomMember, {
                        Connect: true,
                        ManageChannels: True
                    })
                })
                voicManafer.set(member.id, null)
                voicManafer.set(randomMember.id, oldChannel.id)
            } else {
                voicManafer.set(member.id, null)
                oldChannel.delete().catch((e) => null)
            }
        }
    }
})