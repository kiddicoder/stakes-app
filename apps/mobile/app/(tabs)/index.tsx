import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  ProgressBar,
  Surface,
  Text
} from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import {
  type DashboardCommitment,
  type DashboardSummary,
  getCommitmentDashboard
} from "../../services/commitments";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function daysLabel(daysRemaining: number) {
  if (daysRemaining <= 0) return "Ends today";
  if (daysRemaining === 1) return "1 day left";
  return `${daysRemaining} days left`;
}

function displayName(summary: DashboardSummary | null) {
  if (!summary) return "there";
  return summary.profile.displayName ?? summary.profile.username ?? "there";
}

function ActionRow(props: { label: string; value: number; tone: "primary" | "neutral" }) {
  const { label, value, tone } = props;
  const valueStyle = tone === "primary" ? styles.actionValuePrimary : styles.actionValueNeutral;

  return (
    <View style={styles.actionRow}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={valueStyle}>{value}</Text>
    </View>
  );
}

function CommitmentCard(props: { item: DashboardCommitment }) {
  const { item } = props;
  const router = useRouter();

  return (
    <Card style={styles.commitmentCard} mode="elevated">
      <Card.Content>
        <View style={styles.commitmentHeader}>
          <View style={styles.commitmentHeaderText}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.commitmentMeta}>
              {item.category} • {item.checkInFrequency}
            </Text>
          </View>
          <Chip compact>{daysLabel(item.daysRemaining)}</Chip>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Progress {item.completedCount}/{item.totalCheckInsRequired}
          </Text>
          <Text style={styles.progressPercent}>{item.progressPercent}%</Text>
        </View>
        <ProgressBar
          progress={Math.max(0, Math.min(1, item.progressPercent / 100))}
          style={styles.progressBar}
        />

        <View style={styles.commitmentFooter}>
          <Text style={styles.stakes}>
            Stakes: {formatCurrency(item.stakesAmount, item.stakesCurrency)}
          </Text>
          <Text style={styles.status}>{item.status.replace("_", " ")}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="text"
          onPress={() => router.push({ pathname: "/commitment/[id]", params: { id: item.id } })}
        >
          View
        </Button>
        {item.checkInDueToday ? (
          <Button
            mode="contained"
            onPress={() =>
              router.push({
                pathname: "/commitment/check-in",
                params: { commitmentId: item.id }
              })
            }
          >
            Check In
          </Button>
        ) : null}
      </Card.Actions>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const next = await getCommitmentDashboard();
      setSummary(next);
    } catch (err) {
      setError("We could not load your dashboard yet.");
    }
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard().catch(() => undefined);
    }, [loadDashboard])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard().finally(() => setRefreshing(false));
  }, [loadDashboard]);

  const activeCommitments = summary?.activeCommitments.slice(0, 3) ?? [];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Surface style={styles.hero} elevation={1}>
          <Text variant="titleMedium" style={styles.heroGreeting}>
            {getGreeting()}, {displayName(summary)}
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Keep your promises loud.
          </Text>
          <Text style={styles.heroSubtext}>
            Today is about momentum. One check-in can protect your streak.
          </Text>
          <View style={styles.streakWrap}>
            <Text style={styles.streakValue}>{summary?.stats.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>current streak</Text>
          </View>
        </Surface>

        <Surface style={styles.pendingCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Pending Actions
          </Text>
          <ActionRow
            label="Check-ins due today"
            value={summary?.pendingActions.checkInsDueToday ?? 0}
            tone="primary"
          />
          <Divider />
          <ActionRow
            label="Referee verifications needed"
            value={summary?.pendingActions.refereeVerificationsNeeded ?? 0}
            tone="neutral"
          />
          <Divider />
          <ActionRow
            label="Challenge invites"
            value={summary?.pendingActions.challengeInvites ?? 0}
            tone="neutral"
          />
          <View style={styles.pendingButtons}>
            <Button
              mode="contained-tonal"
              onPress={() => router.push("/referee")}
              disabled={(summary?.pendingActions.refereeVerificationsNeeded ?? 0) === 0}
            >
              Review Referee Queue
            </Button>
          </View>
        </Surface>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Active Commitments</Text>
          <Button mode="text" onPress={() => router.push("/(tabs)/create")}>
            New
          </Button>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && error ? (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text>{error}</Text>
          </Surface>
        ) : null}

        {!loading && !error && activeCommitments.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text variant="titleSmall">No active commitments yet.</Text>
            <Text style={styles.emptySubtext}>
              Create one now and put your first streak on the board.
            </Text>
            <Button mode="contained" onPress={() => router.push("/(tabs)/create")}>
              Create Commitment
            </Button>
          </Surface>
        ) : null}

        {activeCommitments.map((item) => (
          <CommitmentCard key={item.id} item={item} />
        ))}

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Active Challenges</Text>
        </View>
        <Surface style={styles.emptyCard} elevation={0}>
          <Text variant="titleSmall">Head-to-head challenges are up next.</Text>
          <Text style={styles.emptySubtext}>
            Your dashboard is now ready for them once we ship the challenge flow.
          </Text>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    gap: 12
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#0F3557"
  },
  heroGreeting: {
    color: "#D2E8FF"
  },
  heroTitle: {
    marginTop: 4,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  heroSubtext: {
    marginTop: 8,
    lineHeight: 20,
    color: "#B5D3EF"
  },
  streakWrap: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#F1B43C",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  streakValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0B2238"
  },
  streakLabel: {
    color: "#0B2238",
    fontWeight: "600"
  },
  pendingCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F2"
  },
  sectionTitle: {
    marginBottom: 8
  },
  actionRow: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  actionLabel: {
    color: "#294057"
  },
  actionValuePrimary: {
    fontWeight: "700",
    color: "#0B3D91"
  },
  actionValueNeutral: {
    fontWeight: "700",
    color: "#243B53"
  },
  pendingButtons: {
    marginTop: 10
  },
  sectionHeader: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  loadingWrap: {
    paddingVertical: 16
  },
  commitmentCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF"
  },
  commitmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  commitmentHeaderText: {
    flex: 1
  },
  commitmentMeta: {
    marginTop: 2,
    color: "#5A7086"
  },
  progressHeader: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  progressLabel: {
    color: "#4A6074"
  },
  progressPercent: {
    color: "#0B3D91",
    fontWeight: "700"
  },
  progressBar: {
    height: 8,
    borderRadius: 8
  },
  commitmentFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  stakes: {
    color: "#263A4D",
    fontWeight: "600"
  },
  status: {
    textTransform: "capitalize",
    color: "#5A7086"
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F2",
    padding: 16,
    gap: 10
  },
  emptySubtext: {
    color: "#607386"
  }
});
