import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import CinematicExperience from '../components/home/CinematicExperience';
import HomeNavigation from '../components/home/HomeNavigation';
import '../styles/cafe-home.css';

export default function GetStartedPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const getPortalRedirectPath = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.role === 'kitchen') return '/kds';
    if (user.role === 'employee') return '/pos';
    return '/admin/dashboard';
  };

  const enterCafeCanopy = () => navigate(getPortalRedirectPath());

  const scrollToWorkflow = () => {
    document.getElementById('workflow-preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="home-page">
      <HomeNavigation onEnter={enterCafeCanopy} onWorkflow={scrollToWorkflow} />
      <main id="home-main">
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
