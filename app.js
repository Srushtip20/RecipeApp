// app.js - modular plain JS (no frameworks)
// Storage key: legacy array format under 'recipes_v1' (original behavior)
// If data exists in the newer object shape ('recipes' => {recipes: [...]}) we will read it
// and migrate it back to the legacy key so app behaves as earlier.
const STORAGE_KEY = "recipes_v1";
const ALT_KEY = "recipes"; // possible newer key to migrate from

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
const categoryField = document.getElementById("category");

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
  title: "Vinayak's Masala Omelette",
  description: "A quick spicy omelette with onions, chillies and masala.",
  image: "",
  ingredients: ["2 eggs","1 small onion, chopped","1 green chilli, chopped","Pinch turmeric","Salt to taste","1 tbsp oil"],
  steps: ["Beat eggs with turmeric and salt","Heat oil in a pan","Sauté onion and chilli 1-2 min","Pour egg mix, cook both sides","Serve hot"],
  prepTime: 10,
  difficulty: "Easy",
  category: "South Indian",
  createdAt: new Date().toISOString()
};

const starterMaggi = {
  id: String(Date.now() + 1),
  title: "Quick Maggi Noodles",
  description: "Comforting Maggi noodles with vegetables and a dash of masala — ready in 5 minutes.",
  image: "",
  ingredients: ["1 packet Maggi","1 small onion, sliced","1 small tomato, chopped","1/2 cup mixed peas & carrots","2 cups water","1 tbsp oil"],
  steps: ["Heat oil and sauté onion until translucent","Add tomato and mixed vegetables, cook 2-3 min","Add water and bring to boil","Add Maggi and masala, cook 2 minutes while stirring","Serve hot"],
  prepTime: 5,
  difficulty: "Easy",
  category: "Noodles",
  createdAt: new Date().toISOString()
};

// Utilities
function loadRecipesFromStorage() {
  // Prefer the legacy key (array) but accept new object shape if present and migrate back
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(ALT_KEY);
  if (!raw) {
    recipes = [starterRecipe, starterMaggi];
    saveRecipesToStorage();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    // newer shape: { recipes: [...] }
    if (parsed && Array.isArray(parsed.recipes)) {
      recipes = parsed.recipes.map(r => ({...r, category: r.category || 'South Indian'}));
      // migrate back to legacy array key for original behavior
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)); } catch (e) {}
      return;
    }
    // legacy shape: an array stored directly
    if (Array.isArray(parsed)) {
      recipes = parsed.map(r => ({...r, category: r.category || 'South Indian'}));
      return;
    }
    throw new Error("Invalid data");
  } catch (e) {
    console.error("localStorage corrupted, resetting. Error:", e);
    // handle corrupted localStorage gracefully by backing up raw value
    try { localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, raw); } catch(e){}
    recipes = [starterRecipe, starterMaggi];
    saveRecipesToStorage();
  }
}

