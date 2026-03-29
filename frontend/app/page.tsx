import { redirect } from "next/navigation";

// Next.js App Router: redirect from / based on auth state.
// Since auth is client-side (localStorage), we default to /dashboard
// which itself reads localStorage and redirects to /login if unauthenticated.
export default function RootPage() {
  redirect("/dashboard");
}
