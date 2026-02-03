import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { appTheme } from "../constants/theme";

export default function RootLayout() {
  return (
    <PaperProvider theme={appTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
