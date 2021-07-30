/* Admin Commands */
import { Config } from './admin/config';
import { Prefix } from './admin/prefix';

/* Fun Commands */
import { Honk } from './fun/honk';

/* Info Commands */
import { Help } from './info/help';

/* Owner Commands */
import { Deploy } from './owner/deploy';
import { Reload } from './owner/reload';

/* UWaterloo Commands */
import { Course } from './uwaterloo/course';
import { Countdown } from './uwaterloo/countdown';

export default [Config, Prefix, Honk, Help, Deploy, Reload, Course, Countdown];
