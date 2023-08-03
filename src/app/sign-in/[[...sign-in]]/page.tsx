import { SignIn } from '@clerk/clerk-react';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn />
    </div>
  );
}
