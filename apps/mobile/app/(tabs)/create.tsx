import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { categories } from "../../constants/categories";
import { createCommitment } from "../../services/commitments";

const frequencies = ["daily", "weekly", "one_time"] as const;

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>(categories[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("daily");
  const [stakesAmount, setStakesAmount] = useState("");
  const [refereeId, setRefereeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const amount = Math.round(Number(stakesAmount || 0) * 100);

    try {
      await createCommitment({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        checkInFrequency: frequency,
        stakesAmount: Number.isNaN(amount) ? 0 : amount,
        stakesCurrency: "USD",
        refereeId: refereeId.trim() || undefined
      });
      setSuccess("Commitment created.");
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStakesAmount("");
      setRefereeId("");
    } catch (err) {
      setError("Unable to create commitment. Check your fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Commitment</Text>
        <TextInput
          label="Title"
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          label="Description"
          mode="outlined"
          multiline
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />

        <Text style={styles.section}>Category</Text>
        <View style={styles.row}>
          {categories.map((item) => (
            <Button
              key={item}
              mode={item === category ? "contained" : "outlined"}
              onPress={() => setCategory(item)}
              style={styles.chip}
            >
              {item}
            </Button>
          ))}
        </View>

        <TextInput
          label="Start Date (YYYY-MM-DD)"
          mode="outlined"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
        />
        <TextInput
          label="End Date (YYYY-MM-DD)"
          mode="outlined"
          value={endDate}
          onChangeText={setEndDate}
          style={styles.input}
        />

        <Text style={styles.section}>Check-in Frequency</Text>
        <View style={styles.row}>
          {frequencies.map((item) => (
            <Button
              key={item}
              mode={item === frequency ? "contained" : "outlined"}
              onPress={() => setFrequency(item)}
              style={styles.chip}
            >
              {item}
            </Button>
          ))}
        </View>

        <TextInput
          label="Stakes Amount (USD)"
          mode="outlined"
          value={stakesAmount}
          onChangeText={setStakesAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          label="Referee User ID (required if stakes > 0)"
          mode="outlined"
          value={refereeId}
          onChangeText={setRefereeId}
          style={styles.input}
        />

        <HelperText type={error ? "error" : "info"}>
          {error ?? success ?? "Fill in the details and submit."}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving || !title || !startDate || !endDate}
        >
          Create Commitment
        </Button>

        <Text style={styles.note}>Challenges are coming next.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12
  },
  input: {
    marginBottom: 12
  },
  section: {
    fontWeight: "600",
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  chip: {
    marginRight: 8,
    marginBottom: 8
  },
  note: {
    marginTop: 16,
    color: "#555"
  }
});
