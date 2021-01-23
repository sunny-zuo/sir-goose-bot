const Discord = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'course',
    description: 'Get information about a UWaterloo course',
    aliases: ['class'],
    args: true,
    guildOnly: false,
    displayHelp: true,
    usage: "(course)",
    async execute(message, args) {
        const courseName = args.toLowerCase().replace(/[^a-z0-9]/g, "")
        const response = await fetch('https://uwflow.com/graphql', {
            method: 'POST',
            body: `{"operationName":"getCourse","variables":{"code":"${courseName}","user_id":0},"query":"query getCourse($code: String, $user_id: Int) {\n  course(where: {code: {_eq: $code}}) {\n    ...CourseInfo\n    ...CourseSchedule\n    ...CourseRequirements\n    ...CourseRating\n    __typename\n  }\n}\n\nfragment CourseInfo on course {\n  id\n  code\n  name\n  description\n  profs_teaching {\n    prof {\n      id\n      code\n      name\n      rating {\n        liked\n        comment_count\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CourseSchedule on course {\n  id\n  sections {\n    id\n    enrollment_capacity\n    enrollment_total\n    class_number\n    campus\n    section_name\n    term_id\n    updated_at\n    meetings {\n      days\n      start_date\n      end_date\n      start_seconds\n      end_seconds\n      location\n      prof {\n        id\n        code\n        name\n        __typename\n      }\n      is_closed\n      is_cancelled\n      is_tba\n      __typename\n    }\n    exams {\n      date\n      day\n      end_seconds\n      is_tba\n      location\n      section_id\n      start_seconds\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CourseRequirements on course {\n  id\n  antireqs\n  prereqs\n  coreqs\n  postrequisites {\n    postrequisite {\n      id\n      code\n      name\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CourseRating on course {\n  id\n  rating {\n    liked\n    easy\n    useful\n    filled_count\n    comment_count\n    __typename\n  }\n  __typename\n}\n"}`
        });
        const json = await response.json();
        if (Object.keys(json.data.course).length < 1) {
            message.channel.send(new Discord.MessageEmbed().setColor("#9932cc")
                .setTitle('Error: No Course Found')
                .setDescription(`No course with the name '${courseName}' was found.`))
            return;
        }
        const course = json.data.course[0];
        
        const responseEmbed = new Discord.MessageEmbed()
            .setColor("#9932cc")
            .setTitle(`${course.code.toUpperCase()}: ${course.name}`)
            .setDescription(`${course.description}\n **[View course on UWFlow](https://uwflow.com/course/${courseName})**`)
            .addFields(
                { name: 'Prerequisites', value: (course.prereqs) ? course.prereqs : 'None'},
                { name: 'Antirequisites', value: (course.antireqs) ? course.antireqs : 'None'},
                { name: 'Liked', value: `${(course.rating.liked * 100).toFixed(2)}%`, inline: true },
                { name: 'Easy', value: `${(course.rating.easy * 100).toFixed(2)}%`, inline: true },
                { name: 'Useful', value: `${(course.rating.useful * 100).toFixed(2)}%`, inline: true },
            )
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');
        message.channel.send(responseEmbed);
    }
}