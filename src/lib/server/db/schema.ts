// src/lib/server/db/schema.ts
import {
  boolean,
  decimal,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Define enums
export const userRoleEnum = pgEnum("UserRole", [
  "CUSTOMER",
  "CLEANER",
  "ADMIN",
]);
export const bookingStatusEnum = pgEnum("BookingStatus", [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);
export const paymentMethodEnum = pgEnum("PaymentMethod", [
  "CREDIT_CARD",
  "DEBIT_CARD",
  "EFT",
  "MOBICRED",
  "SNAPSCAN",
  "ZAPPER",
  "OTHER",
]);
export const dayOfWeekEnum = pgEnum("DayOfWeek", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
export const idTypeEnum = pgEnum("IdType", ["SOUTH_AFRICAN_ID", "PASSPORT"]);
export const petCompatibilityEnum = pgEnum("PetCompatibility", [
  "NONE",
  "DOGS",
  "CATS",
  "BOTH",
]);
export const communicationTypeEnum = pgEnum("CommunicationType", [
  "EMAIL",
  "SMS",
  "NOTE",
]);
export const communicationDirectionEnum = pgEnum("CommunicationDirection", [
  "INCOMING",
  "OUTGOING",
]);

// Define enum for application status
export const applicationStatusEnum = pgEnum("ApplicationStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const EXPERIENCE_TYPES = {
  GUEST_HOUSE: "Cleaning Guest house/Hotel/BnB",
  OFFICE: "Cleaning Offices",
  CARE_GIVING: "Care Giving",
} as const;

// Define tables
export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").default("CUSTOMER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const session = pgTable("user_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

export const key = pgTable("key", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  hashedPassword: text("hashed_password"),
});

export const passwordResetToken = pgTable("password_reset_token", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const address = pgTable("address", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  street: text("street").notNull(),
  aptUnit: text("apt_unit"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  instructions: text("instructions"),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const service = pgTable("service", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  details: text("details"), // JSON-stringified details from CSV files
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(999),
});

export const booking = pgTable("booking", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  addressId: text("address_id")
    .notNull()
    .references(() => address.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),
  cleanerId: text("cleaner_id").references(() => user.id),
  status: bookingStatusEnum("status").default("PENDING").notNull(),
  scheduledDate: timestamp("scheduled_date", { mode: "date" }).notNull(),
  duration: integer("duration").notNull(), // Duration in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const payment = pgTable("payment", {
  id: text("id").primaryKey().notNull(),
  bookingId: text("booking_id")
    .notNull()
    .unique()
    .references(() => booking.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  paymentMethod: paymentMethodEnum("payment_method")
    .default("CREDIT_CARD")
    .notNull(),
  platformCommissionRate: decimal("platform_commission_rate", {
    precision: 5,
    scale: 2,
  })
    .default("25.00")
    .notNull(),
  platformCommissionAmount: decimal("platform_commission_amount", {
    precision: 10,
    scale: 2,
  }),
  cleanerPayoutAmount: decimal("cleaner_payout_amount", {
    precision: 10,
    scale: 2,
  }),
  isPaidToProvider: boolean("is_paid_to_provider").default(false).notNull(),
  providerPayoutDate: timestamp("provider_payout_date", { mode: "date" }),
  payFastId: text("pay_fast_id"),
  payFastToken: text("pay_fast_token"),
  merchantReference: text("merchant_reference"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

//  cleanerProfile table
export const cleanerProfile = pgTable("cleaner_profile", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  idType: idTypeEnum("id_type").notNull(),
  idNumber: text("id_number").notNull(),
  taxNumber: text("tax_number"),
  bankAccount: text("bank_account"),
  workLocationLat: decimal("work_location_lat", {
    precision: 10,
    scale: 6,
  }).notNull(),
  workLocationLng: decimal("work_location_lng", {
    precision: 10,
    scale: 6,
  }).notNull(),
  workAddress: text("work_address").notNull(),
  workRadius: decimal("work_radius", { precision: 10, scale: 2 }).notNull(),
  bio: text("bio"),
  petCompatibility: petCompatibilityEnum("pet_compatibility")
    .default("NONE")
    .notNull(),
  availableDays: text("available_days").array(), // Using array of text for the enum array
  rating: decimal("rating", { precision: 3, scale: 1 }),
  experienceTypes: json("experience_types").$type<string[]>().default([]),
  isAvailable: boolean("is_available").default(true).notNull(),
  profileImageUrl: text("profile_image_url"), // New field for profile image URL
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// cleanerApplication table
export const cleanerApplication = pgTable("cleaner_application", {
  id: text("id").primaryKey().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city").notNull(),

  // Address data fields
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  formattedAddress: text("formatted_address"),

  // Additional fields for profile creation
  workRadius: decimal("work_radius", { precision: 10, scale: 2 }).default("20"),
  bio: text("bio"),
  taxNumber: text("tax_number"),
  bankAccount: text("bank_account"),
  petCompatibility: text("pet_compatibility").default("NONE"),

  experienceTypes: json("experience_types").$type<string[]>().default([]),
  availability: text("availability").notNull(), // JSON string of days
  ownTransport: boolean("own_transport").default(false).notNull(),
  whatsApp: boolean("whats_app").default(false).notNull(),
  idType: text("id_type"),
  idNumber: text("id_number"),
  referralSource: text("referral_source"),
  documents: text("documents").array(), // Array of document URLs
  profileImageUrl: text("profile_image_url"), // New field for profile image URL
  status: applicationStatusEnum("status").default("PENDING").notNull(),
  notes: text("notes"), // Admin notes about application
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Application notes table
export const applicationNote = pgTable("application_note", {
  id: text("id").primaryKey().notNull(),
  applicationId: text("application_id")
    .notNull()
    .references(() => cleanerApplication.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const cleanerSpecialisation = pgTable("cleaner_specialisation", {
  id: text("id").primaryKey().notNull(),
  cleanerProfileId: text("cleaner_profile_id")
    .notNull()
    .references(() => cleanerProfile.id, { onDelete: "cascade" }),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),
  experience: integer("experience").notNull(), // In months
});

// New table for admin notes
export const adminNote = pgTable("admin_note", {
  id: text("id").primaryKey().notNull(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// New table for communication logs
export const communicationLog = pgTable("communication_log", {
  id: text("id").primaryKey().notNull(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  type: communicationTypeEnum("type").notNull(),
  content: text("content").notNull(),
  subject: text("subject"),
  sentTo: text("sent_to"),
  sentBy: text("sent_by").notNull(),
  direction: communicationDirectionEnum("direction").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const cleanerPayoutSummary = pgTable("cleaner_payout_summary", {
  id: text("id").primaryKey().notNull(),
  cleanerId: text("cleaner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalCommission: decimal("total_commission", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalPayout: decimal("total_payout", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  pendingPayout: decimal("pending_payout", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  lastUpdated: timestamp("last_updated", { mode: "date" })
    .defaultNow()
    .notNull(),

  // Running totals by period
  totalEarningsCurrentMonth: decimal("total_earnings_current_month", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  totalEarningsLastMonth: decimal("total_earnings_last_month", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  totalEarningsThisYear: decimal("total_earnings_this_year", {
    precision: 10,
    scale: 2,
  }).default("0.00"),

  // Last payout info
  lastPayoutAmount: decimal("last_payout_amount", { precision: 10, scale: 2 }),
  lastPayoutDate: timestamp("last_payout_date", { mode: "date" }),
});

// Define types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Key = typeof key.$inferSelect;
export type NewKey = typeof key.$inferInsert;

export type PasswordResetToken = typeof passwordResetToken.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetToken.$inferInsert;

export type Address = typeof address.$inferSelect;
export type NewAddress = typeof address.$inferInsert;

export type Service = typeof service.$inferSelect;
export type NewService = typeof service.$inferInsert;

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export type CleanerProfile = typeof cleanerProfile.$inferSelect;
export type NewCleanerProfile = typeof cleanerProfile.$inferInsert;

export type CleanerApplication = typeof cleanerApplication.$inferSelect;
export type NewCleanerApplication = typeof cleanerApplication.$inferInsert;

export type ApplicationNote = typeof applicationNote.$inferSelect;
export type NewApplicationNote = typeof applicationNote.$inferInsert;

export type ExperienceType =
  (typeof EXPERIENCE_TYPES)[keyof typeof EXPERIENCE_TYPES];

export type CleanerSpecialisation = typeof cleanerSpecialisation.$inferSelect;
export type NewCleanerSpecialisation =
  typeof cleanerSpecialisation.$inferInsert;

export type AdminNote = typeof adminNote.$inferSelect;
export type NewAdminNote = typeof adminNote.$inferInsert;

export type CommunicationLog = typeof communicationLog.$inferSelect;
export type NewCommunicationLog = typeof communicationLog.$inferInsert;

export type CleanerPayoutSummary = typeof cleanerPayoutSummary.$inferSelect;
export type NewCleanerPayoutSummary = typeof cleanerPayoutSummary.$inferInsert;
