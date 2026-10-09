import pins from "../../../server/src/data/wave1DirectoryPins.json";

export type PrelaunchDirectoryPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  postcode?: string;
  address?: string;
  track?: string;
  type?: string;
  mechanic?: string;
  district?: string;
  /** Claimed Unwrapped member — shown differently on map/list. */
  isMember?: boolean;
  /** Public profile slug when isMember. */
  slug?: string;
  category?: string;
};

/** Wave 1 directory pins shown on the homepage map and list. */
export const PRELAUNCH_WAVE1_DIRECTORY_PINS = pins as PrelaunchDirectoryPin[];
