import { CheckCircle, Circle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BuyerColors } from "../../constants/theme";

export interface TimelineStep {
  label: string;
  completed: boolean;
  isCurrent?: boolean;
  date?: string;
  icon?: string;
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  orientation?: "vertical" | "horizontal";
}

export default function ProgressTimeline({
  steps,
  orientation = "vertical",
}: ProgressTimelineProps) {
  if (orientation === "horizontal") {
    return <HorizontalTimeline steps={steps} />;
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={styles.leftColumn}>
            {/* Dot/Circle */}
            <View style={styles.dotContainer}>
              {step.completed ? (
                <View
                  style={[
                    styles.completedDot,
                    step.isCurrent && styles.currentDot,
                  ]}
                >
                  <CheckCircle size={20} color="#fff" />
                </View>
              ) : (
                <View
                  style={[
                    styles.incompleteDot,
                    step.isCurrent && styles.currentDotBorder,
                  ]}
                >
                  {step.isCurrent ? (
                    <View style={styles.currentDotInner} />
                  ) : (
                    <Circle size={20} color="#D1D5DB" />
                  )}
                </View>
              )}
            </View>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <View
                style={[styles.line, step.completed && styles.completedLine]}
              />
            )}
          </View>

          <View style={styles.rightColumn}>
            <Text
              style={[
                styles.stepLabel,
                (step.completed || step.isCurrent) && styles.activeStepLabel,
              ]}
            >
              {step.icon && `${step.icon} `}
              {step.label}
            </Text>
            {step.date && <Text style={styles.stepDate}>{step.date}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function HorizontalTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.horizontalContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.horizontalStepContainer}>
          <View style={styles.horizontalDotLine}>
            {step.completed ? (
              <View style={[styles.completedDot, styles.horizontalDot]}>
                <CheckCircle size={16} color="#fff" />
              </View>
            ) : (
              <View
                style={[
                  styles.incompleteDot,
                  styles.horizontalDot,
                  step.isCurrent && styles.currentDotBorder,
                ]}
              >
                {step.isCurrent && <View style={styles.currentDotInner} />}
              </View>
            )}

            {index < steps.length - 1 && (
              <View
                style={[
                  styles.horizontalLine,
                  step.completed && styles.completedLine,
                ]}
              />
            )}
          </View>

          <Text
            style={[
              styles.horizontalStepLabel,
              (step.completed || step.isCurrent) && styles.activeStepLabel,
            ]}
            numberOfLines={2}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepContainer: {
    flexDirection: "row",
    minHeight: 60,
  },
  leftColumn: {
    alignItems: "center",
    width: 40,
  },
  dotContainer: {
    position: "relative",
  },
  completedDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BuyerColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  incompleteDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  currentDot: {
    shadowColor: BuyerColors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  currentDotBorder: {
    borderColor: BuyerColors.primaryGreen,
    borderWidth: 3,
  },
  currentDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BuyerColors.primaryGreen,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#D1D5DB",
    marginTop: 4,
  },
  completedLine: {
    backgroundColor: BuyerColors.primaryGreen,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: BuyerColors.textGray,
    marginBottom: 4,
  },
  activeStepLabel: {
    color: BuyerColors.textBlack,
    fontWeight: "600",
  },
  stepDate: {
    fontSize: 12,
    color: BuyerColors.textGray,
  },

  // Horizontal styles
  horizontalContainer: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  horizontalStepContainer: {
    flex: 1,
    alignItems: "center",
  },
  horizontalDotLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  horizontalDot: {
    width: 28,
    height: 28,
  },
  horizontalLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#D1D5DB",
  },
  horizontalStepLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: BuyerColors.textGray,
    textAlign: "center",
  },
});
