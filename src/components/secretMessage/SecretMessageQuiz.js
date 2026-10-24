import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { ALPHABET, SECRET_MESSAGES, makeClues, messageLetters, readSecretSession } from './secretMessageConfig';

const primaryButton = 'rounded-button bg-brand-blue px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export default function SecretMessageQuiz({ userId, selectedGrade, returnToTopics }) {
  const storageKey = `mathwhiz-secret-message-v1:${userId}:${selectedGrade}`;
  const [session, setSession] = useState(() => readSecretSession(storageKey));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const answerRef = useRef(null);
  const message = SECRET_MESSAGES.find(item => item.id === session?.quoteId);
  const clues = message ? makeClues(message, selectedGrade, session.seed) : [];
  const complete = !!message && session.solved === clues.length;
  const clue = clues[session?.solved];

  useEffect(() => {
    try {
      if (session) localStorage.setItem(storageKey, JSON.stringify(session));
      else localStorage.removeItem(storageKey);
    } catch (_) { setStorageAvailable(false); }
  }, [session, storageKey]);

  useEffect(() => { answerRef.current?.focus(); }, [session?.solved, session?.mathSolved]);

  const start = (item) => {
    setSession({ quoteId: item.id, seed: Math.floor(Math.random() * 1000000), solved: 0, mathSolved: false });
    setAnswer('');
    setFeedback('');
    setShowHint(false);
  };

  const check = (event) => {
    event.preventDefault();
    if (!clue || !answer.trim()) return;
    if (!session.mathSolved) {
      if (!/^\d+$/.test(answer.trim()) || Number(answer) !== clue.answer) {
        setFeedback('Try again! Solve the math clue first. You can use a hint.');
        return;
      }
      setSession({ ...session, mathSolved: true });
      setAnswer('');
      setFeedback(`Correct! Now use the key to find the letter for ${clue.answer}.`);
    } else if (answer.trim().toUpperCase() !== clue.letter) {
      setFeedback(`Look for ${clue.answer} in the key, then enter its letter.`);
    } else {
      setSession({ ...session, solved: session.solved + 1, mathSolved: false });
      setAnswer('');
      setShowHint(false);
      setFeedback(`${clue.answer} = ${clue.letter}. You decoded a letter!`);
    }
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
      <p className="text-gray-600 mb-6">Solve a math clue. Turn the answer into a letter using A=1, B=2, all the way to Z=26. Uncover a scientist’s words, one letter at a time!</p>
      <p className="text-sm text-gray-500 mb-5">Bonus arithmetic practice. Progress is saved on this device{storageAvailable ? '.' : ' only while this page stays open because browser storage is unavailable.'}</p>
      {!message ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold">Choose a mystery</h2>
          {SECRET_MESSAGES.map(item => (
            <button key={item.id} onClick={() => start(item)} className="w-full text-left p-5 border-2 border-teal-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
              <span className="block text-lg font-bold">A message from {item.scientist}</span>
              <span className="text-sm text-gray-600">{messageLetters(item).length} clues · {item.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-teal-50 rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="font-bold mb-4">{complete ? 'Message decoded!' : `Your message · ${session.solved} of ${clues.length} letters decoded`}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-3" aria-label="Decoded message">
              {(() => {
                let letterIndex = 0;
                return message.text.toUpperCase().split(' ').map((word, wordIndex) => (
                  <span className="inline-flex flex-wrap max-w-full gap-0.5 sm:gap-1" key={wordIndex}>
                    {[...word].map((character, characterIndex) => {
                      if (!ALPHABET.includes(character)) return <span key={characterIndex} className="self-end font-bold">{character}</span>;
                      const index = letterIndex++;
                      const revealed = index < session.solved;
                      return <span key={characterIndex} aria-label={revealed ? character : 'Hidden letter'} className={`inline-flex items-center justify-center w-4 h-8 text-sm sm:text-base sm:w-8 sm:h-10 border-b-2 font-display font-bold ${revealed ? 'bg-white border-teal-600 text-teal-800' : index === session.solved ? 'bg-yellow-100 border-yellow-600' : 'border-teal-200'}`}>{revealed ? character : '?'}</span>;
                    })}
                  </span>
                ));
              })()}
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
              <p className="text-3xl font-display font-bold mb-5">{clue.expression} = {session.mathSolved ? clue.answer : '?'}</p>
              <form onSubmit={check} className="flex flex-wrap items-end gap-3 mb-4">
                <label className="font-semibold">
                  <span className="block mb-2">{session.mathSolved ? `Which letter matches ${clue.answer}?` : 'Your math answer'}</span>
                  <input ref={answerRef} value={answer} onChange={event => setAnswer(event.target.value)} inputMode={session.mathSolved ? 'text' : 'numeric'} autoComplete="off" maxLength={session.mathSolved ? 1 : 3} className="w-32 border-2 border-gray-300 rounded-lg p-3 text-xl uppercase focus:outline-blue-600" />
                </label>
                <button type="submit" disabled={!answer.trim()} className={primaryButton}>{session.mathSolved ? 'Decode letter' : 'Check answer'}</button>
              </form>
              <p role="status" className="min-h-[28px] font-semibold text-teal-800 mb-3">{feedback}</p>
              {!session.mathSolved && <button onClick={() => setShowHint(!showHint)} aria-expanded={showHint} className="text-blue-700 underline mb-3">{showHint ? 'Hide hint' : 'Need a hint?'}</button>}
              {showHint && !session.mathSolved && <p className="bg-blue-50 p-3 rounded-lg mb-4">{clue.hint}</p>}
              <h3 className="font-bold mb-2">Your decoding key</h3>
              <div className="grid grid-cols-7 sm:grid-cols-[repeat(13,minmax(0,1fr))] gap-1" aria-label="Alphabet decoding key">
                {[...ALPHABET].map((letter, index) => <div key={letter} className="text-center border rounded p-1 bg-gray-50"><span className="block font-bold">{letter}</span><span className="text-sm text-gray-600">{index + 1}</span></div>)}
              </div>
              <button onClick={() => { setSession(null); setAnswer(''); setFeedback(''); setShowHint(false); }} className="mt-6 text-sm text-blue-700 underline">Choose a different message</button>
            </>
          )}
        </>
      )}
    </section>
  );
}
