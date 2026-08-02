import path from "path";
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		isAnalyze &&
			visualizer({
				open: true,
				gzipSize: true,
				filename: "dist/stats.html",
			}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3000,
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					firebase: ["firebase/app", "firebase/auth"],
					"vendor-react": ["react", "react-dom", "react-router-dom"],
					"vendor-ui": [
						"@radix-ui/react-alert-dialog",
						"@radix-ui/react-avatar",
						"@radix-ui/react-dialog",
						"@radix-ui/react-scroll-area",
						"@radix-ui/react-select",
						"@radix-ui/react-slider",
						"@radix-ui/react-slot",
						"@radix-ui/react-tabs",
					],
					"socket-io": ["socket.io-client"],
				},
			},
		},
	},
});