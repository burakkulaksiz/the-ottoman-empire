import { Panel } from './panel';

type ProvincePanelProps = {
  name: string;
  country: string;
  ownerName: string | null;
  neighborNames: string[];
};

/** Seçilen bölgenin özeti. Ordu ve şehir ayrıntıları E2'de eklenecek. */
export function ProvincePanel({
  name,
  country,
  ownerName,
  neighborNames,
}: ProvincePanelProps) {
  return (
    <Panel title={name}>
      <p className="text-muted-foreground">
        {country} · {ownerName ?? 'Sahipsiz'}
      </p>
      <p className="mt-2">
        <span className="font-medium">Komşular: </span>
        {neighborNames.join(', ') || 'yok (ada)'}
      </p>
    </Panel>
  );
}
