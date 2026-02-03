import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Screen } from "../../components/ui/Screen";
import { getMe, updateMe, type Profile } from "../../services/profile";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMe()
      .then((res) => {
        if (!active) return;
        setProfile(res.user);
        setUsername(res.user.username);
        setDisplayName(res.user.displayName ?? "");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load profile");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
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
        <HelperText type="error">Profile not found. Please try again.</HelperText>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
