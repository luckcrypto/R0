// UK Lotto Machine
function startLotteryDrum(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id "${canvasId}" not found`);
        return;
    }
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const drumRadius = 180;
    const innerDrumRadius = drumRadius - 15;
    const gravity = 0.68;
    const blowerPower = 2.5;
    const blowerRadius = 58;
    const friction = 0.999;
    const wallBounce = 0.48;
    const timeScale = 0.8;

    // Helper: random float
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Ball color groups
    function getBallColor(number) {
        if (number <= 10) return '#ffffff';
        if (number <= 20) return '#87CEEB';
        if (number <= 30) return '#FFB6C1';
        if (number <= 40) return '#7CFC00';
        if (number <= 50) return '#FFFF00';
        return '#c985ff';
    }

    class Ball {
        constructor(x, y, velX, velY, size, number) {
            this.x = x;
            this.y = y;
            this.velX = velX;
            this.velY = velY;
            this.size = size;
            this.number = number;
            this.baseColor = getBallColor(number);
        }

        draw() { /* unchanged - keeping your original ball drawing */ 
            const gradient = ctx.createRadialGradient(
                this.x - this.size * 0.4,
                this.y - this.size * 0.4,
                this.size * 0.1,
                this.x,
                this.y,
                this.size
            );
            gradient.addColorStop(0, this.baseColor);
            gradient.addColorStop(0.5, this.darkenColor(this.baseColor, 0.85));
            gradient.addColorStop(1, this.darkenColor(this.baseColor, 0.65));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.35, this.y - this.size * 0.35, this.size * 0.22, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number, this.x, this.y);
        }

        darkenColor(hex, factor) { /* unchanged */ 
            let r = parseInt(hex.slice(1,3), 16);
            let g = parseInt(hex.slice(3,5), 16);
            let b = parseInt(hex.slice(5,7), 16);
            r = Math.floor(r * factor);
            g = Math.floor(g * factor);
            b = Math.floor(b * factor);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        }

        update() { /* unchanged */ 
            const ts = timeScale;
            this.velY += gravity * ts;
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            const dist = Math.hypot(dx, dy);
            if (dist > innerDrumRadius * 0.4) {
                const bottomDist = Math.hypot(dx, dy - innerDrumRadius + 35);
                if (bottomDist < blowerRadius) {
                    const strength = blowerPower * (2 - bottomDist / blowerRadius);
                    this.velY -= strength * (1 + random(-0.1, 0.8)) * ts;
                    this.velX += random(-0.1, 0.9) * ts;
                }
            }
            this.velX *= Math.pow(friction, ts);
            this.velY *= Math.pow(friction, ts);
            if (dist + this.size > innerDrumRadius) {
                const angle = Math.atan2(dy, dx);
                this.x = centerX + Math.cos(angle) * (innerDrumRadius - this.size);
                this.y = centerY + Math.sin(angle) * (innerDrumRadius - this.size);
                const nx = dx / dist;
                const ny = dy / dist;
                const dot = this.velX * nx + this.velY * ny;
                this.velX -= 2 * dot * nx * wallBounce;
                this.velY -= 2 * dot * ny * wallBounce;
            }
            this.x += this.velX * ts;
            this.y += this.velY * ts;
        }

        collisionDetect(balls) { /* unchanged */ 
            for (const ball of balls) {
                if (this === ball) continue;
                const dx = this.x - ball.x;
                const dy = this.y - ball.y;
                const distance = Math.hypot(dx, dy);
                if (distance < this.size + ball.size) {
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const rvx = this.velX - ball.velX;
                    const rvy = this.velY - ball.velY;
                    const dot = rvx * nx + rvy * ny;
                    const ix = dot * nx;
                    const iy = dot * ny;
                    this.velX -= ix * 0.94;
                    this.velY -= iy * 0.94;
                    ball.velX += ix * 0.94;
                    ball.velY += iy * 0.94;
                    const overlap = this.size + ball.size - distance;
                    this.x += nx * overlap * 0.5;
                    this.y += ny * overlap * 0.5;
                    ball.x -= nx * overlap * 0.5;
                    ball.y -= ny * overlap * 0.5;
                }
            }
        }
    }

    // Create 50 balls – starting clustered near bottom
    const balls = [];
    const bottomOffset = innerDrumRadius * 0.65;
    const spreadRadius = innerDrumRadius * 0.7;
    for (let i = 1; i <= 59; i++) {
        const size = 14;
        let x, y, dist;
        do {
            const angle = Math.PI + random(-Math.PI / 3, Math.PI / 3);
            const radius = random(0, spreadRadius);
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle) + bottomOffset;
            dist = Math.hypot(x - centerX, y - centerY);
        } while (dist + size > innerDrumRadius || y < centerY - innerDrumRadius * 0.2);
        balls.push(new Ball(
            x, y,
            random(-2, 2),
            random(-1, 3),
            size,
            i.toString()
        ));
    }

    let rotationCW  = 0.025;   // clockwise
    let rotationCCW = 0.058;   // counter-clockwise

    function drawDrum() {
        const cx = centerX;
        const cy = centerY;
        const r = drumRadius;

        // ── Drum background, glass, rim, highlights
        const glassGradient = ctx.createRadialGradient(
            cx - r * 0.35, cy - r * 0.35, r * 0.1,
            cx, cy, r
        );
        glassGradient.addColorStop(0, 'rgba(245, 250, 255, 0.92)');
        glassGradient.addColorStop(0.4, 'rgba(220, 235, 255, 0.75)');
        glassGradient.addColorStop(0.7, 'rgba(200, 220, 245, 0.55)');
        glassGradient.addColorStop(1, 'rgba(180, 200, 230, 0.40)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = glassGradient;
        ctx.fill();

        const insetGradient = ctx.createRadialGradient(
            cx + r * 0.4, cy + r * 0.4, r * 0.3,
            cx, cy, r
        );
        insetGradient.addColorStop(0, 'rgba(0, 0, 40, 0.00)');
        insetGradient.addColorStop(0.5, 'rgba(0, 0, 60, 0.12)');
        insetGradient.addColorStop(0.8, 'rgba(0, 0, 80, 0.25)');
        insetGradient.addColorStop(1, 'rgba(0, 0, 100, 0.35)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = insetGradient;
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        const rimGradient = ctx.createRadialGradient(
            cx, cy, r - 12,
            cx, cy, r
        );
        rimGradient.addColorStop(0, 'rgba(0,0,0,0.00)');
        rimGradient.addColorStop(0.7, 'rgba(0,0,0,0.08)');
        rimGradient.addColorStop(1, 'rgba(0,0,0,0.18)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = rimGradient;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx - r * 0.38, cy - r * 0.38, r * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.28, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - r * 0.18, cy - r * 0.20, r * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationCW);
        ctx.strokeStyle = 'rgba(38, 38, 48, 0.38)'
        ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r - 10, 0);
            ctx.stroke();
            ctx.rotate(Math.PI * 2 / 3);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationCCW);
        ctx.strokeStyle = 'rgba(38, 38, 58, 0.21)';
        ctx.lineWidth = 8;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r - 10, 0);
            ctx.stroke();
            ctx.rotate(Math.PI * 2 / 3);
        }
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        drawDrum();

        for (const ball of balls) {
            ball.update();
            ball.collisionDetect(balls);
            ball.draw();
        }

        const rotSpeed = 0.025 * timeScale;
        rotationCW  += rotSpeed;
        rotationCCW -= rotSpeed;

        requestAnimationFrame(animate);
    }

    animate();
}

startLotteryDrum("TNL");