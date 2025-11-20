// app.js - modular plain JS (no frameworks)
// Key: recipes
const STORAGE_KEY = "recipes_v1";

// DOM refs
const listEl = document.getElementById("list");
const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const recipeForm = document.getElementById("recipeForm");
const formTitle = document.getElementById("formTitle");
const detailView = document.getElementById("detailView");
const searchInput = document.getElementById("searchInput");
const difficultyFilter = document.getElementById("difficultyFilter");

// form fields
const recipeIdField = document.getElementById("recipeId");
const titleField = document.getElementById("title");
const descriptionField = document.getElementById("description");
const imageField = document.getElementById("image");
const ingredientsField = document.getElementById("ingredients");
const stepsField = document.getElementById("steps");
const prepTimeField = document.getElementById("prepTime");
const difficultyField = document.getElementById("difficulty");
const formError = document.getElementById("formError");

const detailTitle = document.getElementById("detailTitle");
const detailImg = document.getElementById("detailImg");
const detailDesc = document.getElementById("detailDesc");
const detailMeta = document.getElementById("detailMeta");
const detailIngredients = document.getElementById("detailIngredients");
const detailSteps = document.getElementById("detailSteps");
const editFromDetailBtn = document.getElementById("editFromDetail");
const deleteFromDetailBtn = document.getElementById("deleteFromDetail");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

let recipes = [];
let currentViewId = null;

// Starter recipe (replace with your own)
const starterRecipe = { 
  id: String(Date.now()),
  title: "Pav Bhaji",
  description: "A spicy, buttery Mumbai street-style mixed vegetable curry served with toasted pav.",
  image: "",
  ingredients: [
    "2 medium potatoes (boiled)",
    "1 cup cauliflower (boiled)",
    "1/2 cup green peas (boiled)",
    "1 capsicum, finely chopped",
    "2 medium onions, finely chopped",
    "3 tomatoes, finely chopped",
    "1 tbsp ginger-garlic paste",
    "2-3 green chillies, chopped",
    "2 tbsp pav bhaji masala",
    "1 tsp red chilli powder",
    "1/2 tsp turmeric",
    "Salt to taste",
    "2 tbsp butter",
    "1 tbsp oil",
    "Pav (4 pieces)",
    "Extra butter for toasting pav"
  ],
  steps: [
    "Step 1: Switch on the gas and place a deep pan/kadhai on medium flame. Add 1 tbsp oil and 1 tbsp butter.",
    "Step 2: Add chopped onions and sauté until they turn light golden.",
    "Step 3: Add ginger-garlic paste and green chillies. Cook for 1 minute until raw smell goes away.",
    "Step 4: Add chopped capsicum and sauté for 2–3 minutes.",
    "Step 5: Add chopped tomatoes and cook until soft and mushy.",
    "Step 6: Add turmeric, red chilli powder, pav bhaji masala, and salt. Mix well and cook the masala for 2 minutes.",
    "Step 7: Add boiled potatoes, cauliflower, and peas. Mash the vegetables using a masher.",
    "Step 8: Add 1/2 to 1 cup water to adjust consistency. Mash and mix continuously for 5–7 minutes on medium flame.",
    "Step 9: Add 1 tbsp butter on top and let it simmer for another 2 minutes on low flame.",
    "Step 10: Turn off the gas — bhaji is ready.",
    "Step 11: For pav, switch on the gas and heat a tawa. Add some butter on the tawa.",
    "Step 12: Place pav on the tawa and toast both sides until golden and crispy.",
    "Step 13: Serve hot bhaji with butter-toasted pav, onions, and lemon."
  ],
  prepTime: 30,
  difficulty: "Medium",
  createdAt: new Date().toISOString()
};


// Utilities
function loadRecipesFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    recipes = [starterRecipe];
    saveRecipesToStorage();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid data");
    recipes = parsed;
  } catch (e) {
    console.error("localStorage corrupted, resetting. Error:", e);
    // handle corrupted localStorage gracefully by resetting but preserve key backup
    try { localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, raw); } catch(e){}
    recipes = [starterRecipe];
    saveRecipesToStorage();
  }
}

function saveRecipesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function createCard(recipe) {
  const div = document.createElement("div");
  div.className = "card";
  const imgHtml = recipe.image ? `<img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}" />` : "";
  div.innerHTML = `
    ${imgHtml}
    <h3>${escapeHtml(recipe.title)}</h3>
    <div class="meta">
      <span>${escapeHtml(recipe.difficulty)}</span>
      <span>${escapeHtml(String(recipe.prepTime))} min</span>
    </div>
    <p class="muted">${escapeHtml(recipe.description || "").substring(0,120)}</p>
    <div class="actions">
      <button class="small" data-action="view" data-id="${recipe.id}">View</button>
      <button class="small" data-action="edit" data-id="${recipe.id}">Edit</button>
      <button class="small danger" data-action="delete" data-id="${recipe.id}">Delete</button>
    </div>
  `;
  return div;
}

