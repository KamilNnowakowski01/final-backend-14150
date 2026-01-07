import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Word } from '../words/word.entity';

/**
 * Generated quiz question structure from AI.
 */
export interface GeneratedQuestion {
  wordId: string;
  type: string;
  question: string;
  correctAnswer: string;
  answerA: string;
  answerB: string;
  answerC: string;
}

/**
 * AI API configuration constants.
 */
const AI_CONFIG = {
  /** xAI API endpoint */
  API_URL: 'https://api.x.ai/v1/chat/completions',
  /** AI model to use */
  MODEL: 'grok-4-1-fast-reasoning',
  /** Response randomness (0-1) */
  TEMPERATURE: 0.7,
  /** Maximum response tokens */
  MAX_TOKENS: 4000,
  /** System message for AI */
  SYSTEM_MESSAGE: 'You are a helpful assistant that outputs JSON.',
} as const;

/**
 * Available question types for quiz generation.
 */
const QUESTION_TYPES = {
  MATCHING: 'matching',
  SYNONYM_OR_ANTONYM: 'synonimOrAntonym',
  CLOZE: 'clouze',
} as const;

/**
 * Service responsible for AI-powered quiz question generation.
 *
 * Uses xAI API to generate multiple-choice questions based on
 * vocabulary words and target proficiency level.
 */
@Injectable()
export class AiGeneratorService {
  private readonly apiKey: string;
  private readonly logger = new Logger(AiGeneratorService.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('XAI_API_KEY') || '';
  }

  /**
   * Generates quiz questions for a list of words using AI.
   *
   * Creates multiple-choice questions (A, B, C) tailored to the
   * specified proficiency level. Question types include matching,
   * synonym/antonym, and cloze (fill-in-the-blank).
   *
   * @param words - Array of Word entities to generate questions for
   * @param level - Target proficiency level (e.g., 'B1-B2')
   * @returns Array of generated questions, empty if API key not set
   * @throws Error if API request fails or response is invalid
   *
   * @example
   * ```ts
   * const questions = await aiService.generateQuizQuestions(words, 'B1-B2');
   * // Returns array of GeneratedQuestion objects
   * ```
   */
  async generateQuizQuestions(words: Word[], level: string): Promise<GeneratedQuestion[]> {
    if (!this.validateApiKey()) {
      return [];
    }

    const prompt = this.buildPrompt(words, level);

    try {
      const response = await this.sendApiRequest(prompt);
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error('Failed to generate quiz questions', error);
      throw error;
    }
  }

  /**
   * Validates that API key is configured.
   *
   * @returns true if API key is set, false otherwise
   */
  private validateApiKey(): boolean {
    if (!this.apiKey) {
      this.logger.warn('XAI_API_KEY is not set. Skipping AI generation.');
      return false;
    }
    return true;
  }

  /**
   * Builds the complete prompt for quiz generation.
   *
   * @param words - Words to include in prompt
   * @param level - Target proficiency level
   * @returns Complete prompt string
   */
  private buildPrompt(words: Word[], level: string): string {
    const wordsList = this.formatWordsForPrompt(words);
    return this.getPromptTemplate(wordsList, level);
  }

  /**
   * Formats words array into JSON strings for the prompt.
   *
   * @param words - Array of Word entities
   * @returns Newline-separated JSON strings
   */
  private formatWordsForPrompt(words: Word[]): string {
    return words
      .map((w) => {
        const meanings = w.meanings ? w.meanings.map((m) => m.meaning).join(', ') : '';
        const partOfSpeech = w.partOfSpeech ? w.partOfSpeech.join(', ') : '';

        return JSON.stringify({
          id: w.id,
          word: w.word,
          pronunciation: w.pronunciation,
          partOfSpeech: partOfSpeech,
          meanings: meanings,
        });
      })
      .join('\n');
  }

