import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const saveActivityResult = async ({
  teamId,
  teamName,
  activityName,
  resultData,
  reflection,
  score,
}) => {
  const currentUser = auth.currentUser;

  return await addDoc(collection(db, "results"), {
    teamId: teamId || "",
    teamName: teamName || "",
    activityName,
    resultData,
    reflection: reflection || "",
    score: score || 0,
    createdBy: currentUser ? currentUser.uid : "unknown",
    createdAt: new Date().toISOString(),
  });
};