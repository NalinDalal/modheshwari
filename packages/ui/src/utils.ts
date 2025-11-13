import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Performs cn operation.
 * @param {import("/Users/nalindalal/modheshwari/node_modules/clsx/clsx").ClassValue[]} inputs - Description of inputs
 * @returns {string} Description of return value
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
