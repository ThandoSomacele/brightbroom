// scripts/db/sa-test-data.ts
// South African test data helpers for seeding

/**
 * Common South African first names (female-weighted ~80%)
 */
export const SA_FIRST_NAMES = {
  female: [
    'Nomvula', 'Thandi', 'Lerato', 'Palesa', 'Nompumelelo', 'Khanyi', 'Zanele', 'Lindiwe',
    'Mbali', 'Naledi', 'Precious', 'Faith', 'Blessing', 'Grace', 'Hope', 'Beauty',
    'Nonhlanhla', 'Siphokazi', 'Nokuthula', 'Busisiwe', 'Thembi', 'Duduzile', 'Ntokozo',
    'Zinhle', 'Ayanda', 'Nosipho', 'Thandiwe', 'Nonkululeko', 'Sindi', 'Mmapula',
    'Mpho', 'Dikeledi', 'Refilwe', 'Kgomotso', 'Lesego', 'Masego', 'Keitumetse', 'Boitumelo'
  ],
  male: [
    'Thabo', 'Sipho', 'Bongani', 'Sibusiso', 'Mandla', 'Themba', 'Lucky', 'Justice',
    'Knowledge', 'Tebogo', 'Kabelo', 'Tshepo'
  ]
};

/**
 * Common South African surnames
 */
export const SA_SURNAMES = [
  'Nkosi', 'Dlamini', 'Ndlovu', 'Zulu', 'Mahlangu', 'Shabalala', 'Mkhize', 'Ngcobo',
  'Khumalo', 'Molefe', 'Sithole', 'Masango', 'Mokoena', 'Mabena', 'Radebe', 'Modise',
  'Pillay', 'Naidoo', 'Govender', 'Maharaj', 'Mthembu', 'Zwane', 'Buthelezi', 'Cele',
  'Ntuli', 'Mbeki', 'Mbatha', 'Ngubane', 'Sibiya', 'Mchunu', 'Gumede', 'Vilakazi',
  'Motaung', 'Kekana', 'Masilela', 'Maphanga', 'Chauke', 'Maluleke', 'Khoza', 'Mhlongo'
];

/**
 * Gauteng addresses within service areas (with coordinates)
 */
export const GAUTENG_ADDRESSES = [
  // Johannesburg
  {
    city: 'Johannesburg',
    address: '25 Nelson Mandela Square, Sandton',
    latitude: -26.1076,
    longitude: 28.0567
  },
  {
    city: 'Johannesburg',
    address: '142 Jan Smuts Avenue, Parktown North',
    latitude: -26.1512,
    longitude: 28.0292
  },
  {
    city: 'Johannesburg',
    address: '88 Oxford Road, Illovo',
    latitude: -26.1283,
    longitude: 28.0547
  },
  {
    city: 'Johannesburg',
    address: '15 Bompas Road, Dunkeld West',
    latitude: -26.1367,
    longitude: 28.0314
  },
  {
    city: 'Johannesburg',
    address: '203 Louis Botha Avenue, Orange Grove',
    latitude: -26.1622,
    longitude: 28.0753
  },
  {
    city: 'Johannesburg',
    address: '56 7th Street, Melville',
    latitude: -26.1753,
    longitude: 28.0083
  },
  {
    city: 'Johannesburg',
    address: '78 Grant Avenue, Norwood',
    latitude: -26.1528,
    longitude: 28.0822
  },
  {
    city: 'Johannesburg',
    address: '12 Tyrone Avenue, Parkview',
    latitude: -26.1647,
    longitude: 28.0264
  },
  // Pretoria
  {
    city: 'Pretoria',
    address: '45 Esselen Street, Sunnyside',
    latitude: -25.7608,
    longitude: 28.2031
  },
  {
    city: 'Pretoria',
    address: '310 Atterbury Road, Menlyn',
    latitude: -25.7835,
    longitude: 28.2789
  },
  {
    city: 'Pretoria',
    address: '22 Duxbury Road, Hatfield',
    latitude: -25.7515,
    longitude: 28.2372
  },
  {
    city: 'Pretoria',
    address: '67 Park Street, Arcadia',
    latitude: -25.7512,
    longitude: 28.2178
  },
  // Centurion
  {
    city: 'Centurion',
    address: '156 Lenchen Avenue, Centurion',
    latitude: -25.8603,
    longitude: 28.1894
  },
  {
    city: 'Centurion',
    address: '89 Embankment Road, Centurion',
    latitude: -25.8518,
    longitude: 28.1867
  },
  // Midrand
  {
    city: 'Midrand',
    address: '234 New Road, Midrand',
    latitude: -25.9922,
    longitude: 28.1278
  },
  {
    city: 'Midrand',
    address: '12 Grand Central Boulevard, Midrand',
    latitude: -25.9836,
    longitude: 28.1356
  },
  // Fourways
  {
    city: 'Johannesburg',
    address: '45 William Nicol Drive, Fourways',
    latitude: -26.0197,
    longitude: 28.0125
  },
  {
    city: 'Johannesburg',
    address: '78 Witkoppen Road, Fourways',
    latitude: -26.0322,
    longitude: 28.0083
  },
  // Randburg
  {
    city: 'Johannesburg',
    address: '189 Republic Road, Randburg',
    latitude: -26.0936,
    longitude: 28.0014
  },
  {
    city: 'Johannesburg',
    address: '33 Bram Fischer Drive, Ferndale',
    latitude: -26.0897,
    longitude: 28.0078
  }
];

