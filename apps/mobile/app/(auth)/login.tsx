import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { formatAuthError, sendMagicLink, signInWithPassword } from "../../services/auth";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async () => {
    setStatus("sending");
    setError(null);
    const authResult = usePassword
      ? await signInWithPassword(email.trim(), password)
      : await sendMagicLink(email.trim());
    const signInError = authResult.error;
    if (signInError) {
      setStatus("error");
      setError(formatAuthError(signInError.message));
      return;
    }
    setStatus("sent");
    if (!usePassword) {
      setCooldownSeconds(60);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.modeTitle}>{usePassword ? "Password login" : "Magic link login"}</Text>
      <TextInput
        label="Email"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {usePassword ? (
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      ) : null}
      <HelperText type={status === "error" ? "error" : "info"}>
        {status === "sent" && usePassword
          ? "Signed in. Redirecting..."
          : status === "sent"
          ? "Magic link sent. Check your email."
          : error ??
            (usePassword
              ? "Enter your email and password."
              : "Enter your email to get a login link.")}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={
          !email ||
          status === "sending" ||
          (!usePassword && cooldownSeconds > 0) ||
          (usePassword && password.length === 0)
        }
        loading={status === "sending"}
      >
        {usePassword
          ? "Sign In"
          : cooldownSeconds > 0
            ? `Wait ${cooldownSeconds}s`
            : "Send Magic Link"}
      </Button>
      <Button
        mode="text"
        onPress={() => {
          setUsePassword((prev) => !prev);
          setStatus("idle");
          setError(null);
        }}
      >
        {usePassword ? "Use magic link instead" : "Use password instead"}
      </Button>
      <Button mode="text" onPress={() => router.push("/(auth)/register")}>
        Create an account
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16
  },
  modeTitle: {
    marginBottom: 8,
    color: "#5A7086"
  }
});
