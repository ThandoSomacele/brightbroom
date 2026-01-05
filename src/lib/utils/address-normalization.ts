// src/lib/utils/address-normalization.ts

/**
 * Address Normalization Utilities
 *
 * These functions normalize address data for duplicate detection and comparison.
 * Normalization ensures that addresses with different casing, whitespace, or
 * common abbreviations are correctly identified as duplicates.
 */

/**
 * Normalize an individual address field for comparison
 *
 * @param field - The address field to normalize (can be null/undefined)
 * @returns Normalized string (lowercase, trimmed, extra spaces removed)
 *
 * @example
 * normalizeAddressField("  123 Main Street  ") => "123 main street"
 * normalizeAddressField("APT 1") => "apt 1"
 * normalizeAddressField(null) => ""
 */
export function normalizeAddressField(
  field: string | null | undefined,
): string {
  if (!field) return "";

  return field
    .trim() // Remove leading/trailing whitespace
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\./g, "") // Remove periods (e.g., "St." -> "St")
    .trim(); // Trim again after replacements
}

/**
 * Normalize common street suffixes and abbreviations
 *
 * @param street - The street name to normalize
 * @returns Street with common abbreviations standardized
 *
 * @example
 * normalizeStreetName("Main Street") => "main st"
 * normalizeStreetName("Oak Ave") => "oak ave"
 */
export function normalizeStreetName(street: string): string {
  let normalized = normalizeAddressField(street);

  // Common street suffix mappings (South African and international)
  const suffixMap: Record<string, string> = {
    street: "st",
    avenue: "ave",
    road: "rd",
    drive: "dr",
    lane: "ln",
    court: "ct",
    place: "pl",
    boulevard: "blvd",
    crescent: "cres",
    circle: "cir",
    way: "way",
    north: "n",
    south: "s",
    east: "e",
    west: "w",
  };

  // Replace each suffix with its abbreviation
  Object.entries(suffixMap).forEach(([full, abbr]) => {
    // Match suffix at word boundaries
    const regex = new RegExp(`\\b${full}\\b`, "g");
    normalized = normalized.replace(regex, abbr);
  });

  return normalized;
}

/**
 * Normalize South African province names
 *
 * @param state - The province/state name
 * @returns Normalized province name
 *
 * @example
 * normalizeProvince("GP") => "gauteng"
 * normalizeProvince("Western Cape") => "western cape"
 */
export function normalizeProvince(state: string): string {
  const normalized = normalizeAddressField(state);

  // South African province mappings
  const provinceMap: Record<string, string> = {
    gp: "gauteng",
    gauteng: "gauteng",
    wc: "western cape",
    "western cape": "western cape",
    ec: "eastern cape",
    "eastern cape": "eastern cape",
    nc: "northern cape",
    "northern cape": "northern cape",
    fs: "free state",
    "free state": "free state",
    kzn: "kwazulu-natal",
    "kwazulu-natal": "kwazulu-natal",
    "kwazulu natal": "kwazulu-natal",
    nw: "north west",
    "north west": "north west",
    northwest: "north west",
    mp: "mpumalanga",
    mpumalanga: "mpumalanga",
    lp: "limpopo",
    limpopo: "limpopo",
  };

  return provinceMap[normalized] || normalized;
}

/**
 * Create a composite key for duplicate detection
 *
 * This key is used to identify duplicate addresses. It combines all
 * address fields into a single string for comparison.
 *
 * @param addressData - The address data to create a key from
 * @returns A composite key string
 *
 * @example
 * createAddressKey({
 *   street: "123 Main St",
 *   aptUnit: "Apt 1",
 *   city: "Randburg",
 *   state: "Gauteng",
 *   zipCode: "2194"
 * }) => "123 main st|apt 1|randburg|gauteng|2194"
 */
export function createAddressKey(addressData: {
  street: string;
  aptUnit?: string | null;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const normalizedStreet = normalizeStreetName(addressData.street);
  const normalizedAptUnit = normalizeAddressField(addressData.aptUnit);
  const normalizedCity = normalizeAddressField(addressData.city);
  const normalizedState = normalizeProvince(addressData.state);
  const normalizedZipCode = normalizeAddressField(addressData.zipCode);

  // Create composite key with pipe separator
  // Include aptUnit in the key since different apt/unit = different address
  return [
    normalizedStreet,
    normalizedAptUnit,
    normalizedCity,
    normalizedState,
    normalizedZipCode,
  ].join("|");
}

/**
 * Normalize a full address object for storage or comparison
 *
 * @param addressData - The address data to normalize
 * @returns Normalized address data
 *
 * @example
 * normalizeAddress({
 *   street: "  123 Main Street  ",
 *   aptUnit: "APT 1",
 *   city: "Randburg",
 *   state: "GP",
 *   zipCode: "2194"
 * }) => {
 *   street: "123 main st",
 *   aptUnit: "apt 1",
 *   city: "randburg",
 *   state: "gauteng",
 *   zipCode: "2194"
 * }
 */
export function normalizeAddress(addressData: {
  street: string;
  aptUnit?: string | null;
  city: string;
  state: string;
  zipCode: string;
}): {
  street: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
} {
  return {
    street: normalizeStreetName(addressData.street),
    aptUnit: normalizeAddressField(addressData.aptUnit),
    city: normalizeAddressField(addressData.city),
    state: normalizeProvince(addressData.state),
    zipCode: normalizeAddressField(addressData.zipCode),
  };
}

/**
 * Check if two addresses are duplicates
 *
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns true if addresses are duplicates, false otherwise
 *
 * @example
 * areAddressesDuplicate(
 *   { street: "123 Main St", city: "Randburg", state: "GP", zipCode: "2194" },
 *   { street: "123 Main Street", city: "randburg", state: "Gauteng", zipCode: "2194" }
 * ) => true
 */
export function areAddressesDuplicate(
  address1: {
    street: string;
    aptUnit?: string | null;
    city: string;
    state: string;
    zipCode: string;
  },
  address2: {
    street: string;
    aptUnit?: string | null;
    city: string;
    state: string;
    zipCode: string;
  },
): boolean {
  const key1 = createAddressKey(address1);
  const key2 = createAddressKey(address2);
  return key1 === key2;
}
