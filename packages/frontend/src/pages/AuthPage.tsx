import { Box, Link, Stack } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { login, signup } from "../api/auth";
import { useAuthStore } from "../state/auth";
export default function AuthPage() {
  const [params] = useSearchParams(); const mode = params.get("mode") === "signup" ? "signup" : "login";
  const setAuth = useAuthStore((s) => s.setAuth); const navigate = useNavigate();
  const submit = async (email: string, password: string) => { const result = mode === "signup" ? await signup(email, password) : await login(email, password); setAuth(result.token, result.userId); navigate("/"); };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 3,
      }}
    >
      <AuthForm mode={mode} onSubmit={submit} />
      <Stack mt={2} alignItems="center">
        {mode === "login"
          ? <Link href="/auth?mode=signup">Need an account? Sign up</Link>
          : <Link href="/auth?mode=login">Already have an account? Log in</Link>}
      </Stack>
    </Box>
  );
}
