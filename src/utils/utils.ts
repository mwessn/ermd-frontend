import { irregularPlurals } from "@/types/irregularPlurals.ts";

type IdScope = 'col' | 'table' | 'relation' | 'commentArea';

export function generateId(scope: IdScope): string {
    let id: string;
    const random = Math.random().toString(36).substring(2, 8); // 6-char random
    const timestamp = Date.now().toString(36); // compact timestamp
    id = `${scope}-${timestamp}-${random}`;

    return id;
}

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const resetFocus = () => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
    document.body.removeAttribute("tabindex");
}

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function notBlankOrEmpty(val: string) {
    return val.trim().length > 0;
}

/**
 * Un-pluralizes a word by removing common English plural suffixes.
 * Handles irregular plurals and maintains case sensitivity.
 */
export function unpluralize(word: string): string {
    if (!word || word.length <= 3) return word;

    const lowerWord = word.toLowerCase();

    // Check irregular plurals first
    const irregularMatch = irregularPlurals[lowerWord];
    if (irregularMatch) {
        return preserveCase(word, irregularMatch);
    }

    // Common suffix patterns (ordered by specificity)
    const pluralPatterns = [
        { pattern: /(qu)ies$/i, replace: '$1y' }, // "qu" words like "queries" → "query"
        { pattern: /([^aeiou])ies$/i, replace: '$1y' }, // "cities" → "city"
        { pattern: /(ss|sh|ch|x|z)es$/i, replace: '$1' }, // "boxes" → "box"
        { pattern: /([^s])s$/i, replace: '$1' }, // "cats" → "cat"
        { pattern: /(matrices)$/i, replace: 'matrix' }, // special cases
        { pattern: /(appendices)$/i, replace: 'appendix' }
    ];

    for (const { pattern, replace } of pluralPatterns) {
        if (pattern.test(word)) {
            const singular = word.replace(pattern, replace);
            // Validate that we didn't create an invalid singular (e.g., "news" → "new")
            if (singular !== word) return singular;
        }
    }

    return word;
}

/** Helper to preserve original word casing */
function preserveCase(original: string, newWord: string): string {
    if (original === original.toUpperCase()) {
        return newWord.toUpperCase();
    } else if (original[0] === original[0].toUpperCase()) {
        return newWord[0].toUpperCase() + newWord.slice(1);
    }
    return newWord;
}

