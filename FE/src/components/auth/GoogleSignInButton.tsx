import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  if (disabled) {
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
