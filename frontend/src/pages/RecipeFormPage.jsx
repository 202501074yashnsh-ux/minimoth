import { useState } from 'react';

function RecipeFormPage({ user, API_BASE }) {
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Recipe title is required.');
      return;
    }

    if (!ingredients.trim()) {
      setError('Ingredients are required.');
      return;
    }

    if (!instructions.trim()) {
      setError('Instructions are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id),
        },
        body: JSON.stringify({
          title: title.trim(),
          ingredients: ingredients.trim(),
          instructions: instructions.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save recipe.');
      }

      window.location.hash = 'recipes';
    } catch (submitError) {
      setError(submitError.message || 'There was a problem saving the recipe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="panel form-panel">
        <div className="section-header">
          <span className="eyebrow">New recipe</span>
          <h1>Add a recipe</h1>
        </div>

        <form onSubmit={handleSubmit} className="recipe-form">
          <label>
            Recipe title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Spicy garlic noodles" />
          </label>

          <label>
            Ingredients
            <textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} rows={5} placeholder="200g noodles, 2 cloves garlic, chili flakes" />
          </label>

          <label>
            Instructions
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={6} placeholder="Boil noodles, sauté garlic, combine and serve." />
          </label>

          <div className="actions-row">
            <button type="button" className="secondary" onClick={() => (window.location.hash = 'recipes')}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save recipe'}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default RecipeFormPage;
