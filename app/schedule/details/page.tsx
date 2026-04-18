import BookingDetailsForm from "./BookingDetailsForm";

type SearchParams = Promise<{
  price?: string;
  slotLabel?: string;
  slotStart?: string;
  slotEnd?: string;
  serviceLevel?: string;
}>;

export default async function BookingDetailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const price = Number(params.price);
  const slotLabel = params.slotLabel ?? "";
  const slotStart = params.slotStart ?? "";
  const slotEnd = params.slotEnd ?? "";
  const serviceLevel = params.serviceLevel ?? "";

  const missingServiceLevel =
    Number.isFinite(price) && slotLabel && slotStart && slotEnd && !serviceLevel;

  const draft =
    Number.isFinite(price) && slotLabel && slotStart && slotEnd && serviceLevel
      ? {
          price,
          slotLabel,
          slotStart,
          slotEnd,
          serviceLevel,
        }
      : null;

  return (
    <BookingDetailsForm
      draft={draft}
      missingServiceLevel={missingServiceLevel}
    />
  );
}
