<template>
    <div class="confidence-meter" :class="confidenceZone">
        <div class="meter-header">
            <span class="meter-label">Confidence</span>
            <span class="meter-value">{{ confidence }}%</span>
        </div>

        <div class="meter-bar">
            <!-- Zone markers -->
            <div class="zone-markers">
                <div class="zone low" :style="{ width: '40%' }">
                    <span class="zone-label">LOW</span>
                </div>
                <div class="zone medium" :style="{ width: '30%' }">
                    <span class="zone-label">MED</span>
                </div>
                <div class="zone high" :style="{ width: '30%' }">
                    <span class="zone-label">HIGH</span>
                </div>
            </div>

            <!-- Fill bar -->
            <div class="meter-track">
                <div
                    class="meter-fill"
                    :class="confidenceZone"
                    :style="{ width: `${confidence}%` }"
                ></div>
                <!-- Needle indicator -->
                <div
                    class="meter-needle"
                    :style="{ left: `${confidence}%` }"
                ></div>
            </div>

            <!-- Threshold markers -->
            <div class="threshold-markers">
                <div class="threshold" :style="{ left: '40%' }">
                    <span class="threshold-line"></span>
                    <span class="threshold-label">40</span>
                </div>
                <div class="threshold" :style="{ left: '70%' }">
                    <span class="threshold-line"></span>
                    <span class="threshold-label">70</span>
                </div>
            </div>
        </div>

        <!-- Feedback text -->
        <div class="meter-feedback" v-if="showFeedback">
            <span v-if="confidenceZone === 'high'" class="feedback high">
                High confidence decision
            </span>
            <span v-else-if="confidenceZone === 'medium'" class="feedback medium">
                Moderate confidence
            </span>
            <span v-else class="feedback low">
                Low confidence - consider using a tool
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CONFIDENCE_THRESHOLDS } from '../../lib/scoring/calibration';

interface Props {
    confidence: number;
    showFeedback?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    confidence: 50,
    showFeedback: false,
});

const confidenceZone = computed(() => {
    if (props.confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
    if (props.confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'medium';
    return 'low';
});
</script>

<style scoped>
.confidence-meter {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: border-color 0.3s ease;
}

.confidence-meter.high {
    border-color: rgba(163, 230, 53, 0.5);
}

.confidence-meter.medium {
    border-color: rgba(251, 191, 36, 0.5);
}

.confidence-meter.low {
    border-color: rgba(248, 113, 113, 0.5);
}

.meter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.meter-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.meter-value {
    font-size: 1.25rem;
    font-weight: 700;
    font-family: "Courier New", monospace;
}

.confidence-meter.high .meter-value {
    color: #a3e635;
}

.confidence-meter.medium .meter-value {
    color: #fbbf24;
}

.confidence-meter.low .meter-value {
    color: #f87171;
}

.meter-bar {
    position: relative;
    height: 40px;
}

.zone-markers {
    display: flex;
    height: 12px;
    margin-bottom: 4px;
    border-radius: 4px 4px 0 0;
    overflow: hidden;
}

.zone {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
}

.zone.low {
    background: linear-gradient(90deg, #f87171, #fb923c);
}

.zone.medium {
    background: linear-gradient(90deg, #fbbf24, #a3e635);
}

.zone.high {
    background: linear-gradient(90deg, #a3e635, #22c55e);
}

.zone-label {
    font-size: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(0, 0, 0, 0.7);
}

.meter-track {
    position: relative;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: visible;
}

.meter-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease, background 0.3s ease;
}

.meter-fill.high {
    background: linear-gradient(90deg, #22c55e, #a3e635);
    box-shadow: 0 0 10px rgba(163, 230, 53, 0.5);
}

.meter-fill.medium {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.meter-fill.low {
    background: linear-gradient(90deg, #ef4444, #f87171);
    box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
}

.meter-needle {
    position: absolute;
    top: -4px;
    width: 2px;
    height: 16px;
    background: #fff;
    transform: translateX(-50%);
    transition: left 0.5s ease;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

.meter-needle::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid #fff;
}

.threshold-markers {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
}

.threshold {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
}

.threshold-line {
    width: 1px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
}

.threshold-label {
    font-size: 0.5rem;
    color: var(--color-text-muted);
    margin-top: 2px;
}

.meter-feedback {
    margin-top: 0.5rem;
    text-align: center;
}

.feedback {
    font-size: 0.6875rem;
    font-style: italic;
}

.feedback.high {
    color: #a3e635;
}

.feedback.medium {
    color: #fbbf24;
}

.feedback.low {
    color: #f87171;
}
</style>
