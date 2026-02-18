export function prefer<A extends Record<string, any>>(a: A, b: A): A {
  const out: any = { ...a };
  for (const k of Object.keys(b)) {
    const v = (b as any)[k];
    const ok =
      v !== undefined &&
      v !== null &&
      !(typeof v === "string" && v.trim() === "");
    if (ok) out[k] = v;
  }
  return out;   
}
