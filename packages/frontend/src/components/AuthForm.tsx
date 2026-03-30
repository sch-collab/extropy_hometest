import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
interface Props { mode: "login" | "signup"; onSubmit: (email: string, password: string) => Promise<void>; }
export default function AuthForm({ mode, onSubmit }: Props) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(null); setLoading(true); try { await onSubmit(email, password); } catch (err) { setError(err instanceof Error ? err.message : "Request failed"); } finally { setLoading(false); } };
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 420 }}>
      <Typography variant="h4" mb={2}>
        {mode === "login" ? "Log in" : "Create account"}
      </Typography>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth inputProps={{ minLength: 6 }} />
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </Stack>
    </Box>
  );
}
