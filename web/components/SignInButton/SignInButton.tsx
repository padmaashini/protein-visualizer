"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider/AuthProvider";
import styles from "./SignInButton.module.css";

export default function SignInButton() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.wrap}>
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        text="signin_with"
        onSuccess={async (response) => {
          setError(null);
          if (!response.credential) {
            setError("No credential returned from Google");
            return;
          }
          try {
            await signIn(response.credential);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed");
          }
        }}
        onError={() => setError("Google sign-in failed")}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
