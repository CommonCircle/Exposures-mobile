package app.CommonCircle.extensions

import app.CommonCircle.models.Summary
import com.google.android.gms.nearby.exposurenotification.ExposureSummary

fun ExposureSummary.toSummary(): Summary {
    return Summary(
        daysSinceLastExposure = daysSinceLastExposure,
        matchedKeyCount = matchedKeyCount,
        maximumRiskScore = maximumRiskScore
    )
}
