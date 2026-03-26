export const EVENT_TYPE_LABELS: Record<string, string> = {
  collection_launch: "Collection Launch",
  markdown: "Markdown",
  promotion: "Promotion",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  collection_launch: "bg-blue-100 text-blue-800",
  markdown: "bg-amber-100 text-amber-800",
  promotion: "bg-green-100 text-green-800",
};

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatEventDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatEventDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