  /**
   * Returns the prompt template with interpolated values.
   *
   * @param wordsList - Formatted words string
   * @param level - Target proficiency level
   * @returns Complete prompt string
   */
  private getPromptTemplate(wordsList: string, level: string): string {
    return `
You are an expert language tutor.
I have a list of words (in JSON format). For each word, generate a multiple-choice quiz question (A, B, C) to test the user's knowledge of the word.
The target proficiency level for the questions is: ${level}.

Words:
${wordsList}

Instructions:
1. For each word, select the most appropriate question type from these 3 options: 'matching', 'synonimOrAntonym', 'clouze'. Choose the type that best fits the word's characteristics (e.g., use 'clouze' if the word fits well in a sentence context, 'synonimOrAntonym' if it has clear synonyms/antonyms).
2. Create exactly one question per word based on the selected type.

Rules for Question Types:
- 'matching': The question must be a definition or description of the word's meaning. The options (A, B, C) must include the target word (correct) and two other random words (distractors).
- 'synonimOrAntonym': The question should ask to identify a synonym or antonym of the target word (e.g., "Which word is a synonym for...?"). The options (A, B, C) must be words.
- 'clouze': The question must be a sentence using the target word, but with the target word replaced by a blank "_____". The options (A, B, C) must include the target word (correct) and two other words that fit grammatically but are incorrect in context.

General Rules:
1. Provide 3 options: A, B, and C.
2. One option must be the correct answer, the other two should be plausible distractors (incorrect answers).
3. CRITICAL: Randomize the position of the correct answer content among 'answerA', 'answerB', and 'answerC'.
4. The 'correctAnswer' field MUST contain the letter ('A', 'B', or 'C') corresponding to the option that holds the correct answer.
   - Example: If the correct answer is in 'answerB', then 'correctAnswer' must be "B".
5. Return the result as a strictly valid JSON array of objects.

Output JSON Format:
[
  {
    "wordId": "id_of_the_word",
    "type": "matching", // or "synonimOrAntonym" or "clouze"
    "question": "The question text here?",
    "answerA": "Option A text",
    "answerB": "Option B text",
    "answerC": "Option C text",
    "correctAnswer": "A" // or "B" or "C"
  }
]

Do not include any markdown formatting (like \`\`\`json). Return only the raw JSON string.
`;
  }

  /**
   * Sends request to xAI API.
   *
   * @param prompt - User prompt to send
   * @returns Raw API response
   * @throws Error if request fails
   */
  private async sendApiRequest(prompt: string): Promise<Response> {
    const response = await fetch(AI_CONFIG.API_URL, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: this.buildRequestBody(prompt),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return response;
  }

  /**
   * Builds HTTP headers for API request.
   */
  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Builds JSON request body for API.
   *
   * @param prompt - User prompt content
   * @returns Stringified request body
   */
  private buildRequestBody(prompt: string): string {
    return JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: AI_CONFIG.SYSTEM_MESSAGE },
        { role: 'user', content: prompt },
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
    });
  }

  /**
   * Handles API error responses.
   *
   * @param response - Failed API response
   * @throws Error with status and message
   */
  private async handleApiError(response: Response): Promise<never> {
    const errorText = await response.text();
    this.logger.error(`xAI API Error: ${response.status} - ${errorText}`);
    throw new Error(`xAI API request failed with status ${response.status}`);
  }

  /**
   * Parses and validates API response.
   *
   * @param response - API response to parse
   * @returns Array of generated questions
   * @throws Error if response is invalid or empty
   */
  private async parseResponse(response: Response): Promise<GeneratedQuestion[]> {
    const data = await response.json();
    const content = this.extractContent(data);
    const jsonString = this.sanitizeJsonContent(content);

    return this.parseQuestions(jsonString);
  }

  /**
   * Extracts content from API response data.
   *
   * @param data - Parsed API response
   * @returns Content string
   * @throws Error if content is empty
   */
  private extractContent(data: any): string {
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('xAI API returned empty content');
    }

    return content;
  }

  /**
   * Removes markdown formatting from JSON content.
   *
   * @param content - Raw content string
   * @returns Cleaned JSON string
   */
  private sanitizeJsonContent(content: string): string {
    return content.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  /**
   * Parses JSON string into GeneratedQuestion array.
   *
   * @param jsonString - Clean JSON string
   * @returns Array of questions
   * @throws SyntaxError if JSON is invalid
   */
  private parseQuestions(jsonString: string): GeneratedQuestion[] {
    try {
      const questions: GeneratedQuestion[] = JSON.parse(jsonString);
      this.logger.debug(`Successfully generated ${questions.length} quiz questions`);
      return questions;
    } catch (error) {
      this.logger.error('Failed to parse AI response as JSON', { jsonString });
      throw new Error('Invalid JSON response from AI API');
    }
  }
}
