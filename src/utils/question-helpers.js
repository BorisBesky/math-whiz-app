// Fisher-Yates shuffle algorithm
export function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

// Generate a unique set of options for a multiple choice question
export function generateUniqueOptions(correctAnswer, potentialDistractors, numOptions = 4) {
  const options = [correctAnswer];
  const distractors = [...potentialDistractors];

  while (options.length < numOptions && distractors.length > 0) {
    const randomIndex = Math.floor(Math.random() * distractors.length);
    const distractor = distractors.splice(randomIndex, 1)[0];
    if (!options.includes(distractor)) {
      options.push(distractor);
    }
  }

  // If not enough unique distractors, generate random numbers
  while (options.length < numOptions) {
    const randomOffset = Math.floor(Math.random() * 10) + 1;
    const randomDistractor = (parseInt(correctAnswer) + randomOffset).toString();
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }

  return options;
}
