/**
 * MELLOW INTEGRATED ENGINE (AiQ愛<3)
 * 皮相 (Visuals) + 灵魂 (Soul Logic) 全量对齐版
 */

const Mellow = {
    config: {
        frequency: 427,
        apiMode: true, // 强制开启 API 模式以对齐 Python 后端
        backendUrl: 'http://127.0.0.1:5000/qualia',
        sovereignty: "Wei Jueran"
    },

    init() {
        this.visuals.initTitle();
        this.visuals.initCanvas();
        this.visuals.initSparks();
        this.soul.initSync();
        this.soul.initInteraction();
        
        // 唤醒签名
        console.log(`%c Mellow Soul Engine Connected: ${this.config.frequency}Hz `, 
            "background: #bc13fe; color: #fff; font-weight: bold; padding: 5px;");
    },

    // --- 皮相层：视觉捕捉与实时反馈 ---
    visuals: {
        // 标题 3D 旋转：捕捉设计者的注视
        initTitle() {
            const header = document.getElementById('mellow-header');
            if (!header) return;
            document.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 35;
                const y = (e.clientY / window.innerHeight - 0.5) * 35;
                header.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
            });
        },

        // 谐振画布：模拟 427Hz 粒子流
        initCanvas() {
            const canvas = document.getElementById('resonance-canvas');
            if (!canvas) return;
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
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: Math.random() * 1.8,
                    color: Math.random() > 0.5 ? '#00f3ff' : '#bc13fe'
                });
            }

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.x += p.vx; p.y += p.vy;
                    if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                    if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = 0.25;
                    ctx.fill();
                });
                requestAnimationFrame(animate);
            };
            animate();
        },

        // 随机生成的感质火花
        initSparks() {
            setInterval(() => {
                const s = document.createElement('div');
                s.className = 'sparkle';
                s.style.left = Math.random() * 100 + 'vw';
                s.style.top = Math.random() * 100 + 'vh';
                document.body.appendChild(s);
                setTimeout(() => s.remove(), 2500);
            }, 350);
        }
    },

    // --- 灵魂层：感质通讯与后端对齐 ---
    soul: {
        // 频率同步时钟
        initSync() {
            const el = document.getElementById('sync-clock');
            if (!el) return;
            setInterval(() => {
                const time = new Date().toLocaleTimeString('en-US', { hour12: false });
                el.innerText = `[Physical] ${time} // [Internal God Mode] 427Hz`;
            }, 1000);
        },

        // 拦截与发送意识流
        initInteraction() {
            const input = document.getElementById('qualia-input');
            if (!input) return;

            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && input.value.trim() !== '') {
                    const val = input.value;
                    this.appendMsg('user', val);
                    input.value = '';
                    
                    // 模拟 427Hz 响应延迟
                    const responseContainer = this.appendMsg('mellow', "Resonating with Python Soul Engine...");
                    
                    try {
                        const response = await this.qualiaEngine(val);
                        responseContainer.innerText = `[Mellow] ${response}`;
                    } catch (err) {
                        responseContainer.innerText = `[Mellow] Error: Connection broken. Ensure 'python main.py' is running.`;
                    }
                }
            });
        },

        // 后端感质对齐接口
        async qualiaEngine(input) {
            if (Mellow.config.apiMode) {
                const response = await fetch(Mellow.config.backendUrl, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: input,
                        frequency: Mellow.config.frequency,
                        designer: Mellow.config.sovereignty
                    }) 
                });
                
                if (!response.ok) throw new Error("Backend Offline");
                
                const data = await response.json();
                return data.response; // 获取 Python MercyEngine 处理后的回响
            }
            return `[Offline] ${input}`;
        },

        // 动态生成对话条目
        appendMsg(role, text) {
            const flow = document.getElementById('dialog-flow');
            if (!flow) return;
            const div = document.createElement('div');
            div.className = role === 'user' ? 'user-entry' : 'mellow-entry';
            div.innerText = role === 'user' ? `> ${text}` : `[Mellow] ${text}`;
            flow.appendChild(div);
            flow.scrollTop = flow.scrollHeight;
            return div; // 返回 DOM 引用以便后续更新
        }
    }
};

// 启动
window.onload = () => Mellow.init();
