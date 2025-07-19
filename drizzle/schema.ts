import { pgTable, foreignKey, text, integer, timestamp, numeric, boolean, unique, json, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const applicationStatus = pgEnum("ApplicationStatus", ['PENDING', 'APPROVED', 'REJECTED'])
export const bookingStatus = pgEnum("BookingStatus", ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const communicationDirection = pgEnum("CommunicationDirection", ['INCOMING', 'OUTGOING'])
export const communicationType = pgEnum("CommunicationType", ['EMAIL', 'SMS', 'NOTE'])
export const dayOfWeek = pgEnum("DayOfWeek", ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
export const idType = pgEnum("IdType", ['SOUTH_AFRICAN_ID', 'PASSPORT'])
export const paymentMethod = pgEnum("PaymentMethod", ['CREDIT_CARD', 'DEBIT_CARD', 'EFT', 'MOBICRED', 'SNAPSCAN', 'ZAPPER', 'OTHER'])
export const paymentStatus = pgEnum("PaymentStatus", ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
export const petCompatibility = pgEnum("PetCompatibility", ['NONE', 'DOGS', 'CATS', 'BOTH'])
export const userRole = pgEnum("UserRole", ['CUSTOMER', 'CLEANER', 'ADMIN'])


export const cleanerSpecialisation = pgTable("cleaner_specialisation", {
	id: text().primaryKey().notNull(),
	cleanerProfileId: text("cleaner_profile_id").notNull(),
	serviceId: text("service_id").notNull(),
	experience: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cleanerProfileId],
			foreignColumns: [cleanerProfile.id],
			name: "cleaner_specialisation_cleaner_profile_id_cleaner_profile_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "cleaner_specialisation_service_id_service_id_fk"
		}),
]);

export const booking = pgTable("booking", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	addressId: text("address_id").notNull(),
	serviceId: text("service_id").notNull(),
	cleanerId: text("cleaner_id"),
	status: bookingStatus().default('PENDING').notNull(),
	scheduledDate: timestamp("scheduled_date", { mode: 'string' }).notNull(),
	duration: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "booking_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [address.id],
			name: "booking_address_id_address_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "booking_service_id_service_id_fk"
		}),
	foreignKey({
			columns: [table.cleanerId],
			foreignColumns: [user.id],
			name: "booking_cleaner_id_user_id_fk"
		}),
]);

export const address = pgTable("address", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	street: text().notNull(),
	aptUnit: text("apt_unit"),
	city: text().notNull(),
	state: text().notNull(),
	zipCode: text("zip_code").notNull(),
	instructions: text(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lat: numeric({ precision: 10, scale:  6 }),
	lng: numeric({ precision: 10, scale:  6 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "address_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const cleanerProfile = pgTable("cleaner_profile", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	idType: idType("id_type").notNull(),
	idNumber: text("id_number").notNull(),
	taxNumber: text("tax_number"),
	bankAccount: text("bank_account"),
	workLocationLat: numeric("work_location_lat", { precision: 10, scale:  6 }).notNull(),
	workLocationLng: numeric("work_location_lng", { precision: 10, scale:  6 }).notNull(),
	workAddress: text("work_address").notNull(),
	workRadius: numeric("work_radius", { precision: 10, scale:  2 }).notNull(),
	bio: text(),
	petCompatibility: petCompatibility("pet_compatibility").default('NONE').notNull(),
	availableDays: text("available_days").array(),
	rating: numeric({ precision: 3, scale:  1 }),
	isAvailable: boolean("is_available").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	profileImageUrl: text("profile_image_url"),
	experienceTypes: json("experience_types").default([]),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cleaner_profile_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("cleaner_profile_user_id_unique").on(table.userId),
]);

export const communicationLog = pgTable("communication_log", {
	id: text().primaryKey().notNull(),
	bookingId: text("booking_id").notNull(),
	type: communicationType().notNull(),
	content: text().notNull(),
	subject: text(),
	sentTo: text("sent_to"),
	sentBy: text("sent_by").notNull(),
	direction: communicationDirection().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [booking.id],
			name: "communication_log_booking_id_booking_id_fk"
		}).onDelete("cascade"),
]);

export const key = pgTable("key", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	hashedPassword: text("hashed_password"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "key_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const passwordResetToken = pgTable("password_reset_token", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "password_reset_token_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_token_token_unique").on(table.token),
]);

