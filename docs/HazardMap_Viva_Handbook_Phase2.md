## SECTION 6 — DEM PROCESSING

### Q6.1: What is a DEM and why is it used?

**Beginner Answer:**  
A DEM (Digital Elevation Model) is a 3D digital map of the earth's surface. We use it to know how high every point on the map is, which helps us calculate how steep a mountain is.

**Technical Answer:**  
A DEM is a specialized raster grid where each pixel value represents the bare-earth elevation above a reference geoid (sea level). In geospatial analysis, DEMs are the foundational datasets for generating geomorphological derivatives like Slope (rate of change of elevation), Aspect (direction of slope), and Curvature. 

**Advanced Answer:**  
In our pipeline, we process DEM GeoTIFFs to calculate topographic variables for the Landslide Machine Learning model. Calculating slope dynamically on the frontend WebGL client for 20 million pixels is impossible. Instead, we precompute the spatial derivatives using GDAL/Rasterio on the backend. A 3x3 pixel moving window (Sobel operator) is applied across the DEM matrix to calculate the partial derivatives in the X and Y directions ($\frac{dz}{dx}$ and $\frac{dz}{dy}$), yielding the slope angle: $\text{Slope} = \arctan(\sqrt{(\frac{dz}{dx})^2 + (\frac{dz}{dy})^2})$.

**Follow-up Questions:**  
* Did you use SRTM, ASTER, or Copernicus DEM? What is the spatial resolution?
* What is the difference between a DEM, DSM (Digital Surface Model), and DTM (Digital Terrain Model)?

**Common Mistakes:**  
* Confusing a DEM with a standard image. A DEM pixel value is a float representing altitude in meters, not an RGB color.

**Project Relation:**  
The DEM was crucial for creating the base static landslide susceptibility map. Without the DEM, we would have no slope data, and without slope data, we cannot model gravity-driven mass wasting (landslides).

---

## SECTION 7 — MACHINE LEARNING

### Q7.1: Why did you choose Random Forest over Deep Learning for Susceptibility Mapping?

**Beginner Answer:**  
Random Forest is faster, requires less data, and explains its decisions better than Deep Learning.

**Technical Answer:**  
Random Forest (RF) is an ensemble learning method that constructs a multitude of decision trees at training time. For geospatial susceptibility mapping (tabular raster pixel data), tree-based models like RF and XGBoost consistently outperform neural networks. Deep Learning (CNNs/UNet) is excellent for spatial context (image segmentation), but for pixel-wise classification of heterogeneous tabular features (Slope, Lithology, Soil Moisture), Random Forest avoids severe overfitting and requires drastically less hyperparameter tuning.

**Advanced Answer:**  
The primary driver for choosing Random Forest was **Interpretability** and **Feature Importance**. In disaster management, black-box models are a liability. Using the Gini Impurity decrease, RF provides a deterministic ranking of which variables drive landslides (e.g., Slope contributes 45%, Lithology 20%). Furthermore, RF easily handles non-linear interactions without needing feature scaling, unlike multi-layer perceptrons. It partitions the spatial feature space into hyper-rectangles, making it robust to the highly imbalanced nature of landslide inventories (where non-landslide pixels outnumber landslide pixels 10,000 to 1).

**Follow-up Questions:**  
* How did you handle the class imbalance in the training data? (Answer: SMOTE, or undersampling the majority class).
* What was your validation strategy? (Spatial Cross-Validation to prevent data leakage).

**Common Mistakes:**  
* Saying "Deep Learning is better but I didn't know how to use it." Own the architectural decision. Tree-based models *are* mathematically superior for tabular pixel-wise classification.

**Project Relation:**  
The RF model was trained offline using historical data. The resulting weights and trained model binaries (`.pkl`) are used by the backend to generate the static base Susceptibility matrix.

---

## SECTION 8 — DATA SOURCES

### Q8.1: Where did you get the data and how did you validate it?

**Beginner Answer:**  
We used data from global scientific organizations like NASA for elevation, ERA5 for climate normals, and live weather APIs for current conditions.

