
///  Discord Bot for Emergency Hamburg Private Server Information
///  Coded by Unl1veabl3

const { Client, GatewayIntentBits, MessageFlags, ComponentType, ButtonStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = 'YOUR_BOT_TOKEN_HERE'; 
const API_URL = "https://api.emergency-hamburg.com/public/servers";

/// Place ID Of Emergency Hamburg, Needed for Join URL ///

const PLACE_ID = 7711635737;


async function findServerByOwnerId(userId) {
    try {
        const response = await axios.get(API_URL);
        const servers = response.data;
        
        if (!Array.isArray(servers)) {
            console.error('API returned non-array data:', servers);
            return null;
        }
        
        const server = servers.find(s => s.ownerId === userId);
        console.log(`Searching for userId ${userId}, found:`, server ? 'Yes' : 'No');
        
        return server;
    } catch (error) {
        console.error('Error fetching server data:', error.message);
        return null;
    }
}

client.once('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}`);
    
    /// Here You can Change the Name of the Command and Description ///
    const commands = [
        {
            name: 'serverinfo',
            description: 'Show information about a private server',
            options: [
                {
                    name: 'user_id',
                    description: 'User ID',
                    type: 4,
                    required: true
                }
            ]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log('Slash command registered');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'serverinfo') {
        try {
            await interaction.deferReply();

            const userId = interaction.options.getInteger('user_id');
            const server = await findServerByOwnerId(userId);

            if (!server) {
                await interaction.editReply({
                    content: `No private server found for User ID: **${userId}**`
                });
                return;
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const privateServerId = server.privateServerId || 'Unknown';
            const ownerId = server.ownerId;
            const ownerName = server.ownerName || 'Unknown User';
            const ownerProfileUrl = server.ownerProfileUrl;
            const joinUrl = `https://www.roblox.com/games/start?launchData=reservedServerId%3D${privateServerId}&placeId=${PLACE_ID}`;

            const components = [
                {
                    type: ComponentType.TextDisplay,
                    id: 1,
                    content: `# ${server.serverName || 'Unknown Server'}`
                },
                {
                    type: ComponentType.Separator,
                    id: 2
                }
            ];

            if (ownerProfileUrl) {
                components.push(
                    {
                        type: ComponentType.MediaGallery,
                        id: 3,
                        items: [
                            {
                                media: {
                                    url: ownerProfileUrl
                                },
                                description: `${ownerName}'s Profile`
                            }
                        ]
                    },
                    {
                        type: ComponentType.Separator,
                        id: 4
                    }
                );
            }

            const infoStartId = ownerProfileUrl ? 5 : 3;
            components.push(
                {
                    type: ComponentType.TextDisplay,
                    id: infoStartId,
                    content: `**Private Server ID**\n\`${privateServerId}\``
                },
                {
                    type: ComponentType.Separator,
                    id: infoStartId + 1
                },
                {
                    type: ComponentType.TextDisplay,
                    id: infoStartId + 2,
                    content: `**Server Owner**\n${ownerName}\n\`${ownerId}\``
                },
                {
                    type: ComponentType.Separator,
                    id: infoStartId + 3
                },
                {
                    type: ComponentType.TextDisplay,
                    id: infoStartId + 4,
                    content: `**Players Online**\n${server.currentPlayers || 0} / ${server.maxPlayers || 0}`
                },
                {
                    type: ComponentType.Separator,
                    id: infoStartId + 5
                },
                {
                    type: ComponentType.TextDisplay,
                    id: infoStartId + 6,
                    content: `**Last Update**\n<t:${timestamp}:R> • <t:${timestamp}:t>`
                },
                {
                    type: ComponentType.Separator,
                    id: infoStartId + 7
                },
                {
                    type: ComponentType.Section,
                    id: infoStartId + 8,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            id: infoStartId + 9,
                            content: '​'
                        }
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        style: ButtonStyle.Link,
                        label: 'Join Server',
                        url: joinUrl
                    }
                }
            );

            await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [
                    {
                        type: ComponentType.Container,
                        id: 100,
                        components: components,
                        spoiler: false
                    }
                ]
            });

        } catch (error) {
            console.error('Error in serverinfo command:', error);
            try {
                await interaction.editReply({
                    content: `An error occurred: ${error.message}`
                });
            } catch (e) {}
        }
    }
});

client.on('error', error => {
    console.error('Discord Client Error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});

client.login(TOKEN);