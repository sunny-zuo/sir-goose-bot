import { ApplicationCommandOption, Collection, CommandInteraction, CommandInteractionOption, MessageEmbed, Message } from 'discord.js';
import Client from '../../Client';
import { Command } from '../Command';
import { request } from 'graphql-request';
import { uwflowQuery, uwflowEndpoint } from '../../helpers/uwflowConstants';

export class Course extends Command {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'course',
            description: 'Enter a course code to learn more about, such as MATH 135',
            type: 'STRING',
            required: true,
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'course',
            description: 'Get info about a UWaterloo course',
            category: 'UWaterloo',
            aliases: ['class'],
            options: Course.options,
            examples: ['math135'],
        });
    }

    async execute(interaction: Message | CommandInteraction, args: Collection<string, CommandInteractionOption>) {
        const courseMatcher = /([a-zA-Z]{2,}[ ]?\d+[a-zA-Z]?)/g;
        const disallowedMatches = /(least)|(4U)/gi;

        const courseName = args.get('course')!.value as string;
        const code = courseName.toLowerCase().replace(/[^a-z0-9]/g, '');

        const variables = {
            code: code,
            user_id: 0,
        };

        const response = await request(uwflowEndpoint, uwflowQuery, variables);

        if (response.course.length < 1) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setTitle('Error: No Course Found')
                .setDescription(`No course with the name '${courseName}' was found.`)
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
            return;
        }

        const replacer = (course: string) => {
            const isDisallowed = disallowedMatches.test(course);
            if (isDisallowed) {
                return course;
            }
            return `**[${course}](https://uwflow.com/course/${course.replace(/\s/g, '')})**`;
        };

        const trimString = (str: string, max: number) =>
            str && str.length > max
                ? `${str
                      .slice(0, max - 3)
                      .split(' ')
                      .slice(0, -1)
                      .join(' ')}...`
                : str;

        const course = response.course[0];
        const prereqs = trimString(course.prereqs?.replace(courseMatcher, replacer), 1024) ?? 'None';
        const antireqs = trimString(course.antireqs?.replace(courseMatcher, replacer), 1024) ?? 'None';

        const embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle(`${course.code.toUpperCase()}: ${course.name}`)
            .setDescription(`${course.description}\n**[View course on UWFlow](https://uwflow.com/course/${code})**`)
            .addFields(
                {
                    name: 'Prerequisites',
                    value: prereqs,
                },
                {
                    name: 'Antirequisites',
                    value: antireqs,
                },
                {
                    name: 'Liked',
                    value: `${(course.rating.liked * 100).toFixed(2)}%`,
                    inline: true,
                },
                {
                    name: 'Easy',
                    value: `${(course.rating.easy * 100).toFixed(2)}%`,
                    inline: true,
                },
                {
                    name: 'Useful',
                    value: `${(course.rating.useful * 100).toFixed(2)}%`,
                    inline: true,
                }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
}
