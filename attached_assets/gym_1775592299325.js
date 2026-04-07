import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  Alert,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0A0F',
  card: '#14141F',
  cardLight: '#1C1C2E',
  accent: '#FF3366',
  accentAlt: '#7C3AED',
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  orange: '#F97316',
  text: '#FFFFFF',
  textDim: '#8888AA',
  textMuted: '#555577',
  border: '#2A2A3E',
  crush: '#FF3366',
  buddy: '#3B82F6',
  advisor: '#10B981',
  spotter: '#F59E0B',
};

const CONNECTION_TYPES = {
  crush: { label: 'Gym Crush 💕', color: COLORS.crush, icon: '💕', desc: 'You think they\'re cute!' },
  buddy: { label: 'Workout Buddy 💪', color: COLORS.buddy, icon: '💪', desc: 'Train together' },
  advisor: { label: 'Fitness Advisor 🧠', color: COLORS.advisor, icon: '🧠', desc: 'Get advice & tips' },
  spotter: { label: 'Spotter 🤝', color: COLORS.spotter, icon: '🤝', desc: 'Need a spot?' },
};

const MOCK_USERS = [
  {
    id: '1', name: 'Alex R.', age: 27, avatar: '🏋️',
    bio: 'Powerlifting addict. Always at the squat rack.',
    gym: 'Iron Temple Fitness', schedule: 'Mon-Fri 6AM',
    interests: ['Powerlifting', 'Nutrition', 'CrossFit'],
    verified: true, distance: '0.2 mi',
  },
  {
    id: '2', name: 'Jordan T.', age: 24, avatar: '🏃',
    bio: 'Marathon runner getting into strength training. Looking for tips!',
    gym: 'Iron Temple Fitness', schedule: 'Tue-Sat 7PM',
    interests: ['Running', 'HIIT', 'Yoga'],
    verified: true, distance: '0.1 mi',
  },
  {
    id: '3', name: 'Sam K.', age: 30, avatar: '💪',
    bio: 'Bodybuilding competitor. Let\'s push each other to the limit.',
    gym: 'Iron Temple Fitness', schedule: 'Daily 5AM',
    interests: ['Bodybuilding', 'Meal Prep', 'Posing'],
    verified: false, distance: '0.3 mi',
  },
  {
    id: '4', name: 'Casey M.', age: 22, avatar: '✨',
    bio: 'New to the gym world. Could use a friendly face!',
    gym: 'Iron Temple Fitness', schedule: 'Mon-Wed-Fri 12PM',
    interests: ['Beginner Lifting', 'Cardio', 'Flexibility'],
    verified: true, distance: '0.5 mi',
  },
  {
    id: '5', name: 'Morgan L.', age: 29, avatar: '🧘',
    bio: 'Functional fitness enthusiast. Kettlebells are life.',
    gym: 'Iron Temple Fitness', schedule: 'Daily 6PM',
    interests: ['Kettlebells', 'Mobility', 'Functional Training'],
    verified: true, distance: '0.4 mi',
  },
  {
    id: '6', name: 'Taylor B.', age: 26, avatar: '🥊',
    bio: 'Boxing and HIIT lover. Always up for a challenge.',
    gym: 'Iron Temple Fitness', schedule: 'Mon-Sat 8AM',
    interests: ['Boxing', 'HIIT', 'Jump Rope'],
    verified: true, distance: '0.1 mi',
  },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'crush', fromName: 'Someone', anonymous: true, time: '2 min ago', responded: false },
  { id: '2', type: 'buddy', fromName: 'Jordan T.', anonymous: false, time: '1 hr ago', responded: false },
  { id: '3', type: 'advisor', fromName: 'Someone', anonymous: true, time: '3 hr ago', responded: true },
];

const MY_PROFILE = {
  id: '99', name: 'You', age: 25, avatar: '🔥',
  bio: 'Fitness journey in progress. Let\'s connect!',
  gym: 'Iron Temple Fitness', schedule: 'Mon-Fri 6PM',
  interests: ['Strength Training', 'Running', 'Yoga'],
  verified: true,
};

// Components

