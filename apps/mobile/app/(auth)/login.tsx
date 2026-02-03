import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { sendMagicLink } from "../../services/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus("sending");
    setError(null);
    const { error: signInError } = await sendMagicLink(email.trim());
    if (signInError) {
      setStatus("error");
      setError(signInError.message);
      return;
    }
    setStatus("sent");
  };

  return (
    <Screen>
      <Text style={styles.title}>Login</Text>
      <TextInput
        label="Email"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <HelperText type={status === "error" ? "error" : "info"}>
        {status === "sent"
          ? "Magic link sent. Check your email."
          : error ?? "Enter your email to get a login link."}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleSend}
        disabled={!email || status === "sending"}
        loading={status === "sending"}
      >
        Send Magic Link
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16
  }
});
