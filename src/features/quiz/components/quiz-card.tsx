import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type QuizCardContent = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type QuizCardProps = {
  quiz: QuizCardContent;
  /** Oyuncunun seçtiği seçenek; seçmediyse `null`. */
  chosen: number | null;
  /** Doğru cevabın ödülü (akçe), kartta yazar. */
  reward: number;
  onChoose: (choice: number) => void;
  /** Soruyu şimdilik geç (ceza yok). */
  onSkip: () => void;
  onReadMore: () => void;
  onClose: () => void;
};

/** Bilgi yarışması (D5): doğruya küçük ödül, yanlışa ceza yok. */
export function QuizCard({
  quiz,
  chosen,
  reward,
  onChoose,
  onSkip,
  onReadMore,
  onClose,
}: QuizCardProps) {
  const answered = chosen !== null;
  const correct = chosen === quiz.answer;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
      className="absolute inset-0 z-10 grid place-items-center bg-foreground/30 p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Bilgi yarışması · doğru cevap +{reward} akçe
          </p>
          <CardTitle id="quiz-title" className="font-display text-xl">
            {quiz.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {quiz.options.map((option, index) => {
            const isAnswer = index === quiz.answer;
            const isChosen = index === chosen;
            return (
              <Button
                key={option}
                variant={
                  answered && isAnswer
                    ? 'default'
                    : answered && isChosen
                      ? 'destructive'
                      : 'outline'
                }
                className="h-auto justify-start py-2 whitespace-normal"
                disabled={answered}
                onClick={() => onChoose(index)}
              >
                {option}
              </Button>
            );
          })}
          {answered && (
            <p role="status" className="mt-2 text-sm">
              <span className="font-medium">
                {correct ? 'Doğru! ' : 'Doğru cevap işaretli. '}
              </span>
              {quiz.explanation}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-between gap-2">
          {answered ? (
            <>
              <Button variant="link" onClick={onReadMore}>
                Ansiklopedide oku
              </Button>
              <Button onClick={onClose}>Devam</Button>
            </>
          ) : (
            <Button variant="ghost" className="ml-auto" onClick={onSkip}>
              Şimdi değil
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
