/* Admin Commands */
import { Config } from './admin/config';
import { Prefix } from './admin/prefix';

/* Fun Commands */
import { Coinflip } from './fun/coinflip';
import { Honk } from './fun/honk';

/* Info Commands */
import { Help } from './info/help';
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

export default [
    Config,
    Prefix,
    Coinflip,
    Honk,
    Help,
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
];
