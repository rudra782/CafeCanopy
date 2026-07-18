import { Coffee } from 'lucide-react';

type HomeNavigationProps = {
  isAuthenticated: boolean;
  userName?: string;
  userRole?: string;
  onEnter: () => void;
  onSignIn: () => void;
  onRegister: () => void;
  onSignOut: () => void;
  onWorkflow: () => void;
};

export default function HomeNavigation({
  isAuthenticated,
  userName,
  userRole,
  onEnter,
  onSignIn,
  onRegister,
  onSignOut,
  onWorkflow,
}: HomeNavigationProps) {
  return (
    <header className="home-nav" aria-label="CafeCanopy homepage navigation">
      <a className="skip-link" href="#home-main">Skip to homepage content</a>
      <div className="home-nav__inner">
        <a className="home-brand" href="#hero" aria-label="CafeCanopy home">
          <span className="home-brand__mark" aria-hidden="true"><Coffee size={20} /></span>
          <span>
            <strong>CafeCanopy</strong>
            <small>Smart café flow</small>
          </span>
        </a>

        <nav className="home-nav__links" aria-label="Homepage sections">
          <a href="#hero">Features</a>
          <button type="button" onClick={onWorkflow}>Workflow</button>
          <a href="#phase-one-proof">About</a>
        </nav>

        <div className="home-nav__actions" aria-label="Account actions">
          {isAuthenticated ? (
            <>
              <span className="home-nav__user">{userName} <em>{userRole}</em></span>
              <button className="home-nav__ghost" type="button" onClick={onSignOut}>Sign Out</button>
              <button className="home-nav__cta" type="button" onClick={onEnter}>Workspace</button>
            </>
          ) : (
            <>
              <button className="home-nav__ghost" type="button" onClick={onSignIn}>Sign In</button>
              <button className="home-nav__ghost home-nav__ghost--register" type="button" onClick={onRegister}>Register Cafe</button>
              <button className="home-nav__cta" type="button" onClick={onEnter}>Enter App</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