/**
 * South African banks with their universal branch codes
 */
export const SA_BANKS = [
  { name: 'ABSA', branchCode: '632005' },
  { name: 'Capitec', branchCode: '470010' },
  { name: 'FNB', branchCode: '250655' },
  { name: 'Nedbank', branchCode: '198765' },
  { name: 'Standard Bank', branchCode: '051001' },
  { name: 'African Bank', branchCode: '430000' },
  { name: 'TymeBank', branchCode: '678910' },
];

/**
 * Bank account types
 */
export const BANK_ACCOUNT_TYPES = ['SAVINGS', 'CHEQUE'];

/**
 * Days of the week for availability
 */
export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

/**
 * Pet compatibility options
 */
export const PET_COMPATIBILITY_OPTIONS = ['NONE', 'DOGS', 'CATS', 'BOTH'];

/**
 * Referral sources
 */
export const REFERRAL_SOURCES = [
  'Facebook',
  'Instagram',
  'Google Search',
  'Friend/Family',
  'WhatsApp Group',
  'Gumtree',
  'Indeed',
  'LinkedIn',
  'Community Notice Board',
  'Other'
];

/**
 * Generate a valid South African ID number
 * Format: YYMMDD SSSS C A Z
 * - YYMMDD: Date of birth
 * - SSSS: Sequence number (gender: 0-4999 female, 5000-9999 male)
 * - C: Citizenship (0 = SA citizen, 1 = permanent resident)
 * - A: Usually 8
 * - Z: Checksum digit (Luhn algorithm)
 */
export function generateSAIdNumber(isFemale: boolean = true): string {
  // Random birth year between 1970 and 2000
  const year = 70 + Math.floor(Math.random() * 30);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');

  // Gender sequence (female: 0000-4999, male: 5000-9999)
  const genderMin = isFemale ? 0 : 5000;
  const genderMax = isFemale ? 4999 : 9999;
  const sequence = String(genderMin + Math.floor(Math.random() * (genderMax - genderMin + 1))).padStart(4, '0');

  // SA citizen
  const citizenship = '0';

  // Usually 8
  const digit8 = '8';

  // Build ID without checksum
  const idWithoutChecksum = `${String(year).padStart(2, '0')}${month}${day}${sequence}${citizenship}${digit8}`;

  // Calculate Luhn checksum
  const checksum = calculateLuhnChecksum(idWithoutChecksum);

  return idWithoutChecksum + checksum;
}

/**
 * Calculate Luhn checksum for SA ID validation
 */
