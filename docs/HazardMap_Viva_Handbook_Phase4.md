## SECTION 18 — 200+ VIVA QUESTION BANK

*(Note: These questions are formatted as direct Q&A for rapid study and revision).*

### 18.1 Basic Questions (50)
1. **What is the full form of GIS?** Geographic Information System.
2. **What is a DEM?** Digital Elevation Model; a 3D representation of terrain.
3. **What does your project do?** Simulates and visualizes multi-hazard risks (earthquake, landslide, heatwave) dynamically on a map.
4. **What programming language is the backend written in?** Python.
5. **What is the frontend framework?** React (using Vite).
6. **What is a GeoJSON?** A JSON format for encoding geographic data structures (Points, Lines, Polygons).
7. **What is the difference between latitude and longitude?** Latitude measures North-South; Longitude measures East-West.
8. **What is an epicenter?** The point on the Earth's surface directly above the earthquake's origin.
9. **What is a hypocenter?** The actual 3D point underground where the earthquake originates.
10. **What scale measures earthquake magnitude?** Moment Magnitude Scale ($M_w$).
11. **What does PGA stand for?** Peak Ground Acceleration.
12. **What is a landslide?** The downward movement of a mass of rock, earth, or debris down a slope.
13. **Name one trigger for a landslide.** Heavy rainfall (or earthquake).
14. **What is a heatwave?** A period of abnormally high temperatures, defined by specific anomalies above historical normals.
15. **What does IMD stand for?** Indian Meteorological Department.
16. **What is the UHI effect?** Urban Heat Island effect; cities are hotter than rural areas due to human activities and concrete.
17. **What does WBGT stand for?** Wet-Bulb Globe Temperature.
18. **Why is WBGT important?** It accounts for humidity, which affects human survivability during heatwaves.
19. **What map library did you use?** MapLibre GL JS (or Mapbox GL JS).
20. **What is an API?** Application Programming Interface; how the frontend talks to the backend.
21. **What is REST?** Representational State Transfer; a standard architecture for web APIs.
22. **What framework did you use for the API?** FastAPI.
23. **What is Docker?** A tool to containerize applications so they run consistently everywhere.
24. **What is a raster?** A grid of pixels where each pixel has a value (e.g., elevation).
25. **What is a vector in GIS?** Points, lines, or polygons defining boundaries.
26. **What is spatial resolution?** The real-world size of one pixel in a raster (e.g., 30m x 30m).
27. **What resolution is your DEM?** 30 meters.
28. **What is slope?** The steepness or incline of the terrain.
29. **What is aspect?** The compass direction that a slope faces.
30. **What does CRS stand for?** Coordinate Reference System.
31. **What is WGS84?** The standard global coordinate system used by GPS (EPSG:4326).
32. **What is Machine Learning?** Algorithms that learn patterns from data instead of being explicitly programmed.
33. **What ML algorithm did you use?** Random Forest.
34. **Why Random Forest?** It handles tabular spatial data well and prevents overfitting.
35. **What is Susceptibility?** The inherent likelihood of a hazard occurring based on static terrain conditions.
36. **What is Hazard?** Susceptibility combined with a dynamic trigger (like rain).
37. **What is Risk?** Hazard multiplied by exposure and vulnerability (damage to people/property).
38. **Where did you get elevation data?** Copernicus/SRTM missions.
39. **Where did you get climate data?** ERA5 (ECMWF) and Open-Meteo.
40. **How did you store state in React?** Using Zustand.
41. **What is an isoline (contour line)?** A line on a map connecting points of equal value (e.g., equal PGA or equal elevation).
42. **What is a choropleth map?** A map where areas are shaded in proportion to a statistical variable (like heatwave severity).
43. **What is a frontend component?** A reusable piece of UI code in React.
44. **What is an HTTP POST request?** A method to send data to a server to create/update a resource (like running a simulation).
45. **What is JSON?** JavaScript Object Notation; a lightweight data-interchange format.
46. **What is NumPy?** A Python library for fast array and matrix math.
47. **What is a topographic map?** A map showing the physical features and elevation of a landscape.
48. **What is the Richter scale?** An outdated logarithmic scale for earthquake magnitude.
49. **What is lithology?** The physical characteristics of rocks.
50. **What does 'open-source' mean?** Software with source code that anyone can inspect, modify, and enhance.

