import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import {
  formatAuthError,
  sendSignupMagicLink,
  signUpWithPassword
} from "../../services/auth";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
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
      ? await signUpWithPassword(
          email.trim(),
          password,
          username.trim(),
          displayName.trim()
        )
      : await sendSignupMagicLink(email.trim(), username.trim(), displayName.trim());
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
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.mode}>
        {usePassword ? "Create account with password" : "Create account with magic link"}
      </Text>
      <TextInput
        label="Email"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        label="Username"
        mode="outlined"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        label="Display Name"
        mode="outlined"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />
      {usePassword ? (
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      ) : null}
      <HelperText type={status === "error" ? "error" : "info"}>
        {status === "sent" && usePassword
          ? "Account created. If email confirmation is enabled, check your inbox."
          : status === "sent"
          ? "Magic link sent. Check your email."
          : error ??
            (usePassword
              ? "Create an account and sign in with password."
              : "We will send a magic link to finish setup.")}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={
          !email ||
          !username ||
          status === "sending" ||
          (!usePassword && cooldownSeconds > 0) ||
          (usePassword && password.length < 6)
        }
        loading={status === "sending"}
      >
        {usePassword
          ? "Create Account"
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
      <Button mode="text" onPress={() => router.push("/(auth)/login")}>
        Back to login
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8
  },
  mode: {
    marginBottom: 12,
    color: "#5A7086"
  },
  input: {
    marginBottom: 12
  }
});
