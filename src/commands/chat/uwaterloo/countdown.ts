import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { DateTime } from 'luxon';
import axios from 'axios';
import { CommandInteraction, Message } from 'discord.js';

export class Countdown extends ChatCommand {
    private _examsEndDate?: DateTime;
    private _termEndDate?: DateTime;
    constructor(client: Client) {
        super(client, {
            name: 'countdown',
            description: 'Count the number of days until the current academic term is over',
            category: 'UWaterloo',
            aliases: ['fml', 'count'],
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        if (!this._examsEndDate || !this._termEndDate || DateTime.local() > this._termEndDate) {
            const currentTerm = await axios
                .get('https://openapi.data.uwaterloo.ca/v3/Terms/current', {
                    headers: {
                        'X-API-KEY': `${process.env.UW_API_KEY}`,
                    },
                })
                .then((response) => response.data);

            this._termEndDate = DateTime.fromISO(currentTerm.termEndDate, { zone: 'America/Toronto' });

            const importantDates = await axios
                .get('https://openapi.data.uwaterloo.ca/v3/ImportantDates', {
                    headers: {
                        'X-API-KEY': `${process.env.UW_API_KEY}`,
                    },
                })
                .then((response) => response.data);

            const examEndEvent = importantDates.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (date: { name: string; details: any[] }) =>
                    date?.name === 'Final examinations end' && date?.details?.some((detail) => detail?.termName === currentTerm.name)
            );
            this._examsEndDate = DateTime.fromISO(
                examEndEvent.details.find((detail: { termName: string }) => detail?.termName === currentTerm.name).startDate
            );
        }

        const dayDiff = Math.floor(this._examsEndDate.diff(DateTime.local(), 'days').days);

        await this.sendNeutralEmbed(interaction, `${dayDiff} Days Left!`, `There are about ${dayDiff} more days until this term is over.`);
    }
}
