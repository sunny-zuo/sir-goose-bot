/* Admin Commands */
import { Config } from './admin/config';

/* Fun Commands */
import { Coinflip } from './fun/coinflip';
import { Goose } from './fun/goose';
import { Honk } from './fun/honk';

/* Info Commands */
import { Avatar } from './info/avatar';
import { BotStats } from './info/botstats';
import { Help } from './info/help';
import { Invite } from './info/invite';
import { Ping } from './info/ping';

/* Moderation Commands */
import { Ban } from './moderation/ban';
import { Unban } from './moderation/unban';

/* Owner Commands */
import { Deploy } from './owner/deploy';
import { GuildList } from './owner/guildlist';
import { Reload } from './owner/reload';

/* Utility Commands */
import { ButtonRole } from './utility/buttonrole';
import { Pin } from './utility/pin';
import { BulkRoleModify } from './utility/bulkrolemodify';

/* UWaterloo Commands */
import { Course } from './uwaterloo/course';
import { Countdown } from './uwaterloo/countdown';

/* Verification Commands */
import { ReVerify } from './verification/reverify';
import { Verify } from './verification/verify';
import { VerifyAll } from './verification/verifyall';
import { VerifyButton } from './verification/verifybutton';
import { VerifyOverride } from './verification/verifyoverride';
import { VerifyRules } from './verification/verifyrules';
import { VerifyStats } from './verification/verifystats';

export default [
    Config,
    Coinflip,
    Goose,
    Honk,
    Avatar,
    BotStats,
    Help,
    Invite,
    Ping,
    Ban,
    Unban,
    Deploy,
    GuildList,
    Reload,
    ButtonRole,
    Pin,
    BulkRoleModify,
    Course,
    Countdown,
    ReVerify,
    Verify,
    VerifyAll,
    VerifyButton,
    VerifyOverride,
    VerifyRules,
    VerifyStats,
];
