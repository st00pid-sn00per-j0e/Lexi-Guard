'use client';
import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

export function StaggerAnimation() {
    const visualizerRef = useRef<HTMLDivElement>(null);
    const dotsWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const staggerVisualizerEl = visualizerRef.current;
        const dotsWrapperEl = dotsWrapperRef.current;
        if (!staggerVisualizerEl || !dotsWrapperEl) return;

        const dotsFragment = document.createDocumentFragment();
        const grid = [20, 10];
        const cell = 55;
        const numberOfElements = grid[0] * grid[1];
        let animation: anime.AnimeInstance;
        let paused = true;

        // Fit element to parent
        function fitElementToParent(el: HTMLElement, padding: number = 0) {
            let timeout: NodeJS.Timeout | null = null;
            function resize() {
                if (timeout) clearTimeout(timeout);
                anime.set(el, { scale: 1 });
                const pad = padding;
                const parentEl = el.parentNode as HTMLElement;
                const elOffsetWidth = el.offsetWidth - pad;
                const parentOffsetWidth = parentEl.offsetWidth;
                const ratio = parentOffsetWidth / elOffsetWidth;
                timeout = setTimeout(() => anime.set(el, { scale: ratio }), 10);
            }
            resize();
            window.addEventListener('resize', resize);
            return () => {
                if (timeout) clearTimeout(timeout);
                window.removeEventListener('resize', resize);
            };
        }

        const cleanupFit = fitElementToParent(staggerVisualizerEl, 0);

        // Create dots
        for (let i = 0; i < numberOfElements; i++) {
            const dotEl = document.createElement('div');
            dotEl.classList.add('dot');
            dotsFragment.appendChild(dotEl);
        }

        dotsWrapperEl.appendChild(dotsFragment);

        let index = anime.random(0, numberOfElements - 1);
        let nextIndex = 0;

        anime.set('.stagger-visualizer .cursor', {
            translateX: anime.stagger(-cell, { grid: grid, from: index, axis: 'x' }),
            translateY: anime.stagger(-cell, { grid: grid, from: index, axis: 'y' }),
            translateZ: 0,
            scale: 1.5,
        });

        function play() {
            paused = false;
            if (animation) animation.pause();

            nextIndex = anime.random(0, numberOfElements - 1);

            animation = anime.timeline({
                easing: 'easeInOutQuad',
                complete: play,
            })
                .add({
                    targets: '.stagger-visualizer .cursor',
                    keyframes: [
                        { scale: 0.75, duration: 120 },
                        { scale: 2.5, duration: 220 },
                        { scale: 1.5, duration: 450 },
                    ],
                    duration: 300,
                })
                .add({
                    targets: '.stagger-visualizer .dot',
                    keyframes: [
                        {
                            translateX: anime.stagger('-2px', { grid: grid, from: index, axis: 'x' }),
                            translateY: anime.stagger('-2px', { grid: grid, from: index, axis: 'y' }),
                            duration: 100,
                        },
                        {
                            translateX: anime.stagger('4px', { grid: grid, from: index, axis: 'x' }),
                            translateY: anime.stagger('4px', { grid: grid, from: index, axis: 'y' }),
                            scale: anime.stagger([2.6, 1], { grid: grid, from: index }),
                            duration: 225,
                        },
                        {
                            translateX: 0,
                            translateY: 0,
                            scale: 1,
                            duration: 1200,
                        },
                    ],
                    delay: anime.stagger(80, { grid: grid, from: index }),
                }, 30)
                .add({
                    targets: '.stagger-visualizer .cursor',
                    translateX: { value: anime.stagger(-cell, { grid: grid, from: nextIndex, axis: 'x' }) },
                    translateY: { value: anime.stagger(-cell, { grid: grid, from: nextIndex, axis: 'y' }) },
                    scale: 1.5,
                    easing: 'cubicBezier(.075, .2, .165, 1)',
                }, '-=800');

            index = nextIndex;
        }

        play();

        return () => {
            cleanupFit();
            if (animation) animation.pause();
        };
    }, []);

    return (
        <div className="animation-wrapper-stagger">
            <div className="stagger-visualizer" ref={visualizerRef}>
                <div className="cursor color-primary"></div>
                <div className="dots-wrapper" ref={dotsWrapperRef}></div>
            </div>
        </div>
    );
}
