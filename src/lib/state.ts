export function produceState<T extends object>(
  prev: T,
  recipe: (draft: T) => void,
): T {
  const draft = structuredClone(prev);
  recipe(draft);
  return draft;
}

export function patchSection<T extends object, K extends keyof T>(
  prev: T,
  key: K,
  patch: Partial<T[K]>,
): T {
  return produceState(prev, (draft) => {
    Object.assign(draft[key] as object, patch);
  });
}

