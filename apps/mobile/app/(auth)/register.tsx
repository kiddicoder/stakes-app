import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { sendSignupMagicLink } from "../../services/auth";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus("sending");
    setError(null);
    const { error: signInError } = await sendSignupMagicLink(
      email.trim(),
      username.trim(),
      displayName.trim()
    );
    if (signInError) {
      setStatus("error");
      setError(signInError.message);
      return;
    }
    setStatus("sent");
  };

  return (
    <Screen>
      <Text style={styles.title}>Create Account</Text>
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
      <HelperText type={status === "error" ? "error" : "info"}>
        {status === "sent"
          ? "Magic link sent. Check your email."
          : error ?? "We will send a magic link to finish setup."}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleSend}
        disabled={!email || !username || status === "sending"}
        loading={status === "sending"}
      >
        Send Magic Link
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
    marginBottom: 16
  },
  input: {
    marginBottom: 12
  }
});
