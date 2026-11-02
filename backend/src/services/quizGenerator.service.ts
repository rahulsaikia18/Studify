export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  "Computer Science": [
    {
      id: "cs-1",
      question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctOptionIndex: 1,
      explanation: "In a balanced BST, the tree height is log(n), meaning each comparison cuts the search space in half."
    },
    {
      id: "cs-2",
      question: "Which layer of the OSI model is responsible for end-to-end communication and flow control?",
      options: ["Network Layer", "Session Layer", "Transport Layer", "Data Link Layer"],
      correctOptionIndex: 2,
      explanation: "The Transport Layer (e.g. TCP) provides end-to-end communication, flow control, and error recovery."
    },
    {
      id: "cs-3",
      question: "Which of the following data structures operates on a LIFO (Last In First Out) principle?",
      options: ["Queue", "Stack", "Priority Queue", "Linked List"],
      correctOptionIndex: 1,
      explanation: "A Stack inserts and removes items from the top (Last In, First Out)."
    },
    {
      id: "cs-4",
      question: "What is normalization in Relational Database Management Systems (RDBMS) primarily used for?",
      options: ["Increasing storage size", "Eliminating redundant data and anomalies", "Encrypting database records", "Speeding up write transactions only"],
      correctOptionIndex: 1,
      explanation: "Database normalization organizes tables to reduce data redundancy and eliminate insert, update, and deletion anomalies."
    },
    {
      id: "cs-5",
      question: "In object-oriented programming, which concept describes wrapping data and methods into a single unit?",
      options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
      correctOptionIndex: 2,
      explanation: "Encapsulation is the bundling of data and the methods that operate on that data into a single unit (class) while restricting direct access."
    },
    {
      id: "cs-6",
      question: "Which HTTP status code indicates that the requested resource has been successfully created?",
      options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
      correctOptionIndex: 1,
      explanation: "HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource."
    }
  ],
  "Mathematics": [
    {
      id: "math-1",
      question: "What is the derivative of f(x) = ln(x) with respect to x?",
      options: ["1/x", "e^x", "x", "1/(x^2)"],
      correctOptionIndex: 0,
      explanation: "By standard calculus rules, d/dx [ln(x)] = 1/x for all x > 0."
    },
    {
      id: "math-2",
      question: "What is the determinant of a 2x2 matrix with rows [3, 4] and [2, 5]?",
      options: ["7", "23", "15", "10"],
      correctOptionIndex: 0,
      explanation: "Determinant = (3 * 5) - (4 * 2) = 15 - 8 = 7."
    },
    {
      id: "math-3",
      question: "If two events A and B are independent, what is P(A ∩ B)?",
      options: ["P(A) + P(B)", "P(A) * P(B)", "P(A) / P(B)", "P(A) - P(B)"],
      correctOptionIndex: 1,
      explanation: "For independent events, the probability of both occurring together is the product of their individual probabilities."
    },
    {
      id: "math-4",
      question: "What is the integral of cos(x) dx?",
      options: ["-sin(x) + C", "sin(x) + C", "-cos(x) + C", "tan(x) + C"],
      correctOptionIndex: 1,
      explanation: "The antiderivative of cos(x) is sin(x) + C because d/dx [sin(x)] = cos(x)."
    }
  ],
  "Physics": [
    {
      id: "phy-1",
      question: "What is the SI unit of electric capacitance?",
      options: ["Henry", "Farad", "Tesla", "Weber"],
      correctOptionIndex: 1,
      explanation: "The SI unit of capacitance is the Farad (F), named after Michael Faraday."
    },
    {
      id: "phy-2",
      question: "According to Newton's Second Law of Motion, what is force equal to?",
      options: ["Mass × Velocity", "Mass × Acceleration", "Energy / Time", "Work × Distance"],
      correctOptionIndex: 1,
      explanation: "Newton's second law states that Force = mass × acceleration (F = m*a)."
    },
    {
      id: "phy-3",
      question: "Which electromagnetic wave has the highest frequency and shortest wavelength?",
      options: ["Radio waves", "Visible light", "Ultraviolet", "Gamma rays"],
      correctOptionIndex: 3,
      explanation: "Gamma rays reside at the highest energy and frequency end of the electromagnetic spectrum."
    }
  ],
  "General": [
    {
      id: "gen-1",
      question: "Which cognitive technique involves reviewing material at systematically increasing intervals?",
      options: ["Cramming", "Spaced Repetition", "Mnemonics only", "Rote memorization"],
      correctOptionIndex: 1,
      explanation: "Spaced repetition leverages the spacing effect to dramatically enhance long-term memory retention."
    },
    {
      id: "gen-2",
      question: "What is the primary objective of the Pomodoro Technique?",
      options: ["Exercising during study", "Maximizing focus in 25-minute sprints with regular breaks", "Listening to study podcasts", "Sleeping between study hours"],
      correctOptionIndex: 1,
      explanation: "The Pomodoro Technique breaks work into focused intervals (traditionally 25 minutes) separated by short breaks."
    }
  ]
};

export class QuizGeneratorService {
  static async generateQuiz(
    subject: string,
    topic: string,
    difficulty: string,
    count: number = 5
  ): Promise<QuizQuestion[]> {
    // If Gemini API key is configured, we can query Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const aiQuestions = await this.generateWithAI(apiKey, subject, topic, difficulty, count);
        if (aiQuestions && aiQuestions.length > 0) {
          return aiQuestions;
        }
      } catch (err) {
        console.warn('AI Quiz generation failed, falling back to intelligent question bank:', err);
      }
    }

    // Default to intelligent curated bank
    return this.generateFromBank(subject, topic, difficulty, count);
  }

  private static generateFromBank(
    subject: string,
    topic: string,
    difficulty: string,
    count: number
  ): QuizQuestion[] {
    const matchedSubject = Object.keys(QUESTION_BANK).find(
      (k) => k.toLowerCase() === subject.toLowerCase()
    );

    const questions = matchedSubject
      ? [...QUESTION_BANK[matchedSubject]]
      : [...QUESTION_BANK['Computer Science'], ...QUESTION_BANK['Mathematics'], ...QUESTION_BANK['Physics'], ...QUESTION_BANK['General']];

    // Shuffle
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, questions.length));

    // If needed more than available in bank, generate dynamic tailored variants
    while (selected.length < count) {
      const idx = selected.length + 1;
      selected.push({
        id: `dyn-${idx}`,
        question: `Practice Concept ${idx} for ${topic || subject}: Which principle is fundamental in understanding this domain?`,
        options: [
          `Systematic breakdown and empirical verification`,
          `Relying purely on intuitive guesswork`,
          `Skipping prerequisite foundational theory`,
          `Avoiding reproducible testing`
        ],
        correctOptionIndex: 0,
        explanation: `In ${subject || 'academic studies'}, rigorous systematic analysis and empirical validation provide the strongest foundation for problem-solving.`
      });
    }

    return selected;
  }

  private static async generateWithAI(
    apiKey: string,
    subject: string,
    topic: string,
    difficulty: string,
    count: number
  ): Promise<QuizQuestion[] | null> {
    const prompt = `Generate a ${count}-question multiple choice quiz for students on Subject: "${subject}", Topic: "${topic || subject}", Difficulty: "${difficulty}".
Format your response ONLY as a valid JSON array of objects with keys:
"id" (string), "question" (string), "options" (array of 4 strings), "correctOptionIndex" (number 0-3), "explanation" (string).`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as QuizQuestion[];
  }
}
