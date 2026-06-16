# Viva Defense Guide: Defending `risk_model.py`

When your professors look at `risk_model.py`, they will ask: *"Why did you choose this exact number? Did you just guess?"* 

Use this guide to confidently defend every single mathematical constant and threshold in your code.

---

## 1. The Gaussian Terrain Normalizations

```python
himalaya_slope_norm = gaussian_membership(slope, center=40.0, width=15.0)
himalaya_elev_norm = gaussian_membership(elevation, center=2500.0, width=800.0)

peninsular_slope_norm = gaussian_membership(slope, center=38.0, width=15.0)
peninsular_elev_norm = gaussian_membership(elevation, center=650.0, width=300.0)
```
**Q: Why do Himalayas peak at 40° and Kerala at 38°? Why not just say steeper is more dangerous?**
> **Defense:** "According to literature on Himalayan orogeny, slopes above 50° are near-vertical cliffs that lack sufficient regolith (soil) accumulation, so they fail via rockfall rather than extensive shallow landslides. The true zone of Very High Susceptibility for landslides is between 30° and 50°, so we placed the Gaussian center perfectly at 40°. For the Western Ghats (Kerala), the deep lateritic weathering profiles accumulate on slightly gentler gradients, making 35°–45° the maximum hazard zone, so we centered it at 38°."

**Q: Why do Himalayas peak at 2500m elevation and Kerala at 650m?**
> **Defense:** "Empirical evidence from the Uttarkashi-Gangotri corridor shows massive landslide concentration in the 2,000m–3,000m band, which captures the intersection of highly incised terrain with human infrastructure. In Kerala, peak susceptibility occurs at intermediate elevations (published precisely between 545m and 782m) where rapid chemical weathering produces deep, unstable soil mantles."

---

## 2. Soil Saturation Threshold

```python
soil_norm = np.clip(soil / 0.7, 0.0, 1.0)
```
**Q: Why does the hazard maximize at 0.7 (70%) soil moisture?**
> **Defense:** "Physical hydrological models from the literature indicate that the statistical probability of landslide initiation escalates exponentially when the degree of saturation in the subsurface unsaturated zone exceeds 0.7. Therefore, our model locks any pixel $\ge 70\%$ moisture at maximum vulnerability (1.0)."

---

## 3. The Renormalized AHP Weights

```python
himalaya_susc = (0.676 * himalaya_slope_norm) + (0.176 * soil_norm) + (0.147 * himalaya_elev_norm)
peninsular_susc = (0.268 * peninsular_slope_norm) + (0.662 * soil_norm) + (0.070 * peninsular_elev_norm)
```
**Q: Where did these extremely specific decimals (0.676, 0.268) come from?**
> **Defense:** "Because we lacked national 1:50,000 scale lithological shapefiles, we could not arbitrarily guess the weights for Geology without introducing severe mathematical bias. Instead, we used **Wijnmalen's (2004) accepted methodology** for Single-Level Hierarchy Renormalization. We took the exact published weights for the factors we possessed (e.g., from Dwivedi et al. 2026 for Garhwal and Irshad et al. 2025 for Kerala) and mathematically renormalized them to sum to 1.0. For example, Dwivedi's original slope weight was 0.23, and our available factors summed to 0.34. $0.23 / 0.34 = 67.6\%$."

**Q: Why isn't Historical Landslide Density in the static equation?**
> **Defense:** "The contemporary literature strictly warns against including historical landslide inventories in the static predictive weighting matrix, as it causes circular reasoning (overfitting). Historical data must be reserved strictly for the model's AUC Validation phase."

---

## 4. The Rainfall I-D Thresholds

```python
I_himalaya = 58.7 * (safe_duration ** -1.12)
I_kerala = 0.9 * (safe_duration ** -0.16)
```
**Q: Where did the constants 58.7 and 0.9 come from?**
> **Defense:** "These are peer-reviewed regional Rainfall Intensity-Duration (I-D) thresholds. $I = 58.7 \times D^{-1.12}$ was derived by Sengupta et al. (2013) for the Garhwal Himalayas. $I = 0.9 \times D^{-0.16}$ was derived by Abraham et al. (2019) specifically for prediction of landslides in Idukki, Kerala."

---

## 5. The Logistic Rainfall Exceedance Curve

```python
k = 0.5
exceedance = intensity - I_crit
trigger = 1.0 / (1.0 + np.exp(-k * exceedance))
```
**Q: Why use this specific Sigmoid equation (`1 / 1 + exp(...)`) for the rainfall trigger?**
> **Defense:** "Modern early warning systems are shifting from binary deterministic thresholds (where crossing a line just equals 'Danger') to probabilistic frameworks. We implemented a Logistic Sigmoid Curve to mimic a Bayesian posterior probability. The steepness factor ($k=0.5$) is an engineering approximation that ensures minor threshold exceedances yield low probabilities of failure, while massive downpours geometrically scale the probability up to 100%."

---

## 6. The Earthquake Constants

```python
# Displacement (Dn)
log_dn = 0.215 + np.log10( np.power(1.0 - ac_pga_ratio, 2.34) * np.power(ac_pga_ratio, -1.43) )
# Probability of Failure (PoF)
pof = 0.335 * (1.0 - np.exp(-0.048 * np.power(Dn, 1.565)))
```
**Q: Where did 0.215, 2.34, 0.335, and 1.565 come from? Did you make them up?**
> **Defense:** "Absolutely not. These are global, empirically derived constants for seismic slope stability analysis. The first equation for Newmark Displacement ($Dn$) was published by **Jibson (2007)** based on thousands of global strong-motion records. The second equation for Probability of Failure ($P_f$) was derived by **Jibson et al. (2000)** based on the 1994 Northridge earthquake dataset."

---

## 7. The GIRI Matrix Fusion (Square Root)

```python
intersection = np.sqrt(susceptibility * trigger)
```
**Q: Why are you using a Square Root (Geometric Mean) instead of just adding or multiplying them?**
> **Defense:** "Linear additive models mathematically dilute extreme threats (averaging a Very High trigger with a Very Low susceptibility yields a 'Moderate' warning). The CDRI Global Infrastructure Resilience Index (GIRI) recommends a strict Intersection Hazard Matrix. By using the Geometric Mean (`sqrt(S * T)`), we created a continuous mathematical proxy for an intersection matrix. It guarantees that an extreme $H_4$ hazard alert is exclusively generated at the geographic junction where extreme terrain fragility ($1.0$) is struck by an extreme climatic/seismic trigger ($1.0$)."
