import { formatDayMonthYear } from '@/utils/content';

export default function ReleaseDateMetadata({
  date,
  catalogNumber,
}: {
  date?: Date | undefined;
  catalogNumber: string;
}) {
  const machineDate = date?.toISOString().slice(0, 10);
  return (
    <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
      {machineDate && (
        <>
          <span>Digital release</span>
          <span aria-hidden="true"> / </span>
          <time dateTime={machineDate}>{formatDayMonthYear(date)}</time>
          <span aria-hidden="true"> · </span>
        </>
      )}
      <span className="whitespace-nowrap" data-release-catalog-number="">
        <span className="sr-only">Catalog number </span>
        {catalogNumber}
      </span>
    </p>
  );
}
