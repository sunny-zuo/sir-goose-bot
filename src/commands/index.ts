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

/* Utility Commands */
import { Pin } from './utility/pin';

/* UWaterloo Commands */
import { Course } from './uwaterloo/course';
import { Countdown } from './uwaterloo/countdown';

import { Verify } from './verification/verify';

export default [Config, Prefix, Honk, Help, Deploy, Reload, Pin, Course, Countdown, Verify];
