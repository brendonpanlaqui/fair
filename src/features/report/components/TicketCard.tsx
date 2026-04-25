import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    ReportRecord,
    formatDate,
    getStatusColor,
    getViolationLabel,
} from "../reportUtils";

interface TicketCardProps {
  item: ReportRecord;
  onPress: () => void;
}

export default function TicketCard({ item, onPress }: TicketCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="confirmation-number" size={16} color="#64748B" />
          <Text style={styles.ticketId}>{item.report_id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}15` },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Displaying the translated label instead of the raw backend value */}
      <Text style={styles.violationText}>
        {getViolationLabel(item.violation_type)}
      </Text>
      <Text style={styles.commentsText} numberOfLines={2}>
        "{item.passenger_comments}"
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.bodyNumberText}>
          Tricycle Body #{item.body_number}
        </Text>
        <Text style={styles.dateText}>{formatDate(item.filed_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketId: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  violationText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  commentsText: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  bodyNumberText: { fontSize: 13, fontWeight: "800", color: "#334155" },
  dateText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
});
