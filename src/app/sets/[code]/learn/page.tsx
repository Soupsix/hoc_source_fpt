import { notFound } from "next/navigation";
import { getPublicQuestionSetByCode } from "@/actions/publicSets";
import { FlashcardStudyApp } from "@/components/public/FlashcardStudyApp";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicLearnPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { code } = resolvedParams;

  const res = await getPublicQuestionSetByCode(code);

  if (!res.success || !res.data) {
    notFound();
  }

  const set = res.data;

  const formattedQuestions = (set.questions || []).map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    options: q.options,
    explanation: q.explanation,
    order: q.order,
  }));

  return (
    <FlashcardStudyApp
      setInfo={{
        code: set.code,
        title: set.title,
      }}
      questions={formattedQuestions}
    />
  );
}
