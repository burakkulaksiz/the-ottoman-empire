import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ChronicleCardRow = {
  year: number;
  played: { date: string; text: string }[];
  history: { date: string; text: string; source?: string }[];
};

type ChronicleCardProps = {
  rows: ChronicleCardRow[];
  onClose: () => void;
};

function Items({
  items,
  empty,
}: {
  items: ChronicleCardRow['history'];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${item.date}-${index}`}>
          <span className="text-xs text-muted-foreground">{item.date}: </span>
          {item.text}
          {item.source && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({item.source})
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Kronik (D4): oyuncunun yazdığı tarih ile gerçek tarih yan yana. */
export function ChronicleCard({ rows, onClose }: ChronicleCardProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chronicle-title"
      className="absolute inset-0 z-10 grid place-items-center bg-foreground/30 p-4"
    >
      <Card className="max-h-full w-full max-w-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center">
          <CardTitle id="chronicle-title" className="font-display text-2xl">
            Kronik
          </CardTitle>
          <Button
            size="icon-sm"
            variant="ghost"
            className="ml-auto"
            aria-label="Kapat"
            onClick={onClose}
          >
            <X />
          </Button>
        </CardHeader>
        <CardContent className="max-h-[70dvh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">Kronik henüz boş.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th scope="col" className="w-16 py-1">
                    Yıl
                  </th>
                  <th scope="col" className="py-1">
                    Senin tarihin
                  </th>
                  <th scope="col" className="py-1">
                    Gerçek tarih
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year} className="border-t align-top">
                    <th scope="row" className="py-2 pr-2 font-display">
                      {row.year}
                    </th>
                    <td className="py-2 pr-3">
                      <Items items={row.played} empty="—" />
                    </td>
                    <td className="py-2">
                      <Items items={row.history} empty="—" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Gerçek tarih yalnızca oyunda gelinen yıla kadar gösterilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
