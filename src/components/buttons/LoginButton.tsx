import { api } from '../../../convex/_generated/api';
import { useSessionMutation } from '../../hooks/useServerSession';

export default function LoginButton() {
  // const logIn = useSessionMutation(api.auth.logIn);
  return (
    <button onClick={alert} className="button text-white shadow-solid">
      <div className="inline-block bg-clay-700">
        <span>Log in</span>
      </div>
    </button>
  );
}
