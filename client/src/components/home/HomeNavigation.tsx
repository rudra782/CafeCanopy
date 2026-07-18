import { Coffee } from 'lucide-react';

type HomeNavigationProps = {
  onEnter: () => void;
  onWorkflow: () => void;
};

export default function HomeNavigation({ onEnter, onWorkflow }: HomeNavigationProps) {
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

        <button className="home-nav__cta" type="button" onClick={onEnter}>Enter App</button>
      </div>
    </header>
  );
}
