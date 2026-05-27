import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const REASONS = [
  "Nudity or sexual content",
  "Harassment or bullying",
  "Hate speech or threats",
  "Spam or scam",
  "Impersonation",
  "Self-harm or violence",
  "Other",
];

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
  isSubmitting?: boolean;
  targetLabel: string;
}

export function ReportSheet({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  targetLabel,
}: ReportSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const reset = () => {
    setReason(null);
    setDetails("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details.trim() || undefined);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Report {targetLabel}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Our team reviews reports within 24 hours and removes anything that
            violates our community standards.
          </Text>

          <View style={styles.reasonsList}>
            {REASONS.map((r) => {
              const selected = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  style={[
                    styles.reasonRow,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? `${colors.primary}14`
                        : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {selected && (
                      <View
                        style={[styles.radioDot, { backgroundColor: colors.primary }]}
                      />
                    )}
                  </View>
                  <Text style={[styles.reasonText, { color: colors.foreground }]}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add details (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={2000}
            style={[
              styles.details,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !reason || isSubmitting ? 0.5 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="flag" size={16} color="#fff" />
                  <Text style={styles.submitText}>Submit report</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  reasonsList: {
    gap: 8,
    marginTop: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  details: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
