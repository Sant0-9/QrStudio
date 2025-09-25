import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
	return (
		<header className="sticky top-0 z-40 w-full glass">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<Link 
					href="/" 
					className="font-semibold tracking-tight header-animate transition-colors duration-200 hover:text-primary"
					aria-label="QRStudio - Go to homepage"
				>
					QRStudio
				</Link>
				<div className="flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
} 