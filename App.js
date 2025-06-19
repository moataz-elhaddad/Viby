
import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, FlatList, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_URL = 'https://viby-51668-default-rtdb.firebaseio.com/moods.json'; // Replace with your Firebase DB URL

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState([]);

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😨', label: 'Afraid' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😲', label: 'Surprised' },
    { emoji: '🤢', label: 'Disgusted' },
  ];

  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem('viby_user_name');
      const onboardingDone = await AsyncStorage.getItem('viby_onboarding_done');
      setSavedName(storedName);
      setShowOnboarding(onboardingDone !== 'true');
      fetchMoods();
    };
    loadData();
  }, []);

  const fetchMoods = async () => {
    try {
      const res = await fetch(FIREBASE_URL);
      const data = await res.json();
      if (data) {
        const loaded = Object.values(data).reverse();
        setEntries(loaded);
      }
    } catch (err) {
      console.error('Failed to fetch moods:', err);
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('viby_onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const saveName = async () => {
    if (name.trim().length > 0) {
      await AsyncStorage.setItem('viby_user_name', name);
      setSavedName(name);
    }
  };

  const toggleMood = (mood) => {
    if (selectedMoods.find((m) => m.label === mood.label)) {
      setSelectedMoods(selectedMoods.filter((m) => m.label !== mood.label));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const logMood = async () => {
    if (selectedMoods.length > 0) {
      const newEntry = {
        id: Date.now().toString(),
        name: savedName,
        moods: selectedMoods,
        note,
        date: new Date().toLocaleDateString(),
      };
      setEntries([newEntry, ...entries]);
      setSelectedMoods([]);
      setNote('');

      try {
        await fetch(FIREBASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      }
    }
  };

  const logout = async () => {
    Alert.alert("Reset Viby?", "This will erase your data and start over.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive", onPress: async () => {
          await AsyncStorage.clear();
          setSavedName(null);
          setName('');
          setShowOnboarding(true);
          setEntries([]);
          setSelectedMoods([]);
          setNote('');
        }
      }
    ]);
  };

  const styles = createStyles(darkMode);

  if (savedName === null) return <View style={styles.container}><Text style={styles.subtitle}>Loading...</Text></View>;

  if (showOnboarding) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌈 Welcome to Viby</Text>
        <Text style={styles.subtitle}>
          Track 6 emotions: 😊 😢 😨 😡 😲 🤢. Learn your patterns, reflect better.
        </Text>
        <TouchableOpacity style={styles.logButton} onPress={completeOnboarding}>
          <Text style={styles.logButtonText}>Let’s Start</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!savedName) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎉 What's your name?</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={darkMode ? "#aaa" : "#555"}
        />
        <TouchableOpacity style={styles.logButton} onPress={saveName}>
          <Text style={styles.logButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.funnyText}>🧠 Mood Decoder Activated!</Text>

      <View style={styles.switchRow}>
        <Text style={styles.subtitle}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>🔁 Log Out & Reset</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Hi, {savedName}! 👋</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      <View style={styles.moodRow}>
        {moods.map((m) => {
          const selected = selectedMoods.find((s) => s.label === m.label);
          return (
            <TouchableOpacity
              key={m.label}
              onPress={() => toggleMood(m)}
              style={[styles.moodButton, selected && styles.moodSelected]}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={styles.label}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        placeholder="Add a note (optional)"
        value={note}
        onChangeText={setNote}
        style={styles.input}
        placeholderTextColor={darkMode ? "#aaa" : "#555"}
        multiline
      />

      <TouchableOpacity style={styles.logButton} onPress={logMood}>
        <Text style={styles.logButtonText}>Log My Mood</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>📅 Mood History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.entryMood}>
              {item.date} – {item.moods.map((m) => `${m.emoji} ${m.label}`).join(', ')}
            </Text>
            {item.note ? <Text style={styles.entryNote}>📝 {item.note}</Text> : null}
          </View>
        )}
      />
    </ScrollView>
  );
}

const createStyles = (darkMode) => StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, backgroundColor: darkMode ? '#121212' : '#f0f4f8', flexGrow: 1 },
  funnyText: { fontSize: 20, textAlign: 'center', marginBottom: 10, color: darkMode ? '#ffda77' : '#6a4c93', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: darkMode ? '#fff' : '#4A4E69' },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 20, color: darkMode ? '#ccc' : '#22223B' },
  logout: { textAlign: 'center', marginBottom: 10, color: '#ff6b6b', fontWeight: 'bold', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 15 },
  moodButton: { alignItems: 'center', backgroundColor: darkMode ? '#2a2a2a' : '#fff', borderRadius: 12, padding: 10, margin: 6, width: 90, elevation: 2 },
  moodSelected: { backgroundColor: '#cde8f2', borderWidth: 2, borderColor: '#0077b6' },
  emoji: { fontSize: 26 }, label: { marginTop: 4, fontSize: 12, color: darkMode ? '#eee' : '#333' },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 12, backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000', marginBottom: 15 },
  logButton: { backgroundColor: '#0077b6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyTitle: { fontSize: 20, fontWeight: 'bold', color: darkMode ? '#fff' : '#4A4E69', marginBottom: 10 },
  entry: { backgroundColor: darkMode ? '#1e1e1e' : '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 1 },
  entryMood: { fontSize: 16, fontWeight: '600', color: darkMode ? '#fff' : '#000' },
  entryNote: { marginTop: 4, fontSize: 14, fontStyle: 'italic', color: darkMode ? '#aaa' : '#555' }
});