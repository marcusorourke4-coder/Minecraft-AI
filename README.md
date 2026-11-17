# Mindcraft — autonomous Minecraft bot prototype

This repository contains a first-stage Mineflayer bot for a Java Paper server that can also be joined from Minecraft Bedrock on iPad using Geyser and Floodgate.

## Current features
- Joins a Java Minecraft server using Mineflayer.
- Independently selects nearby places to explore.
- Stops navigating when health is low.
- Optional follow-player mode.
- In-game commands: `!bot status` and `!bot stop`.

**Not yet implemented:** LLM decision-making, resource gathering, crafting, construction, persistent memory, or robust survival. The code has not been tested on your Falix server.

## Run on a cloud Node.js host
1. Choose a Node.js host with outbound TCP access to your Falix server. GitHub is source hosting, not a continuously running bot host.
2. Set the environment variables described in `.env.example` in your host's settings. Use the Java TCP host and port, **not** the Bedrock/Geyser UDP endpoint.
3. Use Node.js 20 or newer and run `npm install`, then `npm start`.
4. Allow the bot username on the server if you have a whitelist enabled.

## Security
Your server currently uses `online-mode=false`. That permits Java username impersonation; a whitelist alone is not sufficient protection. Keep access restricted and plan to use authenticated Java connections or an appropriate secure proxy before allowing other players. Never commit credentials or `.env` files.

The starter uses `MC_AUTH=offline` for the current setup, with cautious movement and digging disabled. It does not yet use ChatGPT or another language model.
