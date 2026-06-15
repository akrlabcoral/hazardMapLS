## SECTION 19 — RAPID FIRE ROUND

*(For last-minute revision outside the exam hall)*

*   **Project Name?** Hazard Map Platform.
*   **Core Goal?** Dynamic, multi-hazard risk simulation and visualization.
*   **Frontend?** React, Vite, MapLibre GL JS, Zustand.
*   **Backend?** FastAPI, Python, NumPy, SciPy.
*   **Database?** Currently local flat-files/cache; PostGIS planned for production.
*   **ML Algorithm?** Random Forest.
*   **Earthquake Metric?** Peak Ground Acceleration (PGA).
*   **Earthquake Physics Model?** GMPE (Ground Motion Prediction Equation).
*   **Heatwave Metric?** IMD Temperature Anomaly & WBGT (Wet-Bulb Globe Temp).
*   **Landslide Input Data?** DEM (Slope, Aspect, Elevation), Lithology, Rainfall, PGA.
*   **Geospatial Data Format?** GeoJSON.
*   **Coordinate System?** EPSG:4326 (WGS84) for data; EPSG:3857 (Web Mercator) for rendering.
*   **Optimization Technique?** Server-side vectorization (sending isolines instead of massive rasters).
*   **Deployment Tool?** Docker and docker-compose.
*   **Most novel feature?** Multi-hazard cascading logic (Earthquakes triggering Landslides dynamically).

---

## SECTION 20 — PROJECT DEFENSE QUESTIONS

### Q20.1: Why did you choose this architecture?

**Beginner Answer:**  
We chose this setup because Python is great at math and science, while React is great at building beautiful user interfaces.

**Technical Answer:**  
The architecture is explicitly decoupled to separate concerns. CPU-bound geospatial matrix operations must run on a backend capable of C-level vectorization (Python/NumPy). The frontend must be highly reactive to handle complex WebGL state mutations without blocking the main browser thread. A monolithic architecture (like Django templating) would fail here because rendering 10,000 GeoJSON polygons requires dedicated client-side GPU processing.

**Advanced Answer:**  
This architecture reflects the modern "headless GIS" paradigm. By shifting the computational burden (raster algebra, contouring, interpolation) entirely to the FastAPI server, we bypass the browser's strict RAM and V8 engine limitations. The backend acts as a spatial microservice, emitting highly compressed payload geometries. If user load scales, the stateless FastAPI workers can be container-orchestrated (Kubernetes) horizontally behind a load balancer, connecting to a shared Redis cache for precomputed isolines.

**Follow-up Questions:**  
* What happens if the Python backend takes 10 seconds to calculate? (The React frontend uses an asynchronous `await fetch` with a loading spinner. In the future, we would use Celery/WebSockets for long-polling).
* How do you handle CORS?

**Common Mistakes:**  
* Explaining the architecture as "React talks to a database." There is no direct DB connection; the crucial layer is the intermediate Python Physics Engine.

**Project Relation:**  
This defends your foundational tech stack choice against examiners who might ask "Why didn't you just use PHP/MySQL" or "Why not just a QGIS plugin?"

---

### Q20.2: Why didn't you use Deep Learning?

**Beginner Answer:**  
Deep learning requires millions of data points and supercomputers to train. Our Random Forest model is much faster and actually performs better for our specific type of map data.

**Technical Answer:**  
Deep Learning (like Convolutional Neural Networks) excels at spatial context (e.g., extracting roads from satellite imagery). However, for pixel-by-pixel tabular classification (where each pixel is an independent row of features like Slope, Rain, Soil), tree-based ensemble models like Random Forest generally outperform Multi-Layer Perceptrons (MLPs). Neural Networks are prone to severe overfitting on imbalanced landslide datasets and require exhaustive hyperparameter tuning.

