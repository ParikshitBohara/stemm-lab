import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const getActiveTeam = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in before submitting an activity.");
  }

  const teamsQuery = query(
    collection(db, "teams"),
    where("createdBy", "==", currentUser.uid),
    limit(1),
  );

  const querySnapshot = await getDocs(teamsQuery);

  if (querySnapshot.empty) {
    throw new Error("Set up your team before submitting an activity.");
  }

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();

  return {
    teamId: teamDoc.id,
    teamName: teamData.teamName,
    members: teamData.members,
    yearLevel: teamData.yearLevel,
    teamCode: teamData.teamCode,
  };
};
