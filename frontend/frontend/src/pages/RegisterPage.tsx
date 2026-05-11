import { RegisterForm } from '@/components/auth/RegisterForm';
import { GraduationCap } from 'lucide-react';

export function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary mb-4">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground mt-1">
          Start transforming videos into lectures today
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