function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const difficulty = difficultyFilter.value;
  listEl.innerHTML = "";
  const filtered = recipes.filter(r => {
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    if (q && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });
  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="color:var(--muted);padding:12px">No recipes found.</p>`;
    return;
  }
  const frag = document.createDocumentFragment();
  filtered.forEach(r => frag.appendChild(createCard(r)));
  listEl.appendChild(frag);
}

// small helper to avoid XSS in templates
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

// modal show/hide
function openModal(showDetail=true) {
  modal.classList.remove("hidden");
  if (showDetail) {
    detailView.classList.remove("hidden");
    recipeForm.classList.add("hidden");
  } else {
    detailView.classList.add("hidden");
    recipeForm.classList.remove("hidden");
  }
}
function closeModal() {
  modal.classList.add("hidden");
  clearForm();
}

// viewing details
function viewRecipe(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  currentViewId = id;
  detailTitle.textContent = r.title;
  detailDesc.textContent = r.description || "";
  detailMeta.innerHTML = `<li>Prep: ${r.prepTime} min</li><li>Difficulty: ${r.difficulty}</li>`;
  if (r.image) {
    detailImg.src = r.image;
    detailImg.classList.remove("hidden");
  } else detailImg.classList.add("hidden");
  detailIngredients.innerHTML = r.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join("");
  detailSteps.innerHTML = r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("");
  openModal(true);
}

// edit
function openEdit(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  recipeIdField.value = r.id;
  titleField.value = r.title;
  descriptionField.value = r.description || "";
  imageField.value = r.image || "";
  ingredientsField.value = (r.ingredients || []).join("\n");
  stepsField.value = (r.steps || []).join("\n");
  prepTimeField.value = r.prepTime;
  difficultyField.value = r.difficulty;
  formTitle.textContent = "Edit Recipe";
  formError.classList.add("hidden");
  openModal(false);
}

// delete
function deleteRecipe(id) {
  if (!confirm("Delete this recipe? This action cannot be undone.")) return;
  recipes = recipes.filter(r => r.id !== id);
  saveRecipesToStorage();
  renderList();
  closeModal();
}

// form helpers
function clearForm() {
  recipeForm.reset();
  recipeIdField.value = "";
  formTitle.textContent = "Add Recipe";
  formError.classList.add("hidden");
}

function validateForm(data) {
  if (!data.title || data.title.trim().length < 2) return "Title is required (min 2 chars).";
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) return "At least one ingredient is required.";
  if (!Array.isArray(data.steps) || data.steps.length === 0) return "At least one step is required.";
  if (!data.prepTime || isNaN(Number(data.prepTime)) || Number(data.prepTime) <= 0) return "Prep time must be a positive number.";
  if (!["Easy","Medium","Hard"].includes(data.difficulty)) return "Select a valid difficulty.";
  return null;
}

// submit handler (create or update)
recipeForm.addEventListener("submit", function(e){
  e.preventDefault();
  const id = recipeIdField.value || String(Date.now());
  const data = {
    id,
    title: titleField.value.trim(),
    description: descriptionField.value.trim(),
    image: imageField.value.trim(),
    ingredients: ingredientsField.value.split("\n").map(s => s.trim()).filter(Boolean),
    steps: stepsField.value.split("\n").map(s => s.trim()).filter(Boolean),
    prepTime: Number(prepTimeField.value),
    difficulty: difficultyField.value,
    updatedAt: new Date().toISOString()
  };
  const err = validateForm(data);
  if (err) {
    formError.textContent = err;
    formError.classList.remove("hidden");
    return;
  }
  // determine create/update
  const existingIndex = recipes.findIndex(r => r.id === id);
  if (existingIndex >= 0) {
    recipes[existingIndex] = {...recipes[existingIndex], ...data};
  } else {
    data.createdAt = new Date().toISOString();
    recipes.unshift(data); // newest first
  }
  saveRecipesToStorage();
  renderList();
  closeModal();
});

// click events in cards (delegation)
listEl.addEventListener("click", function(e){
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action || !id) return;
  if (action === "view") viewRecipe(id);
  else if (action === "edit") openEdit(id);
  else if (action === "delete") deleteRecipe(id);
});

// modal controls
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", function(e){
  if (e.target === modal) closeModal();
});

// header buttons
addBtn.addEventListener("click", function(){
  clearForm();
  openModal(false);
});

// search / filter
searchInput.addEventListener("input", renderList);
difficultyFilter.addEventListener("change", renderList);

// detail view edit/delete
editFromDetailBtn.addEventListener("click", function(){
  if (!currentViewId) return;
  openEdit(currentViewId);
});
deleteFromDetailBtn.addEventListener("click", function(){
  if (!currentViewId) return;
  deleteRecipe(currentViewId);
});

// keyboard accessibility: ESC to close
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

// init
function init(){
  loadRecipesFromStorage();
  renderList();
}

init();




function seedLocalStorageIfEmpty() {
  const key = 'recipes';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const starter = [ /* put your candidate recipe object here */ ];
      localStorage.setItem(key, JSON.stringify(starter));
      return starter;
    }
    // try parse to ensure it's valid JSON
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('invalid format');
    return parsed;
  } catch (err) {
    // handle corrupted data gracefully
    console.warn('Corrupted recipes in localStorage — resetting.', err);
    const starter = [ /* starter recipe */ ];
    localStorage.setItem(key, JSON.stringify(starter));
    return starter;
  }
}


function validateRecipe(obj) {
  const errors = [];
  if (!obj.title || !obj.title.trim()) errors.push('Title is required.');
  if (!Array.isArray(obj.ingredients) || obj.ingredients.length === 0) errors.push('At least 1 ingredient.');
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) errors.push('At least 1 step.');
  if (!['Easy','Medium','Hard'].includes(obj.difficulty)) errors.push('Difficulty must be Easy, Medium or Hard.');
  if (!Number.isFinite(obj.prepTimeMin) || obj.prepTimeMin < 0) errors.push('Prep time must be a non-negative number.');
  return errors; // empty array = valid
}

const KEY = 'recipes';
function getRecipes() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch (e) { localStorage.removeItem(KEY); return []; }
}
function saveRecipes(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
function addRecipe(recipe) {
  const list = getRecipes();
  list.unshift(recipe);
  saveRecipes(list);
}
function updateRecipe(id, updates) {
  const list = getRecipes();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Not found');
  list[idx] = {...list[idx], ...updates};
  saveRecipes(list);
}
function deleteRecipe(id) {
  saveRecipes(getRecipes().filter(r=>r.id !== id));
}
