import { SECRET_MESSAGES } from './secretMessageConfig';

export const MESSAGE_BATCH_SIZE = 200;
// Distinct, reviewed fragments: composition produces original messages, not invented quotations.
const openings = ['Each day', 'At school', 'While learning', 'During practice', 'With a friend', 'When solving problems', 'In your next lesson', 'As you explore', 'When you feel stuck', 'As you begin', 'With curiosity', 'When you try again', 'With patience', 'In a quiet moment', 'During a challenge', 'As you make progress'];
const actions = ['look closely', 'ask a question', 'draw your idea', 'take a small step', 'listen carefully', 'check your work', 'try your own example', 'notice a pattern', 'make a connection', 'use what you know', 'take time to think', 'compare two methods', 'write what you know', 'test your idea', 'think about the parts', 'practice a new skill'];
const partners = ['share a discovery', 'offer a kind word', 'listen with patience', 'welcome a question', 'welcome a new idea', 'help a classmate', 'thank a helper', 'celebrate progress', 'notice another’s effort', 'explain your thinking', 'encourage a friend', 'invite a friend to join', 'share your method', 'respect another method', 'ask how a friend solved it', 'include another learner'];
const endings = ['Small steps count.', 'Discovery takes practice.', 'Questions help us learn.', 'Kindness matters.', 'Mistakes can teach us.', 'Your ideas matter.', 'Stay curious.', 'Keep exploring.', 'Explaining builds understanding.', 'Practice builds skill.', 'New methods teach us.', 'Good thinking takes care.', 'Every learner has ideas.', 'Patterns invite discovery.', 'Thoughtful effort helps.', 'Learning brings new ideas.'];
export const ORIGINAL_MESSAGE_CAPACITY = openings.length * actions.length * partners.length * endings.length;

export function generateMessageBatch(batch) {
  if (!Number.isSafeInteger(batch) || batch < 0) throw new Error('Invalid message batch.');
  if (batch === 0) return SECRET_MESSAGES;
  const start = (batch - 1) * MESSAGE_BATCH_SIZE;
  if (start + MESSAGE_BATCH_SIZE > ORIGINAL_MESSAGE_CAPACITY) throw new Error('The message library needs more original messages.');
  return Array.from({ length: MESSAGE_BATCH_SIZE }, (_, offset) => {
    const ordinal = start + offset;
    // Permute the ordinal so adjacent messages vary in all four fragments.
    let value = (ordinal * 40503 + 7919) % ORIGINAL_MESSAGE_CAPACITY;
    const pick = list => { const result = list[value % list.length]; value = Math.floor(value / list.length); return result; };
    const opening = pick(openings), action = pick(actions), partner = pick(partners), ending = pick(endings);
    return {
      id: `original-v1-${ordinal}`, text: `${opening}, ${action}, then ${partner}. ${ending}`,
      scientist: 'Math Whiz original', attribution: 'original',
      description: 'An original message about learning and kindness.',
      meaning: 'Which part of this message could you try in your next lesson?',
    };
  });
}

export const emptyMessageProgress = () => ({ batch: 0, completedIds: [], completedCount: 0, complexityByGrade: {} });
export function normalizeMessageProgress(value) {
  if (!value || !Number.isSafeInteger(value.batch) || value.batch < 0) return emptyMessageProgress();
  let messages;
  try { messages = generateMessageBatch(value.batch); } catch (_) { return emptyMessageProgress(); }
  const validIds = new Set(messages.map(message => message.id));
  const completedIds = [...new Set(Array.isArray(value.completedIds) ? value.completedIds : [])].filter(id => validIds.has(id));
  const complexityByGrade = {};
  for (const grade of ['G3', 'G4', 'G5']) {
    const level = value.complexityByGrade?.[grade];
    if (Number.isFinite(level)) complexityByGrade[grade] = Math.max(0.15, Math.min(0.95, level));
  }
  return { batch: value.batch, completedIds, completedCount: value.batch * MESSAGE_BATCH_SIZE + completedIds.length, complexityByGrade };
}

export function completeMessage(progress, messageId, grade, performance) {
  const next = normalizeMessageProgress(progress);
  const messages = generateMessageBatch(next.batch);
  if (!messages.some(message => message.id === messageId) || next.completedIds.includes(messageId)) return next;
  next.completedIds.push(messageId);
  next.completedCount++;
  const accuracy = performance.total > 0 ? performance.firstTry / performance.total : 0.75;
  const level = Number.isFinite(performance.complexity) ? performance.complexity : 0.5;
  next.complexityByGrade[grade] = Math.max(0.15, Math.min(0.95, level + (accuracy >= 0.85 ? 0.08 : accuracy < 0.6 ? -0.08 : 0)));
  if (next.completedIds.length === MESSAGE_BATCH_SIZE && next.batch < Math.floor(ORIGINAL_MESSAGE_CAPACITY / MESSAGE_BATCH_SIZE)) {
    // Never wrap the generator. At capacity, retain a fully completed final batch.
    generateMessageBatch(next.batch + 1);
    next.batch++;
    next.completedIds = [];
  }
  return next;
}
