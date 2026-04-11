import { X } from "lucide-react";
import { useEffect } from "react";

const recipes = {
  hot: {
    title: "Hot Estate Tea",
    subtitle: "Perfect for cold & pleasant weather",
    steps: [
      "Boil 200ml of fresh water in a saucepan.",
      "Add 1 teaspoon of Estate Premium Tea leaves.",
      "Let it simmer on low heat for 3-4 minutes.",
      "Add a small piece of crushed ginger and 2 crushed cardamom pods for extra warmth.",
      "Strain into your favourite cup.",
      "Add honey or sugar to taste.",
      "Serve hot and enjoy the rich, aromatic flavour!"
    ],
    tip: "For a creamier version, replace half the water with milk and let it boil together with the tea leaves."
  },
  cold: {
    title: "Iced Estate Tea",
    subtitle: "Refreshing for warm & hot weather",
    steps: [
      "Boil 150ml of water and add 2 teaspoons of Estate Premium Tea leaves (extra strong).",
      "Steep for 5 minutes, then strain into a glass.",
      "Add 1 tablespoon of sugar or honey while still warm — stir to dissolve.",
      "Squeeze in half a lime or lemon.",
      "Let it cool to room temperature.",
      "Fill a tall glass with ice cubes and pour the tea over.",
      "Garnish with fresh mint leaves and a lime wedge."
    ],
    tip: "For a cold brew version, steep 2 tablespoons of tea in 500ml cold water overnight in the fridge. Strain and serve over ice."
  }
};

const RecipeModal = ({ type, onClose }) => {
  const recipe = recipes[type];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="recipe-modal-overlay"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto card-surface rounded-2xl p-6 sm:p-8 fade-up"
        data-testid="recipe-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          data-testid="recipe-modal-close"
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Recipe</p>
          <h3 className="text-2xl sm:text-3xl font-light gold-text">{recipe.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{recipe.subtitle}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mb-6" />

        {/* Steps */}
        <ol className="space-y-4 mb-6">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-xs text-[#D4AF37] font-medium">
                {i + 1}
              </span>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed pt-0.5">{step}</p>
            </li>
          ))}
        </ol>

        {/* Pro Tip */}
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-[#D4AF37] font-medium mb-2">Pro Tip</p>
          <p className="text-sm text-gray-300 leading-relaxed">{recipe.tip}</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
