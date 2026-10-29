export interface Option {
  value: string;
  label: string;
}

/** Transforme un dictionnaire de libellés en options de liste déroulante. */
export function optionsOf<K extends string>(labels: Record<K, string>): Option[] {
  return (Object.keys(labels) as K[]).map((key) => ({ value: key, label: labels[key] }));
}

/** Options d'une liste déroulante liée à des entités, avec une première option « vide » (ex. « — Choisir — »). */
export function entityOptions<T extends { id: number }>(items: readonly T[], label: (item: T) => string, emptyLabel: string): Option[] {
  return [{ value: '', label: emptyLabel }, ...items.map((item) => ({ value: String(item.id), label: label(item) }))];
}
