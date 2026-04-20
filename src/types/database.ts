export type AuthProvider = "Local" | "Google";
export type UserType = "Regular" | "Student" | "Senior" | "PWD";
export type TricycleStatus = "Active" | "Suspended";
export type TripMode = "Direct" | "Special";
export type TripStatus = "Completed" | "Cancelled";
export type ViolationType = "Overcharging" | "Refusal" | "Detour" | "Arrogance";
export type ReportStatus =
  | "Pending"
  | "Investigating"
  | "Resolved"
  | "Dismissed";

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  auth_provider: AuthProvider;
  user_type: UserType;
  id_photo_url: string | null;
  is_verified: boolean;
  created_at: string; // ISO 8601 Date string
}

export interface Tricycle {
  body_number: string;
  driver_name: string;
  operator_name: string | null;
  toda_branch: string;
  plate_number: string;
  status: TricycleStatus;
}

export interface FareMatrix {
  matrix_id: number;
  trip_mode: TripMode;
  base_fare: number;
  base_distance_km: number;
  succeeding_km_rate: number;
  discount_percent: number;
  effective_date: string;
  updated_by_admin: string;
}

export interface Trip {
  trip_id: string;
  user_id: string | null;
  body_number: string;
  matrix_id: number;
  trip_mode: TripMode;
  origin_address: string;
  destination_address: string;
  total_distance_km: number;
  stopovers_count: number;
  computed_fare: number;
  actual_fare_charged: number;
  discount_applied: number;
  polyline_hash: string;
  status: TripStatus;
  timestamp: string;
}

export interface Report {
  report_id: string;
  trip_id: string;
  user_id: string;
  violation_type: ViolationType;
  passenger_comments: string;
  evidence_photo_url: string | null;
  status: ReportStatus;
  admin_remarks: string | null;
  filed_at: string;
  resolved_at: string | null;
}