function GradientBG({ children, style }) {
  return (
    <View style={[{ backgroundColor: COLORS.bg, flex: 1 }, style]}>
      <View style={styles.gradientOverlay} />
      {children}
    </View>
  );
}

function Badge({ text, color, small }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }, small && { paddingHorizontal: 8, paddingVertical: 2 }]}>
      <Text style={[styles.badgeText, { color }, small && { fontSize: 10 }]}>{text}</Text>
    </View>
  );
}

function ConnectionButton({ type, onPress, selected }) {
  const conn = CONNECTION_TYPES[type];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.connectionBtn,
        { borderColor: conn.color + '44' },
        selected && { backgroundColor: conn.color + '33', borderColor: conn.color },
      ]}
    >
      <Text style={{ fontSize: 20 }}>{conn.icon}</Text>
      <Text style={[styles.connectionBtnLabel, { color: selected ? conn.color : COLORS.textDim }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function ProfileCard({ user, onPress }) {
  return (
    <TouchableOpacity style={styles.profileCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.profileCardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.avatar}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.profileName}>{user.name}</Text>
            {user.verified && <Text style={{ marginLeft: 4 }}>✓</Text>}
          </View>
          <Text style={styles.profileMeta}>{user.age} • {user.distance}</Text>
        </View>
        <View style={styles.activeIndicator} />
      </View>
      <Text style={styles.profileBio} numberOfLines={2}>{user.bio}</Text>
      <View style={styles.interestRow}>
        {user.interests.slice(0, 3).map((interest, i) => (
          <Badge key={i} text={interest} color={COLORS.accentAlt} small />
        ))}
      </View>
      <View style={styles.profileCardFooter}>
        <Text style={styles.scheduleText}>🕐 {user.schedule}</Text>
        <Text style={styles.gymText}>📍 {user.gym}</Text>
      </View>
    </TouchableOpacity>
  );
}

function NotificationCard({ notification, onRespond }) {
  const conn = CONNECTION_TYPES[notification.type];
  return (
    <View style={[styles.notifCard, { borderLeftColor: conn.color, borderLeftWidth: 3 }]}>
      <View style={styles.notifHeader}>
        <Text style={{ fontSize: 24 }}>{conn.icon}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.notifTitle}>
            {notification.anonymous ? 'Someone' : notification.fromName} marked you as their {conn.label}
          </Text>
          <Text style={styles.notifTime}>{notification.time} {notification.anonymous ? '• Anonymous' : ''}</Text>
        </View>
      </View>
      {!notification.responded && notification.type === 'crush' && (
        <View style={styles.notifActions}>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: conn.color + '22' }]}
            onPress={() => onRespond(notification.id, 'mutual')}
          >
            <Text style={[styles.notifBtnText, { color: conn.color }]}>💕 Crush Too!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: COLORS.cardLight }]}
            onPress={() => onRespond(notification.id, 'ignore')}
          >
            <Text style={[styles.notifBtnText, { color: COLORS.textDim }]}>Leave it</Text>
          </TouchableOpacity>
        </View>
      )}
      {!notification.responded && notification.type !== 'crush' && (
        <View style={styles.notifActions}>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: conn.color + '22' }]}
            onPress={() => onRespond(notification.id, 'accept')}
          >
            <Text style={[styles.notifBtnText, { color: conn.color }]}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: COLORS.cardLight }]}
            onPress={() => onRespond(notification.id, 'decline')}
          >
            <Text style={[styles.notifBtnText, { color: COLORS.textDim }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {notification.responded && (
        <Text style={styles.respondedText}>✓ Responded</Text>
      )}
    </View>
  );
}

// Screens

