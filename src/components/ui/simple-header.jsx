import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetFooter } from './sheet';
import { Button, buttonVariants } from './button';
import { MenuToggle } from './menu-toggle';
import { getCurrentUser, signOut } from '../../lib/supabase';

export function SimpleHeader({ onSignOut, onNavigateToAuth, onNavigateToHome, user: userProp }) {
	const [open, setOpen] = useState(false);
	const [user, setUser] = useState(userProp);

	useEffect(() => {
		checkUser();
	}, []);

	useEffect(() => {
		// Update user state when prop changes
		setUser(userProp);
	}, [userProp]);

	const checkUser = async () => {
		const currentUser = await getCurrentUser();
		setUser(currentUser);
	};

	const handleSignOut = async () => {
		await signOut();
		setUser(null);
		if (onSignOut) {
			onSignOut();
		}
		setOpen(false);
	};

	const scrollToSection = (id) => {
		// First navigate to home page if not already there
		if (onNavigateToHome) {
			onNavigateToHome();
		}
		// Wait a bit for page to render, then scroll to section
		setTimeout(() => {
			const element = document.getElementById(id);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}, 300);
		setOpen(false);
	};

	const navigateToAuth = () => {
		if (onNavigateToAuth) {
			onNavigateToAuth();
		}
		setOpen(false);
	};

	const links = [
		{
			label: 'Features',
			href: '#features',
			onClick: () => scrollToSection('features'),
		},
	];

	return (
		<header className="bg-gray-900/95 supports-[backdrop-filter]:bg-gray-900/80 sticky top-0 z-50 w-full border-b border-gray-800 backdrop-blur-lg">
			<nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div className="flex items-center">
					<a 
						href="#top" 
						onClick={(e) => { 
							e.preventDefault(); 
							if (onNavigateToHome) {
								onNavigateToHome();
							}
							window.scrollTo({ top: 0, behavior: 'smooth' }); 
						}}
						className="font-mono text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-pink-300 transition-all cursor-pointer"
					>
						Pomodoro
					</a>
				</div>
				<div className="hidden items-center gap-3 lg:flex">
					{!user && links.map((link, index) => (
						<button
							key={index}
							onClick={link.onClick}
							className={buttonVariants({ variant: 'ghost', className: 'text-gray-300 hover:text-purple-400 text-base' })}
						>
							{link.label}
						</button>
					))}
					{user && (
						<span className="text-gray-400 text-base mr-4">
							Signed in as <span className="text-purple-400 font-semibold">{user.email}</span>
						</span>
					)}
					{user ? (
						<Button variant="outline" onClick={handleSignOut} className="text-base">Sign Out</Button>
					) : (
						<>
							<Button variant="outline" onClick={navigateToAuth} className="text-base">Sign In</Button>
							<Button onClick={navigateToAuth} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-base">Get Started</Button>
						</>
					)}
				</div>
				<Sheet open={open} onOpenChange={setOpen}>
					<Button size="icon" variant="outline" className="lg:hidden">
						<MenuToggle
							strokeWidth={2.5}
							open={open}
							onOpenChange={setOpen}
							className="size-6"
						/>
					</Button>
					<SheetContent
						className="bg-gray-900/95 supports-[backdrop-filter]:bg-gray-900/80 gap-0 backdrop-blur-lg border-r border-gray-800"
						showClose={false}
						side="left"
					>
						<div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
							{!user && links.map((link, index) => (
								<button
									key={index}
									onClick={link.onClick}
									className={buttonVariants({
										variant: 'ghost',
										className: 'justify-start text-gray-300 hover:text-purple-400 text-base',
									})}
								>
									{link.label}
								</button>
							))}
							{user && (
								<div className="px-3 py-2 text-base text-gray-400">
									Signed in as <span className="text-purple-400 font-semibold">{user.email}</span>
								</div>
							)}
						</div>
						<SheetFooter className="gap-2">
							{user ? (
								<Button variant="outline" onClick={handleSignOut} className="w-full text-base">Sign Out</Button>
							) : (
								<>
									<Button variant="outline" onClick={navigateToAuth} className="w-full text-base">Sign In</Button>
									<Button onClick={navigateToAuth} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-base">Get Started</Button>
								</>
							)}
						</SheetFooter>
					</SheetContent>
				</Sheet>
			</nav>
		</header>
	);
}