### 18.2 Intermediate Questions (75)
51. **Explain the difference between a DEM, DSM, and DTM.** DEM is bare earth. DSM includes buildings and trees. DTM is a DEM augmented with breaklines.
52. **How do you calculate slope from a DEM?** Using a 3x3 moving window (Sobel operator) to find the rate of change in Z over X and Y.
53. **What is a GMPE?** Ground Motion Prediction Equation; predicts PGA based on magnitude and distance.
54. **Why use hypocentral distance instead of epicentral distance?** Epicentral distance ignores depth, which drastically overestimates surface shaking for deep earthquakes.
55. **How does soil amplification work?** Soft soils ($V_{s30}$) trap and amplify seismic waves, increasing surface PGA compared to hard bedrock.
56. **What is the Infinite Slope Stability model?** A geotechnical physics model to calculate the Factor of Safety of a slope.
57. **How does rainfall affect the Factor of Safety?** It increases pore water pressure, which reduces effective stress and soil shear strength.
58. **What is Newmark Displacement?** A method to estimate how far a slope block will slide during an earthquake.
59. **Explain the IMD Heatwave criteria.** Base temp > 40°C, and anomaly > 4.5°C (Heatwave) or > 6.4°C (Severe).
60. **Why is a Wet-Bulb temperature of 35°C fatal?** The human body cannot cool itself via evaporation when the wet-bulb temperature equals skin temperature.
61. **How do you calculate WBGT?** Using empirical formulas (like Stull's) taking dry-bulb temperature and relative humidity.
62. **How does the UHI toggle work in your code?** It applies a static positive temperature modifier (+2°C) to grid cells located over known urban areas.
63. **What is Web Mercator?** EPSG:3857; the projection used by web maps to render a flat map, though it distorts polar areas.
64. **Why project coordinates from EPSG:4326 to a local UTM?** To calculate accurate metric distances (meters), since degrees of longitude vary in physical length.
65. **What is the Haversine formula?** Calculates the great-circle distance between two points on a sphere given their longitudes and latitudes.
66. **What is an ensemble model in ML?** A model that combines multiple weak learners (like decision trees) to create a strong learner (like Random Forest).
67. **What is Gini Impurity?** A metric used by Random Forest to decide how to split a decision tree node based on class purity.
68. **What is a multi-hazard system?** A system that models multiple cascading or compounding hazards simultaneously.
69. **How do you handle cross-origin requests (CORS)?** By configuring the FastAPI CORS middleware or using a Vite development proxy.
70. **What is Pydantic in FastAPI?** A library for data validation and settings management using Python type annotations.
71. **What is ASGI?** Asynchronous Server Gateway Interface; standard for Python async web apps, allowing non-blocking I/O.
72. **How did you optimize the raster rendering?** By not rendering rasters directly; instead, processing them backend into lightweight GeoJSON isolines.
73. **What is a Mapbox Vector Tile (MVT)?** A highly compressed, tile-based vector format optimized for web rendering.
74. **Why use Zustand instead of Redux?** Zustand has less boilerplate, no providers, and allows transient updates without forced component re-renders.
75. **What is a React Hook?** A function that lets you "hook into" React state and lifecycle features (e.g., `useState`, `useEffect`).
76. **How do you generate contour lines from a grid?** Using algorithms like Marching Squares (via `scipy.interpolate` or `turf.isolines`).
77. **What is a choropleth vs an isoline map?** Choropleth colors distinct polygonal boundaries (like states or grid cells); isolines draw continuous contour rings.
78. **What is SMOTE?** Synthetic Minority Over-sampling Technique; used to balance imbalanced ML datasets.
79. **Why is landslide data usually imbalanced?** Because 99% of a mountain is stable, and only 1% contains actual landslide events.
80. **What is an ROC curve?** Receiver Operating Characteristic curve; plots True Positive Rate vs False Positive Rate to evaluate an ML model.
81. **What is AUC?** Area Under the ROC Curve; a single metric summarizing model performance (0.5 is random, 1.0 is perfect).
82. **What is Boruta feature selection?** A wrapper algorithm around Random Forest that iteratively compares original features against randomized shadow features to find truly important variables.
83. **What are the inputs to your Landslide model?** Slope, elevation, aspect, rainfall, lithology, PGA.
84. **What is the output of your GMPE?** A grid of PGA (Peak Ground Acceleration) values.
85. **What is spatial resolution vs temporal resolution?** Spatial = pixel size (e.g., 30m). Temporal = how often data is updated (e.g., hourly for ERA5).
86. **How does ERA5 data differ from satellite imagery?** ERA5 is a reanalysis dataset combining model data with observations globally.
87. **What is a NetCDF file?** Network Common Data Form; a format for array-oriented scientific data (often mult-dimensional like time, lat, lon).
88. **How do you read a NetCDF in Python?** Using `xarray` or `netCDF4` libraries.
89. **How do you read a GeoTIFF in Python?** Using `rasterio` or `gdal`.
90. **What is bilinear interpolation?** A resampling method that averages the 4 nearest pixel values, used for continuous data like temperature.
91. **What is nearest-neighbor interpolation?** A resampling method that assigns the exact value of the closest pixel, used for categorical data like rock type.
92. **What does a Dockerfile do?** It provides step-by-step instructions to build a Docker image.
93. **What does docker-compose do?** Orchestrates multiple Docker containers (like backend and frontend) to run together on a shared network.
94. **How do you pass variables to React at build time?** Using `.env` files and `import.meta.env`.
95. **What is the difference between `useEffect` and `useLayoutEffect`?** `useEffect` runs asynchronously after render; `useLayoutEffect` runs synchronously before the browser paints.
96. **How did you test your APIs?** Using Swagger UI (auto-generated by FastAPI) or Postman.
97. **What HTTP status code is for 'Not Found'?** 404.
98. **What HTTP status code is for 'Internal Server Error'?** 500.
99. **How does your map update without refreshing the page?** React updates the DOM/WebGL context reactively when Zustand state changes.
100. **What is a Web Worker?** A JavaScript script executed in the background, independent of UI scripts, to prevent UI freezing (though your project uses server-side processing instead).
101. **Why not do all math in the browser using JavaScript?** JS is single-threaded and slow for large matrix math compared to Python's C-compiled NumPy arrays.
102. **What is the GIL in Python?** Global Interpreter Lock; prevents multiple native threads from executing Python bytecodes at once.
103. **How does NumPy bypass the GIL?** NumPy operations are written in C and release the GIL during massive array computations.
104. **What is vectorization in NumPy?** Performing operations on entire arrays at once rather than using slow Python `for` loops.
105. **What is the `turf.js` library?** A spatial analysis library for JavaScript used to manipulate GeoJSON.
106. **How do you define a bounding box (BBOX)?** By minimum and maximum longitudes and latitudes [minX, minY, maxX, maxY].
107. **What is a Point vs a Polygon in GeoJSON?** Point is a single coordinate `[lon, lat]`. Polygon is an array of linear rings `[[[lon, lat], ...]]]`.
108. **What is a topological error?** Errors in vector data like overlapping polygons, gaps, or unclosed rings.
109. **What does it mean to "clip" a raster?** Masking out or deleting all raster pixels outside a specific polygon boundary (like a state border).
110. **What is a "NoData" value in a raster?** A specific pixel value (e.g., -9999) indicating the absence of valid data.
111. **Why is it hard to predict earthquakes?** We cannot measure stress buildup deep within the earth's crust accurately enough to predict exact time and magnitude.
112. **Why do we use deterministic scenarios for earthquakes?** Since we can't predict them, we simulate a specific hypothetical event to prepare for its impact.
113. **What is probabilistic hazard assessment (PSHA)?** Calculating the statistical probability of exceeding a certain hazard level over a return period (e.g., 50 years).
114. **What is an active fault?** A geological fault that is likely to become the source of an earthquake in the future.
115. **How does aspect influence landslides?** Aspect determines sunlight exposure and wind, which affects soil moisture, vegetation density, and weathering rates.
116. **How does curvature influence landslides?** Concave curvature converges water (increasing pore pressure); convex disperses water.
117. **What is a slip surface?** The underground boundary plane where a landslide mass separates from the stable ground.
118. **What is debris flow?** A fast-moving landslide made of water, mud, and rocks.
119. **What is climate change's effect on heatwaves?** It increases both their frequency and their intensity (pushing the statistical normal distribution curve to the right).
120. **What is the difference between a forecast and a simulation?** A forecast predicts reality based on current data; a simulation models a hypothetical "what if" scenario.
121. **How do you update the map when the slider moves?** The slider updates a Zustand state variable, which triggers a `useEffect` hook in MapView to swap the GeoJSON data source.
122. **What is the difference between `source` and `layer` in Mapbox?** `source` holds the raw GeoJSON data; `layer` defines how that data is styled and painted on the screen.
123. **Why did you use WebGL?** It utilizes the GPU hardware for rendering graphics, allowing smooth rendering of millions of vectors.
124. **How do you ensure data security in your API?** Through CORS policies, input validation (Pydantic limits), and potentially rate limiting.
125. **What is the role of `vite.config.js`?** Configures the Vite build tool, handling plugins, aliases, and local proxying to bypass CORS during development.

### 18.3 Advanced Questions (75)
126. **Explain the math behind the Newmark Sliding Block model.** It calculates cumulative displacement by double-integrating the acceleration time-history whenever the input acceleration exceeds the critical yield acceleration ($a_c$) of the slope.
127. **Derive the Factor of Safety for an infinite slope.** $FoS = \frac{\text{Resisting Forces}}{\text{Driving Forces}} = \frac{c' + (\gamma z \cos^2\beta - u)\tan \phi'}{\gamma z \sin\beta \cos\beta}$.
128. **How does the spatial resolution of a DEM affect slope accuracy?** Coarse DEMs (e.g., 90m) artificially flatten the terrain, underestimating slope angles and thus underestimating landslide susceptibility.
129. **What is the Modifiable Areal Unit Problem (MAUP)?** A statistical bias occurring when point-based measures are aggregated into geographic districts; changing district boundaries changes the statistical results.
130. **How did you solve the OOM (Out of Memory) issue with large NumPy arrays?** By processing in blocks, using `dtype=float32` instead of `float64`, or downsampling the grid dynamically based on the requested BBOX.
131. **Explain the difference between a Decision Tree and a Random Forest.** A DT is a single tree prone to overfitting. RF is an ensemble of many DTs trained on bootstrapped data subsets (bagging) that output the majority vote.
132. **What is spatial autocorrelation in ML?** The phenomenon where data points close to each other are more similar than distant ones (Tobler's First Law). It violates the Independent and Identically Distributed (I.I.D) assumption in standard ML.
133. **How do you account for spatial autocorrelation in train/test splitting?** By using Spatial Block Cross-Validation (splitting by geographic tiles) rather than random K-Fold split.
134. **What is the role of the focal mechanism in an earthquake?** It defines the orientation of the fault and the direction of slip (strike-slip, normal, reverse), affecting the radiation pattern of seismic waves. Does your GMPE account for it?
135. **Explain the mathematical concept of Convolution in GIS.** Applying a filter matrix (kernel) across a raster to calculate moving window operations, like the Sobel filter for slope calculation.
136. **What is the difference between GDAL and Rasterio?** Rasterio is a more Pythonic, idiomatic wrapper around the foundational C/C++ GDAL library.
137. **How does a GiST index work in PostGIS?** It uses R-Trees (bounding boxes) to rapidly rule out geometries that definitely don't intersect, before doing exact, slow computational geometry on the remaining candidates.
138. **Write the SQL to find all landslides inside a state.** `SELECT l.* FROM landslides l JOIN states s ON ST_Intersects(l.geom, s.geom) WHERE s.name = 'StateName';`
139. **How would you implement real-time streaming of earthquake data?** Connect to the USGS WebSocket or Kafka stream, push updates to the React client via Socket.io or Server-Sent Events (SSE).
140. **What is the difference between CSR (Client-Side Rendering) and SSR (Server-Side Rendering)?** CSR ships JS to the browser to build the DOM; SSR builds HTML on the server and sends it ready to the browser (e.g., Next.js). HazardMap uses CSR for the dashboard UI.
141. **How do you prevent excessive API calls when dragging the slider?** By implementing a `debounce` or `throttle` function on the input onChange handler.
142. **Explain the MapLibre `paint` interpolation syntax.** `['interpolate', ['linear'], ['get', 'property'], stop1, color1, stop2, color2]` mathematically blends colors between specified property values.
143. **Why do heatmaps oversaturate on dense grids, and how did you fix it?** Mapbox heatmaps sum density; dense grids cause values to exceed 1.0. Fixed by dynamically scaling down `intensity_normalized` weights for dense FeatureCollections.
144. **What is the mathematical difference between Isobands and Isolines?** Isolines are 1D topological rings connecting equal values; Isobands are 2D topological polygons bounded by isolines.
145. **How does SciPy's `griddata` function work?** It interpolates unstructured multi-dimensional point data onto a regular grid using nearest-neighbor, linear, or cubic (Delaunay triangulation) algorithms.
146. **What is the Stull empirical formula?** A formula to calculate Wet-Bulb Temperature from dry-bulb temp and RH, avoiding complex iterative psychrometric charts.
147. **How does UHI affect the diurnal temperature range?** It decreases it; cities retain heat and do not cool down as much as rural areas during the night.
148. **Explain the physical meaning of $V_{s30}$.** The time-averaged shear-wave velocity in the top 30 meters of the earth; defines site classification for seismic amplification.
149. **What is Liquefaction?** When saturated, loose soils lose shear strength and stiffness due to earthquake shaking, behaving like a liquid.
150. **How do you calculate Peak Ground Velocity (PGV) from PGA?** Empirical correlations depend on magnitude, distance, and soil type, but roughly PGV (cm/s) correlates with PGA.
151. **What is a Docker volume?** A mechanism for persisting data generated by and used by Docker containers, bypassing the ephemeral container filesystem.
152. **Explain the purpose of `useEffect` cleanup functions.** To prevent memory leaks by unsubscribing from WebSockets, clearing intervals, or aborting fetch requests when a component unmounts.
153. **What is an `AbortController` in JS?** An interface that allows you to abort one or more Web requests as and when desired. Used to cancel stale API requests in our map.
154. **How do you handle Z-index/layer ordering in Mapbox?** By explicitly passing a `beforeId` parameter when adding a layer, or using `map.moveLayer()`.
155. **What is the difference between Starlette and FastAPI?** FastAPI is built *on top of* Starlette, adding Pydantic data validation and auto-generated OpenAPI docs.
156. **What is the Big-O time complexity of querying a raw Raster for a pixel value?** $O(1)$ if the array is in memory; if searching via bounding box, $O(1)$ via matrix slicing.
157. **How does the Ray Casting algorithm work?** To check if a point is inside a polygon, cast a ray in any direction and count intersections; odd = inside, even = outside.
158. **Explain the concept of Physics-Informed Neural Networks (PINNs).** Incorporating partial differential equations (PDEs) into the loss function of a neural network so it learns the physics, not just data correlations.
159. **Why is forecasting landslides harder than earthquakes?** Earthquakes originate deep and propagate predictably through rock. Landslides depend on highly heterogeneous, localized surface conditions (soil depth, localized rainfall, human cutting).
160. **What is the difference between a 1D and 2D flood model?** 1D routes water through a defined channel profile; 2D routes water across a complex spatial grid (floodplains).
161. **How do you extract a river network from a DEM?** Fill sinks -> Flow Direction (D8 algorithm) -> Flow Accumulation -> Stream definition by threshold.
162. **What is the difference between active and passive remote sensing?** Active (like LiDAR/Radar) emits a signal and reads the bounce. Passive (like Optical satellites) reads natural reflected sunlight.
163. **What is InSAR?** Interferometric Synthetic Aperture Radar; detects millimeter-level ground deformation over time, useful for detecting slow-moving landslides.
164. **How would you deploy this platform to AWS?** Dockerize the app, push to ECR. Use ECS (Fargate) to run containers. Serve frontend via S3/CloudFront. Connect to managed PostgreSQL/PostGIS in RDS.
165. **What is a Reverse Proxy (e.g., Nginx)?** A server that sits in front of backend servers and forwards client requests to them; provides load balancing, SSL termination, and caching.
166. **What is the difference between deterministic and probabilistic modeling?** Deterministic answers "What happens if this exact event occurs?" Probabilistic answers "What is the chance of this happening in the next 50 years?"
167. **How did you handle the NaN/NoData values in NumPy arrays?** Using `np.nan_to_num` or masked arrays (`np.ma`) to ignore void pixels during computation.
168. **What is the role of an Activation Function in Deep Learning?** Introduces non-linearity into the network, allowing it to learn complex patterns (e.g., ReLU, Sigmoid).
169. **Explain the Bias-Variance Tradeoff.** Bias is error from erroneous assumptions in the learning algorithm (underfitting). Variance is error from sensitivity to small fluctuations in the training set (overfitting).
170. **Why do you scale/normalize data for SVMs but not for Random Forests?** SVMs rely on distance metrics (Euclidean) which are skewed if features have different scales. Decision Trees split on thresholds, which are scale-invariant.
171. **What is Cross-Entropy Loss?** A loss function used in classification tasks that measures the performance of a model whose output is a probability value between 0 and 1.
172. **What is the difference between HTTP/1.1 and HTTP/2?** HTTP/2 introduces multiplexing (multiple requests over a single TCP connection), header compression, and server push.
173. **How do you optimize a Dockerfile to be small?** Use Alpine Linux base images, use multi-stage builds (compile in one stage, run in a minimal stage), and combine `RUN` commands to reduce layers.
174. **What is the Event Loop in Node.js/JavaScript?** A mechanism that handles asynchronous callbacks, executing them when the call stack is empty, allowing JS to be non-blocking.
175. **What is a Promise in JavaScript?** An object representing the eventual completion (or failure) of an asynchronous operation and its resulting value.
176. **How does Python's `asyncio` differ from JavaScript's Event Loop?** Python requires explicit `await` and `async` keywords to yield control back to the event loop, whereas JS handles async implicitly in its runtime.
177. **What is a Tiled Web Map?** A map that loads geographic data in multiple seamless square tiles (usually 256x256 pixels) based on the XYZ coordinate scheme to save bandwidth.
178. **What is the difference between Raster Tiles (PNG/JPG) and Vector Tiles (PBF)?** Raster tiles are pre-rendered images; they get blurry when zoomed. Vector tiles contain raw geometry data, allowing the client (browser) to style and render them crisply at any zoom level.
179. **How would you secure the FastAPI endpoints from DDoS attacks?** Implement Rate Limiting middleware (e.g., `slowapi`), use API keys, and put it behind a Web Application Firewall (WAF) like Cloudflare.
180. **What is the difference between `GET` and `POST` methods?** `GET` retrieves data and encodes parameters in the URL (not secure for large/sensitive data). `POST` submits data enclosed in the request body.
181. **Why is state management hard in React?** Because data flows unidirectionally down the component tree. Passing props deeply (prop drilling) becomes unmanageable, necessitating context or global stores like Zustand.
182. **What is a closure in JavaScript?** A function that remembers the variables from its lexical scope even after the outer function has finished executing.
183. **How do you calculate the area of a polygon defined by coordinates?** Using the Shoelace formula (Surveyor's formula) for planar coordinates, or spherical geometry algorithms for EPSG:4326.
184. **What is the difference between Earth's Geoid and Ellipsoid?** Ellipsoid is a smooth mathematical model of Earth. Geoid is the true, lumpy shape of Earth based on gravitational potential.
185. **Why do we use the WGS84 Ellipsoid?** It is the standard reference frame for GPS systems globally, providing a common baseline.
186. **What is the purpose of a Spatial Index (R-Tree)?** To drastically speed up spatial queries (like intersections) by grouping nearby objects and representing them with their minimum bounding rectangles.
187. **How does the Sobel operator work for slope?** It applies two 3x3 convolution kernels (one for X-gradient, one for Y-gradient) over the DEM to approximate the derivatives of elevation.
188. **What is Hydrological Conditioning of a DEM?** Filling artificial sinks/pits and burning streams into a DEM to ensure water routes continuously across the surface.
189. **What is the 'Curse of Dimensionality' in ML?** As the number of features increases, the volume of the feature space increases so fast that the available data becomes sparse, making statistical significance hard to find.
190. **How does XGBoost differ from Random Forest?** RF trains trees independently (bagging). XGBoost trains trees sequentially, where each new tree tries to correct the errors (residuals) of the previous ones (boosting).
191. **What is the difference between L1 and L2 regularization?** L1 (Lasso) shrinks less important feature weights to exactly zero. L2 (Ridge) shrinks weights close to zero but not exactly.
192. **How does an HTTP Proxy work in Vite?** It intercepts frontend requests (e.g., `/api/xyz`) and forwards them to the backend server, tricking the browser into thinking they are on the same domain to bypass CORS restrictions during development.
193. **What is a JWT?** JSON Web Token; a compact, URL-safe means of representing claims securely between two parties, often used for authentication.
194. **How do you prevent SQL Injection in PostgreSQL?** By using parameterized queries or an ORM (like SQLAlchemy) that automatically escapes input variables.
195. **What is the CAP Theorem?** In a distributed database, you can only guarantee two out of three: Consistency, Availability, and Partition Tolerance.
196. **What is the difference between monolithic and microservice architecture?** Monolithic is a single unified codebase/deployment. Microservices break the app into smaller, independent, loosely coupled services communicating via APIs.
197. **Explain the Concept of 'State' in Web Development.** State represents the data or UI condition of an application at a specific moment in time.
198. **How does React's Reconciliation process work?** React compares the new Virtual DOM with the old Virtual DOM (Diffing), identifies the changes, and updates the real DOM efficiently in batches.
199. **What is the difference between a Float32 and Float64?** Float64 (Double) has double the precision and takes twice the memory (8 bytes vs 4 bytes). Downcasting to Float32 is a common optimization in large NumPy arrays.
200. **If you had to redo the project, what architectural change would you make?** Migrating to PostGIS for all spatial operations instead of relying entirely on in-memory NumPy/Pandas processing, allowing for planet-scale horizontal scaling.
