import { redirect } from "next/navigation";

export default function HistoryRedirect() {
  redirect("/statistics?tab=history");
}
