/**
 * Rate My President — Shared Country + Leader Data
 *
 * Single source of truth for both the Onboarding country picker
 * and the SwipeCard demo queue builder.
 */

export interface CountryData {
  /** ISO 3166-1 alpha-2 country code (e.g. 'GB') */
  code: string;
  /** Display name */
  name: string;
  /** Unicode flag emoji */
  flag: string;
  /** Current head of state */
  leader?: string;
  /** Dicebear seed initials for avatar generation */
  avatarSeed?: string;
  /** Dicebear background colour (hex without #) */
  avatarColor?: string;
}

export const availableCountries: CountryData[] = [
  { code: 'GB', name: 'United Kingdom',  flag: '🇬🇧', leader: 'Keir Starmer',                    avatarSeed: 'KS', avatarColor: '2f4f4f' },
  { code: 'US', name: 'United States',   flag: '🇺🇸', leader: 'Donald Trump',                     avatarSeed: 'DT', avatarColor: '4682b4' },
  { code: 'FR', name: 'France',          flag: '🇫🇷', leader: 'Emmanuel Macron',                  avatarSeed: 'EM', avatarColor: '4b0082' },
  { code: 'DE', name: 'Germany',         flag: '🇩🇪', leader: 'Friedrich Merz',                   avatarSeed: 'FM', avatarColor: '556b2f' },
  { code: 'JP', name: 'Japan',           flag: '🇯🇵', leader: 'Shigeru Ishiba',                   avatarSeed: 'SI', avatarColor: '8b0000' },
  { code: 'IN', name: 'India',           flag: '🇮🇳', leader: 'Narendra Modi',                    avatarSeed: 'NM', avatarColor: 'b8860b' },
  { code: 'BR', name: 'Brazil',          flag: '🇧🇷', leader: 'Luiz Inácio Lula da Silva',        avatarSeed: 'LL', avatarColor: '2e8b57' },
  { code: 'CA', name: 'Canada',          flag: '🇨🇦', leader: 'Mark Carney',                      avatarSeed: 'MC', avatarColor: 'c0392b' },
  { code: 'AU', name: 'Australia',       flag: '🇦🇺', leader: 'Anthony Albanese',                 avatarSeed: 'AA', avatarColor: '1a5276' },
  { code: 'MX', name: 'Mexico',          flag: '🇲🇽', leader: 'Claudia Sheinbaum',                avatarSeed: 'CS', avatarColor: '884ea0' },
  { code: 'ZA', name: 'South Africa',    flag: '🇿🇦', leader: 'Cyril Ramaphosa',                  avatarSeed: 'CR', avatarColor: '1e8bc3' },
  { code: 'KR', name: 'South Korea',     flag: '🇰🇷', leader: 'Lee Jae-myung',                    avatarSeed: 'LJ', avatarColor: '2c3e50' },
  { code: 'IT', name: 'Italy',           flag: '🇮🇹', leader: 'Giorgia Meloni',                   avatarSeed: 'GM', avatarColor: '6c3483' },
  { code: 'ES', name: 'Spain',           flag: '🇪🇸', leader: 'Pedro Sánchez',                    avatarSeed: 'PS', avatarColor: 'd35400' },
  { code: 'RU', name: 'Russia',          flag: '🇷🇺', leader: 'Vladimir Putin',                   avatarSeed: 'VP', avatarColor: '7f8c8d' },
  { code: 'CN', name: 'China',           flag: '🇨🇳', leader: 'Xi Jinping',                       avatarSeed: 'XJ', avatarColor: '922b21' },
  { code: 'AR', name: 'Argentina',       flag: '🇦🇷', leader: 'Javier Milei',                     avatarSeed: 'JM', avatarColor: '1a5276' },
  { code: 'NG', name: 'Nigeria',         flag: '🇳🇬', leader: 'Bola Tinubu',                      avatarSeed: 'BT', avatarColor: '145a32' },
  { code: 'EG', name: 'Egypt',           flag: '🇪🇬', leader: 'Abdel Fattah el-Sisi',            avatarSeed: 'AS', avatarColor: '6e2f1a' },
  { code: 'TR', name: 'Turkey',          flag: '🇹🇷', leader: 'Recep Tayyip Erdoğan',            avatarSeed: 'RE', avatarColor: '922b21' },
  { code: 'SE', name: 'Sweden',          flag: '🇸🇪', leader: 'Ulf Kristersson',                  avatarSeed: 'UK', avatarColor: '1a6b8a' },
  { code: 'NO', name: 'Norway',          flag: '🇳🇴', leader: 'Jonas Gahr Støre',                 avatarSeed: 'JG', avatarColor: '154360' },
  { code: 'NL', name: 'Netherlands',     flag: '🇳🇱', leader: 'Dick Schoof',                      avatarSeed: 'DS', avatarColor: 'f39c12' },
  { code: 'PL', name: 'Poland',          flag: '🇵🇱', leader: 'Donald Tusk',                      avatarSeed: 'DT', avatarColor: 'c0392b' },
  { code: 'UA', name: 'Ukraine',         flag: '🇺🇦', leader: 'Volodymyr Zelensky',               avatarSeed: 'VZ', avatarColor: '1f618d' },
  { code: 'ZW', name: 'Zimbabwe',        flag: '🇿🇼', leader: 'Emmerson Mnangagwa',               avatarSeed: 'EM', avatarColor: '117a65' },
];
