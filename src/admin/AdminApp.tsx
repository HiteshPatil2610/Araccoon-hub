import { Outlet } from 'react-router';
import { AuthProvider } from './auth';

/** Everything under /admin lives in this lazily loaded chunk. */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