function saveRecipesToStorage() {
  // Original behavior: save the recipes array under the legacy key
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save recipes to storage', e);
  }
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
      <span>${escapeHtml(recipe.category || '')}</span>
      <span>${escapeHtml(String(recipe.prepTime))} min</span>
    </div>
    <p class="muted">${escapeHtml(recipe.description || "")}</p>
    <div class="actions">
      <button class="btn btn-red" data-action="view" data-id="${recipe.id}">View</button>
    </div>
  `;
  // image load animation: add loaded class when image finishes loading (handles cached images)
  const img = div.querySelector("img");
  if (img) {
    function markLoaded() { img.classList.add("img-loaded"); }
    img.addEventListener("load", markLoaded);
    if (img.complete && img.naturalWidth !== 0) markLoaded();
  }
  
  return div;
}
function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const difficulty = difficultyFilter.value;
  // Try to render into category columns if present, otherwise fallback to single grid
  const southEl = document.getElementById('southList');
  const northEl = document.getElementById('northList');
  const westernEl = document.getElementById('westernList');
  const noodlesEl = document.getElementById('noodlesList');

  const filtered = recipes.filter(r => {
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    if (q && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });

  if (southEl && northEl && westernEl && noodlesEl) {
    southEl.innerHTML = '';
    northEl.innerHTML = '';
    westernEl.innerHTML = '';
    noodlesEl.innerHTML = '';

    const byCat = { 'South Indian': [], 'North Indian': [], 'Western India': [], 'Noodles': [] };
    filtered.forEach(r => {
      const cat = r.category || 'South Indian';
      if (byCat[cat]) byCat[cat].push(r);
      else byCat['South Indian'].push(r);
    });

    function renderCat(container, items){
      if (items.length === 0) {
        container.innerHTML = `<p style="color:var(--muted);padding:8px">No recipes in this category.</p>`;
        return;
      }
      const frag = document.createDocumentFragment();
      items.forEach(r => frag.appendChild(createCard(r)));
      container.appendChild(frag);
    }

    renderCat(southEl, byCat['South Indian']);
    renderCat(northEl, byCat['North Indian']);
    renderCat(westernEl, byCat['Western India']);
    renderCat(noodlesEl, byCat['Noodles']);
    return;
  }

  // fallback: single grid
  listEl.innerHTML = "";
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
    // trigger zoom animation: remove class, force reflow, then add
    detailImg.classList.remove("zoom");
    // force reflow to restart animation
    // eslint-disable-next-line no-unused-expressions
    detailImg.offsetWidth;
    detailImg.classList.add("zoom");
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
  categoryField.value = r.category || 'South Indian';
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
    category: categoryField ? categoryField.value : 'South Indian',
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

// delegated click events for card buttons anywhere in the document
document.addEventListener("click", function(e){
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action) return;
  if (action === "view" && id) return viewRecipe(id);
  if (action === "edit" && id) return openEdit(id);
  if (action === "delete" && id) return deleteRecipe(id);
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

// Show full descriptions while hovering/focusing the 'All' filter
function setShowAllDescriptions(enabled){
  if (enabled) document.documentElement.classList.add("show-all-descriptions");
  else document.documentElement.classList.remove("show-all-descriptions");
}

difficultyFilter.addEventListener("mouseenter", function(){
  if (difficultyFilter.value === "All") setShowAllDescriptions(true);
});
difficultyFilter.addEventListener("mouseleave", function(){ setShowAllDescriptions(false); });
difficultyFilter.addEventListener("focus", function(){ if (difficultyFilter.value === "All") setShowAllDescriptions(true); });
difficultyFilter.addEventListener("blur", function(){ setShowAllDescriptions(false); });
// if user changes selection away from All, ensure expanded state removed
difficultyFilter.addEventListener("change", function(){ if (difficultyFilter.value !== "All") setShowAllDescriptions(false); });

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
  // animate headings on open (staggered)
  animateHeadings();
}

// animate headings and subheadings with a small stagger for a pleasant entrance
function animateHeadings(){
  try {
    const timeline = [];
    const top = document.querySelector('.topbar h1');
    if (top) timeline.push({el: top, cls: 'animate-in'});

    // category headings
    document.querySelectorAll('.category-box h2').forEach(h => timeline.push({el: h, cls: 'animate-sub'}));
    // card titles
    document.querySelectorAll('.card h3').forEach(h => timeline.push({el: h, cls: 'animate-sub'}));
    // modal / form headings
    document.querySelectorAll('.modal-content h2, #formTitle').forEach(h => timeline.push({el: h, cls: 'animate-sub'}));

    timeline.forEach((item, idx) => {
      setTimeout(() => {
        if (!item.el) return;
        item.el.classList.add(item.cls);
      }, idx * 90);
    });
  } catch (e) {
    // non-fatal; don't block app if animation fails
    console.error('animateHeadings failed', e);
  }
}

init();