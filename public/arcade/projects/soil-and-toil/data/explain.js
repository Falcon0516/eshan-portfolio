window.EXPLAIN = {
 "theme": {
  "left": "28%",
  "bg": "#FBF1DC",
  "ink": "#3A2A1A",
  "accent": "#5DBB63",
  "line": "#B89E6E",
  "font": "Georgia,\"Times New Roman\",serif"
 },
 "title": "SOIL & TOIL",
 "line": "Soil nitrogen, phosphorus, potassium and pH from one phone photo.",
 "achievements": [
  {
   "k": "1",
   "t": "Solo personal project",
   "s": "Built for my father's farmland"
  }
 ],
 "stack": [
  "Python",
  "PyTorch",
  "FastAPI",
  "Redis",
  "scikit-learn",
  "NumPy",
  "pandas",
  "SciPy",
  "Groq"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Farmers cannot easily reach or afford soil-testing labs.",
    "Lab results are slow, and fertiliser is often guessed."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "One phone photo gives nitrogen, phosphorus, potassium, pH and soil type.",
    "Fertiliser advice for 30 crops in English, Hindi and Kannada.",
    "A web app with a background job queue and live progress."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "The browser sends photo, location, crop, acreage and language; progress is polled every 2 s.",
    "The photo is resized to 512x512 and white-balanced.",
    "An MST++ transformer rebuilds a spectrum from RGB; the near-infrared part is extrapolated.",
    "Smoothing, scaling and derivatives give 188 features; PCA cuts them to 30.",
    "pH and soil type are predicted first, because pH changes nutrient availability.",
    "NPK comes from a PLSR plus 1D-CNN ensemble; 50 dropout passes give a 95% confidence range.",
    "Weather and soil context from Open-Meteo and SoilGrids; deficit compared with the chosen crop.",
    "Groq writes the advice in the chosen language, with a static fallback plan."
   ]
  },
  {
   "h": "DATA AND SCALE",
   "pts": [
    "Cleaned OSSL, AfSIS and Kaggle data; 10-fold cross-validation.",
    "32 saved end-to-end analysis runs.",
    "Heuristic fallbacks if model weights are missing."
   ]
  }
 ],
 "links": [
  {
   "label": "CODE",
   "url": "github.com/Falcon0516/Soil_and_Toil_Ai_Powered_soil_spectral_ML_ensemble"
  },
  {
   "label": "PORTFOLIO",
   "url": "eshan-portfolio.streyeke.cloud"
  },
  {
   "label": "GITHUB",
   "url": "github.com/Falcon0516"
  },
  {
   "label": "LINKEDIN",
   "url": "linkedin.com/in/eshan-h"
  }
 ]
};
