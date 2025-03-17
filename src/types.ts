export interface PackFile {
  name: string;
  data: string | ArrayBuffer | Uint8Array;
}

export interface Options {
  root?: string;
  pack?: 'auto' | 'npm' | 'yarn' | 'pnpm' | 'bun' | {tarball: ArrayBuffer};
}

export interface Message {
  severity: 'error' | 'warning' | 'suggestion';
  score: number;
  message: string;
}
