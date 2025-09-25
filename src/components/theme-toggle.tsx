"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	
	useEffect(() => {
		setMounted(true);
	}, []);
	
	if (!mounted) {
		return (
			<Toggle
				aria-label="Toggle theme"
				pressed={false}
				disabled
				className="smooth-scale"
				size="sm"
			>
				<Sun className="h-4 w-4" />
			</Toggle>
		);
	}
	
	const isDark = resolvedTheme === "dark";

	return (
		<Toggle
			aria-label="Toggle theme"
			pressed={isDark}
			onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
			className="smooth-scale"
			size="sm"
		>
			{isDark ? (
				<Moon className="h-4 w-4" />
			) : (
				<Sun className="h-4 w-4" />
			)}
		</Toggle>
	);
} 