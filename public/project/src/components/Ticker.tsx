import React from 'react';

const Ticker = () => {
  const tickerText = "STABO BETA / ADD TO HOME SCREEN / Y2K DIGITAL EXPERIENCE / CONNECT WALLET / DUMPLING TV VIBES / RETRO CYBER / ";

  return (
    <div className="ticker py-2 font-mono-retro text-sm tracking-wider">
      <div className="ticker-content text-green-400">
        {tickerText.repeat(3)}
      </div>
    </div>
  );
};

export default Ticker;