function HomeScreen({ onViewProfile, notifications, onRespondNotif }) {
  const unread = notifications.filter(n => !n.responded).length;
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.logoText}>GymLink</Text>
          <Text style={styles.logoSub}>Iron Temple Fitness</Text>
        </View>
        <View style={styles.headerRight}>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>24</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
        <View style={[styles.statBox, { borderColor: COLORS.crush + '44' }]}>
          <Text style={[styles.statNum, { color: COLORS.crush }]}>3</Text>
          <Text style={styles.statLabel}>Crushes</Text>
        </View>
        <View style={[styles.statBox, { borderColor: COLORS.buddy + '44' }]}>
          <Text style={[styles.statNum, { color: COLORS.buddy }]}>7</Text>
          <Text style={styles.statLabel}>Buddies</Text>
        </View>
      </View>

      {unread > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 New Activity</Text>
          {notifications.filter(n => !n.responded).map(n => (
            <NotificationCard key={n.id} notification={n} onRespond={onRespondNotif} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People at Your Gym</Text>
        {MOCK_USERS.map(user => (
          <ProfileCard key={user.id} user={user} onPress={() => onViewProfile(user)} />
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function ProfileDetailScreen({ user, onBack, onConnect }) {
  const [selectedType, setSelectedType] = useState(null);
  const [anonymous, setAnonymous] = useState(true);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!selectedType) {
      Alert.alert('Choose a connection type', 'Pick how you want to connect with ' + user.name);
      return;
    }
    onConnect(user.id, selectedType, anonymous);
    setSent(true);
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.detailHeader}>
        <View style={styles.detailAvatar}>
          <Text style={{ fontSize: 64 }}>{user.avatar}</Text>
        </View>
        <Text style={styles.detailName}>{user.name} {user.verified ? '✓' : ''}</Text>
        <Text style={styles.detailMeta}>{user.age} • {user.distance} away</Text>
        <Text style={styles.detailGym}>📍 {user.gym}</Text>
        <Text style={styles.detailSchedule}>🕐 {user.schedule}</Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>About</Text>
        <Text style={styles.detailBio}>{user.bio}</Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Interests</Text>
        <View style={styles.interestRow}>
          {user.interests.map((interest, i) => (
            <Badge key={i} text={interest} color={COLORS.accentAlt} />
          ))}
        </View>
      </View>

      {!sent ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Connect with {user.name.split(' ')[0]}</Text>
          <View style={styles.connectionGrid}>
            {Object.keys(CONNECTION_TYPES).map(type => (
              <ConnectionButton
                key={type}
                type={type}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </View>

          {selectedType === 'crush' && (
            <TouchableOpacity
              style={styles.anonToggle}
              onPress={() => setAnonymous(!anonymous)}
            >
              <View style={[styles.anonCheck, anonymous && styles.anonCheckActive]}>
                {anonymous && <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={styles.anonLabel}>Stay anonymous</Text>
              <Text style={styles.anonDesc}>They won't see your name</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: selectedType ? CONNECTION_TYPES[selectedType].color : COLORS.border },
            ]}
            onPress={handleSend}
          >
            <Text style={styles.sendBtnText}>
              {selectedType ? `Send ${CONNECTION_TYPES[selectedType].label}` : 'Choose a connection type'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sentBox}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={styles.sentTitle}>Sent!</Text>
          <Text style={styles.sentDesc}>
            {anonymous && selectedType === 'crush'
              ? `${user.name.split(' ')[0]} will receive an anonymous notification`
              : `${user.name.split(' ')[0]} will be notified`}
          </Text>
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function ActivityScreen({ notifications, onRespond }) {
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Activity</Text>
      <Text style={styles.screenSub}>Your connections and notifications</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>
        {notifications.map(n => (
          <NotificationCard key={n.id} notification={n} onRespond={onRespond} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Connections</Text>
        <View style={styles.connectionSummary}>
          {Object.entries(CONNECTION_TYPES).map(([type, info]) => (
            <View key={type} style={[styles.connSummaryItem, { borderColor: info.color + '33' }]}>
              <Text style={{ fontSize: 24 }}>{info.icon}</Text>
              <Text style={[styles.connSummaryNum, { color: info.color }]}>
                {type === 'crush' ? 3 : type === 'buddy' ? 7 : type === 'advisor' ? 2 : 4}
              </Text>
              <Text style={styles.connSummaryLabel}>{info.label.split(' ')[0]} {info.label.split(' ')[1]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MyProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(MY_PROFILE.bio);

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>My Profile</Text>

      <View style={styles.myProfileCard}>
        <View style={styles.myAvatar}>
          <Text style={{ fontSize: 64 }}>{MY_PROFILE.avatar}</Text>
        </View>
        <Text style={styles.myName}>{MY_PROFILE.name}</Text>
        <Text style={styles.myMeta}>{MY_PROFILE.age} • {MY_PROFILE.gym}</Text>
        {MY_PROFILE.verified && <Badge text="✓ Verified" color={COLORS.green} />}
      </View>

      <View style={styles.detailSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.detailSectionTitle}>Bio</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={{ color: COLORS.accent }}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholderTextColor={COLORS.textMuted}
          />
        ) : (
          <Text style={styles.detailBio}>{bio}</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Schedule</Text>
        <Text style={styles.detailBio}>🕐 {MY_PROFILE.schedule}</Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Interests</Text>
        <View style={styles.interestRow}>
          {MY_PROFILE.interests.map((interest, i) => (
            <Badge key={i} text={interest} color={COLORS.accentAlt} />
          ))}
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Privacy Settings</Text>
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Show my profile to others</Text>
          <View style={[styles.toggle, styles.toggleOn]}>
            <View style={[styles.toggleDot, styles.toggleDotOn]} />
          </View>
        </View>
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Allow crush notifications</Text>
          <View style={[styles.toggle, styles.toggleOn]}>
            <View style={[styles.toggleDot, styles.toggleDotOn]} />
          </View>
        </View>
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Show when I'm at the gym</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleDot} />
          </View>
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Main App

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedUser, setSelectedUser] = useState(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setActiveTab('detail');
  };

  const handleBack = () => {
    setSelectedUser(null);
    setActiveTab('home');
  };

  const handleConnect = (userId, type, anonymous) => {
    // In a real app, this would send to a server
    console.log(`Connected with ${userId} as ${type}, anonymous: ${anonymous}`);
  };

  const handleRespondNotif = (notifId, response) => {
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, responded: true } : n)
    );
    if (response === 'mutual') {
      Alert.alert('It\'s a match! 💕', 'You both have a gym crush on each other!');
    }
  };

  const renderScreen = () => {
    if (activeTab === 'detail' && selectedUser) {
      return (
        <ProfileDetailScreen
          user={selectedUser}
          onBack={handleBack}
          onConnect={handleConnect}
        />
      );
    }
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onViewProfile={handleViewProfile}
            notifications={notifications}
            onRespondNotif={handleRespondNotif}
          />
        );
      case 'activity':
        return <ActivityScreen notifications={notifications} onRespond={handleRespondNotif} />;
      case 'profile':
        return <MyProfileScreen />;
      default:
        return null;
    }
  };

  return (
    <GradientBG>
      <StatusBar barStyle="light-content" />
      {renderScreen()}

      {activeTab !== 'detail' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabActive]}>🏠</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabIcon, activeTab === 'activity' && styles.tabActive]}>🔔</Text>
            <Text style={[styles.tabLabel, activeTab === 'activity' && styles.tabLabelActive]}>Activity</Text>
            {notifications.filter(n => !n.responded).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{notifications.filter(n => !n.responded).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabActive]}>👤</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </GradientBG>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  screen: {
    flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  homeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
  logoText: {
    fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -1,
  },
  logoSub: {
    fontSize: 13, color: COLORS.textDim, marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row', alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: COLORS.crush, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  unreadText: {
    color: '#FFF', fontSize: 12, fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statNum: {
    fontSize: 28, fontWeight: '800', color: COLORS.text,
  },
  statLabel: {
    fontSize: 11, color: COLORS.textDim, marginTop: 4, fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12,
  },
  profileCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  profileCardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  avatarContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.cardLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  profileName: {
    fontSize: 17, fontWeight: '700', color: COLORS.text,
  },
  profileMeta: {
    fontSize: 13, color: COLORS.textDim, marginTop: 2,
  },
  activeIndicator: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green,
  },
  profileBio: {
    fontSize: 14, color: COLORS.textDim, lineHeight: 20, marginBottom: 10,
  },
  interestRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  badgeText: {
    fontSize: 12, fontWeight: '600',
  },
  profileCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
  },
  scheduleText: {
    fontSize: 12, color: COLORS.textMuted,
  },
  gymText: {
    fontSize: 12, color: COLORS.textMuted,
  },
  // Notification card
  notifCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20,
  },
  notifTime: {
    fontSize: 12, color: COLORS.textMuted, marginTop: 4,
  },
  notifActions: {
    flexDirection: 'row', gap: 10, marginTop: 14,
  },
  notifBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
  },
  notifBtnText: {
    fontSize: 14, fontWeight: '600',
  },
  respondedText: {
    color: COLORS.green, fontSize: 13, marginTop: 10, fontWeight: '600',
  },
  // Detail screen
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16, color: COLORS.accent, fontWeight: '600',
  },
  detailHeader: {
    alignItems: 'center', marginBottom: 24,
  },
  detailAvatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: COLORS.accent + '44',
  },
  detailName: {
    fontSize: 28, fontWeight: '800', color: COLORS.text,
  },
  detailMeta: {
    fontSize: 15, color: COLORS.textDim, marginTop: 4,
  },
  detailGym: {
    fontSize: 14, color: COLORS.textMuted, marginTop: 8,
  },
  detailSchedule: {
    fontSize: 14, color: COLORS.textMuted, marginTop: 4,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10,
  },
  detailBio: {
    fontSize: 15, color: COLORS.textDim, lineHeight: 22,
  },
  connectionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  connectionBtn: {
    width: (width - 60) / 2, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  connectionBtnLabel: {
    fontSize: 13, fontWeight: '600', marginTop: 6,
  },
  anonToggle: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 14,
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  anonCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.textMuted,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  anonCheckActive: {
    backgroundColor: COLORS.accent, borderColor: COLORS.accent,
  },
  anonLabel: {
    fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1,
  },
  anonDesc: {
    fontSize: 12, color: COLORS.textMuted,
  },
  sendBtn: {
    marginTop: 20, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
  },
  sentBox: {
    alignItems: 'center', padding: 32, backgroundColor: COLORS.card,
    borderRadius: 20, marginTop: 10,
  },
  sentTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 12,
  },
  sentDesc: {
    fontSize: 14, color: COLORS.textDim, marginTop: 8, textAlign: 'center',
  },
  // Activity screen
  screenTitle: {
    fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 4,
  },
  screenSub: {
    fontSize: 14, color: COLORS.textDim, marginBottom: 24,
  },
  connectionSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  connSummaryItem: {
    width: (width - 60) / 2, backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1,
  },
  connSummaryNum: {
    fontSize: 28, fontWeight: '800', marginTop: 8,
  },
  connSummaryLabel: {
    fontSize: 12, color: COLORS.textDim, marginTop: 4, fontWeight: '600',
  },
  // Profile screen
  myProfileCard: {
    alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 20,
    padding: 24, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  myAvatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.cardLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  myName: {
    fontSize: 24, fontWeight: '800', color: COLORS.text,
  },
  myMeta: {
    fontSize: 14, color: COLORS.textDim, marginTop: 4, marginBottom: 10,
  },
  bioInput: {
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 14,
    color: COLORS.text, fontSize: 15, minHeight: 80, borderWidth: 1,
    borderColor: COLORS.border, textAlignVertical: 'top',
  },
  privacyOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  privacyLabel: {
    fontSize: 15, color: COLORS.text,
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: COLORS.cardLight,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: COLORS.accent + '44',
  },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textMuted,
  },
  toggleDotOn: {
    backgroundColor: COLORS.accent, alignSelf: 'flex-end',
  },
  // Tab bar
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: COLORS.card + 'F5',
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10, paddingTop: 10,
  },
  tab: {
    flex: 1, alignItems: 'center', position: 'relative',
  },
  tabIcon: {
    fontSize: 22, opacity: 0.5,
  },
  tabActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
  tabBadge: {
    position: 'absolute', top: -4, right: '25%', backgroundColor: COLORS.crush,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  tabBadgeText: {
    color: '#FFF', fontSize: 10, fontWeight: '700',
  },
});
