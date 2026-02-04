import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { getCommitment, listCheckIns } from "../../services/commitments";

type CheckIn = {
  id: string;
  checkInDate: string;
  finalStatus: string;
  note?: string | null;
};

export default function CommitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([getCommitment(String(id)), listCheckIns(String(id))])
      .then(([commitmentRes, checkInRes]) => {
        if (!active) return;
        setItem(commitmentRes.item);
        setCheckIns(checkInRes.items ?? []);
      })
      .catch(() => {
        if (!active) return;
        setItem(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <Text>Commitment not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {item.startDate} → {item.endDate} • {item.checkInFrequency}
      </Text>
      <Text style={styles.meta}>Status: {item.status}</Text>

      <Button
        mode="contained"
        onPress={() => router.push({ pathname: "/commitment/check-in", params: { commitmentId: item.id } })}
        style={styles.button}
      >
        Check In
      </Button>

      <Text style={styles.section}>Check-in History</Text>
      {checkIns.length === 0 ? (
        <Text>No check-ins yet.</Text>
      ) : (
        checkIns.map((checkIn) => (
          <Card key={checkIn.id} style={styles.card}>
            <Card.Title title={checkIn.checkInDate} subtitle={`Status: ${checkIn.finalStatus}`} />
            {checkIn.note ? <Card.Content><Text>{checkIn.note}</Text></Card.Content> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8
  },
  meta: {
    marginBottom: 4,
    color: "#555"
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600"
  },
  card: {
    marginBottom: 12
  },
  button: {
    marginTop: 12,
    marginBottom: 8
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
