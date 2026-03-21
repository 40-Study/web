"use client";

import { useState, useEffect } from "react";

/**
 * useReducedMotion - Detects user's reduced motion preference
 *
 * Returns true if the user has enabled "reduce motion" in their system settings.
 * Use this hook to disable or simplify animations for users who prefer reduced motion.
 *
 * WCAG 2.1 Success Criterion 2.3.3 - Animation from Interactions
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <div className={prefersReducedMotion ? "transition-none" : "transition-all duration-300"}>
 *     Content
 *   </div>
 * );
 *
 * @example
 * // Conditional animation
 * const prefersReducedMotion = useReducedMotion();
 *
 * const handleClick = () => {
 *   if (prefersReducedMotion) {
 *     // Skip animation, show result immediately
 *     showResult();
 *   } else {
 *     // Play animation
 *     playAnimation().then(showResult);
 *   }
 * };
 *
 * @returns {boolean} true if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
    // Default to false for SSR (assume animations are OK)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check if matchMedia is available (client-side only)
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Set initial value
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Use addEventListener for better browser support
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return prefersReducedMotion;
}

/**
 * getReducedMotionValue - SSR-safe helper to get animation values based on motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param normalValue - Value to use when animations are OK
 * @param reducedValue - Value to use when reduced motion is preferred
 * @returns The appropriate value based on motion preference
 *
 * @example
 * const duration = getReducedMotionValue(prefersReducedMotion, 300, 0);
 */
export function getReducedMotionValue<T>(
    reducedMotion: boolean,
    normalValue: T,
    reducedValue: T
): T {
    return reducedMotion ? reducedValue : normalValue;
}