**Technical Answer:**  
*   **Elevation (DEM):** SRTM or Copernicus 30m resolution datasets accessed via EarthExplorer.
*   **Meteorology (Historical):** ERA5 Reanalysis data (ECMWF) provided decades of hourly temperature and humidity data to construct the baseline climate normals for the Heatwave anomaly calculations.
*   **Meteorology (Live):** Open-Meteo API for real-time and 5-day forecast ingestion.
*   **Seismic/Landslide:** USGS Earthquake catalogs and Geological Survey of India (GSI) landslide inventories.

**Advanced Answer:**  
Data validation was critical, especially ensuring coordinate alignment across multiple raster projections. The ERA5 dataset is provided in a coarse NetCDF grid (e.g., 0.25° x 0.25°). To fuse this with a 30m DEM, we had to perform spatial resampling (Bilinear interpolation for continuous variables like temperature, Nearest Neighbor for categorical variables like Lithology). We validated the ERA5 historical normals by cross-referencing against available IMD station observational records to ensure the anomaly thresholds were statistically sound for the Indian subcontinent.

**Follow-up Questions:**  
* Why didn't you use IMD APIs directly? (IMD APIs are notoriously rate-limited, difficult to scrape, and lack consistent gridded historical archives for free access compared to ERA5).
* What is a NetCDF file?

**Common Mistakes:**  
* Claiming you gathered the data yourself. Be clear that you are aggregating, cleaning, and fusing secondary datasets.

**Project Relation:**  
The entire platform is a data-fusion engine. The pipeline scripts in the backend exist purely to download, standardize, and cache these diverse datasets into a unified 2D grid matrix.

---

## SECTION 9 — FRONTEND (REACT)

### Q9.1: Why did you use React and Zustand for the Frontend?

**Beginner Answer:**  
React makes it easy to build interactive user interfaces by breaking the screen into reusable components. Zustand helps us share data (like the map coordinates) between all those different components.

**Technical Answer:**  
We chose React (via Vite) for its component-based architecture and efficient Virtual DOM rendering. For state management, Redux was deemed too boilerplate-heavy. We selected Zustand because it provides a lightweight, unopinionated, hooks-based global store. This is critical in a GIS application where the sidebar UI (triggers, sliders) needs to instantly mutate state that is deeply buried inside the Mapbox WebGL component.

**Advanced Answer:**  
The Hazard Map frontend architecture requires high-frequency state updates without triggering cascading re-renders that would crash the WebGL map context. By using Zustand, we can utilize transient updates (subscribing to state changes without re-rendering the component) or selective selectors (`const pga = useStore(state => state.pga)`). Furthermore, React allows us to encapsulate complex MapLibre layer management logic inside custom hooks (`useSimulation.js`), ensuring a clean separation between UI components and asynchronous WebGL imperative commands.

**Follow-up Questions:**  
* Why MapLibre over Google Maps? (Google Maps is extremely limited and expensive for rendering complex dynamic GeoJSON heatmaps. MapLibre is open-source WebGL).
* What is the Virtual DOM?

**Common Mistakes:**  
* Saying "React is faster than plain HTML." It's not. React is used for maintainability and complex state syncing, not pure raw rendering speed.

**Project Relation:**  
The frontend is structurally divided into UI Modules (`HeatwaveModule.jsx`) and the Map Renderer (`MapView.jsx`). Zustand (`useStore.js`) acts as the central nervous system connecting them.

---

## SECTION 10 — BACKEND (FASTAPI)

### Q10.1: Why FastAPI instead of Django or Node.js?

**Beginner Answer:**  
FastAPI is a Python web framework that is incredibly fast. Since all our science and math formulas (like the earthquake physics) are written in Python, FastAPI was the perfect choice to serve them.

**Technical Answer:**  
FastAPI provides high-performance asynchronous execution natively via ASGI (Starlette) and automatic data validation via Pydantic. Node.js is great for I/O, but terrible for CPU-bound tasks like geospatial matrix multiplication. Django is too heavy and monolithic for an API-only microservice. FastAPI gave us the speed of Node.js combined with the vast scientific ecosystem of Python (NumPy, SciPy, Rasterio).

