import { DateTime } from 'luxon';
import { green, black, bgRed, blue, gray } from 'chalk';

export class Logger {
    info(content: string) {
        console.log(blue(`[${this.timestamp()}] INFO ${content}`));
    }

    error(content: string, stack?: string) {
        if (stack) {
            console.log(bgRed(`[${this.timestamp()}] ERROR ${content}`), stack);
            console.error(`[${this.timestamp()}] ERROR ${content}`, stack);
        } else {
            console.log(bgRed(`[${this.timestamp()}] ERROR ${content}`));
            console.error(`[${this.timestamp()}] ERROR ${content}`);
        }
    }

    debug(content: string) {
        console.log(green(`[${this.timestamp()}] DEBUG ${content}`));
    }

    command(content: string) {
        console.log(gray(`[${this.timestamp()}] COMMAND ${content}`));
    }

    warn(content: string) {
        console.log(black.bgYellow(`[${this.timestamp()}] WARN ${content}`));
    }

    private timestamp() {
        return DateTime.now().toHTTP();
    }
}
