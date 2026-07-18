import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { authAPI } from '../lib/api';
import CinematicExperience from '../components/home/CinematicExperience';
import HomeNavigation from '../components/home/HomeNavigation';
import { useReducedMotion } from '../hooks/useReducedMotion';
import '../styles/cafe-home.css';

export default function GetStartedPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const reducedMotion = useReducedMotion();

  const getPortalRedirectPath = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.role === 'kitchen') return '/kds';
    if (user.role === 'employee') return '/pos';
    return '/admin/dashboard';
  };

  const enterCafeCanopy = () => navigate(getPortalRedirectPath());
  const signIn = () => navigate('/login');
  const registerCafe = () => navigate('/register');

  const signOut = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try {
      await authAPI.logout(refreshToken);
    } catch {
      // Preserve the previous homepage behavior: local sign-out still succeeds if the network logout fails.
    }
    clearAuth();
    toast.success('Signed out successfully');
  };

  const scrollToWorkflow = () => {
    document.getElementById('phase-one-proof')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="home-page">
      <HomeNavigation
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        userRole={user?.role}
        onEnter={enterCafeCanopy}
        onSignIn={signIn}
        onRegister={registerCafe}
        onSignOut={signOut}
        onWorkflow={scrollToWorkflow}
      />
      <main id="home-main" tabIndex={-1}>
        <CinematicExperience onEnter={enterCafeCanopy} onWorkflow={scrollToWorkflow} />

        <section id="phase-one-proof" className="home-phase-one-proof" aria-labelledby="phase-one-title">
          <h2 id="phase-one-title">A cinematic beginning for a connected café system.</h2>
          <article>
            <h3>Accessible first</h3>
            <p>The hero message, navigation and calls to action remain real HTML, readable without relying on the visual layer.</p>
          </article>
          <article>
            <h3>Ready for the reveal</h3>
            <p>The cup settles into a rightward motion path that prepares Phase 2 without showing the dashboard yet.</p>
          </article>
          <article>
            <h3>Respectful motion</h3>
            <p>Reduced-motion and WebGL fallback states keep the homepage understandable on constrained devices.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
