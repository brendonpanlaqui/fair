// app/file-report.tsx
import { Stack } from "expo-router";
import ReportFormScreen from "../src/features/report/screens/ReportFormScreen";

export default function FileReportRoute() {
  return (
    <>
      {/* 🚨 This tells Expo Router to hide the default native header */}
      <Stack.Screen options={{ headerShown: false }} />
      <ReportFormScreen />
    </>
  );
}
