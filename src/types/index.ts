import type {
  User,
  Shop,
  ShopMember,
  Service,
  AvailabilitySchedule,
  WeeklyHours,
  DateOverride,
  Appointment,
  WaitlistEntry,
  PoolSlot,
  Contact,
  Plan,
  AppointmentStatus,
  WaitlistStatus,
  PoolSlotStatus,
  DayOfWeek,
  BookingMode,
} from "@prisma/client";

export type {
  User,
  Shop,
  ShopMember,
  Service,
  AvailabilitySchedule,
  WeeklyHours,
  DateOverride,
  Appointment,
  WaitlistEntry,
  PoolSlot,
  Contact,
  Plan,
  AppointmentStatus,
  WaitlistStatus,
  PoolSlotStatus,
  DayOfWeek,
  BookingMode,
};

export type UserWithShop = User & {
  ownedShop: Shop | null;
  shopMemberships: (ShopMember & { shop: Shop })[];
};

export type ServiceWithCount = Service & {
  _count: { appointments: number };
};

export type AppointmentWithDetails = Appointment & {
  barber: Pick<User, "id" | "name" | "username" | "photoUrl">;
  service: Pick<Service, "id" | "name" | "durationMinutes" | "color">;
  contact: Pick<Contact, "id" | "name" | "email"> | null;
};

export type WaitlistEntryWithBarber = WaitlistEntry & {
  barber: Pick<User, "id" | "name" | "photoUrl"> | null;
};

export type PoolSlotWithBarber = PoolSlot & {
  barber: Pick<User, "id" | "name" | "photoUrl">;
  service: Pick<Service, "id" | "name" | "durationMinutes"> | null;
};

export type TimeSlot = {
  startTime: string; // ISO string
  endTime: string;
  available: boolean;
};

export const PLANS: Record<Plan, { label: string; price: number; maxBarbers: number }> = {
  SOLO: { label: "Solo", price: 19, maxBarbers: 1 },
  SHOP: { label: "Shop", price: 49, maxBarbers: 10 },
  PRO_SHOP: { label: "Pro Shop", price: 99, maxBarbers: Infinity },
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};
