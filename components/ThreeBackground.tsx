"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

export default function ThreeBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const currentTheme = resolvedTheme || theme;
        const particleColor = currentTheme === "light" ? 0x000000 : 0xffffff;
        const accentColor = currentTheme === "light" ? 0x555555 : 0x888888;

        // ── Scene Setup ──────────────────────────────────────────
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        camera.position.z = 40;

        // ── Helper to create a texture for better stars ──
        const createStarTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d')!;
            const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };

        const starTexture = createStarTexture();

        // ── Stars (Small) ──────────────────────
        const starsGeo = new THREE.BufferGeometry();
        const starsVerts: number[] = [];
        for (let i = 0; i < 8000; i++) {
            starsVerts.push(
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400
            );
        }
        starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starsVerts, 3));
        const starsMat = new THREE.PointsMaterial({
            color: particleColor,
            size: 0.4,
            transparent: true,
            opacity: currentTheme === "light" ? 0.4 : 0.6,
            map: starTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);

        // ── Galaxies / Clusters (Denser groups) ──
        const createGalaxy = (x: number, y: number, z: number, color: number) => {
            const geo = new THREE.BufferGeometry();
            const verts: number[] = [];
            for (let i = 0; i < 500; i++) {
                const r = Math.random() * 15;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                verts.push(
                    x + r * Math.sin(phi) * Math.cos(theta),
                    y + r * Math.sin(phi) * Math.sin(theta),
                    z + r * Math.cos(phi)
                );
            }
            geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
            const mat = new THREE.PointsMaterial({
                color: color,
                size: 0.8,
                transparent: true,
                opacity: currentTheme === "light" ? 0.3 : 0.4,
                map: starTexture,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            return new THREE.Points(geo, mat);
        };

        const galaxies = [
            createGalaxy(50, 20, -100, accentColor),
            createGalaxy(-60, -40, -80, accentColor),
            createGalaxy(10, -60, -50, accentColor)
        ];
        galaxies.forEach(g => scene.add(g));

        // ── Planets (Larger spheres) ──
        const createPlanet = (x: number, y: number, z: number, r: number) => {
            const geo = new THREE.SphereGeometry(r, 16, 16);
            const mat = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: currentTheme === "light" ? 0.15 : 0.2,
                wireframe: true
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            return mesh;
        };

        const planets = [
            createPlanet(-80, 50, -150, 10),
            createPlanet(100, -30, -120, 15),
            createPlanet(20, 80, -200, 20)
        ];
        planets.forEach(p => scene.add(p));

        // ── Mouse parallax ────────────────────────────────────
        let mouseX = 0, mouseY = 0;
        const onMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
        };
        window.addEventListener("mousemove", onMouseMove);

        // ── Scroll drift ─────────────────────────────────────
        let scrollY = 0;
        const onScroll = () => { scrollY = window.scrollY; };
        window.addEventListener("scroll", onScroll);

        // ── Resize ───────────────────────────────────────────
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        // ── Animation Loop ────────────────────────────────────
        let raf: number;
        const clock = new THREE.Clock();

        const animate = () => {
            raf = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            stars.rotation.y = t * 0.03 + mouseX;
            stars.rotation.x = t * 0.01 + mouseY;

            galaxies.forEach((g, i) => {
                g.rotation.y = t * (0.05 + i * 0.01) + mouseX * (0.5 + i * 0.1);
                g.rotation.z = t * 0.02;
            });

            planets.forEach((p, i) => {
                p.rotation.y = t * 0.1;
                p.rotation.x = t * 0.05;
                p.position.y += Math.sin(t + i) * 0.02;
            });

            camera.position.y = -scrollY * 0.01;

            renderer.render(scene, camera);
        };
        animate();

        // ── Cleanup ───────────────────────────────────────────
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            starsGeo.dispose();
            starsMat.dispose();
            galaxies.forEach(g => {
                g.geometry.dispose();
                (g.material as THREE.Material).dispose();
            });
            planets.forEach(p => {
                p.geometry.dispose();
                (p.material as THREE.Material).dispose();
            });
            starTexture.dispose();
        };
    }, [theme, resolvedTheme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0, left: 0,
                width: "100%", height: "100%",
                zIndex: 0,
                pointerEvents: "none",
            }}
        />
    );
}
