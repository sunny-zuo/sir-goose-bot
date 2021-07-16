/* Admin Commands */
import { Prefix } from './admin/prefix';

/* Fun Commands */
import { Honk } from './fun/honk';

/* Owner Commands */
import { Deploy } from './owner/deploy';
import { Reload } from './owner/reload';

/* UWaterloo Commands */
import { Course } from './uwaterloo/course';

export default [Prefix, Honk, Deploy, Reload, Course];
