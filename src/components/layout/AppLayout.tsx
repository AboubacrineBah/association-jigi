import { useEffect, useRef, useState } from 'react';
import { Button, Offcanvas } from 'react-bootstrap';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';
import { ROLE_LABELS } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { DemoBanner } from '../ui/DemoBanner';
import { Logo } from '../ui/Logo';

/** Gabarit des vues connectées : bandeau démo, navigation selon le rôle, contenu principal. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // À chaque changement de vue, le focus passe au contenu (navigation clavier et lecteurs d'écran).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    setMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const tabs = items.filter((item) => item.mobileTab);
  const showNavigation = user.role !== 'donateur';

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#contenu"
        onClick={(event) => {
          // Le routage par hash réserve « # » : on déplace le focus sans changer l'adresse.
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Aller au contenu
      </a>
      <DemoBanner />
      <div className="app-body">
        {showNavigation ? (
          <aside className="sidebar d-none d-md-flex">
            <div className="d-flex align-items-center gap-2 px-2 pb-3">
              <Logo size={40} ring decorative />
              <div>
                <div className="brand-name">Jigi Dons</div>
                <div className="brand-tag">ASSOCIATION</div>
              </div>
            </div>
            <nav aria-label="Navigation principale" className="d-flex flex-column gap-1">
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'} className="sidebar-link">
                  <i className={`bi ${item.icon} me-2`} aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <p className="sidebar-foot">
              Démonstration réalisée par{' '}
              <a href="https://aboubacrinebah.github.io/nexawebmali" target="_blank" rel="noreferrer">
                NexaWeb Mali
              </a>
            </p>
          </aside>
        ) : null}

        <div className="app-main">
          <header className="topbar">
            <div className="d-flex align-items-center gap-2 d-md-none">
              <Logo size={36} ring decorative />
              <span className="brand-name">Jigi Dons</span>
            </div>
            <div className="ms-auto d-flex align-items-center gap-3">
              <span className="small d-none d-sm-inline">
                {user.name} · <strong>{ROLE_LABELS[user.role]}</strong>
              </span>
              <Button variant="outline-primary" size="sm" className={showNavigation ? 'd-none d-md-inline-flex' : undefined} onClick={() => void logout()}>
                Se déconnecter
              </Button>
              {showNavigation ? (
                <Button variant="outline-primary" size="sm" className="d-md-none" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
                  <i className="bi bi-list" aria-hidden="true" /> Menu
                </Button>
              ) : null}
            </div>
          </header>
          <main id="contenu" ref={mainRef} tabIndex={-1} className="content">
            <Outlet />
          </main>
          <footer className="app-footer small text-body-secondary">Jigi Dons · démonstration NexaWeb Mali · données fictives</footer>
        </div>
      </div>

      {showNavigation ? (
        <>
          <nav aria-label="Navigation mobile" className="tabbar d-md-none">
            {tabs.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className="tabbar-link">
                {item.label}
              </NavLink>
            ))}
            <button type="button" className="tabbar-link" onClick={() => setMenuOpen(true)}>
              Menu
            </button>
          </nav>
          <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} placement="end" aria-labelledby="menu-title">
            <Offcanvas.Header closeButton closeLabel="Fermer le menu">
              <Offcanvas.Title id="menu-title">Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-flex flex-column gap-2">
              <p className="small text-body-secondary mb-1">
                {user.name} · {ROLE_LABELS[user.role]}
              </p>
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'} className="menu-link">
                  {item.label}
                </NavLink>
              ))}
              <Button variant="outline-primary" className="mt-2" onClick={() => void logout()}>
                Se déconnecter
              </Button>
            </Offcanvas.Body>
          </Offcanvas>
        </>
      ) : null}
    </div>
  );
}
