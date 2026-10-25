export type EntryViewContent = {
  title: string;
  categoryLabel: string;
  body: string[];
  inGame?: string;
  /** Biçimlendirilmiş kaynak atıfları (D6). */
  sources?: string[];
};

type EntryViewProps = {
  entry: EntryViewContent;
  related: { id: string; title: string }[];
  onRelated: (id: string) => void;
  /** Başlık düzeyi: sayfada h1, panelde h2. */
  headingLevel?: 1 | 2;
};

/** Bir ansiklopedi maddesi: metin, oyundaki karşılığı ve ilgili maddeler. */
export function EntryView({
  entry,
  related,
  onRelated,
  headingLevel = 2,
}: EntryViewProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <article className="space-y-3">
      <header>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {entry.categoryLabel}
        </p>
        <Heading className="font-display text-2xl">{entry.title}</Heading>
      </header>

      {entry.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {entry.inGame && (
        <aside className="rounded-lg bg-muted p-3 text-sm">
          <span className="font-medium">Oyunda: </span>
          {entry.inGame}
        </aside>
      )}

      {entry.sources && entry.sources.length > 0 && (
        <section>
          <h3 className="font-display text-lg">Kaynaklar</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            {entry.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h3 className="font-display text-lg">İlgili maddeler</h3>
          <ul className="mt-1 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => onRelated(item.id)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
