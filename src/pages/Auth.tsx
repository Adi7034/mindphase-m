import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { z } from 'zod';
import logo from '@/assets/logo.ico';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading: authLoading, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPassword) {
      const emailSchema = z.string().email('Please enter a valid email');
      const validation = emailSchema.safeParse(email);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Password reset email sent! Check your inbox.');
        setIsForgotPassword(false);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const schema = z.object({
      email: z.string().email('Please enter a valid email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    });
    const validation = schema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!isLogin && !gender) {
      toast.error('Please select your gender');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.toLowerCase().includes('invalid login')) {
            toast.error('Incorrect email or password. If you forgot it, use "Forgot password?" below.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success(t('auth.welcomeBack'));
        navigate('/');
      } else {
        const { error } = await signUp(email, password, gender);
        if (error) {
          if (error.message?.toLowerCase().includes('already')) {
            toast.error('This email is already registered. Switch to Sign In, or use "Forgot password?" to reset it.');
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created! Please check your email to verify.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSession = async () => {
    try {
      // Clear all supabase auth keys from localStorage to recover from stuck tokens
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
        .forEach((k) => localStorage.removeItem(k));
      toast.success('Session cleared. Try signing in again.');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error('Could not clear session');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-purple-50 flex items-center justify-center">
        <img src={logo} alt="MindPhase-M Logo" className="w-10 h-10 rounded-full shadow-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <img src={logo} alt="MindPhase-M Logo" className="w-16 h-16 mx-auto mb-4 rounded-full shadow-lg" />
          <h1 className="text-2xl font-bold text-foreground">{t('app.name')}</h1>
          <p className="text-muted-foreground">{t('app.tagline')}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Enter your email to receive a password reset link
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? t('auth.pleaseWait') : 'Send Reset Link'}
              </Button>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={isLogin ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsLogin(true)}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={!isLogin ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="gender">{t('auth.gender') || 'Gender'}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder={t('auth.selectGender') || 'Select your gender'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">{t('auth.female') || 'Female'}</SelectItem>
                        <SelectItem value="male">{t('auth.male') || 'Male'}</SelectItem>
                        <SelectItem value="other">{t('auth.other') || 'Other'}</SelectItem>
                        <SelectItem value="prefer_not_to_say">{t('auth.preferNotToSay') || 'Prefer not to say'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? t('auth.pleaseWait') : (
                  <>{isLogin ? t('auth.signIn') : (t('auth.createAccount') || 'Create Account')}<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="button"
                onClick={handleClearSession}
                className="w-full text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                Having trouble signing in? Clear session & retry
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
