import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getActiveTeam } from "./getActiveTeam";
import { auth, db } from "./firebaseConfig";

export const saveActivityResult = async ({
  activityId,
  activityName,
  pointsAwarded,
  resultSummary,
  reflection,
  evidenceSummary,
}) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in before submitting an activity.");
  }

  if (!activityId) {
    throw new Error(
      "Activity result could not be submitted without an activity id.",
    );
  }

  const activeTeam = await getActiveTeam();
  const savedPoints = Number(pointsAwarded) || 0;
  const resultId = `${activeTeam.teamId}_${activityId}`;
  const resultRef = doc(db, "results", resultId);

  await setDoc(
    resultRef,
    {
      activityId,
      activityName,
      teamId: activeTeam.teamId,
      teamName: activeTeam.teamName || "",
      userId: currentUser.uid,
      pointsAwarded: savedPoints,
      score: savedPoints,
      resultSummary: resultSummary || {},
      reflection: reflection || "",
      evidenceSummary: evidenceSummary || {},
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    resultId,
    teamId: activeTeam.teamId,
    teamName: activeTeam.teamName || "",
    pointsAwarded: savedPoints,
  };
};