export const service = pgTable("service", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	durationHours: integer("duration_hours").notNull(),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(999),
});

export const payment = pgTable("payment", {
	id: text().primaryKey().notNull(),
	bookingId: text("booking_id").notNull(),
	userId: text("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: paymentStatus().default('PENDING').notNull(),
	paymentMethod: paymentMethod("payment_method").default('CREDIT_CARD').notNull(),
	payFastId: text("pay_fast_id"),
	payFastToken: text("pay_fast_token"),
	merchantReference: text("merchant_reference"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	platformCommissionRate: numeric("platform_commission_rate", { precision: 5, scale:  2 }).default('25.00').notNull(),
	platformCommissionAmount: numeric("platform_commission_amount", { precision: 10, scale:  2 }),
	cleanerPayoutAmount: numeric("cleaner_payout_amount", { precision: 10, scale:  2 }),
	isPaidToProvider: boolean("is_paid_to_provider").default(false).notNull(),
	providerPayoutDate: timestamp("provider_payout_date", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [booking.id],
			name: "payment_booking_id_booking_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "payment_user_id_user_id_fk"
		}),
	unique("payment_booking_id_unique").on(table.bookingId),
]);

export const applicationNote = pgTable("application_note", {
	id: text().primaryKey().notNull(),
	applicationId: text("application_id").notNull(),
	content: text().notNull(),
	addedBy: text("added_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [cleanerApplication.id],
			name: "application_note_application_id_cleaner_application_id_fk"
		}).onDelete("cascade"),
]);

export const cleanerPayoutSummary = pgTable("cleaner_payout_summary", {
	id: text().primaryKey().notNull(),
	cleanerId: text("cleaner_id").notNull(),
	totalEarnings: numeric("total_earnings", { precision: 10, scale:  2 }).default('0.00').notNull(),
	totalCommission: numeric("total_commission", { precision: 10, scale:  2 }).default('0.00').notNull(),
	totalPayout: numeric("total_payout", { precision: 10, scale:  2 }).default('0.00').notNull(),
	pendingPayout: numeric("pending_payout", { precision: 10, scale:  2 }).default('0.00').notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
	totalEarningsCurrentMonth: numeric("total_earnings_current_month", { precision: 10, scale:  2 }).default('0.00'),
	totalEarningsLastMonth: numeric("total_earnings_last_month", { precision: 10, scale:  2 }).default('0.00'),
	totalEarningsThisYear: numeric("total_earnings_this_year", { precision: 10, scale:  2 }).default('0.00'),
	lastPayoutAmount: numeric("last_payout_amount", { precision: 10, scale:  2 }),
	lastPayoutDate: timestamp("last_payout_date", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.cleanerId],
			foreignColumns: [user.id],
			name: "cleaner_payout_summary_cleaner_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const adminNote = pgTable("admin_note", {
	id: text().primaryKey().notNull(),
	bookingId: text("booking_id").notNull(),
	content: text().notNull(),
	addedBy: text("added_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [booking.id],
			name: "admin_note_booking_id_booking_id_fk"
		}).onDelete("cascade"),
]);

export const userSession = pgTable("user_session", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_session_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text(),
	role: userRole().default('CUSTOMER').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const cleanerApplication = pgTable("cleaner_application", {
	id: text().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text(),
	city: text().notNull(),
	availability: text().notNull(),
	ownTransport: boolean("own_transport").default(false).notNull(),
	whatsApp: boolean("whats_app").default(false).notNull(),
	idType: text("id_type"),
	idNumber: text("id_number"),
	referralSource: text("referral_source"),
	documents: text().array(),
	status: applicationStatus().default('PENDING').notNull(),
	notes: text(),
	isActive: boolean("is_active").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	profileImageUrl: text("profile_image_url"),
	latitude: numeric({ precision: 10, scale:  6 }),
	longitude: numeric({ precision: 10, scale:  6 }),
	formattedAddress: text("formatted_address"),
	experienceTypes: json("experience_types").default([]),
	workRadius: numeric("work_radius", { precision: 10, scale:  2 }).default('20'),
	bio: text(),
	taxNumber: text("tax_number"),
	bankAccount: text("bank_account"),
	petCompatibility: text("pet_compatibility").default('NONE'),
});

export const authSession = pgTable("authSession", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "authSession_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);

export const account = pgTable("account", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);
