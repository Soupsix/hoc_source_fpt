export type QuestionType = "FLASHCARD" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface QuestionData {
  id: string;
  setId: string;
  type: QuestionType;
  question: string;
  answer: string;
  options: string[] | null;
  explanation: string | null;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