**Advanced Answer:**  
In our hazard simulations, an endpoint might need to parse an incoming JSON payload, perform a spatial query, run a GMPE over a 10,000-cell NumPy array, interpolate the results, and serialize it back to GeoJSON. FastAPI handles the async HTTP request non-blockingly, while NumPy releases the Global Interpreter Lock (GIL) under the hood to crunch the C-compiled math arrays. Pydantic ensures that the complex multi-hazard payload structures are strictly typed and validated before they ever touch the physics engine, preventing fatal runtime exceptions in the matrix operations.

**Follow-up Questions:**  
* What is ASGI vs WSGI?
* How do you handle long-running simulations? (Answer: Currently synchronously if they are fast enough via NumPy optimization, but Celery/Redis would be used for multi-minute jobs).

**Common Mistakes:**  
* Saying "FastAPI makes Python run faster." FastAPI is fast for routing and I/O; the actual math speed comes from NumPy/C bindings.

**Project Relation:**  
The entire `backend/app/api/endpoints` directory relies on FastAPI routes. When the user clicks "Run Sim", a POST request hits FastAPI, which delegates the CPU-bound task to the `services` layer, and returns the resulting GeoJSON.

---

## SECTION 11 — DATABASE

### Q11.1: What database is used, and what is PostGIS?

**Beginner Answer:**  
Currently, we store our static data in flat files (like JSON and GeoTIFF). In the future, we would use a spatial database called PostgreSQL with PostGIS to query the map data much faster.

**Technical Answer:**  
Our current prototype relies heavily on in-memory operations using Pandas/NumPy and caching GeoJSON responses. For a production-scale system, the architecture mandates PostgreSQL extended with the PostGIS extension. PostGIS adds native spatial types (Geometry, Geography) and spatial indexing (R-Tree / GiST).

**Advanced Answer:**  
Without PostGIS, finding which hazard grid cells intersect a specific state boundary requires loading all polygons into memory and running a computational geometry algorithm (like Ray Casting) in Python. With PostGIS, you can execute a highly optimized SQL query using `ST_Intersects()`. The GiST (Generalized Search Tree) index mathematically bounds polygons into boxes (Bounding Box), allowing the database engine to prune millions of irrelevant rows in milliseconds before doing the exact geometry check, drastically reducing API latency.

**Follow-up Questions:**  
* What is the difference between Geometry and Geography in PostGIS? (Geometry uses a flat cartesian plane; Geography calculates on a sphere/spheroid).
* Why are you using flat files right now? (Prototyping speed and avoiding complex database container setups during initial development).

**Common Mistakes:**  
* Assuming MongoDB is good for this. While MongoDB supports GeoJSON, its spatial querying capabilities are vastly inferior to PostGIS for complex polygon intersections.

**Project Relation:**  
While not fully implemented, discussing PostGIS shows the examiners that you understand how to scale this prototype into an enterprise-grade system.

---

## SECTION 12 — DOCKER

### Q12.1: Why is Docker necessary for this project?

**Beginner Answer:**  
Docker packages our entire project (React, Python, libraries) into a box. This ensures that if the code runs on my laptop, it will run exactly the same way on the examiner's laptop or a cloud server.

**Technical Answer:**  
Docker uses containerization to isolate the application environment from the host operating system. A `Dockerfile` defines the exact OS dependencies, Python versions, and pip packages needed. This prevents the classic "it works on my machine" problem, resolving painful cross-platform issues with complex C-based libraries like GDAL and Rasterio, which are notoriously difficult to install on Windows.

**Advanced Answer:**  
We utilize `docker-compose` to orchestrate multiple microservices simultaneously. The `docker-compose.yml` file defines the networking namespace, allowing the Vite Frontend container to communicate with the FastAPI Backend container internally via hostname resolution (e.g., `http://backend:8000`) without exposing ports unnecessarily. It also ensures consistent environment variable injection and volume mapping for local development (hot-reloading inside the container via mounted host directories).

**Follow-up Questions:**  
* What is the difference between a Container and a Virtual Machine? (Containers share the host OS kernel and are lightweight; VMs have a full guest OS).
* What is an Image vs a Container? (An Image is the read-only blueprint; a Container is the running instance of that blueprint).

**Common Mistakes:**  
* Saying Docker "makes the code run faster." Docker adds a microscopic layer of overhead; its purpose is consistency, not execution speed.

**Project Relation:**  
The project root contains `docker-compose.yml`, which spins up both the React frontend and the Python backend with a single `docker compose up` command.
