import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingView from "@/components/LandingView";

export default async function Page() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(
    (c) =>
      c.name.startsWith("sb-") &&
      (c.name.includes("-auth-token") || c.name.includes("access-token")) &&
      c.value &&
      c.value.trim() !== ""
  );

  // If user is already authenticated, redirect straight to /dashboard on the server
  // to prevent any landing page flash
  if (hasAuthCookie) {
    redirect("/dashboard");
  }

  return <LandingView />;
}
