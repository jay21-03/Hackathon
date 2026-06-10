import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useEffect, useState } from "react";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (disabled || !mounted) {
    return null;
  }

  return (
    <GoogleLogin
      onSuccess={async (response: CredentialResponse) => {
        if (!response.credential) {
          onError?.();
          return;
        }
        await onSuccess(response.credential);
      }}
      onError={() => onError?.()}
      useOneTap={false}
      auto_select={false}
    />
  );
}
