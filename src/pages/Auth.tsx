import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { localAuth } from '@/lib/localDb';
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
  const { signIn, signUp } = useAuth();
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [pin, setPin] = useState('');
  const [gender, setGender] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if account exists on mount
  useEffect(() => {
    localAuth.getUser().then(user => {
      setHasAccount(!!user);
      setIsLogin(!!user); // If account exists, default to login
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pinSchema = z.string().min(4, 'PIN must be at least 4 characters');
    const validation = pinSchema.safeParse(pin);
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
        const { error } = await signIn(pin);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('auth.welcomeBack'));
        navigate('/');
      } else {
        const { error } = await signUp(pin, gender);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('auth.accountCreated'));
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasAccount === null) {
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
          <p className="text-xs text-muted-foreground mt-2">🔒 All data stored locally on your device</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {hasAccount ? (
            // Login only — account exists
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter your PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10 pr-10"
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

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? t('auth.pleaseWait') : (
                  <>{t('auth.signIn')}<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          ) : (
            // Create account — no account exists
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Create a local PIN to protect your data
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="pin">Choose a PIN (min 4 characters)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10 pr-10"
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

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? t('auth.pleaseWait') : (
                  <>{t('auth.createAccount') || 'Create Account'}<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
