import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { appTheme } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";

export default function RootLayout() {
  const { userId, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!userId && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (userId && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [initialized, userId, segments, router]);

  return (
    <PaperProvider theme={appTheme}>
      <StatusBar style="dark" />
      {initialized ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </PaperProvider>
  );
}
