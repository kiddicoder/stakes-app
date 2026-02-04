import { useRouter } from "expo-router";
import { Button, Text } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";

export default function VerifyScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text variant="titleMedium">Verifying your login link...</Text>
      <Text variant="bodyMedium" style={{ marginTop: 8 }}>
        If nothing happens, go back and request a new magic link.
      </Text>
      <Button mode="text" onPress={() => router.replace("/(auth)/login")} style={{ marginTop: 12 }}>
        Back to login
      </Button>
    </Screen>
  );
}
