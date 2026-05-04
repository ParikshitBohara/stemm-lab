import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Filter } from "bad-words";

export default function TextFilter() {
  const [inputText, setInputText] = useState("");
  const [filteredText, setFilteredText] = useState("");
  const [warning, setWarning] = useState("");
  const [isFilterOn, setIsFilterOn] = useState(true);

  const filter = new Filter({placeHolder: '#'});
  filter.addWords("sucks","stupid","idiot","dumb");

  const handleFilter = () => {
    if (inputText.trim() === "") {
      setWarning("Please enter some text.");
      setFilteredText("");
      return;
    }

    if (!isFilterOn) {
      setFilteredText(inputText);
      setWarning("⚠️ Filter is turned OFF.");
      return;
    }

    const hasBadWords = filter.isProfane(inputText);
    const cleanText = filter.clean(inputText);

    setFilteredText(cleanText);

    if (hasBadWords) {
      setWarning("⚠️ Inappropriate content detected.");
    } else {
      setWarning("✅ Text is clean.");
    }
  };

  const handleClear = () => {
    setInputText("");
    setFilteredText("");
    setWarning("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Text Filter Feature</Text>

      <Text style={styles.description}>
        This prototype detects inappropriate words and filters student text
        before it is displayed.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your message..."
        value={inputText}
        onChangeText={setInputText}
        multiline
      />

      <Pressable
        style={styles.toggleButton}
        onPress={() => setIsFilterOn(!isFilterOn)}
      >
        <Text style={styles.buttonText}>
          {isFilterOn ? "Filter ON" : "Filter OFF"}
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleFilter}>
        <Text style={styles.buttonText}>Filter Text</Text>
      </Pressable>

      <Pressable style={styles.clearButton} onPress={handleClear}>
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>

      {warning !== "" && <Text style={styles.warning}>{warning}</Text>}

      <View style={styles.box}>
        <Text style={styles.label}>Original:</Text>
        <Text>{inputText || "No input yet"}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.label}>Filtered:</Text>
        <Text>{filteredText || "No output yet"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleButton: {
    backgroundColor: "#FF9500",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  clearText: {
    color: "#000",
  },
  warning: {
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  box: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
});