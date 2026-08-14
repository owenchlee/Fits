import { redirect } from "next/navigation";

export default function ProgressRedirect() {
  redirect("/statistics?tab=trends");
}
