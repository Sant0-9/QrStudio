"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Palette, Type, X, FileImage, Link, Mail, Phone, User } from "lucide-react";
import { Preview, type PreviewConfig } from "./preview";
import { validateQrPayload } from "@/lib/qr";

export default function StudioPage() {
	// State for QR configuration
	const [config, setConfig] = useState<PreviewConfig>({
		contentType: "url",
		content: "https://qrstudio.app",
		vcard: {
			name: "",
			phone: "",
			email: "",
			organization: "",
			url: "",
		},
		size: 256,
		margin: 4,
		errorCorrection: "M" as const,
		colors: {
			foreground: "#000000",
			background: "#FFFFFF",
		},
		style: {
			cornerRadius: 0,
			gradient: false,
			gradientColors: ["#667eea", "#764ba2"],
			dotStyle: "square",
			eyeStyle: "square",
		},
		logo: {
			size: 0.2, // 20%
			background: true,
			borderRadius: 4,
		},
	});

	// File upload state
	const [isDragOver, setIsDragOver] = useState(false);

	// Update functions for different config properties
	const updateConfig = (updates: Partial<PreviewConfig>) => {
		setConfig(prev => ({ ...prev, ...updates }));
	};

	const updateColors = (colors: Partial<PreviewConfig['colors']>) => {
		setConfig(prev => ({ ...prev, colors: { ...prev.colors, ...colors } }));
	};

	const updateStyle = (style: Partial<PreviewConfig['style']>) => {
		setConfig(prev => ({ ...prev, style: { ...prev.style, ...style } }));
	};

	const updateLogo = (logo: Partial<PreviewConfig['logo']>) => {
		setConfig(prev => ({ 
			...prev, 
			logo: prev.logo ? { ...prev.logo, ...logo } : { size: 0.2, background: true, borderRadius: 4, ...logo }
		}));
	};

	const updateVcard = (vcard: Partial<PreviewConfig['vcard']>) => {
		setConfig(prev => ({ 
			...prev, 
			vcard: prev.vcard ? { ...prev.vcard, ...vcard } : { name: "", phone: "", email: "", organization: "", url: "", ...vcard }
		}));
	};

	// File upload handlers
	const handleFileUpload = useCallback((file: File) => {
		if (!file.type.startsWith('image/')) {
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const src = e.target?.result as string;
			updateLogo({ file, src });
		};
		reader.readAsDataURL(file);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileUpload(files[0]);
		}
	}, [handleFileUpload]);

	const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileUpload(files[0]);
		}
	}, [handleFileUpload]);

	// Validation
	const validation = validateQrPayload(config.content, config.contentType);

	// Calculate contrast ratio for accessibility
	const getContrastRatio = (color1: string, color2: string): number => {
		const hexToRgb = (hex: string) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		};

		const getLuminance = (r: number, g: number, b: number) => {
			const [rs, gs, bs] = [r, g, b].map(c => {
				c = c / 255;
				return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
		};

		const rgb1 = hexToRgb(color1);
		const rgb2 = hexToRgb(color2);
		
		if (!rgb1 || !rgb2) return 21;
		
		const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
		const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
		
		const brightest = Math.max(lum1, lum2);
		const darkest = Math.min(lum1, lum2);
		
		return (brightest + 0.05) / (darkest + 0.05);
	};

	// Check if contrast is too low  
	const contrastRatio = getContrastRatio(config.colors.foreground, config.colors.background);
	const hasLowContrast = contrastRatio < 3;
	return (
		<div className="mx-auto max-w-7xl px-6 py-8">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-8"
			>
				<h1 className="text-3xl font-bold tracking-tight">QR Studio</h1>
				<p className="mt-2 text-lg text-muted-foreground">
					Design and customize your QR code with real-time preview
				</p>
			</motion.div>

			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left Column - Controls */}
				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="space-y-6"
				>
					<Tabs defaultValue="content" className="w-full">
						<TabsList className="grid w-full grid-cols-3 glass" role="tablist" aria-label="QR code configuration options">
							<TabsTrigger 
								value="content" 
								className="flex items-center gap-2 data-[state=active]:bg-white/10 transition-all duration-200 button-glow-hover"
								aria-label="Configure QR code content and data"
							>
								<Type className="h-4 w-4" aria-hidden="true" />
								Content
							</TabsTrigger>
							<TabsTrigger 
								value="style" 
								className="flex items-center gap-2 data-[state=active]:bg-white/10 transition-all duration-200 button-glow-hover"
								aria-label="Customize QR code appearance and colors"
							>
								<Palette className="h-4 w-4" aria-hidden="true" />
								Style
							</TabsTrigger>
							<TabsTrigger 
								value="logo" 
								className="flex items-center gap-2 data-[state=active]:bg-white/10 transition-all duration-200 button-glow-hover"
								aria-label="Add logo or branding to QR code"
							>
								<Upload className="h-4 w-4" aria-hidden="true" />
								Logo
							</TabsTrigger>
						</TabsList>

						{/* Content Tab */}
						<TabsContent value="content" className="mt-6">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<Card className="glass border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Type className="h-5 w-5" />
											QR Content
										</CardTitle>
										<CardDescription>
											Enter the content you want to encode in your QR code
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{/* Content Type Selector */}
										<div className="space-y-2">
											<Label htmlFor="qr-type">Content Type</Label>
											<Select 
												value={config.contentType} 
												onValueChange={(value: PreviewConfig['contentType']) => 
													updateConfig({ contentType: value })
												}
											>
												<SelectTrigger id="qr-type" className="glass border-white/10">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="text">
														<div className="flex items-center gap-2">
															<Type className="h-4 w-4" />
															Plain Text
														</div>
													</SelectItem>
													<SelectItem value="url">
														<div className="flex items-center gap-2">
															<Link className="h-4 w-4" />
															Website URL
														</div>
													</SelectItem>
													<SelectItem value="email">
														<div className="flex items-center gap-2">
															<Mail className="h-4 w-4" />
															Email
														</div>
													</SelectItem>
													<SelectItem value="phone">
														<div className="flex items-center gap-2">
															<Phone className="h-4 w-4" />
															Phone Number
														</div>
													</SelectItem>
													<SelectItem value="vcard">
														<div className="flex items-center gap-2">
															<User className="h-4 w-4" />
															Contact Card (vCard)
														</div>
													</SelectItem>
													<SelectItem value="wifi">WiFi Network</SelectItem>
													<SelectItem value="sms">SMS Message</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Content Input Based on Type */}
										{config.contentType === 'vcard' ? (
											<div className="space-y-4">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="vcard-name">Full Name *</Label>
														<Input
															id="vcard-name"
															placeholder="John Doe"
															value={config.vcard?.name || ''}
															onChange={(e) => updateVcard({ name: e.target.value })}
															className="glass border-white/10"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="vcard-phone">Phone Number</Label>
														<Input
															id="vcard-phone"
															placeholder="+1 234 567 8900"
															value={config.vcard?.phone || ''}
															onChange={(e) => updateVcard({ phone: e.target.value })}
															className="glass border-white/10"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="vcard-email">Email</Label>
														<Input
															id="vcard-email"
															type="email"
															placeholder="john@example.com"
															value={config.vcard?.email || ''}
															onChange={(e) => updateVcard({ email: e.target.value })}
															className="glass border-white/10"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="vcard-org">Organization</Label>
														<Input
															id="vcard-org"
															placeholder="Company Name"
															value={config.vcard?.organization || ''}
															onChange={(e) => updateVcard({ organization: e.target.value })}
															className="glass border-white/10"
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label htmlFor="vcard-url">Website</Label>
													<Input
														id="vcard-url"
														type="url"
														placeholder="https://example.com"
														value={config.vcard?.url || ''}
														onChange={(e) => updateVcard({ url: e.target.value })}
														className="glass border-white/10"
													/>
												</div>
											</div>
										) : config.contentType === 'text' ? (
											<div className="space-y-2">
												<Label htmlFor="content-text">Text Content</Label>
												<Textarea
													id="content-text"
													placeholder="Enter your text here..."
													value={config.content}
													onChange={(e) => updateConfig({ content: e.target.value })}
													className="glass border-white/10 min-h-[100px]"
													rows={4}
												/>
											</div>
										) : (
											<div className="space-y-2">
												<Label htmlFor="content">
													{config.contentType === 'url' && 'URL'}
													{config.contentType === 'email' && 'Email Address'}
													{config.contentType === 'phone' && 'Phone Number'}
													{config.contentType === 'wifi' && 'WiFi Network Details'}
													{config.contentType === 'sms' && 'SMS Number'}
												</Label>
												<Input
													id="content"
													type={config.contentType === 'url' ? 'url' : config.contentType === 'email' ? 'email' : 'text'}
													placeholder={
														config.contentType === 'url' ? 'https://example.com' :
														config.contentType === 'email' ? 'user@example.com' :
														config.contentType === 'phone' ? '+1 234 567 8900' :
														config.contentType === 'wifi' ? 'WIFI:T:WPA;S:NetworkName;P:Password;;' :
														config.contentType === 'sms' ? '+1234567890' :
														'Enter content...'
													}
													value={config.content}
													onChange={(e) => updateConfig({ content: e.target.value })}
													className={`glass border-white/10 ${
														!validation.isValid ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''
													}`}
												/>
											</div>
										)}

										{/* Validation Messages */}
										{!validation.isValid && validation.warnings.length > 0 && (
											<div className="space-y-2">
												{validation.warnings.map((warning, i) => (
													<p key={i} className="text-sm text-red-400 flex items-center gap-2">
														<span className="text-red-500 font-bold">!</span>
														{warning}
													</p>
												))}
											</div>
										)}

										{validation.suggestions.length > 0 && (
											<div className="space-y-2">
												{validation.suggestions.map((suggestion, i) => (
													<p key={i} className="text-sm text-blue-400 flex items-center gap-2">
														<span className="text-blue-500 font-bold">?</span>
														{suggestion}
													</p>
												))}
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</TabsContent>

						{/* Style Tab */}
						<TabsContent value="style" className="mt-6">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<Card className="glass border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Palette className="h-5 w-5" />
											Visual Style
										</CardTitle>
										<CardDescription>
											Customize the appearance of your QR code
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{/* Color Controls */}
										<div className="space-y-4">
											<div className="space-y-3">
												<Label>Foreground Color</Label>
												<div className="flex flex-wrap gap-2">
												{[
													{ color: '#000000', name: 'Black' },
													{ color: '#1f2937', name: 'Dark Gray' },
													{ color: '#2563eb', name: 'Blue' },
													{ color: '#9333ea', name: 'Purple' },
													{ color: '#db2777', name: 'Pink' },
													{ color: '#dc2626', name: 'Red' },
													{ color: '#059669', name: 'Green' },
													{ color: '#d97706', name: 'Orange' },
												].map(({ color, name }) => (
													<Button
														key={color}
														variant="outline"
														size="sm"
														className={`w-10 h-10 p-0 border-white/20 transition-all duration-200 hover:scale-110 button-glow-hover ${
															config.colors.foreground === color ? 'ring-2 ring-primary scale-110' : ''
														} ${hasLowContrast && config.colors.foreground === color ? 'contrast-warning' : ''}`}
														style={{ backgroundColor: color }}
														onClick={() => updateColors({ foreground: color })}
														title={name}
														aria-label={`Set foreground color to ${name}`}
														aria-pressed={config.colors.foreground === color}
													/>
												))}
													<input
														type="color"
														value={config.colors.foreground}
														onChange={(e) => updateColors({ foreground: e.target.value })}
														className="w-10 h-10 rounded-md border border-white/20 cursor-pointer button-glow-hover"
														title="Custom foreground color"
														aria-label="Choose custom foreground color"
													/>
												</div>
											</div>

											<div className="space-y-3">
												<Label>Background Color</Label>
												<div className="flex flex-wrap gap-2">
												{[
													{ color: '#FFFFFF', name: 'White' },
													{ color: '#f3f4f6', name: 'Light Gray' },
													{ color: '#e5e7eb', name: 'Gray' },
													{ color: 'transparent', name: 'Transparent' },
												].map(({ color, name }) => (
													<Button
														key={color}
														variant="outline"
														size="sm"
														className={`w-10 h-10 p-0 border-white/20 transition-all duration-200 hover:scale-110 button-glow-hover ${
															config.colors.background === color ? 'ring-2 ring-primary scale-110' : ''
														} ${color === 'transparent' ? 'bg-gradient-to-br from-red-500 via-transparent to-blue-500' : ''}`}
														style={color !== 'transparent' ? { backgroundColor: color } : {}}
														onClick={() => updateColors({ background: color })}
														title={name}
														aria-label={`Set background color to ${name}`}
														aria-pressed={config.colors.background === color}
													>
														{color === 'transparent' && (
															<div className="w-full h-full bg-white/20 backdrop-blur-sm rounded border border-white/30" />
														)}
													</Button>
												))}
													<input
														type="color"
														value={config.colors.background === 'transparent' ? '#FFFFFF' : config.colors.background}
														onChange={(e) => updateColors({ background: e.target.value })}
														className="w-10 h-10 rounded-md border border-white/20 cursor-pointer button-glow-hover"
														title="Custom background color"
														aria-label="Choose custom background color"
													/>
												</div>
											</div>
										</div>

										{/* Error Correction */}
										<div className="space-y-2">
											<Label htmlFor="ecc">Error Correction Level</Label>
											<Select 
												value={config.errorCorrection} 
												onValueChange={(value: PreviewConfig['errorCorrection']) => 
													updateConfig({ errorCorrection: value })
												}
											>
												<SelectTrigger id="ecc" className="glass border-white/10">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="L">L - Low (~7%)</SelectItem>
													<SelectItem value="M">M - Medium (~15%)</SelectItem>
													<SelectItem value="Q">Q - Quartile (~25%)</SelectItem>
													<SelectItem value="H">H - High (~30%)</SelectItem>
												</SelectContent>
											</Select>
											<p className="text-xs text-muted-foreground">
												Higher levels allow more damage but create denser QR codes
											</p>
										</div>

										{/* Size Controls */}
										<div className="space-y-2">
											<Label>Size: {config.size}px</Label>
											<Slider
												value={[config.size]}
												onValueChange={([value]) => updateConfig({ size: value })}
												max={512}
												min={128}
												step={32}
												className="w-full"
											/>
										</div>

										{/* Corner Radius */}
										<div className="space-y-2">
											<Label>Corner Radius: {config.style.cornerRadius}px</Label>
											<Slider
												value={[config.style.cornerRadius]}
												onValueChange={([value]) => updateStyle({ cornerRadius: value })}
												max={20}
												min={0}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Style Options - Temporarily disabled */}
										<div className="space-y-4 opacity-50">
											<div className="space-y-3">
												<Label>Dot Style (Coming Soon)</Label>
												<div className="grid grid-cols-3 gap-2">
													{[
														{ value: 'square', name: 'Square', icon: '■' },
														{ value: 'rounded', name: 'Rounded', icon: '▢' },
														{ value: 'circle', name: 'Circle', icon: '●' },
													].map(({ value, name, icon }) => (
														<Button
															key={value}
															variant="outline"
															size="sm"
															className="glass border-white/20"
															disabled
														>
															<span className="mr-2">{icon}</span>
															{name}
														</Button>
													))}
												</div>
											</div>

											<div className="space-y-3">
												<Label>Eye Style (Coming Soon)</Label>
												<div className="grid grid-cols-3 gap-2">
													{[
														{ value: 'square', name: 'Square', icon: '■' },
														{ value: 'rounded', name: 'Rounded', icon: '▢' },
														{ value: 'circle', name: 'Circle', icon: '●' },
													].map(({ value, name, icon }) => (
														<Button
															key={value}
															variant="outline"
															size="sm"
															className="glass border-white/20"
															disabled
														>
															<span className="mr-2">{icon}</span>
															{name}
														</Button>
													))}
												</div>
											</div>
										</div>

										{/* Gradient Effect */}
										<div className="flex items-center space-x-2">
											<Switch
												id="gradient"
												checked={config.style.gradient}
												onCheckedChange={(checked) => updateStyle({ gradient: checked })}
											/>
											<Label htmlFor="gradient">Gradient effect</Label>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						</TabsContent>

						{/* Logo Tab */}
						<TabsContent value="logo" className="mt-6">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<Card className="glass border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Upload className="h-5 w-5" />
											Logo & Branding
										</CardTitle>
										<CardDescription>
											Add a logo or icon to the center of your QR code
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{/* File Upload Area */}
										<div 
											className={`border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-all duration-200 ${
												isDragOver 
													? 'border-primary/50 bg-primary/5 scale-105' 
													: 'border-white/20 hover:border-white/30'
											}`}
											onDragOver={handleDragOver}
											onDragLeave={handleDragLeave}
											onDrop={handleDrop}
										>
											{config.logo?.src ? (
												<div className="space-y-4">
													<div className="relative mx-auto w-24 h-24 rounded-lg overflow-hidden border border-white/20">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img 
															src={config.logo.src} 
															alt="Logo preview" 
															className="w-full h-full object-cover"
														/>
													</div>
													<div>
														<p className="text-sm font-medium text-green-400">Logo uploaded</p>
														<p className="text-xs text-muted-foreground">
															{config.logo.file?.name || 'Logo image'}
														</p>
													</div>
													<div className="flex gap-2 justify-center">
														<Button 
															variant="secondary" 
															size="sm" 
															className="glass"
															onClick={() => document.getElementById('logo-upload')?.click()}
														>
															<Upload className="h-4 w-4 mr-2" />
															Replace
														</Button>
														<Button 
															variant="outline" 
															size="sm" 
															className="glass border-red-500/50 text-red-400 hover:bg-red-500/10"
															onClick={() => updateLogo({ file: undefined, src: undefined })}
														>
															<X className="h-4 w-4 mr-2" />
															Remove
														</Button>
													</div>
												</div>
											) : (
												<div className="space-y-4">
													<FileImage className={`h-12 w-12 mx-auto transition-colors duration-200 ${
														isDragOver ? 'text-primary' : 'text-muted-foreground'
													}`} />
													<div>
														<p className="text-sm font-medium">
															{isDragOver ? 'Drop your logo here' : 'Upload your logo'}
														</p>
														<p className="text-xs text-muted-foreground">
															PNG, JPG up to 2MB. Square images work best.
														</p>
													</div>
														<Button
															variant="secondary" 
															size="sm" 
															className="glass button-glow-hover"
															onClick={() => document.getElementById('logo-upload')?.click()}
															aria-label="Choose logo file to upload"
														>
															<Upload className="h-4 w-4 mr-2" aria-hidden="true" />
															Choose File
														</Button>
												</div>
											)}
										</div>

										{/* Hidden File Input */}
										<input
											id="logo-upload"
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleFileInputChange}
										/>

										{/* Logo Controls */}
										{config.logo?.src && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: 'auto' }}
												exit={{ opacity: 0, height: 0 }}
												transition={{ duration: 0.3 }}
												className="space-y-4"
											>
												{/* Scale Slider */}
												<div className="space-y-2">
													<Label>Logo Scale: {Math.round((config.logo?.size || 0.2) * 100)}%</Label>
													<Slider
														value={[config.logo?.size || 0.2]}
														onValueChange={([value]) => updateLogo({ size: value })}
														max={0.3}
														min={0.1}
														step={0.01}
														className="w-full"
													/>
													<div className="flex justify-between text-xs text-muted-foreground">
														<span>10%</span>
														<span>20%</span>
														<span>30%</span>
													</div>
												</div>

												{/* Logo Options */}
												<div className="space-y-3">
													<div className="flex items-center space-x-2">
														<Switch 
															id="logo-background" 
															checked={config.logo?.background || false}
															onCheckedChange={(checked) => updateLogo({ background: checked })}
														/>
														<Label htmlFor="logo-background">White background</Label>
													</div>
													
													<div className="space-y-2">
														<Label>Logo Border Radius: {config.logo?.borderRadius || 0}px</Label>
														<Slider
															value={[config.logo?.borderRadius || 0]}
															onValueChange={([value]) => updateLogo({ borderRadius: value })}
															max={20}
															min={0}
															step={1}
															className="w-full"
														/>
													</div>
												</div>

												{/* Logo Preview Info */}
												<div className="p-3 bg-black/20 rounded-lg border border-white/10">
													<p className="text-xs text-muted-foreground">
														<span className="font-medium">Note:</span> Logo will be placed in the center 
														and QR modules will be removed behind it for better readability. 
														Error correction is automatically set to High (H) when logo is present.
													</p>
												</div>
											</motion.div>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</TabsContent>
					</Tabs>

				</motion.div>

				{/* Right Column - Preview */}
				<motion.div
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="lg:sticky lg:top-8 lg:h-fit"
				>
					<Preview config={config} />
				</motion.div>
			</div>
		</div>
	);
} 