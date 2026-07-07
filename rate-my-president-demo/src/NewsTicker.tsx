import newGlobeImage from '../../assets/New Globe.png';

interface NewsItem {
  country: string;
  headline: string;
}

const HEADLINES: NewsItem[] = [
  { country: 'United Kingdom', headline: "Starmer's growth plan faces first parliamentary test" },
  { country: 'France', headline: 'Macron reshuffles cabinet ahead of autumn budget vote' },
  { country: 'United States', headline: 'Trump signs executive order on trade tariff expansion' },
  { country: 'India', headline: 'Modi unveils infrastructure spend of $1.2 trillion over five years' },
  { country: 'Germany', headline: 'Scholz coalition reaches deal on climate transition fund' },
  { country: 'Brazil', headline: 'Lula increases minimum wage amid inflation concerns' },
  { country: 'South Africa', headline: 'Ramaphosa pledges electricity reform at energy summit' },
  { country: 'Japan', headline: 'Kishida secures G7 backing for Indo-Pacific security pact' },
  { country: 'Canada', headline: 'New PM tables landmark indigenous reconciliation bill' },
  { country: 'Australia', headline: 'Albanese announces record defence budget for 2027' },
];

// Render each item as a JSX fragment so country gets amber colouring inline.
// We duplicate all items to form the seamless 2× loop.
function buildItems(items: NewsItem[]) {
  // Full set × 2 for the seamless -50% loop
  const doubled = [...items, ...items];
  return doubled.map((item, i) => (
    <span key={i} className="news-ticker-item">
      <span className="news-ticker-country">{item.country}:</span>
      {' '}
      <span className="news-ticker-headline">{item.headline}</span>
      {i < doubled.length - 1 && (
        <span className="news-ticker-sep" aria-hidden="true">   ·   </span>
      )}
    </span>
  ));
}

export function NewsTicker() {
  return (
    <div className="news-ticker-bar flex items-center gap-3 border-b border-[oklch(0.28_0.02_250)] bg-[oklch(0.17_0.03_250)] px-4 py-1.5">
      {/* Globe — sized to match text line-height */}
      <img
        src={newGlobeImage}
        alt="Globe"
        className="h-[34px] w-[34px] flex-shrink-0 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      />

      {/* Divider */}
      <span className="h-5 w-px flex-shrink-0 bg-[oklch(0.32_0.02_250)]" aria-hidden="true" />

      {/* LIVE badge — green */}
      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[oklch(0.62_0.18_142)] font-['Space_Grotesk']">
        <span className="news-live-dot inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.18_142)]" />
        News
      </span>

      {/* Divider */}
      <span className="h-5 w-px flex-shrink-0 bg-[oklch(0.32_0.02_250)]" aria-hidden="true" />

      {/* Scrolling ticker — single animated strip, content doubled inside */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="news-ticker whitespace-nowrap text-xs font-medium font-['Inter']">
          {buildItems(HEADLINES)}
        </div>
      </div>
    </div>
  );
}

export default NewsTicker;
