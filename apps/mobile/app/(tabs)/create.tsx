import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { categories } from "../../constants/categories";
import { createCommitment } from "../../services/commitments";
import { searchUsers, type SearchUser } from "../../services/users";

const frequencies = ["daily", "weekly", "one_time"] as const;

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>(categories[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("daily");
  const [stakesEnabled, setStakesEnabled] = useState(false);
  const [stakesAmount, setStakesAmount] = useState("");
  const [refereeId, setRefereeId] = useState("");
  const [refereeQuery, setRefereeQuery] = useState("");
  const [refereeResults, setRefereeResults] = useState<SearchUser[]>([]);
  const [searchingReferee, setSearchingReferee] = useState(false);
  const [selectedReferee, setSelectedReferee] = useState<SearchUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const stakesCents = useMemo(() => {
    if (!stakesEnabled) return 0;
    return Math.max(0, Math.round(Number(stakesAmount || 0) * 100));
  }, [stakesAmount, stakesEnabled]);
  const hasStakes = stakesCents > 0;

  useEffect(() => {
    if (!hasStakes) {
      setRefereeResults([]);
      setRefereeQuery("");
      setRefereeId("");
      setSelectedReferee(null);
      return;
    }

    const trimmed = refereeQuery.trim();
    if (trimmed.length < 2) {
      setRefereeResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setSearchingReferee(true);
      searchUsers(trimmed)
        .then((res) => {
          setRefereeResults(res.results ?? []);
        })
        .catch(() => {
          setRefereeResults([]);
        })
        .finally(() => {
          setSearchingReferee(false);
        });
    }, 250);

    return () => clearTimeout(timeout);
  }, [refereeQuery, hasStakes]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (hasStakes && !refereeId) {
      setSaving(false);
      setError("Choose a referee when stakes are above $0.");
      return;
    }

    try {
      await createCommitment({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        checkInFrequency: frequency,
        stakesAmount: stakesCents,
        stakesCurrency: "USD",
        refereeId: refereeId.trim() || undefined
      });
      setSuccess("Commitment created.");
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStakesEnabled(false);
      setStakesAmount("");
      setRefereeId("");
      setRefereeQuery("");
      setRefereeResults([]);
      setSelectedReferee(null);
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

        <Text style={styles.section}>Add Stakes?</Text>
        <View style={styles.row}>
          <Button
            mode={stakesEnabled ? "contained" : "outlined"}
            onPress={() => setStakesEnabled(true)}
            style={styles.chip}
          >
            Yes
          </Button>
          <Button
            mode={!stakesEnabled ? "contained" : "outlined"}
            onPress={() => setStakesEnabled(false)}
            style={styles.chip}
          >
            No
          </Button>
        </View>

        {stakesEnabled ? (
          <TextInput
            label="Stakes Amount (USD)"
            mode="outlined"
            value={stakesAmount}
            onChangeText={setStakesAmount}
            keyboardType="numeric"
            style={styles.input}
          />
        ) : null}
        {hasStakes ? (
          <View style={styles.refereeWrap}>
            <Text style={styles.section}>Referee (required)</Text>
            <TextInput
              label="Search by username"
              mode="outlined"
              value={refereeQuery}
              onChangeText={setRefereeQuery}
              autoCapitalize="none"
              style={styles.input}
            />

            {searchingReferee ? <ActivityIndicator style={styles.searching} /> : null}

            {refereeResults.map((user) => {
              const active = selectedReferee?.id === user.id;
              const subtitle = user.displayName ? `${user.displayName} · @${user.username}` : `@${user.username}`;
              return (
                <Button
                  key={user.id}
                  mode={active ? "contained" : "outlined"}
                  style={styles.resultButton}
                  onPress={() => {
                    setSelectedReferee(user);
                    setRefereeId(user.id);
                  }}
                >
                  {subtitle}
                </Button>
              );
            })}

            {!searchingReferee && refereeQuery.trim().length >= 2 && refereeResults.length === 0 ? (
              <HelperText type="info">No users found for that search.</HelperText>
            ) : null}
          </View>
        ) : null}

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
  },
  refereeWrap: {
    marginBottom: 8
  },
  searching: {
    marginVertical: 8
  },
  resultButton: {
    marginBottom: 8,
    justifyContent: "flex-start"
  }
});
