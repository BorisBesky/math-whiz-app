import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { ALPHABET, makeClues, makeNumberLetterMap, messageLetters, readSecretSession } from './secretMessageConfig';

import { generateMessageBatch, normalizeMessageProgress, completeMessage } from './messageLibrary';

const primaryButton = 'rounded-button bg-brand-blue px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export default function SecretMessageQuiz({ userId, selectedGrade, returnToTopics, savedProgress, saveCompletion, initialComplexity = 0.5 }) {
  const storageKey = `mathwhiz-secret-message-v4:${userId}:${selectedGrade}`;
  const progressKey = `mathwhiz-secret-progress-v1:${userId}`;
  const [progress, setProgress] = useState(() => {
    if (savedProgress) return normalizeMessageProgress(savedProgress);
    try { return normalizeMessageProgress(JSON.parse(localStorage.getItem(progressKey))); }
    catch (_) { return normalizeMessageProgress(null); }
  });
  const messages = useMemo(() => generateMessageBatch(progress.batch), [progress.batch]);
  const [session, setSession] = useState(() => {
    const restored = readSecretSession(storageKey, generateMessageBatch(progress.batch));
    return restored && !progress.completedIds.includes(restored.quoteId) ? { ...restored, message: messages.find(item => item.id === restored.quoteId) } : null;
  });
  const [visibleCount, setVisibleCount] = useState(6);
  const [completionState, setCompletionState] = useState('idle');
  const [completionError, setCompletionError] = useState('');
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const answerRef = useRef(null);
  const letterRef = useRef(null);
  const message = session?.message;
  const availableMessages = messages.filter(item => !progress.completedIds.includes(item.id));
  const clues = message ? makeClues(message, selectedGrade, session.seed, session.complexity) : [];
  const code = message ? makeNumberLetterMap(session.seed, selectedGrade, session.complexity) : {};
  const decodedLetters = new Set(clues.slice(0, session?.solved || 0).map(item => item.letter));
  const complete = !!message && session.solved === clues.length;
  const clue = clues[session?.solved];

  useEffect(() => {
    const incoming = normalizeMessageProgress(savedProgress);
    setProgress(current => incoming.completedCount > current.completedCount ? incoming : current);
  }, [savedProgress]);

  useEffect(() => {
    try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch (_) { setStorageAvailable(false); }
    // A completion on another device must not leave an already-used puzzle playable.
    if (session && !complete && (session.batch !== progress.batch || progress.completedIds.includes(session.quoteId))) {
      setSession(null);
      setFeedback('That message was completed on another device. Choose a new one.');
    }
  }, [progress, progressKey, session, complete]);

  useEffect(() => {
    if (!complete || completionState !== 'idle') return;
    let active = true;
    setCompletionState('saving');
    const performance = { firstTry: session.firstTry, total: clues.length, complexity: session.complexity };
    const saving = Promise.resolve().then(() => saveCompletion
      ? saveCompletion(userId, message.id, selectedGrade, performance)
      : completeMessage(progress, message.id, selectedGrade, performance));
    Promise.resolve(saving).then(next => {
      if (active) { setProgress(next); setCompletionState('saved'); }
    }).catch(() => {
      if (active) { setCompletionState('error'); setCompletionError('Your completion could not be saved. Check your connection and try again.'); }
    });
    return () => { active = false; };
    // Completion is a single operation per puzzle. Retry explicitly resets this status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, saveAttempt]);

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
    const complexity = progress.complexityByGrade[selectedGrade] ?? Math.max(0.15, Math.min(0.95, initialComplexity));
    setSession({ quoteId: item.id, message: item, batch: progress.batch, seed: Math.floor(Math.random() * 1000000), solved: 0, mathSolved: false, complexity, firstTry: 0, hadMistake: false });
    setCompletionState('idle');
    setCompletionError('');
    setAnswer('');
    setFeedback('');
    setShowHint(false);
  };

  const check = (event) => {
    event.preventDefault();
    if (!clue || !answer.trim()) return;
    if (session.mathSolved) return;
    if (!/^\d+$/.test(answer.trim()) || Number(answer) !== clue.answer) {
      setSession({ ...session, hadMistake: true });
      setFeedback('Try again! Solve the math clue first. You can use a hint.');
      return;
    }
    setSession({ ...session, mathSolved: true });
    setAnswer('');
    setFeedback(`Correct! ${clue.answer} = ${clue.letter}. Click ${clue.letter} in your key to fill every ${clue.answer} in the message.`);
  };

  const placeLetter = () => {
    if (!session.mathSolved || !clue) return;
    setSession({ ...session, solved: session.solved + 1, mathSolved: false, firstTry: session.firstTry + (session.hadMistake ? 0 : 1), hadMistake: false });
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
      <p className="text-sm text-gray-500 mb-5">Bonus arithmetic practice. {saveCompletion ? 'Completed messages are saved to your account across grades and devices.' : 'Progress is saved on this device.'}{!storageAvailable && ' Browser storage is unavailable, so unfinished puzzles cannot be saved on this device.'}</p>
      {!message ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold">Choose a mystery</h2>
          <p className="text-sm text-gray-600">{progress.completedCount} {progress.completedCount === 1 ? 'message' : 'messages'} completed · {availableMessages.length} unused messages in this batch of 200. Completed messages will not repeat.</p>
          {feedback && <p role="status" className="text-teal-800">{feedback}</p>}
          {progress.batch > 0 && <p className="text-sm text-teal-800">New batch: 200 Math Whiz original messages, composed for learning and kindness.</p>}
          {availableMessages.length > 0 ? <button onClick={() => start(availableMessages[Math.floor(Math.random() * availableMessages.length)])} className={primaryButton}>Start a surprise message</button> : <p>You have completed every message currently available. More messages need to be added to the library.</p>}
          {availableMessages.slice(0, visibleCount).map(item => (
            <button key={item.id} onClick={() => start(item)} className="w-full text-left p-5 border-2 border-teal-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
              <span className="block text-xs font-semibold text-teal-700 mb-1">Mystery {progress.batch * 200 + messages.indexOf(item) + 1}</span>
              <span className="block text-lg font-bold">A message {item.attribution === 'attributed' ? 'attributed to' : 'from'} {item.scientist}</span>
              <span className="text-sm text-gray-600">{item.attribution === 'original' ? 'Original message · ' : ''}{new Set(messageLetters(item)).size} clues · {item.description}</span>
            </button>
          ))}
          {visibleCount < availableMessages.length && <button onClick={() => setVisibleCount(value => value + 12)} className={primaryButton}>Show more mysteries</button>}
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
                    return <span key={characterIndex} aria-label={revealed ? `${number} decoded as ${character}` : `Number ${number}, hidden letter`} className={`inline-flex flex-col items-center justify-center w-10 h-12 sm:w-12 border-b-2 font-display font-bold ${revealed ? 'bg-white border-teal-600 text-teal-800' : ready ? 'bg-yellow-100 border-yellow-600' : 'border-teal-200'}`}>
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
              <p className="font-bold">{message.attribution === 'attributed' ? 'Attributed to ' : '— '}{message.scientist}</p>
              <p>{message.description}</p>
              <p>{message.meaning}</p>
              {message.source && <a href={message.source} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-700 underline">Read the quote’s source</a>}
              <p role="status" className="text-sm text-gray-600">{completionState === 'saved' ? 'Completion saved. This message will not repeat.' : completionState === 'error' ? completionError : 'Saving your completion…'}</p>
              {completionState === 'error' && <button onClick={() => { setCompletionState('idle'); setSaveAttempt(value => value + 1); }} className={primaryButton}>Retry saving completion</button>}
              <div><button disabled={completionState !== 'saved'} onClick={() => { setSession(null); setFeedback(''); setVisibleCount(6); }} className={primaryButton}>Choose another message</button></div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">{selectedGrade.replace('G', 'Grade ')} · {session.complexity < 0.35 ? 'Building confidence' : session.complexity >= 0.7 ? 'Extra challenge' : 'Growing skills'}</p>
              <p className="text-sm font-semibold text-gray-500 mb-2">Clue {session.solved + 1} of {clues.length}</p>
              <h3 className="text-lg font-bold mb-2">Find the number for {clue.letter}</h3>
              <p className={`${clue.skill.includes('word problem') ? 'text-lg leading-relaxed' : 'text-3xl'} font-display font-bold mb-5`}>{clue.expression}{session.mathSolved && <span className="block text-teal-800 text-lg mt-2">Answer: {clue.answer}</span>}</p>
              {!session.mathSolved && <form onSubmit={check} className="flex flex-wrap items-end gap-3 mb-4">
                <label className="font-semibold">
                  <span className="block mb-2">Your math answer</span>
                  <input ref={answerRef} value={answer} onChange={event => setAnswer(event.target.value)} inputMode="numeric" autoComplete="off" maxLength={5} className="w-32 border-2 border-gray-300 rounded-lg p-3 text-xl uppercase focus:outline-blue-600" />
                </label>
                <button type="submit" disabled={!answer.trim()} className={primaryButton}>Check answer</button>
              </form>}
              <p role="status" className="min-h-[28px] font-semibold text-teal-800 mb-3">{feedback}</p>
              {!session.mathSolved && <button onClick={() => { setShowHint(!showHint); if (!showHint) setSession({ ...session, hadMistake: true }); }} aria-expanded={showHint} className="text-blue-700 underline mb-3">{showHint ? 'Hide hint' : 'Need a hint?'}</button>}
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
