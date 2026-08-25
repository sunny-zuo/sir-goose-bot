# Sir Goose Bot

Sir Goose Bot is a Discord bot built for University of Waterloo Discord servers. It offers a variety of features, including button roles (reaction roles but with buttons), moderation tools, and a highly customizable UWaterloo authentication/verification system that allows users to be assigned roles based on their program and/or year of study.

Sir Goose is built using discord.js v14, with full support for slash commands and buttons!

## Features

-   **Verification**: Let users link their Discord with their UWaterloo identity and automatically assign roles based on their program of study and their year. [Read the guide](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd) on setting up verification for your server!

-   **Verification Rule Builder**: Customize verification role assignment to be as specific as you want using [a web interface](https://sebot.sunnyzuo.com/).

-   **Moderation**: Ban users and all alt accounts linked via their UWaterloo identity. Perform bulk role modifications.

-   **Role Assignment**: Let users self-assign roles using button roles. They work just like reaction roles, but with buttons!

-   **UWaterloo Focused Commands**: View information about a UWaterloo courses using the `/course` command.

-   **And more!** Use `/help` for a full list of commands.

## Installation

You can add Sir Goose to your server using [this link](https://discord.com/api/oauth2/authorize?client_id=740653704683716699&permissions=8&scope=bot%20applications.commands)!

Alternatively, you can also host the bot yourself. Clone this repo and install dependencies:

```
git clone https://github.com/sunny-zuo/sir-goose-bot.git
cd sir-goose-bot
npm install
```

The project currently targets Node.js 22 LTS. After, create a copy of `.env.example`, rename it to `.env` and set your environment variables.

## Production Deployment on Oracle Cloud

The default Compose deployment runs only the bot and Watchtower. Caddy and the monitoring services are opt-in through profiles:

```sh
docker compose --profile edge --profile monitoring up -d
```

For an Oracle free-tier VM using Cloudflare Tunnel, create `docker/cloudflared/.env` from its example and add the tunnel token. Then run:

```sh
docker compose -f docker-compose.yml -f docker-compose.oracle.yml up -d
```

In Cloudflare Zero Trust, route the public hostname to `http://sir-goose:5000`. The VM does not need inbound ports `80` or `443`.

The container healthcheck reports whether the web app is accepting requests. It becomes ready only after Discord login succeeds, so a slow Discord startup can temporarily show the container as unhealthy without causing a restart.

The production container runs as UID/GID `1000`. Before starting it on a new host, give it access to its bind mounts:

```sh
mkdir -p logs src/data/verification
sudo chown -R 1000:1000 logs src/data/verification
```

### Updating

Automatic updates are disabled by default. To update the bot manually:

```sh
docker compose pull sir-goose
docker compose up -d sir-goose
```

To re-enable automatic bot updates temporarily, start Compose with the `updates` profile.

### Log retention

Copy the logrotate policy and Docker log limit configuration:

```sh
sudo cp docker/logrotate.conf /etc/logrotate.d/sir-goose
sudo systemctl restart docker
```

`docker/daemon.json` is a reference configuration for Docker's stdout log limits. If `/etc/docker/daemon.json` already exists, merge these settings into it instead of overwriting the file:

```json
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
```

Recreate running containers after changing Docker's logging settings, then verify the rotation policy:

```sh
docker compose up -d --force-recreate
sudo logrotate --debug /etc/logrotate.d/sir-goose
```

## Contributing

All contributions are welcome! If you encounter a bug, have a feature request or have any ideas for improvement, please create a new issue.
