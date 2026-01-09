/**
 * Text normalization utilities for comparing spoken responses to expected answers
 */

// Number word mappings for normalization
const numberWords: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
  'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
  'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
  'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
  'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
};

// Reverse mapping for digit to word
const digitWords: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
};

// Common filler words to detect
export const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically',
  'actually', 'so', 'well', 'right', 'okay', 'hmm'
];

// Phonetic alphabet (NATO)
const phoneticAlphabet: Record<string, string> = {
  'alpha': 'a', 'bravo': 'b', 'charlie': 'c', 'delta': 'd',
  'echo': 'e', 'foxtrot': 'f', 'golf': 'g', 'hotel': 'h',
  'india': 'i', 'juliet': 'j', 'kilo': 'k', 'lima': 'l',
  'mike': 'm', 'november': 'n', 'oscar': 'o', 'papa': 'p',
  'quebec': 'q', 'romeo': 'r', 'sierra': 's', 'tango': 't',
  'uniform': 'u', 'victor': 'v', 'whiskey': 'w', 'xray': 'x',
  'yankee': 'y', 'zulu': 'z'
};

/**
 * Normalize text for comparison
 * - Converts to lowercase
 * - Removes punctuation
 * - Normalizes whitespace
 * - Converts number words to digits (or vice versa based on mode)
 */
export function normalizeText(text: string, options: {
  convertNumbersToDigits?: boolean;
  removeFillers?: boolean;
  expandPhonetic?: boolean;
} = {}): string {
  const {
    convertNumbersToDigits = true,
    removeFillers = false,
    expandPhonetic = false
  } = options;

  let normalized = text.toLowerCase();

  // Remove punctuation except hyphens in compound words
  normalized = normalized.replace(/[.,!?;:'"()[\]{}]/g, '');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Convert number words to digits
  if (convertNumbersToDigits) {
    for (const [word, digit] of Object.entries(numberWords)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalized = normalized.replace(regex, digit);
    }
  }

  // Remove filler words if requested
  if (removeFillers) {
    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      normalized = normalized.replace(regex, '');
    }
    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  // Expand phonetic alphabet if requested
  if (expandPhonetic) {
    for (const [phonetic, letter] of Object.entries(phoneticAlphabet)) {
      const regex = new RegExp(`\\b${phonetic}\\b`, 'gi');
      normalized = normalized.replace(regex, letter);
    }
  }

  return normalized;
}

/**
 * Convert a digit string to spoken words
 * e.g., "27" -> "two seven"
 */
export function digitToWords(digits: string): string {
  return digits.split('').map(d => digitWords[d] || d).join(' ');
}

/**
 * Calculate word count (excluding fillers if specified)
 */
export function countWords(text: string, excludeFillers = false): number {
  let processedText = text.toLowerCase();

  if (excludeFillers) {
    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      processedText = processedText.replace(regex, '');
    }
  }

  const words = processedText.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Count filler words in text
 */
export function countFillers(text: string): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;
  const lowerText = text.toLowerCase();

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      breakdown[filler] = matches.length;
      total += matches.length;
    }
  }

  return { total, breakdown };
}

/**
 * Simple similarity score between two normalized strings (0-100)
 * Uses word overlap method
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  if (words1.size === 0 && words2.size === 0) return 100;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Extract key phrases from expected answer for structure checking
 */
export function extractKeyPhrases(text: string): string[] {
  const normalized = normalizeText(text);
  const phrases: string[] = [];

  // Split on common delimiters
  const parts = normalized.split(/[,.]/).map(p => p.trim()).filter(p => p.length > 0);

  for (const part of parts) {
    if (part.length > 2) {
      phrases.push(part);
    }
  }

  return phrases;
}
