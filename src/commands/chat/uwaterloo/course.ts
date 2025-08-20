import {
    ApplicationCommandOption,
    ChatInputCommandInteraction,
    EmbedBuilder,
    CommandInteractionOptionResolver,
    ApplicationCommandOptionType,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { request } from 'graphql-request';
import { uwflowQuery, uwflowEndpoint } from '#util/uwflowConstants';
import { logger } from '#util/logger';

export class Course extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'course',
            description: 'Enter a course code to learn more about, such as MATH 135',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'course',
            description: 'Get info about a UWaterloo course',
            category: 'UWaterloo',
            options: Course.options,
            examples: ['math135'],
            cooldownSeconds: 30,
            cooldownMaxUses: 8,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply();

        try {
            const courseMatcher = /([a-zA-Z]{2,}[ ]?\d+[a-zA-Z]?)/g;
            const disallowedMatches = /(least)|(4U)/gi;

            const courseName = args.getString('course');
            if (!courseName) return;

            const code = courseName.toLowerCase().replace(/[^a-z0-9]/g, '');

            const variables = {
                code: code,
            };

            const response = await request(uwflowEndpoint, uwflowQuery, variables);

            if (response.course.length < 1) {
                const embed = new EmbedBuilder().setColor('Red').setDescription(`No course with the name '${courseName}' was found.`);

                await interaction.editReply({ embeds: [embed] });
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

            const embed = new EmbedBuilder()
                .setColor('Aqua')
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

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            logger.error(e, `course command error: ${e.message}`);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('An error occurred while fetching the course information. Please try again later.'),
                ],
            });
        }
    }
}
