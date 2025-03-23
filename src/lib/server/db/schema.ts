// src/lib/server/db/schema.ts
import {
  boolean,
  decimal,
  integer,
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

// Define tables
export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").default("CUSTOMER").notNull(),
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
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const service = pgTable("service", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
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
  payFastId: text("pay_fast_id"),
  payFastToken: text("pay_fast_token"),
  merchantReference: text("merchant_reference"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

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
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
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

// Define types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Key = typeof key.$inferSelect;
export type NewKey = typeof key.$inferInsert;

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

export type CleanerSpecialisation = typeof cleanerSpecialisation.$inferSelect;
export type NewCleanerSpecialisation =
  typeof cleanerSpecialisation.$inferInsert;

export type AdminNote = typeof adminNote.$inferSelect;
export type NewAdminNote = typeof adminNote.$inferInsert;

export type CommunicationLog = typeof communicationLog.$inferSelect;
export type NewCommunicationLog = typeof communicationLog.$inferInsert;
