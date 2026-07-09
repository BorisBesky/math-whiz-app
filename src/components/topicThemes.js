// Topic card theming (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 2).
//
// Manifests declare a named theme ("ui": { "theme": "blue" }); this module
// owns the literal Tailwind class strings for each name. The classes MUST
// stay literal in source — Tailwind's JIT purges anything it cannot see
// statically, which is why raw class names never live in manifest JSON.
// Adding a theme = one entry here plus the enum in manifest.schema.json.
import { getTopicByName } from '../content/registry';

export const TOPIC_THEME_CLASSES = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    accent: 'bg-blue-500',    text: 'text-blue-700',    hoverBg: 'hover:bg-blue-100',    lightBg: 'bg-blue-100' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  accent: 'bg-purple-500',  text: 'text-purple-700',  hoverBg: 'hover:bg-purple-100',  lightBg: 'bg-purple-100' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    accent: 'bg-rose-500',    text: 'text-rose-700',    hoverBg: 'hover:bg-rose-100',    lightBg: 'bg-rose-100' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   accent: 'bg-amber-500',   text: 'text-amber-700',   hoverBg: 'hover:bg-amber-100',   lightBg: 'bg-amber-100' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    accent: 'bg-teal-500',    text: 'text-teal-700',    hoverBg: 'hover:bg-teal-100',    lightBg: 'bg-teal-100' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  accent: 'bg-indigo-500',  text: 'text-indigo-700',  hoverBg: 'hover:bg-indigo-100',  lightBg: 'bg-indigo-100' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    accent: 'bg-pink-500',    text: 'text-pink-700',    hoverBg: 'hover:bg-pink-100',    lightBg: 'bg-pink-100' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  accent: 'bg-orange-500',  text: 'text-orange-700',  hoverBg: 'hover:bg-orange-100',  lightBg: 'bg-orange-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-100', lightBg: 'bg-emerald-100' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    accent: 'bg-cyan-500',    text: 'text-cyan-700',    hoverBg: 'hover:bg-cyan-100',    lightBg: 'bg-cyan-100' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  accent: 'bg-violet-500',  text: 'text-violet-700',  hoverBg: 'hover:bg-violet-100',  lightBg: 'bg-violet-100' },
  // Also the fallback look for unknown themes; text-gray-600 matches the
  // historical default card style.
  gray:    { bg: 'bg-gray-50',    border: 'border-gray-200',    accent: 'bg-gray-500',    text: 'text-gray-600',    hoverBg: 'hover:bg-gray-100',    lightBg: 'bg-gray-100' },
};

const FALLBACK_ICON = '📚';

/**
 * Resolves a topic (module object or student-facing name) to its card theme:
 * the Tailwind class bundle for its manifest ui.theme plus its ui.icon.
 * Unknown topics or themes get the historical gray default.
 */
export const getTopicTheme = (topicOrName) => {
  const topic = typeof topicOrName === 'string' ? getTopicByName(topicOrName) : topicOrName;
  const classes = TOPIC_THEME_CLASSES[topic?.ui?.theme] || TOPIC_THEME_CLASSES.gray;
  return { ...classes, icon: topic?.ui?.icon || FALLBACK_ICON };
};
