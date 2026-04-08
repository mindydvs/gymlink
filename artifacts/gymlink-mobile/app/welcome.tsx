import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/context/UserContext";
import { useListGyms } from "@workspace/api-client-react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const BASE = `${API_BASE}/gymlink-mobile`;

type Screen = "landing" | "sign-in" | "join-1" | "join-2";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useUser();
  const [screen, setScreen] = useState<Screen>("landing");
  const [isLoading, setIsLoading] = useState(false);

  const [signInName, setSignInName] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPw, setShowSignInPw] = useState(false);

  const [joinName, setJoinName] = useState("");
  const [joinAge, setJoinAge] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinConfirm, setJoinConfirm] = useState("");
  const [showJoinPw, setShowJoinPw] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  const handleSignIn = async () => {
    if (!signInName.trim() || !signInPassword) {
      Alert.alert("Missing info", "Please enter your name and password.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signInName.trim(), password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      await login(data.userId);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      Alert.alert("Sign in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinName.trim()) { Alert.alert("Missing info", "Please enter your name."); return; }
    const age = parseInt(joinAge);
    if (!joinAge || isNaN(age) || age < 13 || age > 120) { Alert.alert("Invalid age", "Please enter a valid age (13–120)."); return; }
    if (joinPassword.length < 6) { Alert.alert("Weak password", "Password must be at least 6 characters."); return; }
    if (joinPassword !== joinConfirm) { Alert.alert("Passwords don't match", "Please make sure both passwords are the same."); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: joinName.trim(),
          age,
          password: joinPassword,
          bio: "",
          schedule: "",
          interests: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      await login(data.userId);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      Alert.alert("Registration failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/images/hero-lunge.jpeg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={[styles.overlay, StyleSheet.absoluteFillObject]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {screen !== "landing" && (
            <Pressable
              onPress={() => setScreen("landing")}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>
          )}

          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {screen === "landing" && (
            <View style={[styles.card, { marginTop: "auto" }]}>
              <Text style={styles.cardTitle}>Find your gym crew</Text>
              <Text style={styles.cardSub}>
                Connect with gym crushes, workout buddies, advisors & spotters.
              </Text>
              <View style={styles.btnGroup}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => setScreen("join-1")}
                >
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Join GymLink</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => setScreen("sign-in")}
                >
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.secondaryBtnText}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          )}

          {screen === "sign-in" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Sign in with your name and password</Text>

              <View style={styles.fields}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={signInName}
                    onChangeText={setSignInName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Password"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={signInPassword}
                      onChangeText={setSignInPassword}
                      secureTextEntry={!showSignInPw}
                      returnKeyType="done"
                      onSubmitEditing={handleSignIn}
                    />
                    <Pressable onPress={() => setShowSignInPw((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                      <Ionicons name={showSignInPw ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </Pressable>

              <Pressable onPress={() => setScreen("join-1")} style={{ marginTop: 12, alignItems: "center" }}>
                <Text style={styles.switchText}>New here? <Text style={styles.switchLink}>Join GymLink</Text></Text>
              </Pressable>
            </View>
          )}

          {screen === "join-1" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create account</Text>
              <Text style={styles.cardSub}>Step 1 of 1 — your info</Text>

              <View style={styles.fields}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Alex Rivera"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={joinName}
                    onChangeText={setJoinName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="25"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={joinAge}
                    onChangeText={setJoinAge}
                    keyboardType="number-pad"
                    returnKeyType="next"
                    maxLength={3}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Min 6 characters"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={joinPassword}
                      onChangeText={setJoinPassword}
                      secureTextEntry={!showJoinPw}
                      returnKeyType="next"
                    />
                    <Pressable onPress={() => setShowJoinPw((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                      <Ionicons name={showJoinPw ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Repeat password"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={joinConfirm}
                      onChangeText={setJoinConfirm}
                      secureTextEntry={!showJoinConfirm}
                      returnKeyType="done"
                      onSubmitEditing={handleJoin}
                    />
                    <Pressable onPress={() => setShowJoinConfirm((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                      <Ionicons name={showJoinConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
                onPress={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                  </>
                )}
              </Pressable>

              <Pressable onPress={() => setScreen("sign-in")} style={{ marginTop: 12, alignItems: "center" }}>
                <Text style={styles.switchText}>Already a member? <Text style={styles.switchLink}>Sign in</Text></Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0D1A" },
  overlay: {
    backgroundColor: "rgba(10,13,26,0.62)",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 240,
    height: 100,
  },
  card: {
    backgroundColor: "rgba(10,13,26,0.82)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#fff",
  },
  cardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
    marginTop: -8,
  },
  btnGroup: { gap: 10 },
  primaryBtn: {
    backgroundColor: "#E8193C",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  fields: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#fff",
  },
  pwRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
  },
  switchText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  switchLink: {
    fontFamily: "Inter_600SemiBold",
    color: "#00C4E8",
  },
});
