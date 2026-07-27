import { notFound } from "next/navigation";
import { getPublicQuestionSetByCode } from "@/actions/publicSets";
import { QuizApp } from "@/components/public/QuizApp";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicQuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { code } = resolvedParams;

  const res = await getPublicQuestionSetByCode(code);

  if (!res.success || !res.data) {
    notFound();
  }

  const set = res.data;

  const formattedQuestions = (set.questions || []).map((q) => ({
    id: q.id,
    type: (q.type || "FLASHCARD") as "FLASHCARD" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
    question: q.question,
    answer: q.answer,
    options: q.options,
    explanation: q.explanation,
  }));

  return (
    <QuizApp
      setInfo={{
        code: set.code,
        title: set.title,
      }}
      questions={formattedQuestions}
    />
  );
}
