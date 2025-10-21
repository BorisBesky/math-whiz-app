@ -0,0 +1,160 @@
# 4th Grade Addition: Project Plan

## Overview

**Goal:** Add 4th grade support to the Math Whiz app, preserving all 3rd grade content and user data. All changes are non-destructive and backward compatible.

---

## 1. Grade Model

- **Grade Selector:**  
  - Add a dropdown/toggle for grade selection: “3rd Grade” (G3) and “4th Grade” (G4).
  - Persist user’s selection in Firestore at `selectedGrade` (`G3` or `G4`).  
  - Default to `G3` for existing users.

- **Topics by Grade:**  
  - `quizTopicsByGrade`:
    - **G3:** `['Multiplication', 'Division', 'Fractions', 'Measurement & Data']`
    - **G4:** `['Operations & Algebraic Thinking (4.OA)', 'Base Ten (4.NBT)', 'Fractions (4.NF)', 'Measurement & Data (4.MD)', 'Geometry (4.G)']`

---

## 2. Data Schema (Non-Destructive Migration)

- **Daily Goals:**  
  - Migrate `dailyGoals` → `dailyGoalsByGrade`:
    - `dailyGoalsByGrade.G3`: Copy from existing `dailyGoals`.
    - `dailyGoalsByGrade.G4`: Set defaults for the 5 G4 clusters.

- **Per-Day Progress:**  
  - Migrate `progress` → `progressByGrade`:
    - `progressByGrade[YYYY-MM-DD][G3]`: Seed from existing `progress[today]` if present.
    - `progressByGrade[YYYY-MM-DD][G4]`: Initialize with zeros for all G4 clusters.

- **Transition:**  
  - Keep legacy `dailyGoals` and `progress` during migration.
  - New UI and queries should use `dailyGoalsByGrade[selectedGrade]` and `progressByGrade[today][selectedGrade]`.

- **Answered Questions:**  
  - Add a `grade` field (`G3`/`G4`) to new `answeredQuestions` records for grade-specific insights.  
  - Preserve old data without grade field.

---

## 3. UI Changes

- **Topic Selection:**  
  - Add grade dropdown/toggle at the top.
  - Title reflects selected grade (e.g., “Choose a topic for your 4th Grade adventure!”).

- **Topic Grid:**  
  - Show topics from `quizTopicsByGrade[selectedGrade]`.

- **Daily Goal Sliders:**  
  - Show and update goals for the active grade’s topics.

- **Dashboard:**  
  - Filter stats by selected grade:
    - Use `answeredQuestions.filter(q => q.grade === selectedGrade)` for breakdowns.
    - Use `quizTopicsByGrade[selectedGrade]` for topic rows.

---

## 4. Availability & Goals Logic

- **getTopicAvailability:**  
  - Make grade-aware:
    - Read from `dailyGoalsByGrade[selectedGrade]`.
    - Read from `progressByGrade[today][selectedGrade]`.
  - Completion lock/unlock is per-grade.
  - “All Topics Mastered” applies only within the active grade.

---

## 5. Question Generation

- **Quiz Generation:**  
  - Update `startNewQuiz`/`generateQuizQuestions` to accept `grade`.
  - **G3:** Use current generators (no change).
  - **G4:** Implement cluster+subtopic generators for OA/NBT/NF/MD/G, using accurate CA standard codes (e.g., `4.OA.`, `4.NBT.`, etc.).
  - Include `grade` and (for G4) `subtopic` on generated question objects and in `answeredQuestions`.

---

## 6. Explanations

- **G3:** Keep existing explanation files.
- **G4:** Add new static explanations and extend `conceptExplanationFiles` for G4 keys:
  - **OA:** factors/multiples, prime vs composite, multiplicative comparisons, patterns
  - **NBT:** place value, rounding, multi-digit multiplication, long division
  - **NF:** add/sub like denominators and mixed numbers, fraction × whole, decimals to hundredths
  - **MD:** unit conversions, line plots, angles and protractors
  - **G:** lines/angles, classify triangles/quadrilaterals, symmetry

---

## 7. Story Problems (Gemini)

- **Client:**  
  - Pass `{ topic, grade }` in the request body.

- **Server (`netlify/functions/gemini-proxy.js`):**  
  - Expand `VALID_TOPICS` to include both G3 topics and G4 clusters.
  - Accept and validate `grade` and topic membership by grade.
  - Update prompt to reference “3rd grade” or “4th grade” as appropriate; for G4, include guidance on OA/NBT/NF/MD/G skills.
  - Rate limit key should include grade: `dailyStories[date][grade][topic]` (G3 and G4 tracked separately).

---

## 8. Adaptive Engine

- **Selection/Complexity:**  
  - Use only history matching the selected grade (`q.grade === selectedGrade`) to avoid cross-grade interference.

---

## 9. Migration & Safety

- **On User Load:**  
  - If `dailyGoalsByGrade` missing, create as above; leave old `dailyGoals` in place.
  - If `progressByGrade` missing for today, create for both grades; leave old `progress` in place.
  - If `selectedGrade` missing, set to `G3`.
  - Ensure all existing 3rd-grade flows work unchanged when `selectedGrade = G3`.

---

## 10. Testing

- **Backward Compatibility:**  
  - With only legacy `dailyGoals`/`progress`, G3 still works.
- **Grade Isolation:**  
  - Answering G4 does not affect G3 progress/goals and vice versa.
- **G4 Generators:**  
  - Validate single correct answer, correct 4.* standard codes, stable under difficulty bounds.
- **Story API:**  
  - Rejects mismatched topic/grade; respects per-grade rate limits.

---

## 11. Rollout Phases

- **Phase 1:**  
  - Add grade selector, migrate schema, keep G3 intact, implement minimal G4 set (OA comparisons, factors/multiples, NBT place value/rounding, NF equivalence/comparison/add-sub like denoms, MD area/perimeter), extend Gemini to accept grade.
- **Phase 2:**  
  - Add NBT multi-digit multiplication/division, MD conversions, G lines/angles classification.
- **Phase 3:**  
  - Add NF fraction × whole, decimals; MD line plots/angles; G symmetry; explanation pages for all.

---

## 12. Reference

- Use California Grade 4 domains and skills (see IXL: California 4th-grade math standards) to guide G4 coverage and examples (do not copy content).

---

**Summary:**  
- **Added:** Grade selection and per-grade topics/goals/progress, preserving all 3rd-grade content and behavior.
- **Extended:** Gemini story support and rate limiting to be per-grade.
- **Safe Migration:** Non-destructive fields and backward compatibility for existing users.