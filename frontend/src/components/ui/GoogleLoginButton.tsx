// components/ui/GoogleLoginButton.tsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface GoogleLoginButtonProps {
  onLogin: (user: GoogleUser) => void;
}

export default function GoogleLoginButton({ onLogin }: GoogleLoginButtonProps) {
  const handleSuccess = (response: any) => {
    try {
      const user: GoogleUser = jwtDecode(response.credential);
      onLogin(user);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_blue"
        shape="pill"
        text="continue_with"
        size="large"
        width="250"
        // hosted_domain="uespi.br"
      />
    </div>
  );
}