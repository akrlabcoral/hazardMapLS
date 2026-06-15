## SECTION 3 — LANDSLIDE SIMULATION

### Q3.1: What is the difference between Hazard, Susceptibility, and Risk?

**Beginner Answer:**  
Susceptibility is how likely an area is to have a landslide because of its terrain (steepness, soil). Hazard is when a specific trigger (like heavy rain or an earthquake) makes that landslide happen. Risk is the actual damage it causes to people and buildings.

**Technical Answer:**  
*   **Susceptibility:** The intrinsic spatial probability of a landslide occurring based solely on pre-conditioning factors (Slope, Elevation, Aspect, Lithology, Land Cover). It does not factor in time or triggers.
*   **Hazard:** The spatio-temporal probability of a landslide occurring. It is Susceptibility combined with a triggering factor (dynamic variables like Rainfall intensity or Seismic PGA) over a specific time period.
*   **Risk:** The intersection of Hazard, Exposure (population, infrastructure in the area), and Vulnerability. $Risk = Hazard \times Exposure \times Vulnerability$.

**Advanced Answer:**  
In our architecture, the Machine Learning model (Random Forest) calculates *Susceptibility* by learning the non-linear relationships between the static DEM derivatives and historical landslide inventories. However, the backend simulation engine calculates *Hazard*. When the user inputs 50mm/day of rainfall, the backend dynamically modifies the base susceptibility weights using infinite slope stability models or heuristic overlays to generate a real-time hazard index, which is what is finally rendered on the Mapbox GL JS frontend.

**Follow-up Questions:**  
* Does your platform calculate Risk or just Hazard? (Answer: We calculate Hazard, but the Heatwave module touches upon Risk by showing "Population at Risk" statistics).
* How did you obtain the historical landslide inventory?

**Common Mistakes:**  
* Using Hazard and Risk interchangeably. In geospatial science, they are strictly distinct concepts.

**Project Relation:**  
The Landslide module explicitly allows the user to switch between static Susceptibility (the base map) and dynamic Hazard (triggered by the Rainfall or Seismic sliders).

---

### Q3.2: How does rainfall trigger a landslide?

**Beginner Answer:**  
When it rains heavily, water seeps into the soil. The water makes the soil heavy and acts as a lubricant, causing the dirt to slide down the steep slope.

**Technical Answer:**  
Rainfall triggers landslides primarily by altering the pore water pressure within the soil mantle. As soil becomes saturated, the water pressure pushes the soil particles apart, decreasing the effective normal stress and the internal friction (shear strength) of the soil. Once the shear stress (gravity pulling down) exceeds the shear strength, failure occurs.

**Advanced Answer:**  
According to the Infinite Slope Stability Model, the Factor of Safety (FoS) is defined as the ratio of shear strength ($\tau_f$) to shear stress ($\tau_d$). 
$FoS = \frac{c' + (\gamma z \cos^2\beta - u)\tan \phi'}{\gamma z \sin\beta \cos\beta}$
Where $u$ is the pore water pressure. Intense rainfall rapidly increases $u$, which directly decreases the numerator (resisting forces). If FoS drops below 1.0, the slope fails. In our simulation, the rainfall parameter dynamically degrades the stability threshold of grid cells with high slope and low cohesion.

**Follow-up Questions:**  
* Why does duration matter as much as intensity? (Because deep-seated landslides require prolonged rainfall to saturate the deep slip surfaces, while shallow debris flows can be triggered by short, intense bursts).

**Common Mistakes:**  
* Saying the water "washes away" the soil. That is erosion, not a landslide. A landslide is a mass wasting failure due to loss of shear strength.

**Project Relation:**  
The Landslide module has a "Rainfall" trigger tab where users input Intensity (mm/day) and Duration (days). The backend uses these as multipliers against the slope and soil arrays to calculate the final hazard probability.

---

### Q3.3: How do earthquakes induce landslides (Seismic Landslides)?

**Beginner Answer:**  
The violent shaking of an earthquake can loosen the soil and rock on a mountain. If the shaking is hard enough, the mountain face breaks and falls.

