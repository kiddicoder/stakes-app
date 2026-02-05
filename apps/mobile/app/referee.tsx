import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Text, TextInput } from "react-native-paper";
import { Screen } from "../components/ui/Screen";
import {
  disputeCheckIn,
  listPendingVerifications,
  type PendingVerificationItem,
  verifyCheckIn
} from "../services/checkins";

type RowState = {
  note: string;
  loading: boolean;
};

export default function RefereeScreen() {
  const [items, setItems] = useState<PendingVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  const loadItems = useCallback(async () => {
    const res = await listPendingVerifications();
    setItems(res.items ?? []);
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const item of res.items ?? []) {
        next[item.checkIn.id] = prev[item.checkIn.id] ?? { note: "", loading: false };
      }
      return next;
    });
  }, []);

  useEffect(() => {
    loadItems()
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [loadItems]);

  const runAction = async (
    checkInId: string,
    action: (id: string, note?: string) => Promise<unknown>
  ) => {
    const note = rows[checkInId]?.note ?? "";
    setRows((prev) => ({ ...prev, [checkInId]: { note, loading: true } }));
    try {
      await action(checkInId, note);
      await loadItems();
    } finally {
      setRows((prev) => ({ ...prev, [checkInId]: { note, loading: false } }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="headlineSmall">Referee Queue</Text>
        <Text style={styles.subtext}>Review and resolve check-ins that need your decision.</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">All clear.</Text>
              <Text style={styles.subtext}>You have no pending referee verifications right now.</Text>
            </Card.Content>
          </Card>
        ) : null}

        {items.map((item) => {
          const row = rows[item.checkIn.id] ?? { note: "", loading: false };
          return (
            <Card key={item.checkIn.id} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.commitment.title}</Text>
                <Text style={styles.meta}>
                  Date: {item.checkIn.checkInDate} · Reported: {item.checkIn.userReportedStatus}
                </Text>
                {item.checkIn.note ? <Text style={styles.note}>“{item.checkIn.note}”</Text> : null}
                <TextInput
                  mode="outlined"
                  label="Referee note (optional)"
                  value={row.note}
                  onChangeText={(text) =>
                    setRows((prev) => ({ ...prev, [item.checkIn.id]: { ...row, note: text } }))
                  }
                  style={styles.input}
                />
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  loading={row.loading}
                  disabled={row.loading}
                  onPress={() => runAction(item.checkIn.id, verifyCheckIn)}
                >
                  Verify
                </Button>
                <Button
                  mode="outlined"
                  loading={row.loading}
                  disabled={row.loading}
                  onPress={() => runAction(item.checkIn.id, disputeCheckIn)}
                >
                  Dispute
                </Button>
              </Card.Actions>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    gap: 12
  },
  subtext: {
    color: "#5A7086"
  },
  loadingWrap: {
    paddingVertical: 12
  },
  card: {
    borderRadius: 16
  },
  emptyCard: {
    borderRadius: 16
  },
  meta: {
    marginTop: 6,
    color: "#435669"
  },
  note: {
    marginTop: 8,
    marginBottom: 8
  },
  input: {
    marginTop: 10
  }
});
