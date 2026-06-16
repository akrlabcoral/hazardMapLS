# HazardMap Physics Engine: Mathematical Models & Equations

This document contains every core mathematical equation powering the HazardMap simulation engine. For your viva presentation, it is crucial to know which equations are pulled directly from peer-reviewed literature (**Scientifically Backed**) and which were created by us to make the national-scale code work (**Implementation Assumptions**).

---

## 1. Static Vulnerability Model (Shared Base)

Before any triggers (rain or earthquakes) are applied, the engine calculates the baseline "Susceptibility" ($S$) of the terrain using an Analytic Hierarchy Process (AHP).

## 1. Static Vulnerability Model (AHP Single-Level Renormalization)

Due to the macro-scale unavailability of 1:50,000 geological lithology shapefiles, the model mathematically omits the geological criteria and renormalizes the available parameters using Wijnmalen's (2004) accepted methodology for single-level hierarchies.

### The Renormalization Equation
\[ w'_i = \frac{w_i}{\sum_{j=1}^{k} w_j} \]
Where $w'_i$ is the new weight, $w_i$ is the original published weight, and the denominator is the sum of the original weights for the *available* parameters.

### A. Himalayan Model (Dwivedi et al. 2026 Base)
*   **Original Sum:** Slope (0.23) + Soil Base (0.06) + Elevation (0.05) = **0.34**
*   **Renormalized Equation:**
\[ S_{Himalaya} = (0.676 \times S_{norm}) + (0.176 \times M_{norm}) + (0.147 \times E_{norm}) \]

### B. Western Ghats / Kerala Model (Irshad et al. 2025 Base)
*   **Original Sum:** Soil/Rain (0.47) + Slope (0.19) + Elevation (0.05) = **0.71**
*   **Renormalized Equation:**
\[ S_{Kerala} = (0.268 \times S_{norm}) + (0.662 \times M_{norm}) + (0.070 \times E_{norm}) \]

> [!TIP]
> **Status: Scientifically Backed**
> By utilizing Wijnmalen (2004)'s framework, the model prevents arbitrary weight assignments. Historical Landslide Density has been explicitly omitted from the static equation to prevent mathematical circular reasoning (overfitting), as strictly advised by contemporary literature.

---

## 2. Rainfall-Induced Simulation Model

### A. Regional I-D Thresholds ($I_{crit}$)
The critical rainfall intensity ($I_{crit}$) required to trigger a landslide, calculated dynamically based on regional location parameters.

1.  **Kerala / Western Ghats:**
    \[ I_{kerala} = 0.9 \times D^{-0.16} \]
    > [!TIP]
    > **Status: Scientifically Backed** (Abraham et al., 2019 - *Rainfall Thresholds for Prediction of Landslides in Idukki, India*)
2.  **Garhwal Himalayas:**
    \[ I_{himalaya} = 58.7 \times D^{-1.12} \]
    > [!TIP]
    > **Status: Scientifically Backed** (Sengupta et al., 2013)
3.  **Global / Default Base:**
    \[ I_{default} = 10.0 \times D^{-0.5} \]
    > [!WARNING]
    > **Status: Assumption** (Loosely based on the global Caine 1980 threshold, simplified for our engine).

### B. Rainfall Trigger Probability ($T_{rain}$)
Converts the raw rainfall intensity ($I$) into a probability of failure ($0.0$ to $1.0$) when $I > I_{crit}$.
\[ T_{rain} = \frac{I - I_{crit}}{2 \times I_{crit}} \]

> [!WARNING]
> **Status: Implementation Assumption**
> There is no universal equation to convert rainfall exceedance into a probability. We created this linear ramp to visually scale the hazard on the frontend map.

---

## 3. Earthquake-Induced Simulation Model

The seismic model relies heavily on the Newmark sliding-block analysis, which is highly academic and robust.

### A. Critical Acceleration ($A_c$)
The baseline shaking (in $g$) required to destabilize the slope.
\[ A_c = 0.05 + 1.0 \times (1.0 - S) \]
> [!WARNING]
> **Status: Implementation Assumption**
> Calculating true $A_c$ requires knowing exact soil cohesion, friction angles, and rock density (which we don't have for all of India). We mapped $A_c$ inversely to our AHP Susceptibility ($S$) as an engineering approximation.

### B. Newmark Displacement ($D_n$)
Predicts the physical displacement of the soil block in centimeters based on Peak Ground Acceleration (PGA).
\[ \log(D_n) = 0.215 + \log_{10} \left( \left(1 - \frac{A_c}{PGA}\right)^{2.34} \times \left(\frac{A_c}{PGA}\right)^{-1.43} \right) \]

> [!TIP]
> **Status: Scientifically Backed** (Jibson, 2007 - *Models for Estimating Newmark Displacement*)

### C. Trigger Probability / Probability of Failure ($P_f$)
Converts the soil displacement ($D_n$) into a percentage probability of catastrophic failure.
\[ T_{eq} = P_f = 0.335 \times \left(1 - e^{-0.048 \times D_n^{1.565}}\right) \]

> [!TIP]
> **Status: Scientifically Backed** (Jibson et al., 2000 - *A Method for Producing Digital Probabilistic Seismic Landslide Hazard Maps*)

---

## 4. Combined Multi-Hazard Model

When both heavy rainfall and a massive earthquake strike simultaneously, the engine mathematically fuses the triggers.

### A. Synergistic Union
Calculates the combined trigger probability ($T_{combined}$) of two statistically independent hazardous events.
\[ T_{combined} = 1 - (1 - T_{rain}) \times (1 - T_{eq}) \]

> [!TIP]
> **Status: Scientifically Backed**
> This is the standard statistical formula for the Union of two independent probabilities: $P(A \cup B) = P(A) + P(B) - (P(A) \times P(B))$.

### B. Final Fused Risk ($R$)
Applies the active trigger(s) to the static terrain vulnerability to get the final colored pixel value for the frontend.
\[ R = S \times (1 + T) \]

> [!WARNING]
> **Status: Implementation Assumption**
> We designed this formula to ensure that baseline hazard areas simply get "multiplied" into extreme red zones when a trigger event occurs.
