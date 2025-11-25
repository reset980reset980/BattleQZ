import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const IMG_SOURCES = {
    bg: "https://i.imgur.com/2LLsNyo.jpg",
    intro_tanjiro: "https://i.imgur.com/f5A8RgG.png",
    intro_gojo: "https://i.imgur.com/0hYV1Mj.png",
    tanjiro_idle: "https://i.imgur.com/2BK6plS.png",
    tanjiro_attack: "https://i.imgur.com/XXGcNf3.png",
    gojo_idle: "https://i.imgur.com/UGQiUKz.png",
    gojo_attack: "https://i.imgur.com/8d3vKmP.png",
    effect_water: "https://i.imgur.com/5jmRU4b.png",
    effect_red: "https://i.imgur.com/WrnKcsb.png"
};

const COLORS = {
    tanjiro: '#00ff88',
    gojo: '#a29bfe',
};

const GameCanvas = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const imagesRef = useRef({});
    const gameLogicRef = useRef({
        p1: null, p2: null,
        particles: [], shockwaves: [],
        shakeIntensity: 0,
        hitStop: 0,
        groundY: 220,
    });

    // Load Images
    useEffect(() => {
        Object.keys(IMG_SOURCES).forEach(key => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = IMG_SOURCES[key];
            imagesRef.current[key] = img;
        });
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        initGame: (p1Name, p2Name, p1Char = 'Tanjiro', p2Char = 'Gojo') => {
            const logic = gameLogicRef.current;

            logic.p1 = createFighter({
                pos: { x: 200, y: logic.groundY },
                name: p1Char,
                color: p1Char === 'Tanjiro' ? COLORS.tanjiro : COLORS.gojo,
                facing: 1
            });
            logic.p2 = createFighter({
                pos: { x: 750, y: logic.groundY },
                name: p2Char,
                color: p2Char === 'Tanjiro' ? COLORS.tanjiro : COLORS.gojo,
                facing: -1
            });
        },

        performAttack: async (attackerId) => {
            const logic = gameLogicRef.current;
            if (!logic.p1 || !logic.p2) return;

            // attackerId: 'p1' or 'p2'
            const attacker = attackerId === 'p1' ? logic.p1 : logic.p2;
            const defender = attackerId === 'p1' ? logic.p2 : logic.p1;

            await performAttackSequence(attacker, defender);
        },

        performClash: async () => {
            const logic = gameLogicRef.current;
            if (!logic.p1 || !logic.p2) return;
            // Both attack
            const p1 = logic.p1;
            const p2 = logic.p2;

            // Simple clash animation
            p1.state = 'DASH'; p2.state = 'DASH';
            const p1Start = p1.startPos.x;
            const p2Start = p2.startPos.x;
            const center = (p1Start + p2Start) / 2;

            for (let i = 0; i < 10; i++) {
                p1.pos.x += (center - 50 - p1Start) / 10;
                p2.pos.x += (center + 50 - p2Start) / 10;
                await wait(16);
            }

            p1.state = 'ATTACK'; p2.state = 'ATTACK';
            logic.shakeIntensity = 30;
            logic.hitStop = 10;
            addExplosion(center, logic.groundY + 100, '#fff');

            await wait(500);

            p1.state = 'DASH'; p2.state = 'DASH';
            for (let i = 0; i < 15; i++) {
                p1.pos.x += (p1Start - p1.pos.x) * 0.2;
                p2.pos.x += (p2Start - p2.pos.x) * 0.2;
                await wait(16);
            }
            p1.pos.x = p1Start; p2.pos.x = p2Start;
            p1.state = 'IDLE'; p2.state = 'IDLE';
        },

        triggerShake: () => {
            gameLogicRef.current.shakeIntensity = 10;
        }
    }));

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const createFighter = ({ pos, name, color, facing }) => ({
        pos: { ...pos }, startPos: { ...pos },
        name, color, facing,
        width: 140, height: 220,
        state: 'IDLE', frame: 0, trail: [],
        update: function () {
            this.frame++;
            if (this.state !== 'IDLE' && this.frame % 2 === 0) {
                this.trail.push({ x: this.pos.x, y: this.pos.y, a: 0.5 });
            }
            this.trail.forEach(t => t.a -= 0.08);
            this.trail = this.trail.filter(t => t.a > 0);
            if (this.state === 'IDLE') {
                this.pos.y = this.startPos.y + Math.sin(this.frame * 0.08) * 3;
            }
        },
        draw: function (ctx, imgs) {
            this.trail.forEach(t => {
                ctx.save();
                ctx.globalAlpha = t.a;
                ctx.translate(t.x + (this.facing === -1 ? this.width : 0), t.y);
                ctx.scale(this.name === 'Gojo' ? -this.facing : this.facing, 1);
                this.drawBody(ctx, imgs, true);
                ctx.restore();
            });
            ctx.save();
            const scaleX = this.name === 'Gojo' ? -this.facing : this.facing;
            ctx.translate(this.pos.x + (scaleX === -1 ? this.width : 0), this.pos.y);
            ctx.scale(scaleX, 1);

            // Shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            ctx.ellipse(this.width / 2, this.height - 10, 50, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            if (this.state === 'ATTACK') this.drawSkill(ctx, imgs);
            this.drawBody(ctx, imgs, false);
            ctx.restore();
        },
        drawBody: function (ctx, imgs, isSil) {
            let key = this.name === 'Tanjiro' ? 'tanjiro' : 'gojo';
            key += this.state === 'ATTACK' ? '_attack' : '_idle';
            const img = imgs[key];
            if (img && !isSil) {
                ctx.drawImage(img, 0, 0, this.width, this.height);
            } else {
                ctx.fillStyle = isSil ? this.color : '#fff';
                ctx.fillRect(0, 0, this.width, this.height);
            }
        },
        drawSkill: function (ctx, imgs) {
            const key = this.name === 'Tanjiro' ? 'effect_water' : 'effect_red';
            const img = imgs[key];
            if (img) {
                const offX = this.name === 'Tanjiro' ? -150 : -100;
                const offY = this.name === 'Tanjiro' ? -50 : -80;
                ctx.drawImage(img, offX, offY, 300, 300);
            }
        }
    });

    const performAttackSequence = async (attacker, defender) => {
        const logic = gameLogicRef.current;

        attacker.state = 'DASH';
        const targetX = defender.pos.x - (250 * attacker.facing);
        const startX = attacker.startPos.x;

        for (let i = 0; i < 10; i++) {
            attacker.pos.x += (targetX - startX) / 10;
            await wait(16);
        }

        attacker.state = 'ATTACK';
        logic.shakeIntensity = 20;
        logic.hitStop = 8;

        const hitColor = attacker.name === 'Tanjiro' ? '#3498db' : '#ff3333';
        addExplosion(defender.pos.x + 60, defender.pos.y + 100, hitColor);
        defender.state = 'HIT';

        await wait(400);

        attacker.state = 'DASH';
        defender.state = 'IDLE';
        for (let i = 0; i < 15; i++) {
            attacker.pos.x += (startX - attacker.pos.x) * 0.2;
            await wait(16);
        }
        attacker.pos.x = startX;
        attacker.state = 'IDLE';
    };

    const addExplosion = (x, y, c) => {
        const logic = gameLogicRef.current;
        for (let i = 0; i < 15; i++) {
            logic.particles.push({
                x, y,
                dx: (Math.random() - 0.5) * 15, dy: (Math.random() - 0.5) * 15,
                c, s: Math.random() * 8 + 4, l: 30
            });
        }
        logic.shockwaves.push({ x, y, r: 10, c, a: 1 });
    };

    const drawLoop = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const logic = gameLogicRef.current;
        const imgs = imagesRef.current;

        if (!ctx || !canvas) return;

        if (logic.hitStop > 0) {
            logic.hitStop--;
            requestRef.current = requestAnimationFrame(drawLoop);
            return;
        }

        let sx = 0, sy = 0;
        if (logic.shakeIntensity > 0) {
            sx = (Math.random() - 0.5) * logic.shakeIntensity;
            sy = (Math.random() - 0.5) * logic.shakeIntensity;
            logic.shakeIntensity *= 0.9;
            if (logic.shakeIntensity < 0.5) logic.shakeIntensity = 0;
        }

        ctx.save();
        ctx.translate(sx, sy);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (logic.p1 && logic.p2) {
            // Draw order based on y or state? 
            // Usually attacker on top
            if (logic.p1.state === 'ATTACK') { logic.p2.update(); logic.p2.draw(ctx, imgs); logic.p1.update(); logic.p1.draw(ctx, imgs); }
            else { logic.p1.update(); logic.p1.draw(ctx, imgs); logic.p2.update(); logic.p2.draw(ctx, imgs); }
        }

        logic.particles = logic.particles.filter(p => p.l > 0);
        logic.particles.forEach(p => {
            p.x += p.dx; p.y += p.dy; p.l--; p.s *= 0.9;
            ctx.globalAlpha = p.l / 30; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        });

        logic.shockwaves = logic.shockwaves.filter(s => s.a > 0);
        logic.shockwaves.forEach(s => {
            s.r += 20; s.a -= 0.1;
            if (s.a > 0) {
                ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.strokeStyle = s.c; ctx.lineWidth = 8; ctx.globalAlpha = s.a; ctx.stroke(); ctx.restore();
            }
        });

        ctx.restore();
        requestRef.current = requestAnimationFrame(drawLoop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(drawLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <canvas ref={canvasRef} width={1024} height={576} className="absolute inset-0 w-full h-full object-contain block z-0" />
    );
});

export default GameCanvas;
