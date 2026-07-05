import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-brand-gray">
      <LoginForm />
    </div>
  );
}
