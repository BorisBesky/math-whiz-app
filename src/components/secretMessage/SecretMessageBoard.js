import React, { useEffect, useRef, useState } from 'react';
import { ALPHABET } from './secretMessageConfig';
import './SecretMessageBoard.css';

export default function SecretMessageBoard({ message, code, decodedLetters, activeLetter, heading, scanRequest, onScanComplete }) {
  const boardRef = useRef(null);
  const scannerRef = useRef(null);
  const tileRefs = useRef([]);
  const [foundPositions, setFoundPositions] = useState([]);
  const [stoppedAt, setStoppedAt] = useState(null);

  useEffect(() => {
    setFoundPositions([]);
    setStoppedAt(null);
    if (!scanRequest) return undefined;
    const board = boardRef.current;
    const scanner = scannerRef.current;
    // Keep reduced-motion users and older browsers on the immediate reveal path.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !scanner?.animate) {
      onScanComplete();
      return undefined;
    }

    let cancelled = false;
    let animation;
    let timer;
    let resolvePause;
    const pause = duration => new Promise(resolve => {
      resolvePause = resolve;
      timer = window.setTimeout(resolve, duration);
    });
    const positionOf = tile => {
      const bounds = board.getBoundingClientRect();
      const target = tile.getBoundingClientRect();
      // The lens center is (20, 20) in the 48px SVG.
      return `translate(${target.left - bounds.left + target.width / 2 - 20}px, ${target.top - bounds.top + target.height / 2 - 20}px)`;
    };
    const tiles = tileRefs.current.filter(Boolean);
    const travelTime = Math.max(20, Math.min(85, 1500 / tiles.length));
    const scan = async () => {
      board.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      let previous = positionOf(tiles[0]);
      scanner.style.transform = previous;
      scanner.style.visibility = 'visible';
      for (const [index, tile] of tiles.entries()) {
        if (cancelled) return;
        setStoppedAt(null);
        const target = positionOf(tile);
        animation = scanner.animate([{ transform: previous }, { transform: target }], {
          duration: travelTime, easing: 'linear', fill: 'forwards',
        });
        try { await animation.finished; } catch (_) { if (cancelled) return; }
        if (cancelled) return;
        scanner.style.transform = target;
        animation.cancel();
        previous = target;
        if (tile.dataset.letter === scanRequest.letter) {
          tile.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          setStoppedAt(index);
          setFoundPositions(found => [...found, index]);
          await pause(320);
        }
      }
      if (!cancelled) onScanComplete();
    };
    scan();
    return () => {
      cancelled = true;
      animation?.cancel();
      window.clearTimeout(timer);
      resolvePause?.();
    };
  }, [scanRequest, message.text, onScanComplete]);

  let letterIndex = 0;
  return (
    <div ref={boardRef} className="secret-message-board relative bg-teal-50 rounded-xl p-4 sm:p-6 mb-6" aria-busy={Boolean(scanRequest)}>
      <h2 className="font-bold mb-4">{heading}</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-3" aria-label="Decoded message">
        {message.text.toUpperCase().split(' ').map((word, wordIndex) => (
          <span className="inline-flex flex-wrap max-w-full gap-0.5 sm:gap-1" key={wordIndex}>
            {[...word].map((character, characterIndex) => {
              if (!ALPHABET.includes(character)) return <span key={characterIndex} className="self-end font-bold">{character}</span>;
              const index = letterIndex++;
              const revealed = decodedLetters.has(character) || (Boolean(scanRequest) && foundPositions.includes(index));
              const number = code[character];
              const ready = character === activeLetter;
              return <span key={characterIndex} ref={element => { tileRefs.current[index] = element; }} data-letter={character}
                aria-label={revealed ? `${number} decoded as ${character}` : `Number ${number}, hidden letter`}
                className={`secret-message-tile inline-flex flex-col items-center justify-center w-10 h-12 sm:w-12 border-b-2 font-display font-bold ${stoppedAt === index && scanRequest ? 'secret-message-found' : ''} ${revealed ? 'bg-white border-teal-600 text-teal-800' : ready ? 'bg-yellow-100 border-yellow-600' : 'border-teal-200'}`}>
                <span className="text-sm sm:text-base">{revealed ? character : number}</span>
                {revealed && <span className="text-xs font-normal text-gray-500">{number}</span>}
              </span>;
            })}
          </span>
        ))}
      </div>
      {scanRequest && <div ref={scannerRef} className="secret-message-scanner" aria-hidden="true" data-testid="message-magnifier">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M32 32L44 44" stroke="#115e59" strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="20" r="17" fill="#ffffff" fillOpacity="0.18" stroke="#0f766e" strokeWidth="3" />
          <path d="M10 17C11 12 14 10 18 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>}
    </div>
  );
}
