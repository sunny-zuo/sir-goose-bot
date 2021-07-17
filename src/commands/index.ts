/* Admin Commands */
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

export default [Prefix, Honk, Help, Deploy, Reload, Course];
