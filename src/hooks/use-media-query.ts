"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Tailwind breakpoint values in pixels
 * Matches the default Tailwind CSS breakpoints
 */
export const breakpoints = {
    xs: 375,   // Small phones
    sm: 640,   // Large phones / small tablets
    md: 768,   // Tablets
    lg: 1024,  // Laptops
    xl: 1280,  // Desktops
    "2xl": 1536, // Large desktops
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * useMediaQuery - Hook to check if a media query matches
 *
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isWideScreen = useMediaQuery("(min-width: 1024px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
    // Default to false for SSR
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQuery = window.matchMedia(query);

        // Set initial value
        setMatches(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, [query]);

    return matches;
}

/**
 * useBreakpoint - Hook to check if screen is at or above a breakpoint
 *
 * @param breakpoint - Tailwind breakpoint name
 * @returns boolean indicating if screen width is >= breakpoint
 *
 * @example
 * const isDesktop = useBreakpoint("lg");
 * const isTablet = useBreakpoint("md");
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
    const width = breakpoints[breakpoint];
    return useMediaQuery(`(min-width: ${width}px)`);
}

/**
 * useBreakpointValue - Returns different values based on current breakpoint
 *
 * @param values - Object mapping breakpoints to values
 * @param defaultValue - Default value if no breakpoint matches
 * @returns The value for the current breakpoint
 *
 * @example
 * const columns = useBreakpointValue({ base: 1, sm: 2, lg: 3, xl: 4 }, 1);
 */
export function useBreakpointValue<T>(
    values: Partial<Record<Breakpoint | "base", T>>,
    defaultValue: T
): T {
    const is2xl = useBreakpoint("2xl");
    const isXl = useBreakpoint("xl");
    const isLg = useBreakpoint("lg");
    const isMd = useBreakpoint("md");
    const isSm = useBreakpoint("sm");
    const isXs = useBreakpoint("xs");

    // Return the value for the largest matching breakpoint
    if (is2xl && values["2xl"] !== undefined) return values["2xl"];
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    if (isXs && values.xs !== undefined) return values.xs;
    if (values.base !== undefined) return values.base;

    return defaultValue;
}

/**
 * useIsMobile - Simple hook to check if device is mobile
 *
 * @returns boolean indicating if screen is below md breakpoint (768px)
 *
 * @example
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 */
export function useIsMobile(): boolean {
    return !useBreakpoint("md");
}

/**
 * useIsDesktop - Simple hook to check if device is desktop
 *
 * @returns boolean indicating if screen is at or above lg breakpoint (1024px)
 */
export function useIsDesktop(): boolean {
    return useBreakpoint("lg");
}

/**
 * useWindowSize - Hook to get current window dimensions
 *
 * @returns Object with width and height of the window
 *
 * @example
 * const { width, height } = useWindowSize();
 */
export function useWindowSize(): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });

    const updateSize = useCallback(() => {
        setSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        // Set initial size
        updateSize();

        // Listen for resize
        window.addEventListener("resize", updateSize);

        return () => {
            window.removeEventListener("resize", updateSize);
        };
    }, [updateSize]);

    return size;
}
