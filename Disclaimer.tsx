import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[oklch(0.15_0.04_250)] border-t border-[oklch(0.25_0.04_250)] px-4 py-3 z-50">
      <p className="text-[oklch(0.6_0.02_250)] text-xs text-center leading-relaxed">
        Entertainment product. Reflects activity of app users only — not a scientific or representative poll.
      </p>
    </div>
  );
};

export default Disclaimer;
