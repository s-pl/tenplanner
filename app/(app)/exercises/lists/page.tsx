import { redirect } from "next/navigation";

export default function ExerciseListsRedirect() {
  redirect("/exercises?tab=favorites");
}
