import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Alert,
  AppState,
  BackHandler,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { SvgXml } from "react-native-svg";
import { artwork } from "./src/art";
import type {
  Feed,
  Filters,
  Job,
  JobStatus,
  View as Page,
} from "@job-radar/contracts/types";
import { safeApplicationUrl } from "@job-radar/contracts/validation";
import {
  ApiError,
  fetchFeed,
  fetchJob,
  mutateJob,
  configureSession,
  login,
  logout,
  type Session,
} from "./src/api";
import {
  palettes,
  resolveTheme,
  type ThemePreference,
  type Palette,
} from "./src/theme";

const initialFilters: Filters = {
  search: "",
  mode: "all",
  location: "",
  minScore: 0,
  posting: "all",
  sort: "recent",
  page: 1,
  stage: "all",
};
function Art({ name }: { name: keyof typeof artwork }) {
  return (
    <SvgXml
      xml={artwork[name]}
      accessible={false}
      {...(name === "radar" ? { width: 80, height: 80 } : {})}
    />
  );
}
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function AppContent() {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [themeReady, setThemeReady] = useState(false);
  const theme = resolveTheme(preference, system),
    colors = palettes[theme];
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const s = useMemo(() => styles(colors, fontsLoaded), [colors, fontsLoaded]);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    let live = true;
    const persist = async (value: Session | null) => {
      if (value) {
        await SecureStore.setItemAsync("jr-access", value.access_token);
        await SecureStore.setItemAsync("jr-refresh", value.refresh_token);
      } else {
        await SecureStore.deleteItemAsync("jr-access");
        await SecureStore.deleteItemAsync("jr-refresh");
      }
      if (live) setSignedIn(!!value);
    };
    Promise.all([
      SecureStore.getItemAsync("jr-access"),
      SecureStore.getItemAsync("jr-refresh"),
    ])
      .then(([access, refresh]) => {
        const value =
          access && refresh
            ? { access_token: access, refresh_token: refresh }
            : null;
        configureSession(value, persist);
        if (live) setSignedIn(!!value);
      })
      .catch(() => configureSession(null, persist))
      .finally(() => {
        if (live) setAuthReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const [page, setPage] = useState<Page>("discover");
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [feed, setFeed] = useState<Feed>();
  const [detail, setDetail] = useState<Job>();
  const [detailTab, setDetailTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<
    "filters" | "theme" | "status" | "account" | null
  >(null);
  const [draft, setDraft] = useState(initialFilters);
  const generation = useRef(0),
    mutationLock = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem("job-radar-theme")
      .then((value) => {
        if (value === "light" || value === "dark" || value === "system")
          setPreference(value);
      })
      .catch(() => {})
      .finally(() => setThemeReady(true));
  }, []);
  useEffect(() => {
    if (themeReady)
      AsyncStorage.setItem("job-radar-theme", preference).catch(() => {});
  }, [preference, themeReady]);
  const load = useCallback(async () => {
    if (!authReady) return;
    const id = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await fetchFeed(page, filters, signedIn);
      if (id === generation.current) setFeed(result);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Could not load jobs.");
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }, [page, filters, authReady, signedIn]);
  useEffect(() => {
    const requests = generation;
    setFeed(undefined);
    void load();
    return () => {
      requests.current++;
    };
  }, [load]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void load();
        if (detail)
          fetchJob(detail.id, !!detail.matchId)
            .then((fresh) =>
              setDetail((current) =>
                current?.id === fresh.id ? fresh : current,
              ),
            )
            .catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [load, detail]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (detail) {
          setDetail(undefined);
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [detail]);
  const changePage = (next: Page) => {
    setPage(next);
    setDetail(undefined);
    setSearch("");
    setFilters(initialFilters);
    setNotice("");
  };
  const open = async (job: Job) => {
    setDetail(job);
    setDetailTab("Overview");
    setNotice("");
  };
  const update = async (
    job: Job,
    change: { isSaved?: boolean; status?: JobStatus },
  ) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setNotice("");
    try {
      await mutateJob(job, change);
      if (detail?.id === job.id) {
        const fresh = await fetchJob(job.id);
        setDetail((current) => (current?.id === fresh.id ? fresh : current));
      }
      await load();
      setNotice("Saved to your workspace.");
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Your change could not be saved.",
      );
      if (e instanceof ApiError && e.status === 409) {
        await load();
        if (detail) {
          try {
            {
              const fresh = await fetchJob(detail.id, !!detail.matchId);
              setDetail((current) =>
                current?.id === fresh.id ? fresh : current,
              );
            }
          } catch {
            setNotice("Refresh this job before making another change.");
          }
        }
      }
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  };
  const button = (
    label: string,
    onPress: () => void,
    primary = false,
    disabled = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        primary && s.primary,
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text
        style={[
          s.buttonText,
          primary && { color: theme === "dark" ? "#102319" : "#FFFFFF" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
  const chips = (
    values: string[],
    selected: string,
    select: (v: string) => void,
  ) => (
    <View style={s.wrap}>
      {values.map((value) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === selected }}
          key={value}
          onPress={() => select(value)}
          style={[s.chip, value === selected && s.chipActive]}
        >
          <Text
            style={[s.chipText, value === selected && { color: colors.accent }]}
          >
            {title(value)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  const saveButton = (job: Job) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${job.isSaved ? "Unsave" : "Save"} ${job.title}`}
      accessibilityState={{
        selected: job.isSaved,
        disabled: busy || !job.matchId,
      }}
      disabled={busy || !job.matchId}
      onPress={() => void update(job, { isSaved: !job.isSaved })}
      style={[s.save, job.isSaved && s.chipActive]}
    >
      {job.isSaved ? (
        <Text style={s.chipText}>✓</Text>
      ) : (
        <Art name="bookmark" />
      )}
    </Pressable>
  );
  const card = (job: Job) => (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.monogram}>
          <Text style={s.monogramText}>{job.company.slice(0, 1)}</Text>
        </View>
        <View style={s.flex}>
          <Text style={s.muted}>{job.company}</Text>
          <Text style={s.small}>{job.location ?? "Location not listed"}</Text>
        </View>
        {job.matchId && saveButton(job)}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${job.title} at ${job.company}`}
        onPress={() => void open(job)}
        style={s.cardLink}
      >
        <Text style={s.jobTitle}>{job.title}</Text>
        <View style={s.wrap}>
          <Text style={s.tag}>{title(job.mode)}</Text>
          {job.skills.slice(0, 2).map((skill) => (
            <Text key={skill} style={s.tag}>
              {skill}
            </Text>
          ))}
        </View>
        <View style={s.cardFooter}>
          <Text style={s.score}>
            {job.score === null ? "Job listing" : `${job.score}% match`}
          </Text>
          <Text style={s.link}>View role ↗</Text>
        </View>
        {job.status !== "new" && job.status !== "reviewed" && (
          <Text style={s.tag}>{title(job.status)}</Text>
        )}
      </Pressable>
      {page === "applications" &&
        button(
          "Update progress",
          () => {
            setDetail(job);
            setSheet("status");
          },
          false,
          busy || !job.matchId,
        )}
    </View>
  );
  const section = (heading: string, body: string | string[] | null) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{heading}</Text>
      {Array.isArray(body) ? (
        body.length ? (
          body.map((line, i) => (
            <Text key={i} style={s.body}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={s.muted}>Not provided in the listing.</Text>
        )
      ) : (
        <Text selectable style={s.body}>
          {body ?? "Not provided in the listing."}
        </Text>
      )}
    </View>
  );
  return (
    <SafeAreaView
      style={s.screen}
      edges={["top", "left", "right", "bottom"]}
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => {});
      }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={s.header}>
        {detail ? (
          button("‹ Back", () => setDetail(undefined))
        ) : (
          <View>
            <View style={s.brandRow}>
              <Image
                source={require("./assets/branding/app-icon.png")}
                alt=""
                resizeMethod="resize"
                style={s.brandLogo}
                accessibilityIgnoresInvertColors
                accessible={false}
              />
              <Text style={s.brand}>AI Job Radar</Text>
            </View>
            <Text style={s.small}>A little clarity for your next move</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Appearance settings"
          onPress={() => setSheet("theme")}
          style={s.theme}
        >
          <Text style={s.link}>{theme === "dark" ? "☾" : "☀"}</Text>
        </Pressable>
      </View>
      <View style={s.banner}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSheet("account")}
        >
          <Text style={s.link}>
            {signedIn
              ? "Owner workspace · Account"
              : "Sign in for scores, saved jobs and Applied tracking"}
          </Text>
        </Pressable>
      </View>
      {notice !== "" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={() => setNotice("")}
          style={s.banner}
        >
          <Text accessibilityLiveRegion="polite" style={s.body}>
            {notice}
          </Text>
        </Pressable>
      )}
      {detail ? (
        <>
          <ScrollView contentContainerStyle={s.content}>
            <View style={s.row}>
              <View style={s.monogram}>
                <Text style={s.monogramText}>{detail.company.slice(0, 1)}</Text>
              </View>
              <Text style={[s.muted, s.flex]}>{detail.company}</Text>
              {detail.matchId && saveButton(detail)}
            </View>
            <Text style={s.heading}>{detail.title}</Text>
            <Text style={s.muted}>
              {detail.location ?? "Location not listed"} · {title(detail.mode)}
            </Text>
            <Text style={s.score}>
              {detail.score === null
                ? "Public job listing"
                : `${detail.score}% match`}
            </Text>
            <View style={s.wrap}>
              {detail.skills.map((skill) => (
                <Text key={skill} style={s.tag}>
                  {skill}
                </Text>
              ))}
            </View>
            <Text style={s.small}>
              {detail.pay ?? "Compensation not listed"}
            </Text>
            {detail.matchId &&
              chips(["Overview", "Match insights"], detailTab, setDetailTab)}
            {detailTab === "Overview" ? (
              <>
                {section("About this role", detail.description)}
                {section("Responsibilities", detail.responsibilities)}
                {section("Required skills", detail.skills)}
                {section("Preferred skills", detail.preferredSkills)}
                {section("Eligibility", detail.eligibility)}
              </>
            ) : (
              <>
                {section("Why this role", detail.recommendation)}
                {section("Matching evidence", detail.evidence)}
                {section("Skills to review", detail.missing)}
                {detail.breakdown.map((item) => (
                  <View key={item.label} style={s.cardFooter}>
                    <Text style={s.body}>{item.label}</Text>
                    <Text style={s.score}>{item.value}</Text>
                  </View>
                ))}
              </>
            )}
            <Text style={s.small}>
              Posting status: {detail.postingStatus}. Check the employer’s page
              for current availability.
            </Text>
            {!detail.matchId && (
              <Text style={s.muted}>
                Sign in to see personal matches, save jobs and track
                applications. Local backend access requires your paired
                computer.
              </Text>
            )}
            {detail.matchId &&
              section("Application progress", title(detail.status))}
            {detail.matchId &&
              detail.status !== "applied" &&
              button(
                "Mark as applied",
                () => void update(detail, { status: "applied" }),
                true,
                busy,
              )}
            {detail.matchId &&
              button(
                "Update application progress",
                () => setSheet("status"),
                false,
                busy || !detail.matchId,
              )}
            <Text style={s.small}>
              Opening the employer page does not mark this job applied.
            </Text>
          </ScrollView>
          <View style={s.applyFooter}>
            {button(
              "Apply on employer website ↗",
              () => {
                const url = safeApplicationUrl(detail.applicationUrl);
                if (url)
                  Linking.openURL(url).catch(() =>
                    Alert.alert("Could not open link", "Please try again."),
                  );
              },
              true,
              !safeApplicationUrl(detail.applicationUrl),
            )}
          </View>
        </>
      ) : (
        <FlatList
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={7}
          data={feed?.jobs ?? []}
          keyExtractor={(job) => job.id}
          renderItem={({ item }) => card(item)}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          refreshing={loading}
          onRefresh={() => void load()}
          ListHeaderComponent={
            <View style={s.feedHeader}>
              <View style={s.hero}>
                <Text style={s.eyebrow}>
                  {page === "applications"
                    ? "YOUR APPLICATION JOURNEY"
                    : page === "saved"
                      ? "YOUR PERSONAL SHORTLIST"
                      : "YOUR DAILY RADAR"}
                </Text>
                <Text style={s.heroTitle}>
                  {page === "discover"
                    ? "Good roles.\nLess noise."
                    : page === "saved"
                      ? "Good opportunities,\nkept close."
                      : "Your next chapter\nstarts here."}
                </Text>
                <Text style={s.heroBody}>
                  A focused view of the opportunities that matter to you.
                </Text>
                <View style={s.heroBottom}>
                  <View>
                    <Text style={s.heroCount}>
                      {page === "saved"
                        ? (feed?.summary.saved ?? "—")
                        : page === "applications"
                          ? (feed?.summary.tracked ?? "—")
                          : (feed?.summary.total ?? "—")}
                    </Text>
                    <Text style={s.heroBody}>
                      {page === "discover"
                        ? "Opportunities"
                        : page === "saved"
                          ? "Saved roles"
                          : "In progress"}
                    </Text>
                  </View>
                  <Art name="radar" />
                </View>
              </View>
              {page === "applications" && (
                <View style={s.stats}>
                  {(["applied", "interview", "offer"] as const).map((key) => (
                    <View key={key} style={[s.card, s.flex]}>
                      <Text style={s.statValue}>
                        {feed?.summary[key] ?? "—"}
                      </Text>
                      <Text style={s.small}>{title(key)}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={s.row}>
                <View style={s.search}>
                  <Art name="search" />
                  <TextInput
                    accessibilityLabel="Search roles, companies or skills"
                    style={s.input}
                    placeholder="Roles, companies or skills"
                    placeholderTextColor={colors.muted}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={() =>
                      setFilters({ ...filters, search: search.trim(), page: 1 })
                    }
                    returnKeyType="search"
                    maxLength={200}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open filters"
                  onPress={() => {
                    setDraft(filters);
                    setSheet("filters");
                  }}
                  style={s.theme}
                >
                  <Art name="filter" />
                </Pressable>
              </View>
              {button("Search", () =>
                setFilters({ ...filters, search: search.trim(), page: 1 }),
              )}
              {page === "applications"
                ? chips(
                    [
                      "all",
                      "applied",
                      "interview",
                      "offer",
                      "rejected",
                      "withdrawn",
                    ],
                    filters.stage,
                    (stage) => setFilters({ ...filters, stage, page: 1 }),
                  )
                : chips(
                    ["all", "remote", "hybrid", "onsite"],
                    filters.mode,
                    (mode) => setFilters({ ...filters, mode, page: 1 }),
                  )}
              <View style={s.cardFooter}>
                <Text style={s.sectionTitle}>
                  {page === "discover"
                    ? "Latest opportunities"
                    : page === "saved"
                      ? "Saved opportunities"
                      : "Your applications"}
                </Text>
                <Text style={s.small}>{feed?.total ?? "—"} roles</Text>
              </View>
              {error !== "" && (
                <View style={s.card}>
                  <Text accessibilityRole="alert" style={s.error}>
                    {error}
                  </Text>
                  {button("Retry", () => void load(), true)}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={[s.card, s.empty]}>
                <Art name="empty" />
                <Text style={s.sectionTitle}>
                  {page === "saved"
                    ? "Your shortlist starts here"
                    : page === "applications"
                      ? "Your journey is just beginning"
                      : "No matching roles"}
                </Text>
                <Text style={s.muted}>
                  {page === "discover"
                    ? "Try another search or clear your filters."
                    : "Discover a role, save it, and track your next step."}
                </Text>
                {button(
                  page === "discover"
                    ? "Clear filters"
                    : "Explore opportunities",
                  () => changePage("discover"),
                  true,
                )}
              </View>
            ) : loading && !feed ? (
              <ActivityIndicator color={colors.accent} />
            ) : null
          }
          ListFooterComponent={
            feed && feed.total > 0 ? (
              <View style={s.pagination}>
                {button(
                  "Previous",
                  () => setFilters({ ...filters, page: filters.page - 1 }),
                  false,
                  loading || filters.page === 1,
                )}
                <Text style={s.small}>Page {filters.page}</Text>
                {button(
                  "Next",
                  () => setFilters({ ...filters, page: filters.page + 1 }),
                  false,
                  loading || filters.page * 20 >= feed.total,
                )}
              </View>
            ) : null
          }
        />
      )}
      {!detail && (
        <View style={s.nav}>
          {(["discover", "saved", "applications"] as const).map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: page === item }}
              accessibilityLabel={title(item)}
              key={item}
              onPress={() => changePage(item)}
              style={[
                s.navItem,
                page === item && { backgroundColor: colors.soft },
              ]}
            >
              <View style={s.navIcon}>
                <Art name={item} />
              </View>
              <Text
                style={[s.small, page === item && { color: colors.accent }]}
              >
                {item === "applications" ? "Activity" : title(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <View style={s.scrim}>
          <SafeAreaView style={s.sheet}>
            <ScrollView contentContainerStyle={s.sheetContent}>
              <View style={s.cardFooter}>
                <Text accessibilityRole="header" style={s.sectionTitle}>
                  {sheet === "theme"
                    ? "Make it yours"
                    : sheet === "status"
                      ? "Application progress"
                      : "Find your fit"}
                </Text>
                {button("Close", () => setSheet(null))}
              </View>
              {sheet === "theme" ? (
                <>
                  <Text style={s.muted}>
                    Choose your appearance. System follows your phone.
                  </Text>
                  {chips(["system", "light", "dark"], preference, (value) =>
                    setPreference(value as ThemePreference),
                  )}
                </>
              ) : sheet === "account" ? (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>
                    {signedIn ? "Your workspace" : "Owner sign-in"}
                  </Text>
                  {signedIn ? (
                    button("Sign out", () => {
                      void logout()
                        .catch(() =>
                          setNotice(
                            "Signed out on this device. Remote session revocation could not be confirmed.",
                          ),
                        )
                        .finally(() => {
                          setFeed(undefined);
                          setDetail(undefined);
                          setSheet(null);
                          setPage("discover");
                        });
                    })
                  ) : (
                    <>
                      <TextInput
                        accessibilityLabel="Email"
                        style={s.input}
                        placeholder="Email"
                        placeholderTextColor={colors.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                      <TextInput
                        accessibilityLabel="Password"
                        style={s.input}
                        placeholder="Password"
                        placeholderTextColor={colors.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="current-password"
                      />
                      {button(
                        busy ? "Signing in…" : "Sign in",
                        () => {
                          setBusy(true);
                          void login(email.trim(), password)
                            .then(() => {
                              setPassword("");
                              setDetail(undefined);
                              setFeed(undefined);
                              setSheet(null);
                            })
                            .catch((e) =>
                              Alert.alert(
                                "Sign-in failed",
                                e instanceof Error ? e.message : "Try again.",
                              ),
                            )
                            .finally(() => setBusy(false));
                        },
                        true,
                        busy,
                      )}
                    </>
                  )}
                </View>
              ) : sheet === "status" && detail ? (
                <>
                  <Text style={s.muted}>{detail.title}</Text>
                  {(
                    [
                      "new",
                      "reviewed",
                      "applied",
                      "interview",
                      "offer",
                      "rejected",
                      "withdrawn",
                    ] as const
                  ).map((status) => (
                    <View key={status}>
                      {button(
                        `${detail.status === status ? "✓ " : ""}${status === "new" ? "Remove from applications" : title(status)}`,
                        () => {
                          setSheet(null);
                          void update(detail, { status });
                        },
                        detail.status === status,
                        busy || !detail.matchId,
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <Text style={s.sectionTitle}>Work mode</Text>
                  {chips(
                    ["all", "remote", "hybrid", "onsite", "unknown"],
                    draft.mode,
                    (mode) => setDraft({ ...draft, mode }),
                  )}
                  {page !== "discover" && (
                    <>
                      <Text style={s.sectionTitle}>Minimum match</Text>
                      {chips(
                        ["0", "50", "70", "80", "90"],
                        String(draft.minScore),
                        (value) =>
                          setDraft({ ...draft, minScore: Number(value) }),
                      )}
                    </>
                  )}
                  <Text style={s.sectionTitle}>Location</Text>
                  <TextInput
                    accessibilityLabel="Location filter"
                    placeholder="City or country"
                    placeholderTextColor={colors.muted}
                    style={s.textField}
                    value={draft.location}
                    maxLength={100}
                    onChangeText={(location) =>
                      setDraft({ ...draft, location })
                    }
                  />
                  <Text style={s.sectionTitle}>Posting status</Text>
                  {chips(
                    ["all", "open", "closed", "uncertain"],
                    draft.posting,
                    (posting) => setDraft({ ...draft, posting }),
                  )}
                  <Text style={s.sectionTitle}>Sort by</Text>
                  {chips(
                    page === "discover"
                      ? ["recent", "company"]
                      : ["best", "recent", "company"],
                    draft.sort,
                    (sort) => setDraft({ ...draft, sort }),
                  )}
                  {button("Reset filters", () =>
                    setDraft({ ...initialFilters, search: filters.search }),
                  )}
                  {button(
                    "Show opportunities",
                    () => {
                      setFilters({ ...draft, page: 1 });
                      setSheet(null);
                    },
                    true,
                  )}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
function styles(c: Palette, fontsReady = true) {
  const regular = fontsReady ? "Inter_400Regular" : undefined;
  const semibold = fontsReady ? "Inter_600SemiBold" : undefined;
  const bold = fontsReady ? "Inter_700Bold" : undefined;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    header: {
      paddingHorizontal: 22,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandLogo: { width: 32, height: 32, borderRadius: 10 },
    brand: { fontFamily: bold, fontSize: 21, color: c.ink },
    small: {
      fontFamily: regular,
      fontSize: 12,
      lineHeight: 18,
      color: c.muted,
    },
    muted: {
      fontFamily: regular,
      fontSize: 14,
      lineHeight: 21,
      color: c.muted,
    },
    body: {
      fontFamily: regular,
      fontSize: 15,
      lineHeight: 25,
      color: c.ink,
    },
    content: { padding: 20, gap: 18, paddingBottom: 30 },
    feedHeader: { gap: 16 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    card: {
      backgroundColor: c.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      gap: 14,
    },
    cardLink: { gap: 14, paddingTop: 6 },
    monogram: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    monogramText: {
      fontFamily: bold,
      fontSize: 20,
      color: c.accent,
    },
    save: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    jobTitle: {
      fontFamily: semibold,
      fontSize: 19,
      lineHeight: 27,
      color: c.ink,
    },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      fontFamily: regular,
      fontSize: 12,
      lineHeight: 18,
      color: c.muted,
      backgroundColor: c.soft,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    score: { fontFamily: semibold, fontSize: 14, color: c.accent },
    link: { fontFamily: semibold, fontSize: 14, color: c.accent },
    button: {
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    primary: { backgroundColor: c.accent, borderColor: c.accent },
    buttonText: { fontFamily: semibold, fontSize: 14, color: c.ink },
    chip: {
      minHeight: 44,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 13,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
    },
    chipActive: { backgroundColor: c.soft, borderColor: c.accent },
    chipText: { fontFamily: semibold, fontSize: 13, color: c.muted },
    hero: {
      backgroundColor: c.hero,
      borderRadius: 26,
      padding: 20,
      gap: 10,
      overflow: "hidden",
    },
    eyebrow: {
      fontFamily: semibold,
      fontSize: 10,
      letterSpacing: 1.7,
      color: c.lime,
    },
    heroTitle: {
      fontFamily: bold,
      fontSize: 29,
      lineHeight: 35,
      letterSpacing: -0.7,
      color: "#FFFFFF",
    },
    heroBody: {
      fontFamily: regular,
      fontSize: 13,
      lineHeight: 21,
      color: "#DCE7DE",
    },
    heroBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroCount: { fontFamily: bold, fontSize: 29, color: c.lime },
    search: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 15,
      paddingHorizontal: 14,
      minHeight: 52,
    },
    input: {
      flex: 1,
      fontFamily: regular,
      fontSize: 14,
      color: c.ink,
      minHeight: 50,
    },
    theme: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    heading: {
      fontFamily: bold,
      fontSize: 29,
      lineHeight: 37,
      color: c.ink,
    },
    section: { gap: 10, paddingVertical: 4 },
    sectionTitle: {
      fontFamily: semibold,
      fontSize: 18,
      lineHeight: 26,
      color: c.ink,
    },
    empty: { alignItems: "center", paddingVertical: 30 },
    stats: { flexDirection: "row", gap: 8 },
    statValue: { fontFamily: bold, fontSize: 24, color: c.ink },
    nav: {
      flexDirection: "row",
      paddingHorizontal: 18,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    navIcon: {
      backgroundColor: "#E7F2E9",
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
    },
    navItem: {
      flex: 1,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      gap: 5,
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    applyFooter: {
      padding: 18,
      borderTopWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    error: {
      color: c.error,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: regular,
    },
    banner: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.soft,
    },
    scrim: {
      flex: 1,
      backgroundColor: "#00000088",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "90%",
    },
    sheetContent: { padding: 22, gap: 18 },
    textField: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      color: c.ink,
      fontFamily: regular,
    },
  });
}
