/**
 * Runs the shared generator contract against EVERY registered topic
 * (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 4). A new topic folder is covered
 * here automatically — no test wiring required. If a topic legitimately
 * needs different thresholds, add an entry to OPTIONS_BY_TOPIC rather than
 * weakening the shared contract.
 */
import content from '../index';
import { runTopicContractTests } from '../testing/topicContractTests';

const OPTIONS_BY_TOPIC = {
  // 'g4/geometry': { minVariety: 20 },
};

content.grades.forEach((grade) => {
  grade.topics.forEach((topic) => {
    const key = `${grade.id}/${topic.id}`;
    runTopicContractTests(topic, OPTIONS_BY_TOPIC[key]);
  });
});
