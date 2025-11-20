# Recipe Manager (LocalStorage)

**Candidate:** Srushti Patel  
**Batch:** Full-Stack Engineer  
**Email:** patelsrusht9727@gmail.com

This is a simple single-page Recipe Manager written in plain HTML/CSS/JS. All persistence uses browser `localStorage`.

## Files
- `index.html` — UI (Home, Detail, Add/Edit)
- `styles.css` — styling and responsive behavior
- `app.js` — application logic (modular pattern)

## How to run
1. Put the 3 files (`index.html`, `styles.css`, `app.js`) and this `README.md` into the same folder.
2. Open `index.html` in a modern browser (Chrome/Firefox/Edge). No server is required.
3. On first load the app inserts the candidate’s recipe (**Pav Bhaji (For 2 People)**) into `localStorage` so you immediately see it in the list.

## Data structure (localStorage)
- Key: `recipes`
- Value: JSON string containing an array of recipe objects. Example single item:

```json
{
  "id": "k9z1x3",
  "title": "Pav Bhaji (For 2 People)",
  "description": "A delicious Mumbai-style pav bhaji...",
  "ingredients": ["2 Potatoes","2 Tomatoes (chopped)","..."],
  "steps": ["Wash vegetables","Boil vegetables","..."],
  "prepTime": 30,
  "cookTime": 20,
  "difficulty": "Easy",
  "image": ""
}