**Technical Answer:**  
Earthquake-induced landslides occur due to seismic loading. The passage of seismic waves adds temporary dynamic shear stresses to the slope. If these transient stresses, when added to the existing static gravitational shear stress, exceed the shear strength of the rock or soil mass, it yields and begins to displace.

**Advanced Answer:**  
In probabilistic seismic landslide hazard analysis, we often use the Newmark Sliding Block model. The earthquake generates a Peak Ground Acceleration (PGA). A slope has a critical yield acceleration ($a_c$)—the minimum horizontal acceleration required to overcome its friction and cohesion. If $PGA > a_c$, the block accumulates displacement. In our multi-hazard pipeline, we intersect the PGA grid generated by the Earthquake GMPE with the Slope and Lithology grids. High PGA on a >30° slope with soft lithology immediately results in a near 1.0 landslide hazard probability.

**Follow-up Questions:**  
* Does your platform allow simultaneous earthquake and rainfall triggers?
* What is liquefaction?

**Common Mistakes:**  
* Failing to connect the Earthquake module to the Landslide module during the explanation.

**Project Relation:**  
The Landslide module has a "Combined" or "Seismic" trigger tab. Under the hood, this integrates the PGA arrays calculated by the earthquake physics engine directly into the landslide hazard matrix.

---

## SECTION 4 — HEATWAVE MODULE

### Q4.1: What is a Heatwave and what are the IMD criteria?

**Beginner Answer:**  
A heatwave is a period of abnormally hot weather. In India, it's not a heatwave just because it's hot; it has to be significantly hotter than what is normal for that specific region.

**Technical Answer:**  
A heatwave is defined by the Indian Meteorological Department (IMD) based on temperature thresholds and anomalies from historical normals. The criteria for plains include:
1. Normal maximum temperature must reach at least 40°C.
2. Anomaly Criteria: 
   - **Heatwave:** Departure from normal is 4.5°C to 6.4°C.
   - **Severe Heatwave:** Departure from normal is > 6.4°C.
3. Absolute Criteria: If the absolute max temperature crosses 45°C, it's a heatwave regardless of the anomaly. If it crosses 47°C, it's a severe heatwave.

**Advanced Answer:**  
Beyond the dry-bulb temperature IMD criteria, human survivability is heavily dependent on humidity. Therefore, our system computes the **Wet-Bulb Globe Temperature (WBGT)** using Stull's empirical formula. WBGT incorporates temperature, humidity, wind, and solar radiation. If WBGT exceeds 35°C, the human body can no longer cool itself via perspiration, leading to fatal hyperthermia. We classify this as an "Extreme Heatwave" risk layer, assigning it the maximum hazard score (1.0).

**Follow-up Questions:**  
* Why does 40°C in Rajasthan feel different from 40°C in Mumbai? (Humidity).
* How did you calculate the historical normals for the anomaly?

**Common Mistakes:**  
* Stating a fixed temperature (e.g., "Anything above 40 is a heatwave"). A 40°C day in Rajasthan in May might be normal, but a 40°C day in Shimla is a severe heatwave.

**Project Relation:**  
Our Python backend (`heatwave_classification.py`) programmatically evaluates both the IMD Anomaly rules and the WBGT lethality rules to map the entire country onto a 0.0 to 1.0 risk scale, mapped to green, yellow, orange, and red choropleth polygons.

---

### Q4.2: What is the Urban Heat Island (UHI) effect?

**Beginner Answer:**  
Cities are hotter than surrounding rural areas because concrete and asphalt absorb the sun's heat, and there are fewer trees to provide shade and cool the air.

**Technical Answer:**  
The Urban Heat Island (UHI) effect is a microclimatic phenomenon where urban areas experience significantly higher temperatures than adjacent rural areas. This is driven by low albedo surfaces (dark asphalt/concrete) absorbing shortwave solar radiation and re-emitting it as longwave thermal radiation, combined with a lack of evapotranspiration due to low vegetation cover.

**Advanced Answer:**  
In our simulation, enabling the UHI toggle applies a spatial penalty matrix to the interpolated weather grid. We utilize population density or land-cover classifications as a proxy for urbanization. If a grid cell intersects an urban center (like Delhi or Mumbai), the engine artificially inflates the localized dry-bulb temperature by $1.5^\circ C - 3^\circ C$ and slightly alters the relative humidity. This demonstrates how urban planners can use the tool to simulate micro-climatic vulnerabilities.

