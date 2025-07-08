# Mathematical Framework for Clonal Succession

## Core Model Structure

### State Variables
- **N_total**: Total tumor cell population (constant ≈ 100)
- **N_red**: Red clone population
- **N_green**: Green clone population  
- **N_yellow**: Yellow clone population
- **S_red**: Red stem cell state (0=dormant, 1=active)
- **S_green**: Green stem cell state (0=dormant, 1=active)
- **S_yellow**: Yellow stem cell state (0=dormant, 1=active)

### Constraints
- **Population conservation**: N_red + N_green + N_yellow = N_total
- **Single active stem cell**: S_red + S_green + S_yellow ≤ 1
- **Spatial limitation**: Total population bounded by vascular network capacity

## Population Dynamics

### Clone Growth Model
For each active clone i:

```
dN_i/dt = r_i * N_i * (1 - N_i/K_i) * S_i
```

Where:
- **r_i**: Intrinsic growth rate of clone i
- **K_i**: Carrying capacity for clone i (≈ N_total)
- **S_i**: Stem cell activation state (0 or 1)

### Division Limit Model
Each clone has a maximum division potential:

```
D_i(t) = D_max - ∫[0 to t] (dN_i/dt) / N_i dt
```

Where:
- **D_max**: Maximum divisions per stem cell (20-30)
- **D_i(t)**: Remaining division potential at time t

### Cell Death Model
When division limit reached:

```
dN_i/dt = -δ_i * N_i  (when D_i ≤ 0)
```

Where:
- **δ_i**: Death rate for exhausted clone i

## Suppression Mechanism

### Suppression Signal
The suppression strength from active clone i:

```
I_i = α * N_i / (N_i + β)
```

Where:
- **α**: Maximum suppression strength
- **β**: Half-saturation constant

### Activation Probability
Probability of dormant stem cell j becoming active:

```
P_activation(j) = γ * (1 - max(I_k for all active k)) * H(N_total - θ)
```

Where:
- **γ**: Base activation rate
- **H()**: Heaviside step function
- **θ**: Population threshold for activation

## Succession Dynamics

### State Transitions
Stem cell activation follows these rules:

1. **Single activation**: Only one stem cell active at a time
2. **Suppression threshold**: New activation only when suppression < threshold
3. **Population trigger**: Activation triggered by population decline

### Transition Matrix
State transitions between clones:

```
Red → Green: P_RG = f(I_red, N_total, D_red)
Green → Yellow: P_GY = f(I_green, N_total, D_green)  
Yellow → Red: P_YR = f(I_yellow, N_total, D_yellow)
```

## Parameter Estimation

### Biological Parameters
- **Growth rates**: r_i ∈ [0.1, 1.0] per time unit
- **Division limits**: D_max ∈ [20, 30] divisions
- **Death rates**: δ_i ∈ [0.05, 0.2] per time unit
- **Population capacity**: N_total ≈ 100 cells

### Suppression Parameters
- **Maximum suppression**: α ∈ [0.8, 1.0]
- **Half-saturation**: β ∈ [10, 50] cells
- **Activation rate**: γ ∈ [0.01, 0.1] per time unit
- **Threshold**: θ ∈ [80, 95] cells

## Numerical Implementation

### Differential Equation System
```python
def clonal_succession_ode(t, y, params):
    """
    ODE system for clonal succession model
    y = [N_red, N_green, N_yellow, D_red, D_green, D_yellow]
    """
    N_red, N_green, N_yellow, D_red, D_green, D_yellow = y
    
    # Determine active stem cell
    active_stem = determine_active_stem(N_red, N_green, N_yellow, 
                                       D_red, D_green, D_yellow, params)
    
    # Calculate growth rates
    dN_red_dt = growth_rate(N_red, D_red, active_stem['red'], params)
    dN_green_dt = growth_rate(N_green, D_green, active_stem['green'], params)
    dN_yellow_dt = growth_rate(N_yellow, D_yellow, active_stem['yellow'], params)
    
    # Calculate division depletion
    dD_red_dt = -division_depletion(N_red, dN_red_dt)
    dD_green_dt = -division_depletion(N_green, dN_green_dt)
    dD_yellow_dt = -division_depletion(N_yellow, dN_yellow_dt)
    
    return [dN_red_dt, dN_green_dt, dN_yellow_dt, 
            dD_red_dt, dD_green_dt, dD_yellow_dt]
```

### Stochastic Elements
Add noise to capture biological variability:

```python
def add_stochasticity(deterministic_rate, noise_level=0.1):
    """Add Gaussian noise to deterministic rates"""
    return deterministic_rate * (1 + np.random.normal(0, noise_level))
```

## Model Validation

### Steady-State Analysis
- **Population equilibrium**: N_total remains constant
- **Succession periodicity**: Regular cycling between clones
- **Stability analysis**: System returns to cycling after perturbation

### Sensitivity Analysis
Test model robustness to parameter variations:
- **Growth rate sensitivity**: Effect of r_i variations
- **Suppression strength**: Impact of α, β changes
- **Division limits**: Consequences of D_max variations

### Bifurcation Analysis
Identify critical parameter values:
- **Suppression threshold**: Minimum α for stable succession
- **Population capacity**: Effect of N_total on dynamics
- **Growth rate ratios**: Impact of r_i differences

## Experimental Predictions

### Testable Hypotheses
1. **Population homeostasis**: Total cell count remains constant
2. **Clone succession**: Predictable cycling pattern
3. **Suppression mechanism**: Active clones suppress dormant ones
4. **Division limits**: Clones exhaust after fixed divisions

### Measurable Quantities
- **Clone composition over time**: Fraction of each clone
- **Division activity**: Rate of cell division in each clone
- **Succession timing**: Intervals between clone switches
- **Population stability**: Variance in total cell count

### Experimental Design
- **Time-lapse imaging**: Track clone dynamics in real-time
- **Lineage tracing**: Follow individual cell fates
- **Perturbation experiments**: Test suppression mechanisms
- **Parameter estimation**: Fit model to experimental data

## Model Extensions

### Spatial Structure
- **2D/3D spatial models**: Include spatial constraints
- **Diffusion processes**: Model signaling molecule spread
- **Vascular network**: Explicit niche structure

### Environmental Factors
- **Nutrient limitation**: Resource competition effects
- **Oxygen gradients**: Hypoxia impact on succession
- **pH variations**: Microenvironmental heterogeneity

### Therapeutic Interventions
- **Drug effects**: Model treatment impact on succession
- **Resistance evolution**: Clone-specific drug sensitivity
- **Combination therapy**: Multiple intervention strategies
