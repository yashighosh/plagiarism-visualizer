export const d = 256; // Number of characters in the input alphabet
export const q = 1000000007; // A prime number

// Function to compute the initial hash
export function computeHash(str, length) {
  let h = 0;
  for (let i = 0; i < length; i++) {
    h = (d * h + str.charCodeAt(i)) % q;
  }
  return h;
}

// Precompute hashes for the source text
// Maps hash -> array of exact substrings (to handle collisions)
export function precomputeSourceHashes(sourceText, k, caseInsensitive = true) {
  const map = new Map();
  const text = caseInsensitive ? sourceText.toLowerCase() : sourceText;
  
  if (text.length < k) return map;

  let currentHash = computeHash(text, k);
  
  // Calculate h = d^(k-1) % q
  let h = 1;
  for (let i = 0; i < k - 1; i++) {
    h = (h * d) % q;
  }

  const addHash = (hash, str) => {
    if (!map.has(hash)) {
      map.set(hash, new Set());
    }
    map.get(hash).add(str);
  };

  addHash(currentHash, text.substring(0, k));

  for (let i = 0; i <= text.length - k - 1; i++) {
    // Remove leading digit, add trailing digit
    // t_next = (d*(t - text[i]*h) + text[i+m]) % q
    let leadingChar = text.charCodeAt(i);
    let trailingChar = text.charCodeAt(i + k);
    
    currentHash = (d * (currentHash - leadingChar * h) + trailingChar) % q;
    
    // We might get negative value of hash, converting it to positive
    if (currentHash < 0) {
      currentHash = (currentHash + q);
    }

    addHash(currentHash, text.substring(i + 1, i + 1 + k));
  }

  return map;
}

export function analyzePlagiarism(sourceText, suspectedText, k, caseInsensitive = true) {
  const sourceHashes = precomputeSourceHashes(sourceText, k, caseInsensitive);
  const text = caseInsensitive ? suspectedText.toLowerCase() : suspectedText;
  
  const steps = [];
  const matchedIndices = new Set();
  
  if (text.length < k || sourceText.length < k) {
    return { steps, matchedIndices, similarity: 0, totalMatches: 0 };
  }

  // Calculate h = d^(k-1) % q
  let h = 1;
  for (let i = 0; i < k - 1; i++) {
    h = (h * d) % q;
  }

  let currentHash = computeHash(text, k);
  let totalMatches = 0;

  for (let i = 0; i <= text.length - k; i++) {
    const currentSubstring = text.substring(i, i + k);
    const originalSubstring = suspectedText.substring(i, i + k);
    
    let isHashMatch = false;
    let isExactMatch = false;
    let isSpuriousHit = false;

    if (sourceHashes.has(currentHash)) {
      isHashMatch = true;
      const possibleStrings = sourceHashes.get(currentHash);
      if (possibleStrings.has(currentSubstring)) {
        isExactMatch = true;
        totalMatches++;
        for (let j = 0; j < k; j++) {
          matchedIndices.add(i + j);
        }
      } else {
        isSpuriousHit = true;
      }
    }

    steps.push({
      index: i,
      substring: originalSubstring,
      hash: currentHash,
      isHashMatch,
      isSpuriousHit,
      isExactMatch
    });

    if (i < text.length - k) {
      let leadingChar = text.charCodeAt(i);
      let trailingChar = text.charCodeAt(i + k);
      currentHash = (d * (currentHash - leadingChar * h) + trailingChar) % q;
      if (currentHash < 0) {
        currentHash = (currentHash + q);
      }
    }
  }

  const similarity = (matchedIndices.size / suspectedText.length) * 100;

  return {
    steps,
    matchedIndices,
    similarity,
    totalMatches
  };
}
