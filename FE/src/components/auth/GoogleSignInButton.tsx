import { useEffect, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: () => void;
  disabled?: boolean;
}

let googleSignInMounted = false;

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!googleSignInMounted) {
      googleSignInMounted = true;
    }
    setVisible(true);
  }, []);

  if (!visible || disabled) {
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
    />
  );
}
