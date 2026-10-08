import { useEffect, useMemo, useState } from 'react';
import AuthPage from './pages/AuthPage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeFormPage from './pages/RecipeFormPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function readSavedUser() {
  try {
    const raw = localStorage.getItem('recipe-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || 'auth');
  const [user, setUser] = useState(readSavedUser);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || 'auth');
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem('recipe-user');
      if (route !== 'auth') {
        window.location.hash = 'auth';
      }
      return;
    }

    localStorage.setItem('recipe-user', JSON.stringify(user));
  }, [user, route]);

  const handleSetUser = (nextUser) => {
    setUser(nextUser);
    window.location.hash = 'recipes';
  };

  const handleLogout = () => {
    setUser(null);
    window.location.hash = 'auth';
  };

  const currentPage = useMemo(() => {
    if (!user && route !== 'auth') {
      return 'auth';
    }

    if (route === 'new-recipe') {
      return 'new-recipe';
    }

    if (route === 'recipes') {
      return 'recipes';
    }

    return 'auth';
  }, [route, user]);

  const pageProps = { user, setUser: handleSetUser, API_BASE, onLogout: handleLogout };

  if (currentPage === 'auth') {
    return <AuthPage {...pageProps} />;
  }

  if (currentPage === 'new-recipe') {
    return <RecipeFormPage {...pageProps} />;
  }

  return <RecipeListPage {...pageProps} />;
}

export default App;
