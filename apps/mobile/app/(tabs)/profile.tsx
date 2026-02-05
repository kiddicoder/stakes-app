import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { getMe, syncProfile, updateMe, type Profile } from "../../services/profile";
import { signOut } from "../../services/auth";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfile = async (active: boolean) => {
    setLoading(true);
    setError(null);
    try {
      let res = await getMe();
      if (!res.user) {
        await syncProfile().catch(() => undefined);
        res = await getMe();
      }
      if (!active) return;
      setProfile(res.user ?? null);
      setUsername(res.user?.username ?? "");
      setDisplayName(res.user?.displayName ?? "");
    } catch (err) {
      if (!active) return;
      setProfile(null);
      setError("Unable to load profile. Tap retry to bootstrap your account.");
    } finally {
      if (!active) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadProfile(active).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateMe({
        username: username.trim(),
        displayName: displayName.trim()
      });
      setProfile(res.user ?? null);
      setSuccess("Profile updated");
    } catch (err) {
      setError("Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut().catch(() => undefined);
    setSigningOut(false);
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Text style={styles.title}>Profile</Text>
        <HelperText type="error">{error ?? "Profile not found."}</HelperText>
        <Button mode="contained" onPress={() => loadProfile(true)} style={styles.button}>
          Retry
        </Button>
        <Button mode="outlined" onPress={handleSignOut} loading={signingOut}>
          Log Out
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.meta}>User ID: {profile.id}</Text>

      <TextInput
        label="Username"
        mode="outlined"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Display Name"
        mode="outlined"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />

      <HelperText type={error ? "error" : "info"}>
        {error ?? success ?? "Make sure your username is unique."}
      </HelperText>

      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
        Save Changes
      </Button>
      <Button
        mode="outlined"
        onPress={handleSignOut}
        loading={signingOut}
        disabled={signingOut}
        style={styles.button}
      >
        Log Out
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12
  },
  meta: {
    marginBottom: 16,
    color: "#555"
  },
  input: {
    marginBottom: 12
  },
  button: {
    marginTop: 12
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
