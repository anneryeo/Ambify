# MQ135 CO2 Derivation Algorithm (Pseudocode)

Source: `backend/Ambify_GoogleSheets.ino` (`readCO2()` + helper functions)

## Constants Used (Real Sensor Path)

- `MQ135_SAMPLES`
- `MQ135_PIN`
- `ADC_MAX_COUNTS`
- `ADC_VREF`
- `MQ135_RL_KOHM`
- `MQ135_R0_KOHM`
- `MQ135_CO2_A`
- `MQ135_CO2_B`
- `USE_MQ135_TH_COMPENSATION`

## Constants Used (Simulation Path)

- `SIMULATE_MQ135`
- `SIM_CO2_WAYPOINTS[]`
- `SIM_WAYPOINT_COUNT`
- `SIM_STEP_SIZE`
- `SIM_JITTER_PPM`

## State Variables Used

- `simCurrentPpm`
- `simWaypointIndex`

## Core Math

1. ADC to sensor resistance:

`Rs = RL * ((VREF / Vout) - 1)`

where `Vout = (adc / ADC_MAX_COUNTS) * VREF`

2. Optional temperature/humidity compensation:

`Rs_comp = Rs / correctionFactor(T, H)`

3. Resistance ratio:

`ratio = Rs_comp / R0`

4. CO2 estimate via power-law gas curve:

`ppm = A * (ratio ^ B)`

## Pseudocode

```text
FUNCTION mq135ResistanceFromAdc(adcRaw) RETURNS float
    adc <- CLAMP(adcRaw, 1, ADC_MAX_COUNTS - 1)
    vout <- (adc / ADC_MAX_COUNTS) * ADC_VREF
    rs <- MQ135_RL_KOHM * ((ADC_VREF / vout) - 1)
    RETURN rs
END FUNCTION


FUNCTION mq135CorrectionFactor(T, H) RETURNS float
    IF T < 20 THEN
        RETURN (0.00035*T*T) - (0.02718*T) + 1.39538 - 0.0018*(H - 33)
    ELSE
        RETURN (-0.003333333*T) + 1.233333333 - 0.0018*(H - 33)
    END IF
END FUNCTION


FUNCTION mq135PpmFromRs(rs, r0) RETURNS float
    ratio <- rs / r0
    ppm <- MQ135_CO2_A * (ratio ^ MQ135_CO2_B)
    RETURN ppm
END FUNCTION


FUNCTION readCO2(T, H, dhtValid) RETURNS integer

    IF SIMULATE_MQ135 == true THEN
        target <- SIM_CO2_WAYPOINTS[simWaypointIndex]

        IF simCurrentPpm < target THEN
            simCurrentPpm <- MIN(simCurrentPpm + SIM_STEP_SIZE, target)
        ELSE IF simCurrentPpm > target THEN
            simCurrentPpm <- MAX(simCurrentPpm - SIM_STEP_SIZE, target)
        END IF

        IF simCurrentPpm == target THEN
            simWaypointIndex <- (simWaypointIndex + 1) MOD SIM_WAYPOINT_COUNT
        END IF

        jitter <- (SIM_JITTER_PPM > 0) ? RANDOM_INT(-SIM_JITTER_PPM, +SIM_JITTER_PPM) : 0
        output <- MAX(0, simCurrentPpm + jitter)
        RETURN output
    END IF


    sum <- 0
    FOR i FROM 1 TO MQ135_SAMPLES DO
        sum <- sum + analogRead(MQ135_PIN)
        DELAY 100 ms
    END FOR
    raw <- sum / MQ135_SAMPLES

    rs <- mq135ResistanceFromAdc(raw)
    rsForCurve <- rs

    IF USE_MQ135_TH_COMPENSATION == true AND dhtValid == true THEN
        cf <- mq135CorrectionFactor(T, H)
        IF cf > 0.05 THEN
            rsForCurve <- rs / cf
        END IF
    END IF

    ppmFloat <- mq135PpmFromRs(rsForCurve, MQ135_R0_KOHM)
    ppm <- ROUND(ppmFloat)
    ppm <- MAX(0, ppm)

    RETURN ppm
END FUNCTION
```

## R0 Calibration Math (Practical)

If you assume outdoor air is near `C_ref` (for example `400 ppm`), then derive `R0` from measured `Rs`:

1. Rearrange the curve:

`C_ref = A * (Rs/R0)^B`

`Rs/R0 = (C_ref / A)^(1/B)`

`R0 = Rs / ((C_ref / A)^(1/B))`

2. Procedure:

- Warm the MQ135 thoroughly.
- Place sensor in stable outdoor air.
- Record averaged `Rs` for several minutes.
- Compute `R0` from the formula above.
- Use the averaged result as `MQ135_R0_KOHM`.

This improves absolute alignment versus linear offset, but it is still an estimate because MQ135 is cross-sensitive and environment-dependent.
