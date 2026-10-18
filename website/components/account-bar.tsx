import Link from "next/link";
import { signedIn } from "@/lib/server/backend";
import { logout } from "@/app/login/actions";
export async function AccountBar() {
  const personal = await signedIn();
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "flex-end",
        padding: "8px 20px",
        alignItems: "center",
      }}
    >
      {personal ? (
        <>
          <Link href="/review">Collector &amp; needs checking</Link>
          <form action={logout}>
            <button className="jr-btn jr-secondary">Sign out</button>
          </form>
        </>
      ) : (
        <Link href="/login">
          Sign in for matches, saved jobs and Applied tracking
        </Link>
      )}
    </div>
  );
}
