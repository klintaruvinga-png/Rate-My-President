import { useEffect, useState } from 'react';

interface DailyPromptProps {
  /** Current leader's name, used to personalize the rotating prompts. */
  leaderName?: string;
}

// Rotating microcopy per DESIGN.md:223-227. Personalized when a name is present;
// generic otherwise. Rotates on an interval so it isn't a persistent static label.
const GENERIC_TEMPLATES = [
  'Rate today’s approval',
  'Your vote counts',
  'How are things looking today?',
  'Tap to weigh in',
];

const NAMED_TEMPLATES = (name: string) => [
  `How's ${name} doing today?`,
  `Rate ${name} today`,
  `What's your take on ${name}?`,
  `Your vote on ${name} counts`,
];

const ROTATE_MS = 6000;

/**
 * Rotating Daily Prompt line (DESIGN.md:218). Sits above the swipe area; shows a
 * personalized, cycling microcopy prompt to keep the interaction playful without
 * blending into the serious data layer.
 */
export function DailyPrompt({ leaderName }: DailyPromptProps) {
  const [index, setIndex] = useState(0);

  const templates = leaderName
    ? NAMED_TEMPLATES(leaderName)
    : GENERIC_TEMPLATES;

  useEffect(() => {
    setIndex(0); // restart rotation when the leader changes
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % templates.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [leaderName, templates.length]);

  return (
    <p
      aria-live="polite"
      className="text-center text-[oklch(0.75_0.02_250)] font-['Space_Grotesk'] text-base sm:text-[17px] min-h-[1.5rem]"
    >
      {templates[index]}
    </p>
  );
}

export default DailyPrompt;
