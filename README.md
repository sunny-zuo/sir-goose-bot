# Sir Goose Bot

Sir Goose Bot is a rewritten version of [shivam-sh's goose-bot](https://github.com/shivam-sh/goose-bot), built for improved scalability, usability, privacy and security. Its primary functionality is to integrate with UWaterloo's LDAP in order to verify the identity of new Discord members and assign their respective roles.

This bot is currently ran on the UWaterloo SE 2025 and the UWaterloo Tron 2025 discord server. If you would like to invite this bot to your server, please message Dark#4321 on Discord!

---

## Features
- Link a Discord account with a UWaterloo identity and verify the connection via email confirmation
- Assign roles based on the UWaterloo program the user is in
- Easily configurable settings on a per-server basis via bot commands
- **Automatically verify users who have previously verified with the bot on a different discord server**
- MongoDB integration for persisting data

---
## Commands

These commands assume the default prefix of `~` (tilde), which can change depending on the server's settings.


### Verification Commands

> **~verifyhelp**
> 
> Get a help message with all of the verification commands

> **~verify [UWaterloo Email]**
> 
> Verify your Waterloo identity for server access.
> 
> Example usage: `~verify example@uwaterloo.ca`

> **~confirm [TOKEN]**
> 
> Confirm your Waterloo identity, using the token sent via email.
> 
> Example usage: `~confirm 123456`

> **~unverify**
> 
> Unlink your UW identity and delete all of your user data. This will remove any verified roles that you have.

### Server Configuration Commands

Managing settings requires the user to have the MANAGE_GUILD or ADMINISTRATOR permissions.

> **~settings**
> 
> List all of the server's settings

> **~settings (setting)**
> 
> Get information about a specific setting
> 
> Example usage: `~settings verificationEnabled`

> **~settings (setting) (new value)**
> 
> Update the value of a specific setting
> 
> Example usage: `~settings verificationEnabled true`

> **~prefix [prefix]**
> 
> Update the prefix the bot will respond to. The default prefix is `~`
> 
> Example usage: `~prefix !`

### Misc Commands

> **~help**
> 
> Get a help message with a list of all of the commands

> **~help (command name)**
> 
> Get specific information on a specific command

> **~honk**
> 
> HONK

---

## Setup

If you'd like to add this bot to your own server, you can message Dark#4321 on Discord to request a bot invite link for the version hosted by me. Currently, I'm using Heroku for bot hosting and MongoDB Atlas for the database.

You can also host the bot yourself. Rename the `.env.example` file to `.env` and set your own values for each environment variable. Run `node index.js` to start the bot.

Once started, you can configure the settings via bot commands to meet the needs of your server. These are the configurable settings: (default values in brackets)

* **prefix**: The prefix that the bot responds to (`~`)
* **verificationEnabled**: Enable or disable verification (`false`)
* **verificationProgram**: The UWaterloo program users must be in to get the verified role (`VPA/Software Engineering`)
* **verifiedRole**: The name of the role that users part of the verificationProgram get assigned (`SE`)
* **guestRole**: The role to assign guests, which are defined as users who have verified but are part of a different program (`Non-SE`)
* **autoGuest**: Whether or not to automatically assign guest roles (`true`)