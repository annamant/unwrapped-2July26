import wave1Pins from "./data/wave1DirectoryPins.json";
import type { CuratedDirectoryPin } from "./curatedDirectory";

/** The 132 shops on the public homepage. Follows use these ids, not the wider claim list. */
export const WAVE1_DIRECTORY_PINS = wave1Pins as CuratedDirectoryPin[];

const pinIds = new Set(WAVE1_DIRECTORY_PINS.map((pin) => pin.id));

export function isWave1PinId(id: string): boolean {
  return pinIds.has(id);
}
