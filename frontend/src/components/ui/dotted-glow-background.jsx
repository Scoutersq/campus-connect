import React from "react";
import "./dotted-glow-background.css";

export function DottedGlowBackground({
	className = "",
	opacity = 1,
	gap = 72,
	radius = 1,
	colorLightVar,
	glowColorLightVar,
	backgroundOpacity = 0,
	...rest
}) {
	const resolvedDotColor = colorLightVar
		? `var(${colorLightVar})`
		: "rgba(17, 24, 39, 0.28)";
	const resolvedGlowColor = glowColorLightVar
		? `var(${glowColorLightVar})`
		: "rgba(255, 255, 255, 0.85)";

	const style = {
		"--dot-color": resolvedDotColor,
		"--grid-highlight": resolvedGlowColor,
		"--dot-gap": `${gap}px`,
		"--dot-radius": `${Math.max(radius, 1)}px`,
		"--dot-opacity": opacity,
		"--background-opacity": backgroundOpacity,
		backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
	};

	return (
		<div className={`dotted-glow-background ${className}`} style={style} {...rest}>
		</div>
	);
}
