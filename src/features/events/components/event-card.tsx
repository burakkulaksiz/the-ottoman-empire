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
  historical: { note: string };
};

type EventCardProps = {
  event: EventCardContent;
  /** Oyuncu seçtiyse seçilen seçenek; sonuç ve tarihî bilgi gösterilir. */
  chosenId: string | null;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
};

/** Tarihî olay kartı: karar anı, ardından sonuç ve "Tarihte gerçekte ne oldu?". */
export function EventCard({
  event,
  chosenId,
  onChoose,
  onClose,
}: EventCardProps) {
  const chosen = event.choices.find((c) => c.id === chosenId);

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
              </Button>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
