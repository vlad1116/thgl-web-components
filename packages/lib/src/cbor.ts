import { Encoder } from "cbor-x";

const encoder = new Encoder({ useRecords: true, pack: true });

export function decodeFromBuffer<T>(messagePack: Buffer | Uint8Array): T {
  return encoder.decode(messagePack) as T;
}

export function encodeToBuffer<T>(data: T) {
  return encoder.encode(data);
}

const OBFUSCATION_KEY = "thgl-2026-v1";

function xorTransform(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

export function encodeAndObfuscate<T>(data: T): string {
  const encoded = encoder.encode(data);
  const obfuscated = xorTransform(encoded, OBFUSCATION_KEY);
  return Buffer.from(obfuscated).toString("base64");
}

export function deobfuscateAndDecode<T>(base64String: string): T {
  const obfuscated = Buffer.from(base64String, "base64");
  const decoded = xorTransform(obfuscated, OBFUSCATION_KEY);
  return encoder.decode(decoded) as T;
}
