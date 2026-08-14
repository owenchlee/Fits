import { redirect } from "next/navigation";

export default function PercentileRedirect() {
  redirect("/statistics?tab=overview");
}
