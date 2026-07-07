import type { ReactNode, SVGProps } from 'react';

/**
 * Icon System for Rate My President
 * 24×24px, 2px stroke, rounded joins/caps
 * All icons use currentColor for state-driven coloring
 * Reference: DESIGN.md §Icon System
 */

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

interface IconBaseProps extends IconProps {
  label: string;
  children: ReactNode;
}

const IconBase = ({
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  label,
  children,
  ...props
}: IconBaseProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className ?? 'w-6 h-6'}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={ariaHidden}
    aria-label={ariaHidden ? undefined : ariaLabel ?? label}
    role={ariaHidden ? undefined : 'img'}
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

// Navigation Icons
export const HomeIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Home" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </IconBase>
);

export const LeaderboardIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Leaderboard" {...props}>
    <rect x="4" y="8" width="4" height="12" />
    <rect x="10" y="4" width="4" height="16" />
    <rect x="16" y="2" width="4" height="18" />
  </IconBase>
);

export const GlobeIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Globe" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </IconBase>
);

export const NewsIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="News" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M6 8h12" />
    <path d="M6 12h12" />
    <path d="M6 16h8" />
  </IconBase>
);

export const ProfileIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Profile" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

// Action Icons
export const ApproveIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Approve" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);

export const DisapproveIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Disapprove" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconBase>
);

export const SkipIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Skip" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </IconBase>
);

export const ShareIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Share" {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </IconBase>
);

export const SearchIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Search" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
);

export const FilterIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Filter" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </IconBase>
);

export const SettingsIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Settings" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.98 2.98l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.98-2.98l4.24-4.24" />
  </IconBase>
);

export const NotificationsIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Notifications" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </IconBase>
);

export const TrendUpIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Trend up" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </IconBase>
);

export const TrendDownIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Trend down" {...props}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </IconBase>
);

export const ApprovalIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Approval" {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconBase>
);

export const VoteIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Vote count" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </IconBase>
);

export const StreakIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Streak" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
  </IconBase>
);

export const BadgeIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Badge" {...props}>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <path d="M12 22v-9" />
    <path d="M8 9l-2.5-4" />
    <path d="M16 9l2.5-4" />
  </IconBase>
);

export const TipJarIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Tip jar" {...props}>
    <path d="M3 11l1 12h16l1-12M8 7c0-1.657 1.343-3 3-3h2c1.657 0 3 1.343 3 3M9 5h6M5 15h14" />
  </IconBase>
);

export const CountryIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Country" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </IconBase>
);

export const CalendarIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Calendar" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);

export const DailyVoteIcon = ({ className, 'aria-label': ariaLabel, ...props }: IconProps) => (
  <IconBase className={className} aria-label={ariaLabel} label="Daily vote" {...props}>
    <path d="M6 9l6-6 6 6M6 15l6 6 6-6" />
  </IconBase>
);
