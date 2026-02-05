import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Chip, Text } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { type FeedItem, getFriendsFeed, getPublicFeed } from "../../services/feed";

type FeedMode = "friends" | "public";

function relativeTime(input: string) {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

function activityCopy(item: FeedItem) {
  const name = item.user.displayName ?? `@${item.user.username}`;
  const title = typeof item.metadata?.title === "string" ? item.metadata.title : "their goal";

  if (item.activityType === "commitment_created") {
    return `${name} committed to ${title}.`;
  }
  if (item.activityType === "check_in_success") {
    return `${name} logged a successful check-in for ${title}.`;
  }
  if (item.activityType === "check_in_failure") {
    return `${name} marked a failed check-in for ${title}.`;
  }
  return `${name} has new activity.`;
}

export default function FeedScreen() {
  const [mode, setMode] = useState<FeedMode>("friends");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setError(null);
    const res = mode === "friends" ? await getFriendsFeed() : await getPublicFeed();
    setItems(res.items ?? []);
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    loadFeed()
      .catch(() => {
        setError("Unable to load feed right now.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [loadFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="headlineSmall">Activity Feed</Text>
        <View style={styles.toggleRow}>
          <Button
            mode={mode === "friends" ? "contained" : "outlined"}
            onPress={() => setMode("friends")}
            style={styles.toggleButton}
          >
            Friends
          </Button>
          <Button
            mode={mode === "public" ? "contained" : "outlined"}
            onPress={() => setMode("public")}
            style={styles.toggleButton}
          >
            Public
          </Button>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && error ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text>{error}</Text>
            </Card.Content>
          </Card>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">No activity yet.</Text>
              <Text style={styles.subtext}>
                Once commitments and check-ins happen, your feed will come alive here.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {items.map((item) => (
          <Card key={item.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleSmall">
                  {item.user.displayName ?? `@${item.user.username}`}
                </Text>
                <Chip compact>{relativeTime(item.createdAt)}</Chip>
              </View>
              <Text style={styles.copy}>{activityCopy(item)}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    gap: 12
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8
  },
  toggleButton: {
    flex: 1
  },
  loadingWrap: {
    paddingVertical: 16
  },
  card: {
    borderRadius: 16
  },
  subtext: {
    marginTop: 6,
    color: "#607386"
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  copy: {
    marginTop: 8,
    lineHeight: 20
  }
});
