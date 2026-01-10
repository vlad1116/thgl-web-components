import { Encoder } from "cbor-x";

const encoder = new Encoder({ useRecords: true, pack: true });

export function decodeFromBuffer<T>(messagePack: Buffer | Uint8Array): T {
  return encoder.decode(messagePack) as T;
}

export function encodeToBuffer<T>(data: T) {
  return encoder.encode(data);
}
