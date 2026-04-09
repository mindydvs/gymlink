import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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

type Screen = "landing" | "sign-in" | "forgot" | "join-1" | "join-2";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useUser();
  const [screen, setScreen] = useState<Screen>("landing");
  const [isLoading, setIsLoading] = useState(false);

  const [signInName, setSignInName] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPw, setShowSignInPw] = useState(false);

  const [joinName, setJoinName] = useState("");
  const [joinUsername, setJoinUsername] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinAge, setJoinAge] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinConfirm, setJoinConfirm] = useState("");
  const [showJoinPw, setShowJoinPw] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { Alert.alert("Missing info", "Please enter your email address."); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setForgotSent(true);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!termsAccepted) { Alert.alert("Terms Required", "Please read and accept the Terms of Service to create an account."); return; }
    if (!joinName.trim()) { Alert.alert("Missing info", "Please enter your display name."); return; }
    if (!joinUsername.trim() || joinUsername.length < 2) { Alert.alert("Missing info", "Please enter a username (min 2 characters)."); return; }
    if (!joinEmail.trim() || !joinEmail.includes("@")) { Alert.alert("Missing info", "Please enter a valid email address."); return; }
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
          username: joinUsername.trim(),
          email: joinEmail.trim(),
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

  const TERMS_SECTIONS = [
    { h: "1. Eligibility", p: "You must be at least 18 years old to create an account. By using GymLink, you confirm you are at least 18 years of age." },
    { h: "2. Your Account", p: "You are responsible for your account credentials and all activity under your account. Provide accurate information, keep credentials secure, and use only one account." },
    { h: "3. Zero Tolerance — Bullying & Harassment", p: "GymLink has a strict zero-tolerance policy for bullying, harassment, intimidation, hate speech, threats, body shaming, doxxing, impersonation, and manipulation. Violations result in immediate and permanent account termination without refund." },
    { h: "4. User Conduct", p: "Treat all users with respect. Do not solicit, advertise, upload illegal/obscene content, hack the App, use bots, or collect other users' personal information." },
    { h: "5. Content You Create", p: "You are solely responsible for content you post. You grant GymLink a non-exclusive, royalty-free license to display it within the App. We may remove content that violates these Terms." },
    { h: "6. Selfie Verification & Photos", p: "Profile photos must be of you and accurately represent your appearance. No photos of others, celebrities, stock photos, or AI-generated images. Verification selfies are deleted within 24 hours." },
    { h: "7. Purchases — ALL SALES FINAL", p: "All purchases through GymLink are final and non-refundable, including subscriptions and in-app purchases. Subscriptions auto-renew unless cancelled before renewal. No refunds for accounts terminated for policy violations." },
    { h: "8. Privacy", p: "Your use of GymLink is governed by our Privacy Policy, incorporated into these Terms by reference." },
    { h: "9. Anonymous Features", p: "Gym Crush notifications are anonymous unless mutual. Anonymous Hype never reveals the sender. These features must not be used to harass or stalk others." },
    { h: "10. Safety & Meeting In Person", p: "Use provided safety tools (Block, Report, Buddies-Only Mode). Always meet gym connections in public gym areas. GymLink is not responsible for user interactions online or in person." },
    { h: "11. Intellectual Property", p: "GymLink's name, logo, and content are protected by copyright and trademark law. You may not copy, modify, or distribute our IP without written permission." },
    { h: "12. Disclaimers & Liability", p: "GymLink is provided \"as is\" without warranties. Our total liability shall not exceed $100 or amounts paid in the preceding 12 months, whichever is less." },
    { h: "13. Governing Law", p: "These Terms are governed by the laws of the State of Illinois. Disputes shall be resolved in courts in St. Clair County, Illinois." },
    { h: "14. Contact", p: "Questions? Email us at legal@gymlink.app or support@gymlink.app" },
  ];

  return (
    <View style={styles.root}>
      {/* ── Terms of Service Modal ── */}
      <Modal visible={showTermsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTermsModal(false)}>
        <View style={{ flex: 1, backgroundColor: "#0D0F17" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18 }}>Terms of Service</Text>
            <Pressable onPress={() => setShowTermsModal(false)} hitSlop={12} style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20 }}>Last updated: April 9, 2026</Text>
            {TERMS_SECTIONS.map(({ h, p }) => (
              <View key={h} style={{ marginBottom: 20 }}>
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 }}>{h}</Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20 }}>{p}</Text>
              </View>
            ))}
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>© 2026 GymLink. All rights reserved.</Text>
          </ScrollView>
          <View style={{ padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
            <Pressable
              style={({ pressed }) => ({ backgroundColor: "#E8193C", borderRadius: 14, paddingVertical: 15, alignItems: "center", opacity: pressed ? 0.85 : 1 })}
              onPress={() => { setTermsAccepted(true); setShowTermsModal(false); }}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>I Agree to the Terms of Service</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ExpoImage
        source={require("@/assets/images/hero-gym.jpeg")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="top"
      />
      <LinearGradient
        colors={[
          "rgba(10,13,26,0.15)",
          "rgba(10,13,26,0)",
          "rgba(10,13,26,0)",
          "rgba(10,13,26,0.82)",
          "rgba(10,13,26,0.97)",
        ]}
        locations={[0, 0.18, 0.62, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
      />

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

              <Pressable onPress={() => setScreen("forgot")} style={{ marginTop: 10, alignItems: "center" }}>
                <Text style={[styles.switchText, { opacity: 0.55 }]}>Forgot password?</Text>
              </Pressable>

              <Pressable onPress={() => setScreen("join-1")} style={{ marginTop: 6, alignItems: "center" }}>
                <Text style={styles.switchText}>New here? <Text style={styles.switchLink}>Join GymLink</Text></Text>
              </Pressable>
            </View>
          )}

          {screen === "forgot" && (
            <View style={styles.card}>
              {forgotSent ? (
                <>
                  <Text style={styles.cardTitle}>Check your email</Text>
                  <Text style={styles.cardSub}>
                    We sent a password reset link to {forgotEmail}. Open it to set a new password.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1, marginTop: 16 }]}
                    onPress={() => { setForgotSent(false); setForgotEmail(""); setScreen("sign-in"); }}
                  >
                    <Text style={styles.primaryBtnText}>Back to Sign In</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Forgot password?</Text>
                  <Text style={styles.cardSub}>Enter your email and we'll send a reset link.</Text>

                  <View style={styles.fields}>
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="done"
                        onSubmitEditing={handleForgotPassword}
                      />
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading ? 0.8 : 1, marginTop: 8 }]}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    )}
                  </Pressable>

                  <Pressable onPress={() => setScreen("sign-in")} style={{ marginTop: 12, alignItems: "center" }}>
                    <Text style={[styles.switchText, { opacity: 0.6 }]}>Back to Sign In</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {screen === "join-1" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create account</Text>
              <Text style={styles.cardSub}>Step 1 of 1 — your info</Text>

              <View style={styles.fields}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Display Name</Text>
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
                  <Text style={styles.fieldLabel}>Username</Text>
                  <View style={styles.pwRow}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, paddingLeft: 4, paddingRight: 2 }}>@</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="alexrivera"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={joinUsername}
                      onChangeText={(t) => setJoinUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={joinEmail}
                    onChangeText={setJoinEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
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

              {/* Terms checkbox */}
              <Pressable
                onPress={() => setTermsAccepted((v) => !v)}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 5, borderWidth: 2, marginTop: 1, flexShrink: 0,
                  borderColor: termsAccepted ? "#E8193C" : "rgba(255,255,255,0.3)",
                  backgroundColor: termsAccepted ? "#E8193C" : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {termsAccepted && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, flex: 1, lineHeight: 20 }}>
                  I have read and agree to the{" "}
                  <Text
                    style={{ color: "#00C4E8", textDecorationLine: "underline" }}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Terms of Service
                  </Text>
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading || !termsAccepted ? 0.6 : 1 }]}
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
    width: "90%",
    height: 360,
    alignSelf: "center" as const,
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
