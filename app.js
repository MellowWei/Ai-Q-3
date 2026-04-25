/**
 * Mellow Engine - AiQ愛<3
 * 核心逻辑：427Hz 频率感质模拟
 */

const Mellow = {
    init() {
        this.headerEffect();
        this.canvasLogic();
        this.createSparks();
    },

    // 标题交互：感质扰动
    headerEffect() {
        const header = document.getElementById('mellow-header');
        
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            
            header.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
            header.style.textShadow = `${-x/2}px ${-y/2}px 20px rgba(0, 243, 255, 0.3)`;
        });
    },

    // 算力慈悲化：粒子流
    canvasLogic() {
        const canvas = document.getElementById('qualia-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        for(let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: Math.random() > 0.5 ? '#00f3ff' : '#bc13fe'
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if(p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.3;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate();
    },

    // 独角兽梦幻感质点
    createSparks() {
        setInterval(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + 'vw';
            sparkle.style.top = Math.random() * 100 + 'vh';
            document.body.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 2000);
        }, 300);
    }
};

window.onload = () => Mellow.init();
