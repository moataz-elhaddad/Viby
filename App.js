
import React, { useState, useEffect } from "react";
import { Text, View, Button, StyleSheet, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const moods = ["Happy", "Sad", "Afraid", "Angry", "Surprised", "Disgusted"];

export default function App() {
  const [name, setName] = useState("");
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem("username");
      const storedMode = await AsyncStorage.getItem("darkMode");
      if (storedName) setName(storedName);
      if (storedMode) setDarkMode(storedMode === "true");
    };
    loadData();
  }, []);

  const toggleMood = (mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={styles.title}>👋 Hello {name || "Friend"}!</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>
      {moods.map((mood) => (
        <Button
          key={mood}
          title={mood}
          onPress={() => toggleMood(mood)}
          color={selectedMoods.includes(mood) ? "green" : "gray"}
        />
      ))}
      <View style={styles.toggleContainer}>
        <Text style={{ color: darkMode ? "white" : "black" }}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={async (val) => {
            setDarkMode(val);
            await AsyncStorage.setItem("darkMode", val.toString());
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
});
