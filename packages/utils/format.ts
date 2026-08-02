const BLOOD_GROUP_MAP: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

const REVERSE_BLOOD_GROUP_MAP: Record<string, string> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
};

export const BLOOD_GROUPS = Object.keys(REVERSE_BLOOD_GROUP_MAP);

export function formatBloodGroup(enumValue: string | undefined | null): string {
  if (!enumValue) return "-";
  return BLOOD_GROUP_MAP[enumValue] || enumValue;
}

export function toBloodGroupEnum(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  return REVERSE_BLOOD_GROUP_MAP[normalized] || normalized;
}
