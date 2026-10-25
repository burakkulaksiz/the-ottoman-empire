import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type EventCardContent = {
  title: string;
  description: string;
  choices: { id: string; label: string; outcome: string }[];
  /** `choiceId`: tarihte gerçekleşene en yakın seçenek. */
  historical: { note: string; choiceId: string };
};

type EventCardProps = {
  event: EventCardContent;
  /** Oyuncu seçtiyse seçilen seçenek; sonuç ve tarihî bilgi gösterilir. */
  chosenId: string | null;
  /** Tarihe sadık mod: tarihte seçilen seçenek önceden gösterilir (C10). */
  revealHistorical?: boolean;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
};

/** Tarihî olay kartı: karar anı, ardından sonuç ve "Tarihte gerçekte ne oldu?". */
export function EventCard({
  event,
  chosenId,
  revealHistorical = false,
  onChoose,
  onClose,
}: EventCardProps) {
  const chosen = event.choices.find((c) => c.id === chosenId);
  const historicalChoice = event.choices.find(
    (c) => c.id === event.historical.choiceId,
  );
  const sameAsHistory = chosen?.id === event.historical.choiceId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
      className="absolute inset-0 z-10 grid place-items-center bg-foreground/30 p-4"
    >
      <Card className="max-h-full w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle id="event-title" className="font-display text-2xl">
            {event.title}
          </CardTitle>
          {!chosen && <CardDescription>{event.description}</CardDescription>}
        </CardHeader>

        {chosen ? (
          <>
            <CardContent className="space-y-4">
              <p>
                <span className="font-medium">Kararın: </span>
                {chosen.label}
              </p>
              <p>{chosen.outcome}</p>
              <section className="rounded-lg bg-muted p-3">
                <h3 className="font-display text-lg">
                  Tarihte gerçekte ne oldu?
                </h3>
                <p
                  className="mt-1 text-sm font-medium text-primary"
                  data-testid="verdict"
                >
                  {sameAsHistory
                    ? 'Tarihteki gibi karar verdin.'
                    : `Tarihte farklı oldu: "${historicalChoice?.label}" seçildi.`}
                </p>
                <p className="mt-1 text-sm">{event.historical.note}</p>
              </section>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={onClose}>Devam</Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="flex flex-col gap-2">
            {event.choices.map((choice) => (
              <Button
                key={choice.id}
                variant="outline"
                className="h-auto justify-start py-2 whitespace-normal"
                onClick={() => onChoose(choice.id)}
              >
                {choice.label}
                {revealHistorical &&
                  choice.id === event.historical.choiceId && (
                    <span className="ml-auto rounded bg-primary/10 px-1.5 text-xs text-primary">
                      Tarihte seçilen
                    </span>
                  )}
              </Button>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
