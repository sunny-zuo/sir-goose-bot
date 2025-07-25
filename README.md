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

Note that this requires at least version 16.6 of [Node](https://nodejs.org/en/). After, create a copy of `.env.example`, rename it to `.env` and set your environment variables.

## Contributing

All contributions are welcome! If you encounter a bug, have a feature request or have any ideas for improvement, please create a new issue.
