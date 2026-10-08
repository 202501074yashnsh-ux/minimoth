import { useEffect, useState } from 'react';

function RecipeListPage({ user, API_BASE, onLogout }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRecipes() {
    try {
      const response = await fetch(`${API_BASE}/recipes`, {
        headers: { 'x-user-id': String(user.id) },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch recipes.');
      }

      setRecipes(data.recipes || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load recipes.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(recipeId) {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': String(user.id) },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete recipe.');
      }

      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete recipe.');
    }
  }

  useEffect(() => {
    loadRecipes();
  }, [user.id]);

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <span className="eyebrow">Logged in as</span>
          <h2>{user.phone}</h2>
        </div>
        <div className="topbar-actions">
          <button className="secondary" onClick={() => window.location.hash = 'new-recipe'}>
            Add recipe
          </button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="recipe-grid">
        {loading ? (
          <p>Loading recipes...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : recipes.length === 0 ? (
          <div className="empty-card">
            <h3>No recipes yet</h3>
            <p>Add your first recipe to get started.</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <article key={recipe.id} className="recipe-card">
              <div className="recipe-card-header">
                <h3>{recipe.title}</h3>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDelete(recipe.id)}
                  title="Delete recipe"
                >
                  Delete
                </button>
              </div>
              <div className="recipe-meta">
                <span>Ingredients</span>
                <p>{recipe.ingredients}</p>
              </div>
              <div className="recipe-meta">
                <span>Steps</span>
                <p>{recipe.instructions}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default RecipeListPage;
