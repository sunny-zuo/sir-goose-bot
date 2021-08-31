/* Admin Commands */
import { Config } from './admin/config';
import { Prefix } from './admin/prefix';

/* Fun Commands */
import { Coinflip } from './fun/coinflip';
import { Honk } from './fun/honk';

/* Info Commands */
import { BotStats } from './info/botstats';
import { Help } from './info/help';
import { Invite } from './info/invite';
import { Ping } from './info/ping';

/* Moderation Commands */
import { Ban } from './moderation/ban';

/* Owner Commands */
import { Deploy } from './owner/deploy';
import { Reload } from './owner/reload';

/* Utility Commands */
import { ButtonRole } from './utility/buttonrole';
import { Pin } from './utility/pin';

/* UWaterloo Commands */
import { Course } from './uwaterloo/course';
import { Countdown } from './uwaterloo/countdown';

/* Verification Commands */
import { Verify } from './verification/verify';
import { VerifyAll } from './verification/verifyall';
import { VerifyButton } from './verification/verifybutton';
import { VerifyRules } from './verification/verifyrules';
import { VerifyStats } from './verification/verifystats';

export default [
    Config,
    Prefix,
    Coinflip,
    Honk,
    BotStats,
    Help,
    Invite,
    Ping,
    Ban,
    Deploy,
    Reload,
    ButtonRole,
    Pin,
    Course,
    Countdown,
    Verify,
    VerifyAll,
    VerifyButton,
    VerifyRules,
    VerifyStats,
];
