/** The overview read returns at most five unpublished entries per collection. */
export const overviewDraftLimit = 5;

export function changesTodo(drafts: { collection?: string | null; title: string }[]) {
  const perCollection = new Map<string, number>();
  for (const draft of drafts) {
    const collection = draft.collection ?? '';
    perCollection.set(collection, (perCollection.get(collection) ?? 0) + 1);
  }
  return {
    count: drafts.length,
    more: [...perCollection.values()].some((count) => count >= overviewDraftLimit),
    names: drafts.slice(0, 3).map((draft) => draft.title),
  };
}
