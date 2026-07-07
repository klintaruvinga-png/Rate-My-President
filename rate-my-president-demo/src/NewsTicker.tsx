import AnimatedFlag from './AnimatedFlag';
import newGlobeImage from '../../assets/New Globe.png';

interface NewsItem {
  country: string;
  countryCode: string;
  fallbackFlag?: string;
  headline: string;
}

const HEADLINES: NewsItem[] = [
  { country: 'United Kingdom', countryCode: 'GB', fallbackFlag: '🇬🇧', headline: "Starmer's growth plan faces first parliamentary test" },
  { country: 'France', countryCode: 'FR', fallbackFlag: '🇫🇷', headline: 'Macron reshuffles cabinet ahead of autumn budget vote' },
  { country: 'United States', countryCode: 'US', fallbackFlag: '🇺🇸', headline: 'Trump signs executive order on trade tariff expansion' },
  { country: 'India', countryCode: 'IN', fallbackFlag: '🇮🇳', headline: 'Modi unveils infrastructure spend of $1.2 trillion over five years' },
  { country: 'Germany', countryCode: 'DE', fallbackFlag: '🇩🇪', headline: 'Scholz coalition reaches deal on climate transition fund' },
  { country: 'Brazil', countryCode: 'BR', fallbackFlag: '🇧🇷', headline: 'Lula increases minimum wage amid inflation concerns' },
  { country: 'South Africa', countryCode: 'ZA', fallbackFlag: '🇿🇦', headline: 'Ramaphosa pledges electricity reform at energy summit' },
  { country: 'Japan', countryCode: 'JP', fallbackFlag: '🇯🇵', headline: 'Kishida secures G7 backing for Indo-Pacific security pact' },
  { country: 'Canada', countryCode: 'CA', fallbackFlag: '🇨🇦', headline: 'New PM tables landmark indigenous reconciliation bill' },
  { country: 'Australia', countryCode: 'AU', fallbackFlag: '🇦🇺', headline: 'Albanese announces record defence budget for 2027' },
];

function buildItems(items: NewsItem[]) {
  const doubled = [...items, ...items];
  return doubled.map((item, i) => (
    <span key={`${item.country}-${i}`} className="ticker-item">
      <span className="ticker-flag" aria-hidden="true">
        <AnimatedFlag
          countryCode={item.countryCode}
          fallbackFlag={item.fallbackFlag}
          className="h-4 w-4 rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
          alt={`${item.country} flag`}
        />
      </span>
      <span className="ticker-country">{item.country}</span>
      <span className="ticker-copy">{item.headline}</span>
      {i < doubled.length - 1 && <span className="ticker-sep" aria-hidden="true">·</span>}
    </span>
  ));
}

export function NewsTicker() {
  return (
    <div className="ticker-bar">
      <img
        src={newGlobeImage}
        alt="Globe"
        className="h-[34px] w-[34px] flex-shrink-0 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      />

      <span className="ticker-divider" aria-hidden="true" />

      <span className="ticker-label">
        <span className="ticker-live-dot" />
        News
      </span>

      <span className="ticker-divider" aria-hidden="true" />

      <div className="ticker-track">
        <div className="news-ticker ticker-row">
          {buildItems(HEADLINES)}
        </div>
      </div>
    </div>
  );
}

export default NewsTicker;
