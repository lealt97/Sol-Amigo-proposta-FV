import { RegisterForm } from '../components/auth/RegisterForm';

export function Register() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-brand-gray">
      <RegisterForm />
    </div>
  );
}
