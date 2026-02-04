import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { createCheckIn } from "../../services/commitments";

export default function CheckInScreen() {
  const router = useRouter();
  const { commitmentId } = useLocalSearchParams<{ commitmentId: string }>();
  const [checkInDate, setCheckInDate] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"success" | "failure">("success");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!commitmentId) return;
    setSaving(true);
    setError(null);
    try {
      await createCheckIn(String(commitmentId), {
        checkInDate: checkInDate.trim(),
        note: note.trim() || undefined,
        userReportedStatus: status
      });
      router.back();
    } catch (err) {
      setError("Unable to submit check-in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Check In</Text>
      <TextInput
        label="Check-in Date (YYYY-MM-DD)"
        mode="outlined"
        value={checkInDate}
        onChangeText={setCheckInDate}
        style={styles.input}
      />
      <TextInput
        label="Note (optional)"
        mode="outlined"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />
      <Text style={styles.section}>Status</Text>
      <Button
        mode={status === "success" ? "contained" : "outlined"}
        onPress={() => setStatus("success")}
        style={styles.statusButton}
      >
        Success
      </Button>
      <Button
        mode={status === "failure" ? "contained" : "outlined"}
        onPress={() => setStatus("failure")}
        style={styles.statusButton}
      >
        Failure
      </Button>

      <HelperText type={error ? "error" : "info"}>
        {error ?? "Submit your progress for today."}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={saving || !checkInDate}
        loading={saving}
      >
        Submit Check-In
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12
  },
  input: {
    marginBottom: 12
  },
  section: {
    marginTop: 4,
    marginBottom: 8,
    fontWeight: "600"
  },
  statusButton: {
    marginBottom: 8
  }
});
