import { relations } from "drizzle-orm/relations";
import { cleanerProfile, cleanerSpecialisation, service, user, booking, address, communicationLog, key, passwordResetToken, payment, cleanerApplication, applicationNote, cleanerPayoutSummary, adminNote, userSession, authSession, account } from "./schema";

export const cleanerSpecialisationRelations = relations(cleanerSpecialisation, ({one}) => ({
	cleanerProfile: one(cleanerProfile, {
		fields: [cleanerSpecialisation.cleanerProfileId],
		references: [cleanerProfile.id]
	}),
	service: one(service, {
		fields: [cleanerSpecialisation.serviceId],
		references: [service.id]
	}),
}));

export const cleanerProfileRelations = relations(cleanerProfile, ({one, many}) => ({
	cleanerSpecialisations: many(cleanerSpecialisation),
	user: one(user, {
		fields: [cleanerProfile.userId],
		references: [user.id]
	}),
}));

export const serviceRelations = relations(service, ({many}) => ({
	cleanerSpecialisations: many(cleanerSpecialisation),
	bookings: many(booking),
}));

export const bookingRelations = relations(booking, ({one, many}) => ({
	user_userId: one(user, {
		fields: [booking.userId],
		references: [user.id],
		relationName: "booking_userId_user_id"
	}),
	address: one(address, {
		fields: [booking.addressId],
		references: [address.id]
	}),
	service: one(service, {
		fields: [booking.serviceId],
		references: [service.id]
	}),
	user_cleanerId: one(user, {
		fields: [booking.cleanerId],
		references: [user.id],
		relationName: "booking_cleanerId_user_id"
	}),
	communicationLogs: many(communicationLog),
	payments: many(payment),
	adminNotes: many(adminNote),
}));

export const userRelations = relations(user, ({many}) => ({
	bookings_userId: many(booking, {
		relationName: "booking_userId_user_id"
	}),
	bookings_cleanerId: many(booking, {
		relationName: "booking_cleanerId_user_id"
	}),
	addresses: many(address),
	cleanerProfiles: many(cleanerProfile),
	keys: many(key),
	passwordResetTokens: many(passwordResetToken),
	payments: many(payment),
	cleanerPayoutSummaries: many(cleanerPayoutSummary),
	userSessions: many(userSession),
	authSessions: many(authSession),
	accounts: many(account),
}));

export const addressRelations = relations(address, ({one, many}) => ({
	bookings: many(booking),
	user: one(user, {
		fields: [address.userId],
		references: [user.id]
	}),
}));

export const communicationLogRelations = relations(communicationLog, ({one}) => ({
	booking: one(booking, {
		fields: [communicationLog.bookingId],
		references: [booking.id]
	}),
}));

export const keyRelations = relations(key, ({one}) => ({
	user: one(user, {
		fields: [key.userId],
		references: [user.id]
	}),
}));

export const passwordResetTokenRelations = relations(passwordResetToken, ({one}) => ({
	user: one(user, {
		fields: [passwordResetToken.userId],
		references: [user.id]
	}),
}));

export const paymentRelations = relations(payment, ({one}) => ({
	booking: one(booking, {
		fields: [payment.bookingId],
		references: [booking.id]
	}),
	user: one(user, {
		fields: [payment.userId],
		references: [user.id]
	}),
}));

export const applicationNoteRelations = relations(applicationNote, ({one}) => ({
	cleanerApplication: one(cleanerApplication, {
		fields: [applicationNote.applicationId],
		references: [cleanerApplication.id]
	}),
}));

export const cleanerApplicationRelations = relations(cleanerApplication, ({many}) => ({
	applicationNotes: many(applicationNote),
}));

export const cleanerPayoutSummaryRelations = relations(cleanerPayoutSummary, ({one}) => ({
	user: one(user, {
		fields: [cleanerPayoutSummary.cleanerId],
		references: [user.id]
	}),
}));

export const adminNoteRelations = relations(adminNote, ({one}) => ({
	booking: one(booking, {
		fields: [adminNote.bookingId],
		references: [booking.id]
	}),
}));

export const userSessionRelations = relations(userSession, ({one}) => ({
	user: one(user, {
		fields: [userSession.userId],
		references: [user.id]
	}),
}));

export const authSessionRelations = relations(authSession, ({one}) => ({
	user: one(user, {
		fields: [authSession.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));