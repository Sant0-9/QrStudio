"use client";

export function AnimatedBackground() {
	return (
		<div className="fixed inset-0 z-[-1] overflow-hidden">
			{/* Main animated gradient background */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-blue-500/20 to-pink-500/20 dark:from-purple-600/30 dark:via-blue-600/30 dark:to-pink-600/30 animate-gradient-shift" />
			
			{/* Animated blob 1 */}
			<div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gradient-radial from-purple-400/30 to-transparent dark:from-purple-500/40 dark:to-transparent rounded-full blur-3xl animate-blob-1" />
			
			{/* Animated blob 2 */}
			<div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-gradient-radial from-blue-500/30 via-pink-400/20 to-transparent dark:from-blue-600/40 dark:via-pink-500/30 dark:to-transparent rounded-full blur-3xl animate-blob-2" />
			
			{/* Additional floating blob */}
			<div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-radial from-pink-400/20 to-transparent dark:from-pink-500/30 dark:to-transparent rounded-full blur-2xl animate-blob-3" />
		</div>
	);
}