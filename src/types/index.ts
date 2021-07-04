import { DMChannel, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel } from 'discord.js';

export type TextBasedChannel = TextChannel | DMChannel | NewsChannel | PartialDMChannel | ThreadChannel;