**Follow-up Questions:**  
* How can a city mitigate UHI?
* Does your system use actual satellite thermal data or a heuristic algorithm for UHI?

**Common Mistakes:**  
* Confusing UHI with Global Warming. Global warming is a macro-climate trend; UHI is a localized micro-climate phenomenon.

**Project Relation:**  
The Heatwave UI features a distinct "Urban Heat Island (UHI)" toggle. When enabled, the Python backend applies the UHI heuristic multiplier to the spatial temperature arrays before running the IMD classification.

---

## SECTION 5 — GIS FUNDAMENTALS

### Q5.1: What is the difference between Vector and Raster data?

**Beginner Answer:**  
Vector data uses points, lines, and shapes (like polygons) to draw things, like a country border or a road. Raster data uses a grid of square pixels, like a digital photograph, where each pixel has a value (like elevation or color).

**Technical Answer:**  
*   **Vector Data:** Represents discrete geographical features using geometry (Points, LineStrings, Polygons) and coordinates. It is highly scalable, lightweight for boundaries, and stores attributes in tabular format. Formats: GeoJSON, Shapefile.
*   **Raster Data:** Represents continuous geographical surfaces using a matrix of cells (pixels). Each cell holds a numeric value representing a specific variable (e.g., elevation in a DEM, or temperature). Formats: GeoTIFF, NetCDF.

**Advanced Answer:**  
In web GIS, rendering large rasters directly on the client (browser) is extremely computationally expensive. Therefore, our architecture processes massive Rasters (like the 30m DEM) on the backend using Python libraries like `rasterio` and `numpy`. The backend converts the continuous raster data into discrete vector outputs (like GeoJSON isolines or choropleth polygons) because vector data can be easily rendered and styled via WebGL in MapLibre GL JS without crashing the browser.

**Follow-up Questions:**  
* Is a DEM raster or vector? (Raster).
* What is GeoJSON?

**Common Mistakes:**  
* Saying vectors are "better" than rasters. They serve different purposes (vectors for discrete features, rasters for continuous fields).

**Project Relation:**  
Our machine learning pipeline uses Raster data (GeoTIFF DEMs), but our backend converts the simulation results into Vector data (`FeatureCollections`) so the React frontend can quickly draw them as contour lines.

---

### Q5.2: What is a Coordinate Reference System (CRS) and WGS84?

**Beginner Answer:**  
The Earth is a 3D sphere, but our screens are flat 2D rectangles. A CRS is a mathematical formula that translates a point on the 3D earth into 2D coordinates (X and Y) so we can map it.

**Technical Answer:**  
A Coordinate Reference System defines how spatial data relates to the earth's surface. It consists of a datum (the model of the earth's shape) and a projection (how to flatten it). **WGS84 (EPSG:4326)** is the standard geographic coordinate system used by GPS, representing locations as degrees of Latitude and Longitude.

**Advanced Answer:**  
Web maps (like Mapbox, MapLibre, Google Maps) store coordinates in EPSG:4326 (WGS84) but render them on the screen using **Web Mercator (EPSG:3857)**, a projected coordinate system measured in meters. The Mercator projection severely distorts area near the poles (making Greenland look huge). In our backend physics engines (like the GMPE), calculating distances using raw degrees is inaccurate due to Earth's curvature. We must use the Haversine formula (for spherical distance) or project the coordinates into a local UTM zone to perform accurate metric distance calculations (like calculating exact distance to an epicenter).

**Follow-up Questions:**  
* Why does Greenland look so big on Google Maps?
* What happens if your backend uses EPSG:3857 but your frontend expects EPSG:4326? (The points will render in the ocean off the coast of Africa at 0,0).

**Common Mistakes:**  
* Confusing geographic systems (measured in degrees) with projected systems (measured in meters).

**Project Relation:**  
All JSON requests between our React frontend and FastAPI backend transmit coordinates in `EPSG:4326` (lng/lat arrays). The MapLibre engine automatically projects them to Web Mercator for screen rendering.
