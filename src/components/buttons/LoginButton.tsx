import { SignInButton } from '@clerk/clerk-react';

export default function LoginButton() {
  return (
    <SignInButton>
      <button className="button text-white shadow-solid">
        <div className="inline-block bg-clay-700">
          <span>Log in</span>
        </div>
      </button>
    </SignInButton>
  );
}
