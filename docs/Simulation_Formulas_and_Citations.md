# Comprehensive Simulation Formulas & Literature Citations

This document serves as the master reference for the mathematical physics engine powering the National Landslide Hazard Mapping system. Every equation below is currently executing in `risk_model.py`.

---

## 1. Static Vulnerability Model (AHP Single-Level Renormalization)
Due to the macro-scale unavailability of 1:50,000 geological lithology shapefiles, the model mathematically omits geological criteria and renormalizes the available parameters using accepted single-level hierarchy mathematics.

**Mathematical Formula Used:**
\[ w'_i = \frac{w_i}{\sum_{j=1}^{k} w_j} \]
*(Where $w'_i$ is the new weight, $w_i$ is the original published weight, and the denominator is the sum of the original weights for available parameters).*

**Himalayan Region Equation:**
\[ S_{Himalaya} = (0.676 \times S_{norm}) + (0.176 \times M_{norm}) + (0.147 \times E_{norm}) \]
**Kerala / Western Ghats Equation:**
\[ S_{Kerala} = (0.268 \times S_{norm}) + (0.662 \times M_{norm}) + (0.070 \times E_{norm}) \]

> [!TIP]
> **Source / Citation:** 
> *   The Renormalization Methodology is sourced from: **Wijnmalen, D.J.D. (2004). "A non-discriminating criterion in an Analytic Hierarchy Process (AHP) hierarchy."**
> *   The original pre-normalized Himalayan weights were sourced from: **Dwivedi et al. (2026) AHP-GIS framework for the Uttarkashi–Gangotri highway corridor.**
> *   The original pre-normalized Kerala weights were sourced from: **Irshad et al. (2025) AHP framework applied to Wayanad district.**

---

## 2. Terrain Normalization & Thresholds (Gaussian Membership)
Instead of linear scaling, continuous geospatial data (Slope, Elevation) is mapped to hazard probability using fuzzy Gaussian bell curves.

**Mathematical Formula Used:**
\[ f(x) = \exp\left(-\frac{(x - c)^2}{2w^2}\right) \]
*(Where $c$ is the center/peak hazard value, and $w$ is the width of the curve).*

*   **Himalaya Slope Center:** $40^\circ$
*   **Kerala Slope Center:** $38^\circ$
*   **Himalaya Elevation Center:** $2500m$
*   **Kerala Elevation Center:** $650m$
*   **Soil Moisture Threshold:** Absolute maximum hazard ($1.0$) achieved at $\ge 0.7$ ($70\%$) saturation.

> [!TIP]
> **Source / Citation:** 
> *   Himalayan Slope ($30^\circ-50^\circ$ bounds) and Elevation ($2000m-3000m$ bounds) sourced from empirical data in the **Garhwal (Chamoli-Joshimath) region literature.**
> *   Kerala Slope ($35^\circ-45^\circ$ bounds), Elevation ($545m-782m$), and Soil Saturation ($> 0.7$) sourced from physical hydrological models of **tropical monsoonal environments.**

---

## 3. Rainfall Intensity-Duration (I-D) Thresholds
The critical rainfall intensity ($I_{crit}$) required to trigger a landslide, calculated dynamically based on regional location.

**Mathematical Formulas Used:**
*   **Garhwal Himalayas:** $I_{himalaya} = 58.7 \times D^{-1.12}$
*   **Kerala / Western Ghats:** $I_{kerala} = 0.9 \times D^{-0.16}$

> [!TIP]
> **Source / Citation:** 
> *   Himalayan Threshold sourced from: **Sengupta et al. (2013).**
> *   Kerala Threshold sourced from: **Abraham et al. (2019). "Rainfall Thresholds for Prediction of Landslides in Idukki, India."**

---

## 4. Probabilistic Rainfall Trigger Conversion (S-Curve)
Converts raw rainfall exceedance into a dynamic probability of failure (0.0 to 1.0).

**Mathematical Formula Used:**
\[ P_{trigger} = \frac{1}{1 + \exp(-k \times (I - I_{crit}))} \]

> [!TIP]
> **Source / Citation:** 
> *   This is an engineering implementation of the **Multidimensional Bayesian Probability Framework** (e.g., Berti et al., 2012). Because exact multi-dimensional Bayesian matrices require decades of historical hourly rainfall data (which is unavailable), we use the Logistic Sigmoid function as a proxy to replicate the Bayesian sudden, non-linear geometric amplification of probability when thresholds are exceeded.

---

## 5. Earthquake-Induced Slope Failure (Newmark Block Model)
Predicts physical soil displacement and probability of failure based on Peak Ground Acceleration (PGA).

**Mathematical Formulas Used:**
1.  **Critical Acceleration ($A_c$):** $A_c = 0.05 + 1.0 \times (1.0 - S)$ *(Engineering proxy mapping yield acceleration inversely to static susceptibility)*
2.  **Newmark Displacement ($D_n$ in cm):** 
    \[ \log(D_n) = 0.215 + \log_{10} \left( \left(1 - \frac{A_c}{PGA}\right)^{2.34} \times \left(\frac{A_c}{PGA}\right)^{-1.43} \right) \]
3.  **Probability of Failure ($P_f$):**
    \[ P_f = 0.335 \times \left(1 - \exp(-0.048 \times D_n^{1.565})\right) \]

> [!TIP]
> **Source / Citation:** 
> *   Displacement ($D_n$) sourced from: **Jibson, R.W. (2007). "Models for Estimating Newmark Displacement."**
> *   Probability ($P_f$) sourced from: **Jibson et al. (2000). "A Method for Producing Digital Probabilistic Seismic Landslide Hazard Maps."**

---

## 6. Dynamic Risk Fusion (GIRI Matrix Logic)
Fuses the static terrain vulnerability ($S$) with the dynamic climatic/seismic trigger ($T$) to calculate the final live hazard map.

**Mathematical Formula Used:**
\[ Risk = \sqrt{S \times T} \]

> [!TIP]
> **Source / Citation:** 
> *   Sourced from the **Global Infrastructure Resilience Index (GIRI) Hazard Matrix framework**, developed for the Coalition for Disaster Resilient Infrastructure (CDRI).
> *   By using the Geometric Mean (Square Root of the product), the continuous spatial model perfectly mimics the GIRI Intersection Matrix logic. It guarantees that an extreme $H_4$ hazard alert is exclusively generated at the intersection where extreme terrain fragility ($S \to 1.0$) meets extreme dynamic forcing ($T \to 1.0$), mathematically preventing the dilution of risk found in standard additive models.
