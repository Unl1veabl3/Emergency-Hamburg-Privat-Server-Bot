
### Discord Bot for Emergency Hamburg Private Server Information
### Coded by Unl1veabl3

# ---------- Imports ----------

import discord
from discord import app_commands
from discord.ui import View, Button
import requests
import time

# ---------- Config ----------
TOKEN = "YOUR_DISCORD_BOT_TOKEN_HERE"

# Set this to an integer if you want guild-only commands
# Set to None for global slash commands
GUILD_ID = None
# Example:
# GUILD_ID = 1450502148100980796


# ---------- API ----------
API_URL = "https://api.emergency-hamburg.com/public/servers"


# ---------- helpers ----------

def find_server_by_owner_id(owner_id: int):
    response = requests.get(API_URL, timeout=10)
    response.raise_for_status()

    for server in response.json():
        if server.get("ownerId") == owner_id:
            return server

    return None


# ---------- discord ----------

class Bot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        if GUILD_ID:
            guild = discord.Object(id=GUILD_ID)
            await self.tree.sync(guild=guild)
            print("Guild slash commands synced")
        else:
            await self.tree.sync()
            print("Global slash commands synced")


bot = Bot()


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} ({bot.user.id})")


# ---------- Slash Command ----------

@bot.tree.command(
    name="serverinfo",
    description="See information about a private server and be Able to join it.",
    guild=discord.Object(id=GUILD_ID) if GUILD_ID else None
)
@app_commands.describe(user_id="Roblox user ID")
async def server(interaction: discord.Interaction, user_id: int):
    await interaction.response.defer(thinking=True)

    server_data = find_server_by_owner_id(user_id)

    if not server_data:
        await interaction.followup.send(
            "No server found for this user ID."
        )
        return

    timestamp = int(time.time())

    embed = discord.Embed(
        title=server_data.get("serverName", "Unknown Server"),
        color=discord.Color.from_rgb(255, 255, 255)
    )

    private_server_id = server_data.get("privateServerId")

    embed.add_field(
        name="Private Server ID",
        value=f"`{private_server_id}`",
        inline=False
    )

    roblox_user_id = server_data.get("ownerId")
    roblox_username = server_data.get("ownerName", "Unknown")
    profile_url = f"https://www.roblox.com/users/{roblox_user_id}/profile"

    embed.add_field(
        name="Roblox User",
        value=f"[{roblox_username} ({roblox_user_id})]({profile_url})",
        inline=False
    )

    embed.add_field(
        name="Players",
        value=f"{server_data.get('currentPlayers')}/{server_data.get('maxPlayers')}",
        inline=True
    )

    embed.add_field(
        name="Last Update",
        value=f"<t:{timestamp}:R>\n<t:{timestamp}:F>",
        inline=True
    )

    avatar_url = server_data.get("ownerProfileUrl")
    if avatar_url:
        embed.set_thumbnail(url=avatar_url)

    # ---------- Join Service ----------

    join_url = (
        "https://www.roblox.com/games/start"
        f"?launchData=reservedServerId%3D{private_server_id}"
        "&placeId=7711635737"
    )

    # ---------- Join button ----------
    view = View()
    view.add_item(
        Button(
            label="Join the Server",
            style=discord.ButtonStyle.link,
            url=join_url
        )
    )

    await interaction.followup.send(embed=embed, view=view)


bot.run(TOKEN)
