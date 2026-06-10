import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await login(email, password);

    setIsLoading(false);
    if (!res.success) {
      setError(res.message || "Failed to login. Check your credentials.");
    }
  };

  return (
    <Card className="w-full shadow-lg border-0 ring-1 ring-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
        <CardDescription>Enter your email below to login to your clinic</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-center p-2 bg-slate-50 rounded-md border border-slate-100">
            <Button 
              variant="outline" 
              size="sm" 
              type="button" 
              onClick={() => { setEmail('admin@clinic.com'); setPassword('password123'); }}
              className="text-xs h-8"
            >
              Test Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              type="button" 
              onClick={() => { setEmail('test@gmail.com'); setPassword('123456'); }}
              className="text-xs h-8"
            >
              Test Receptionist
            </Button>
          </div>
          {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@clinic.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
