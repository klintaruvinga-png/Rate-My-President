/**
 * Rate My President: Shared Country and Leader Data
 *
 * Single source of truth for both the onboarding country picker
 * and the swipe card demo queue builder.
 */

export interface CountryData {
  /** Backend president ID (pres_xxx) for swipe persistence */
  id: string;
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
  /** Path to custom avatar image in public/avatars/ */
  avatarUrl?: string;
}

export const availableCountries: CountryData[] = [
  { id: 'pres_015', code: 'GB', name: 'United Kingdom',  flag: '🇬🇧', leader: 'Keir Starmer',                    avatarSeed: 'KS', avatarColor: '2f4f4f', avatarUrl: '/avatars/keir-starmer.webp' },
  { id: 'pres_007', code: 'US', name: 'United States',   flag: '🇺🇸', leader: 'Donald Trump',                     avatarSeed: 'DTU', avatarColor: '4682b4', avatarUrl: '/avatars/donald-trump.webp' },
  { id: 'pres_009', code: 'FR', name: 'France',          flag: '🇫🇷', leader: 'Emmanuel Macron',                  avatarSeed: 'EM', avatarColor: '4b0082', avatarUrl: '/avatars/emmanuel-macron.webp' },
  { id: 'pres_011', code: 'DE', name: 'Germany',         flag: '🇩🇪', leader: 'Friedrich Merz',                   avatarSeed: 'FM', avatarColor: '556b2f', avatarUrl: '/avatars/friedrich-merz.webp' },
  { id: 'pres_022', code: 'JP', name: 'Japan',           flag: '🇯🇵', leader: 'Shigeru Ishiba',                   avatarSeed: 'SI', avatarColor: '8b0000', avatarUrl: '/avatars/shigeru-ishiba.webp' },
  { id: 'pres_019', code: 'IN', name: 'India',           flag: '🇮🇳', leader: 'Narendra Modi',                    avatarSeed: 'NM', avatarColor: 'b8860b', avatarUrl: '/avatars/narendra-modi.webp' },
  { id: 'pres_017', code: 'BR', name: 'Brazil',          flag: '🇧🇷', leader: 'Luiz Inácio Lula da Silva',        avatarSeed: 'LL', avatarColor: '2e8b57', avatarUrl: '/avatars/lula-da-silva.webp' },
  { id: 'pres_018', code: 'CA', name: 'Canada',          flag: '🇨🇦', leader: 'Mark Carney',                      avatarSeed: 'MC', avatarColor: 'c0392b', avatarUrl: '/avatars/mark-carney.webp' },
  { id: 'pres_002', code: 'AU', name: 'Australia',       flag: '🇦🇺', leader: 'Anthony Albanese',                 avatarSeed: 'AA', avatarColor: '1a5276', avatarUrl: '/avatars/anthony-albanese.webp' },
  { id: 'pres_004', code: 'MX', name: 'Mexico',          flag: '🇲🇽', leader: 'Claudia Sheinbaum',                avatarSeed: 'CS', avatarColor: '884ea0', avatarUrl: '/avatars/claudia-sheinbaum.webp' },
  { id: 'pres_005', code: 'ZA', name: 'South Africa',    flag: '🇿🇦', leader: 'Cyril Ramaphosa',                  avatarSeed: 'CR', avatarColor: '1e8bc3', avatarUrl: '/avatars/cyril-ramaphosa.webp' },
  { id: 'pres_016', code: 'KR', name: 'South Korea',     flag: '🇰🇷', leader: 'Lee Jae-myung',                    avatarSeed: 'LJ', avatarColor: '2c3e50', avatarUrl: '/avatars/lee-jae-myung.webp' },
  { id: 'pres_012', code: 'IT', name: 'Italy',           flag: '🇮🇹', leader: 'Giorgia Meloni',                   avatarSeed: 'GM', avatarColor: '6c3483', avatarUrl: '/avatars/giorgia-meloni.webp' },
  { id: 'pres_020', code: 'ES', name: 'Spain',           flag: '🇪🇸', leader: 'Pedro Sánchez',                    avatarSeed: 'PS', avatarColor: 'd35400', avatarUrl: '/avatars/pedro-sanchez.webp' },
  { id: 'pres_024', code: 'RU', name: 'Russia',          flag: '🇷🇺', leader: 'Vladimir Putin',                   avatarSeed: 'VP', avatarColor: '7f8c8d', avatarUrl: '/avatars/vladimir-putin.webp' },
  { id: 'pres_026', code: 'CN', name: 'China',           flag: '🇨🇳', leader: 'Xi Jinping',                       avatarSeed: 'XJ', avatarColor: '922b21', avatarUrl: '/avatars/xi-jinping.webp' },
  { id: 'pres_013', code: 'AR', name: 'Argentina',      flag: '🇦🇷', leader: 'Javier Milei',                     avatarSeed: 'JM', avatarColor: '1a5276', avatarUrl: '/avatars/javier-milei.webp' },
  { id: 'pres_003', code: 'NG', name: 'Nigeria',         flag: '🇳🇬', leader: 'Bola Tinubu',                      avatarSeed: 'BT', avatarColor: '145a32', avatarUrl: '/avatars/bola-tinubu.webp' },
  { id: 'pres_001', code: 'EG', name: 'Egypt',           flag: '🇪🇬', leader: 'Abdel Fattah el-Sisi',            avatarSeed: 'AS', avatarColor: '6e2f1a', avatarUrl: '/avatars/abdel-fattah-el-sisi.webp' },
  { id: 'pres_021', code: 'TR', name: 'Turkey',          flag: '🇹🇷', leader: 'Recep Tayyip Erdoğan',            avatarSeed: 'RE', avatarColor: '922b21', avatarUrl: '/avatars/recep-tayyip-erdogan.webp' },
  { id: 'pres_023', code: 'SE', name: 'Sweden',          flag: '🇸🇪', leader: 'Ulf Kristersson',                  avatarSeed: 'UK', avatarColor: '1a6b8a', avatarUrl: '/avatars/ulf-kristersson.webp' },
  { id: 'pres_014', code: 'NO', name: 'Norway',          flag: '🇳🇴', leader: 'Jonas Gahr Støre',                 avatarSeed: 'JG', avatarColor: '154360', avatarUrl: '/avatars/jonas-gahr-store.webp' },
  { id: 'pres_006', code: 'NL', name: 'Netherlands',     flag: '🇳🇱', leader: 'Dick Schoof',                      avatarSeed: 'DS', avatarColor: 'f39c12', avatarUrl: '/avatars/dick-schoof.webp' },
  { id: 'pres_008', code: 'PL', name: 'Poland',          flag: '🇵🇱', leader: 'Donald Tusk',                      avatarSeed: 'DTU2', avatarColor: 'c0392b', avatarUrl: '/avatars/donald-tusk.webp' },
  { id: 'pres_025', code: 'UA', name: 'Ukraine',         flag: '🇺🇦', leader: 'Volodymyr Zelensky',               avatarSeed: 'VZ', avatarColor: '1f618d', avatarUrl: '/avatars/volodymyr-zelensky.webp' },
  { id: 'pres_010', code: 'ZW', name: 'Zimbabwe',        flag: '🇿🇼', leader: 'Emmerson Mnangagwa',               avatarSeed: 'EMN', avatarColor: '117a65', avatarUrl: '/avatars/emmerson-mnangagwa.webp' },
];
