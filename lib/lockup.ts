// utils/lockup.ts
import type { LockupKind, LockupType } from "./types"

export function lockupTypeFromKind(kind: LockupKind): LockupType {
  switch (kind) {
    case 'basic':
      return 'typeA';
    case 'premium':
      return 'typeB';
    default:
      throw new Error(`Tipo de lockup desconocido: ${kind}`);
  }
}