function calculateLuhnChecksum(digits: string): string {
  let sum = 0;
  let isOdd = true;

  // Process from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (!isOdd) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isOdd = !isOdd;
  }

  return String((10 - (sum % 10)) % 10);
}

/**
 * Generate a random South African phone number (+27 format)
 */
export function generateSAPhoneNumber(): string {
  // Common SA mobile prefixes
  const prefixes = ['60', '61', '62', '63', '64', '65', '66', '67', '68', '71', '72', '73', '74', '76', '78', '79', '81', '82', '83', '84'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generate 7 random digits
  const number = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');

  return `+27 ${prefix} ${number.slice(0, 3)} ${number.slice(3)}`;
}

/**
 * Get a random item from an array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple random items from an array (without replacement)
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generate random availability (returns array of days)
 */
export function generateRandomAvailability(): string[] {
  // Between 3 and 6 days per week
  const numDays = 3 + Math.floor(Math.random() * 4);
  return getRandomItems(DAYS_OF_WEEK, numDays);
}

/**
 * Generate a random first name (80% female)
 */
export function generateFirstName(): { name: string; isFemale: boolean } {
  const isFemale = Math.random() < 0.8;
  const nameList = isFemale ? SA_FIRST_NAMES.female : SA_FIRST_NAMES.male;
  return {
    name: getRandomItem(nameList),
    isFemale
  };
}

/**
 * Generate a random surname
 */
export function generateSurname(): string {
  return getRandomItem(SA_SURNAMES);
}

/**
 * Generate a random Gauteng address
 */
export function generateAddress() {
  return getRandomItem(GAUTENG_ADDRESSES);
}

/**
 * Generate a random bio for cleaners
 */
export function generateBio(): string {
  const years = 2 + Math.floor(Math.random() * 8);
  const bios = [
    `Hardworking and dedicated cleaner with ${years} years of professional experience. Looking for stable employment.`,
    `Reliable professional with ${years} years experience in residential and commercial cleaning.`,
    `Passionate about keeping spaces clean and organized. ${years} years of cleaning experience.`,
    `Detail-oriented cleaner seeking opportunities. Experienced in both residential and office environments.`,
    `Trustworthy and punctual with ${years} years experience. Can work independently or as part of a team.`,
    `Professional cleaner committed to delivering high-quality service. ${years} years in the industry.`,
    `Experienced in deep cleaning, regular maintenance, and specialized cleaning services.`
  ];

  return getRandomItem(bios);
}

/**
 * Generate random bank details
 * Returns null ~30% of the time to simulate applicants without bank accounts
 */
export function generateBankDetails(firstName: string, lastName: string): {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  bankAccountType: string | null;
  bankAccountHolder: string | null;
} {
  // 30% chance of no bank details provided
  if (Math.random() < 0.3) {
    return {
      bankName: null,
      bankAccountNumber: null,
      bankBranchCode: null,
      bankAccountType: null,
      bankAccountHolder: null
    };
  }

  const bank = getRandomItem(SA_BANKS);
  const accountType = getRandomItem(BANK_ACCOUNT_TYPES);

  // Generate a random 10-12 digit account number
  const accountLength = 10 + Math.floor(Math.random() * 3);
  const accountNumber = String(Math.floor(Math.random() * Math.pow(10, accountLength))).padStart(accountLength, '0');

  return {
    bankName: bank.name,
    bankAccountNumber: accountNumber,
    bankBranchCode: bank.branchCode,
    bankAccountType: accountType,
    bankAccountHolder: `${firstName} ${lastName}`
  };
}

/**
 * Generate a realistic profile picture URL using Pravatar
 * Pravatar provides real human profile photos
 * https://pravatar.cc
 */
export function generateAvatarUrl(seed: string): string {
  // Pravatar uses the seed as a unique identifier to get consistent images
  // Size 300x300 for good quality
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}

/**
 * Generate a unique email from name
 */
export function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
  const domain = getRandomItem(domains);
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');

  // Add index to ensure uniqueness
  return `${cleanFirst}.${cleanLast}${index}@${domain}`;
}