**Advanced Answer:**  
The decisive factor was **Interpretability**. In disaster management, stakeholders require explainable AI (XAI). A deep neural network is a black box. Random Forest provides deterministic Gini Importance scores, allowing us to mathematically prove to geologists that "Slope" contributes 45% to the hazard probability. Furthermore, RF partitions the non-linear feature space directly without requiring the strict feature normalization/standardization that backpropagation gradients strictly demand.

**Follow-up Questions:**  
* Under what circumstances *would* you use Deep Learning for this project? (Answer: Physics-Informed Neural Networks to replace the GMPE, or UNet for real-time flood inundation mapping).

**Common Mistakes:**  
* Defending the choice by saying "Deep Learning is too hard." Defend it on technical merits: tabular data suitability and interpretability.

**Project Relation:**  
Defends your specific choice of Random Forest in `train_model.py` and the Susceptibility generation pipeline.

---

### Q20.3: Why not use real-time satellite data for the DEM?

**Beginner Answer:**  
The shape of the Earth's mountains doesn't change every day. A static, pre-downloaded map of the terrain is perfectly accurate for our needs and much faster to load.

**Technical Answer:**  
Topography is largely temporally invariant. The SRTM/Copernicus 30m DEM represents static bare-earth elevation. Fetching a 5GB GeoTIFF from NASA's EarthExplorer API in real-time every time a user clicks "Run" is architecturally absurd and would result in 10-minute API latencies. 

**Advanced Answer:**  
While meteorological data (rainfall, temperature) is temporally dynamic and necessitates real-time API ingestion (via Open-Meteo), geological data (DEM, Lithology) is static. By caching the DEM arrays on the server disk during initialization, our $O(N)$ memory reads operate in microseconds. The only time we would need "real-time" satellite data is if we were using Synthetic Aperture Radar (InSAR) to measure millimeter-level slope deformation right before a landslide, which is beyond the scope of a macro-scale hazard simulation platform.

**Follow-up Questions:**  
* What *is* fetched in real-time? (Live weather anomalies, forecast data).
* What happens if a massive earthquake permanently changes the elevation? (The local DEM tile would need to be manually updated in the server cache).

**Common Mistakes:**  
* Thinking that "real-time" automatically equals "better." Caching static data is a core tenet of system optimization.

**Project Relation:**  
Explains why the `data/` folder contains large static `.tif` files while the Heatwave module fetches from external URLs.

---

### Q20.4: How do you know your simulations are accurate?

**Beginner Answer:**  
We validated our models against historical data. For example, we checked if our landslide model would have predicted past landslides that actually happened.

**Technical Answer:**  
Accuracy must be defined per module. 
*   **Landslide:** The Random Forest model was validated using spatial cross-validation and AUC-ROC metrics against a withheld testing set of historical GSI landslide inventories.
*   **Earthquake:** The GMPE equations are standard empirical formulas validated by global seismological organizations against historical seismometer readings.
*   **Heatwave:** The IMD anomaly formulas are strictly algorithmic based on absolute mathematical thresholds against the ERA5 30-year baseline.

**Advanced Answer:**  
While our algorithmic implementations are mathematically sound, true deterministic accuracy is limited by input resolution. A 30m DEM cannot capture a 5m retaining wall that might prevent a landslide. Therefore, the platform outputs probabilistic *Hazard Susceptibility Indices* rather than binary deterministic predictions. It is crucial to frame the project as a **Decision Support System (DSS) and Scenario Simulator**, not a localized life-critical early warning system.

**Follow-up Questions:**  
* What was your AUC score for the landslide model?
* How did you validate the Earthquake GMPE without live sensors? (By comparing our generated PGA contour rings for a historical event, like the 2001 Bhuj Earthquake, against published USGS ShakeMaps).

**Common Mistakes:**  
* Claiming 100% accuracy. 
* Failing to distinguish between algorithmic accuracy (did the code run the math right?) and predictive accuracy (will the mountain actually fall?).

**Project Relation:**  
This is the ultimate defense of the project's scientific validity. It shows the examiner you understand the boundary between a computer science simulation and the chaotic reality of physical geology.
