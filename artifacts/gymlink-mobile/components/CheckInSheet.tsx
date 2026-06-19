import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useListGyms,
  useSearchGyms,
  useAddGym,
  useCheckIn,
  type Gym,
  type GymCandidate,
} from "@workspace/api-client-react";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCheckedIn: () => void | Promise<void>;
}

export function CheckInSheet({ visible, onClose, onCheckedIn }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [webQuery, setWebQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: gyms } = useListGyms();
  const { mutateAsync: addGym } = useAddGym();
  const { mutateAsync: checkIn } = useCheckIn();

  const {
    data: webResults,
    isFetching: isSearching,
    isError: searchError,
  } = useSearchGyms(
    { q: webQuery },
    { query: { enabled: webQuery.trim().length >= 2 } },
  );

  const filteredGyms = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = gyms ?? [];
    if (!q) return list;
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q),
    );
  }, [gyms, query]);

  const reset = () => {
    setQuery("");
    setWebQuery("");
    setBusyId(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const doCheckIn = async (gymId: string, gymName: string) => {
    setBusyId(gymId);
    try {
      await checkIn({ data: { gymId, gymName } });
      await onCheckedIn();
      close();
    } catch {
      Alert.alert("Check-in failed", "Please try again in a moment.");
      setBusyId(null);
    }
  };

  const checkInExisting = (g: Gym) => doCheckIn(g.id, g.name);

  const addAndCheckIn = async (c: GymCandidate) => {
    const key = `${c.osmType}:${c.osmId}`;
    setBusyId(key);
    try {
      const gym = await addGym({ data: { osmType: c.osmType, osmId: c.osmId } });
      await checkIn({ data: { gymId: gym.id, gymName: gym.name } });
      await onCheckedIn();
      close();
    } catch {
      Alert.alert(
        "Could not add gym",
        "We couldn't verify that gym. Try another result.",
      );
      setBusyId(null);
    }
  };

  // Hide only web results that are the *same place* (by OSM identity) as a gym
  // already in our list. Match on the deterministic `osm-<type>-<id>` id so
  // distinct branches of a chain (e.g. several Gold's Gyms) still appear.
  const knownOsmIds = useMemo(
    () => new Set((gyms ?? []).map((g) => g.id)),
    [gyms],
  );
  const newWebResults = (webResults ?? []).filter(
    (c) => !knownOsmIds.has(`osm-${c.osmType}-${c.osmId}`),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, paddingTop: 20 },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Check in
          </Text>
          <Pressable
            onPress={close}
            hitSlop={12}
            style={[styles.closeBtn, { backgroundColor: colors.card }]}
          >
            <Ionicons name="close" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for your gym"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => setWebQuery(query)}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {filteredGyms.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => checkInExisting(g)}
              disabled={busyId !== null}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: colors.foreground }]}>
                  {g.name}
                </Text>
                {!!g.city && (
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    {g.city}
                  </Text>
                )}
              </View>
              {busyId === g.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              )}
            </Pressable>
          ))}

          {/* Add-a-gym section */}
          <View style={styles.addSection}>
            <Text style={[styles.addHint, { color: colors.mutedForeground }]}>
              Can&apos;t find your gym?
            </Text>
            <Pressable
              onPress={() => setWebQuery(query)}
              disabled={query.trim().length < 2 || isSearching}
              style={({ pressed }) => [
                styles.searchWebBtn,
                {
                  borderColor: colors.primary,
                  opacity:
                    query.trim().length < 2 ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
              )}
              <Text style={[styles.searchWebText, { color: colors.primary }]}>
                {query.trim().length < 2
                  ? "Type a gym name to search"
                  : `Search the web for "${query.trim()}"`}
              </Text>
            </Pressable>
          </View>

          {searchError && (
            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              Search is unavailable right now. Please try again.
            </Text>
          )}

          {webQuery.trim().length >= 2 &&
            !isSearching &&
            !searchError &&
            newWebResults.length === 0 && (
              <Text style={[styles.note, { color: colors.mutedForeground }]}>
                No verified gyms found for &quot;{webQuery.trim()}&quot;. Try a
                more specific name or include the city.
              </Text>
            )}

          {newWebResults.map((c) => {
            const key = `${c.osmType}:${c.osmId}`;
            return (
              <Pressable
                key={key}
                onPress={() => addAndCheckIn(c)}
                disabled={busyId !== null}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: colors.foreground }]}>
                    {c.name}
                  </Text>
                  {!!c.address && (
                    <Text
                      style={[styles.rowSub, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {c.address}
                    </Text>
                  )}
                </View>
                {busyId === key ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <View style={[styles.addPill, { backgroundColor: `${colors.primary}22` }]}>
                    <Ionicons name="add" size={14} color={colors.primary} />
                    <Text style={[styles.addPillText, { color: colors.primary }]}>
                      Add
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  closeBtn: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  addSection: {
    gap: 8,
    marginTop: 10,
    marginBottom: 2,
  },
  addHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  searchWebBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 13,
  },
  searchWebText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
});
