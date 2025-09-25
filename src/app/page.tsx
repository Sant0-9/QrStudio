"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col items-center justify-center px-6 text-center">
			<motion.h1
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
			>
				Create beautiful QR codes.
			</motion.h1>
			<motion.p
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg"
			>
				QRStudio helps you design, animate, and export crisp QR codes in light or dark.
			</motion.p>
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="mt-8"
			>
				<Button asChild size="lg" className="glass smooth-scale">
					<Link href="/studio">Open Studio</Link>
				</Button>
			</motion.div>
		</main>
	);
}
