import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { ALPHABET, SECRET_MESSAGES, makeClues, makeNumberLetterMap, messageLetters, readSecretSession } from './secretMessageConfig';

const primaryButton = 'rounded-button bg-brand-blue px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export default function SecretMessageQuiz({ userId, selectedGrade, returnToTopics }) {
  const storageKey = `mathwhiz-secret-message-v2:${userId}:${selectedGrade}`;
  const [session, setSession] = useState(() => readSecretSession(storageKey));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const answerRef = useRef(null);
  const letterRef = useRef(null);
  const message = SECRET_MESSAGES.find(item => item.id === session?.quoteId);
  const clues = message ? makeClues(message, selectedGrade, session.seed) : [];
  const code = message ? makeNumberLetterMap(session.seed) : {};
  const decodedLetters = new Set(clues.slice(0, session?.solved || 0).map(item => item.letter));
  const complete = !!message && session.solved === clues.length;
  const clue = clues[session?.solved];

  useEffect(() => {
    try {
      if (session) localStorage.setItem(storageKey, JSON.stringify(session));
      else localStorage.removeItem(storageKey);
    } catch (_) { setStorageAvailable(false); }
  }, [session, storageKey]);

  useEffect(() => {
    if (session?.mathSolved) letterRef.current?.focus({ preventScroll: true });
    else answerRef.current?.focus({ preventScroll: true });
  }, [session?.solved, session?.mathSolved]);

  const start = (item) => {
    setSession({ quoteId: item.id, seed: Math.floor(Math.random() * 1000000), solved: 0, mathSolved: false });
    setAnswer('');
    setFeedback('');
    setShowHint(false);
  };

  const check = (event) => {
    event.preventDefault();
    if (!clue || !answer.trim()) return;
    if (session.mathSolved) return;
    if (!/^\d+$/.test(answer.trim()) || Number(answer) !== clue.answer) {
      setFeedback('Try again! Solve the math clue first. You can use a hint.');
      return;
    }
    setSession({ ...session, mathSolved: true });
    setAnswer('');
    setFeedback(`Correct! ${clue.answer} = ${clue.letter}. Click ${clue.letter} in your key to fill every ${clue.answer} in the message.`);
  };

  const placeLetter = () => {
    if (!session.mathSolved || !clue) return;
    setSession({ ...session, solved: session.solved + 1, mathSolved: false });
    setAnswer('');
    setShowHint(false);
    setFeedback(`You placed ${clue.letter} in every space numbered ${clue.answer}!`);
  };

  return (
    <section className="max-w-3xl mx-auto mt-12 mb-12 bg-white p-5 sm:p-8 rounded-card shadow-card text-gray-800">
      <button onClick={returnToTopics} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 mb-6 rounded focus-visible:outline focus-visible:outline-2">
        <ArrowLeft size={18} /> Back to topics
      </button>
      <div className="flex items-center gap-3 mb-3">
        <KeyRound className="text-teal-700 shrink-0" size={30} />
        <h1 className="font-display text-3xl font-bold">Secret Message</h1>
      </div>
      <p className="text-gray-600 mb-6">This message is written in numbers! Solve each letter’s math clue to discover its number. Then click the letter in your key to fill every matching space. Each puzzle has its own secret code.</p>
      <p className="text-sm text-gray-500 mb-5">Bonus arithmetic practice. Progress is saved on this device{storageAvailable ? '.' : ' only while this page stays open because browser storage is unavailable.'}</p>
      {!message ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold">Choose a mystery</h2>
          {SECRET_MESSAGES.map(item => (
            <button key={item.id} onClick={() => start(item)} className="w-full text-left p-5 border-2 border-teal-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
              <span className="block text-lg font-bold">A message from {item.scientist}</span>
              <span className="text-sm text-gray-600">{new Set(messageLetters(item)).size} clues · {item.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-teal-50 rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="font-bold mb-4">{complete ? 'Message decoded!' : `Your message · ${session.solved} of ${clues.length} number–letter pairs found`}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-3" aria-label="Decoded message">
              {message.text.toUpperCase().split(' ').map((word, wordIndex) => (
                <span className="inline-flex flex-wrap max-w-full gap-0.5 sm:gap-1" key={wordIndex}>
                  {[...word].map((character, characterIndex) => {
                    if (!ALPHABET.includes(character)) return <span key={characterIndex} className="self-end font-bold">{character}</span>;
                    const revealed = decodedLetters.has(character);
                    const number = code[character];
                    const ready = session.mathSolved && character === clue?.letter;
                    return <span key={characterIndex} aria-label={revealed ? `${number} decoded as ${character}` : `Number ${number}, hidden letter`} className={`inline-flex flex-col items-center justify-center w-5 h-12 sm:w-8 border-b-2 font-display font-bold ${revealed ? 'bg-white border-teal-600 text-teal-800' : ready ? 'bg-yellow-100 border-yellow-600' : 'border-teal-200'}`}>
                      <span className="text-sm sm:text-base">{revealed ? character : number}</span>
                      {revealed && <span className="text-xs font-normal text-gray-500">{number}</span>}
                    </span>;
                  })}
                </span>
              ))}
            </div>
          </div>
          {complete ? (
            <div className="space-y-4">
              <blockquote className="text-2xl font-display font-bold">“{message.text}”</blockquote>
              <p className="font-bold">— {message.scientist}</p>
              <p>{message.description}</p>
              <p>{message.meaning}</p>
              <a href={message.source} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-700 underline">Read the quote’s source</a>
              <div><button onClick={() => { setSession(null); setFeedback(''); }} className={primaryButton}>Choose another message</button></div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-500 mb-2">Clue {session.solved + 1} of {clues.length}</p>
              <h3 className="text-lg font-bold mb-2">Find the number for {clue.letter}</h3>
              <p className="text-3xl font-display font-bold mb-5">{clue.expression} = {session.mathSolved ? clue.answer : '?'}</p>
              {!session.mathSolved && <form onSubmit={check} className="flex flex-wrap items-end gap-3 mb-4">
                <label className="font-semibold">
                  <span className="block mb-2">Your math answer</span>
                  <input ref={answerRef} value={answer} onChange={event => setAnswer(event.target.value)} inputMode="numeric" autoComplete="off" maxLength={3} className="w-32 border-2 border-gray-300 rounded-lg p-3 text-xl uppercase focus:outline-blue-600" />
                </label>
                <button type="submit" disabled={!answer.trim()} className={primaryButton}>Check answer</button>
              </form>}
              <p role="status" className="min-h-[28px] font-semibold text-teal-800 mb-3">{feedback}</p>
              {!session.mathSolved && <button onClick={() => setShowHint(!showHint)} aria-expanded={showHint} className="text-blue-700 underline mb-3">{showHint ? 'Hide hint' : 'Need a hint?'}</button>}
              {showHint && !session.mathSolved && <p className="bg-blue-50 p-3 rounded-lg mb-4">{clue.hint}</p>}
              <h3 className="font-bold mb-2">Your number–letter key</h3>
              <p className="text-sm text-gray-600 mb-3">{session.mathSolved ? `Click ${clue.letter} to place it in the message.` : 'Solve a clue to unlock a letter. Its number will appear here.'}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" aria-label="Number-letter decoding key">
                {[...clues].sort((a, b) => a.letter.localeCompare(b.letter)).map(item => {
                  const ready = session.mathSolved && item.letter === clue.letter;
                  const placed = decodedLetters.has(item.letter);
                  return <button key={item.letter} ref={ready ? letterRef : null} disabled={!ready} onClick={placeLetter}
                    aria-label={ready ? `Place ${item.letter} in every ${item.answer}` : placed ? `${item.answer} = ${item.letter}, placed` : `${item.letter}, locked`}
                    className={`min-h-[52px] rounded-lg border-2 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${ready ? 'bg-yellow-100 border-yellow-600 text-gray-900 hover:bg-yellow-200' : placed ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span className="block font-bold text-lg">{item.letter}</span>
                    <span className="text-sm">{placed || ready ? `= ${item.answer}` : '?'}</span>
                  </button>;
                })}
              </div>
              <button onClick={() => { setSession(null); setAnswer(''); setFeedback(''); setShowHint(false); }} className="mt-6 text-sm text-blue-700 underline">Choose a different message</button>
            </>
          )}
        </>
      )}
    </section>
  );
}
