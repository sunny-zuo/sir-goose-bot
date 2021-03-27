# Sir Goose Bot

Sir Goose Bot is a Discord bot built for UWaterloo Discord servers. Its main functionality is to allow Discord users to authenticate with their UWaterloo identity, and get roles assigned based on their program.

Sir Goose Bot is the **only**<sup>1</sup> bot that integrates with the UW's Office365 OAuth. This allows us to read program info, entrance year (for students entering in 2020 or later), and provides a smoother/simpler experience overall.

---

## Features
- Link a Discord account with a UWaterloo identity and verify the connection via Office365 OAuth
- Assign roles based on the UWaterloo program the user is in
- Easily configurable settings on a per-server basis via bot commands
- Automatically verify users who have previously verified with the bot on a different Discord server

---
## Commands

These commands assume the default prefix of `$` (tilde), which can change depending on the server's settings.


### Verification Commands

> **$verify**
> 
> Verify your Waterloo identity for server access. The bot will DM you a verification link where you can login with your UW account and get verified!
> 
> Example usage: `$verify`


### Server Configuration Commands

Managing settings requires the user to have the MANAGE_GUILD or ADMINISTRATOR permissions.

> **$config**
> 
> List all of the server's settings

> **$config (setting)**
> 
> Get information about a specific setting
> 
> Example usage: `$settings verificationEnabled`

> **$config (setting) (new value)**
> 
> Update the value of a specific setting
> 
> Example usage: `$settings verificationEnabled true`

> **$prefix [prefix]**
> 
> Update the prefix the bot will respond to. The default prefix is `$`
> 
> Example usage: `$prefix !`

### Misc Commands

> **$help**
> 
> Get a help message with a list of all of the commands

> **$help (command name)**
> 
> Get specific information on a specific command

> **$honk**
> 
> HONK

---

## Setup

If you'd like to add this bot to your own server, you can message me (Dark#4321) on Discord for an invite link, or by email at bot@sunnyzuo.com

Self hosting is also possible, but you'll need to first get O365 app registration for OAuth access.

* **prefix**: The prefix that the bot responds to (`$`)
* **verificationEnabled**: Enable or disable verification (`false`)
* **verificationProgram**: The UWaterloo program users must be in to get the verified role (`VPA/Software Engineering`)
* **verifiedRole**: The name of the role that users part of the verificationProgram get assigned (`SE`)
* **guestRole**: The role to assign guests, which are defined as users who have verified but are part of a different program (`Non-SE`)
* **autoGuest**: Whether or not to automatically assign guest roles (`true`)

---

<sup>1</sup> As of time of writing, that I am aware of.