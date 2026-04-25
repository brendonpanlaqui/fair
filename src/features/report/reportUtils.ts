// again match the Django (ReportHistorySerializer)
export interface ReportRecord {
  report_id: string;
  trip: string | null;
  body_number: string;
  violation_type: string;
  passenger_comments: string;
  status: "Pending" | "Investigating" | "Resolved" | "Dismissed";
  filed_at: string;
  admin_response?: string;
}

// violation options for the dropdown in the form, with both label and backend value
export const VIOLATION_OPTIONS = [
  { id: "1", label: "Overcharging", backendValue: "Overcharging" },
  { id: "2", label: "Refused Ride", backendValue: "Refusal" },
  { id: "3", label: "Missing Fare Matrix", backendValue: "No_Matrix" },
  { id: "4", label: "Denied Discount", backendValue: "No_Discount" },
  { id: "5", label: "Others", backendValue: "Others" },
];

// translate backend violation types to user-friendly labels for display in the UI
export const getViolationLabel = (backendValue: string) => {
  const found = VIOLATION_OPTIONS.find(
    (opt) => opt.backendValue === backendValue,
  );
  return found ? found.label : backendValue;
};

export const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "#F59E0B";
    case "Investigating":
      return "#3B82F6";
    case "Resolved":
      return "#10B981";
    case "Dismissed":
      return "#EF4444";
    default:
      return "#64748B";
  }
};
