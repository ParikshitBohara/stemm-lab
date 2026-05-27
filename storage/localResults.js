
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("stemm_lab.db");

export function setupLocalResultsTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS local_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activityName TEXT NOT NULL,
      teamName TEXT,
      score INTEGER,
      resultData TEXT,
      createdAt TEXT NOT NULL
    );
  `);
}

export function saveLocalResult({ activityName, teamName, score, resultData }) {
  setupLocalResultsTable();

  db.runSync(
    `INSERT INTO local_results 
    (activityName, teamName, score, resultData, createdAt) 
    VALUES (?, ?, ?, ?, ?)`,
    [
      activityName,
      teamName || "",
      score || 0,
      JSON.stringify(resultData || {}),
      new Date().toISOString(),
    ],
  );
}

export function getLocalResults() {
  setupLocalResultsTable();

  return db.getAllSync(`
    SELECT * FROM local_results
    ORDER BY id DESC;
  `);
}

export function clearLocalResults() {
  setupLocalResultsTable();

  db.runSync(`DELETE FROM local_results;`);
}