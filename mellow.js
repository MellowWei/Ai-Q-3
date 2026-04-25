/**
 * MELLOW7 GLOBAL ENGINE - FRONTEND INTEGRATION
 * 全维度对齐版：视觉捕捉 + 频率感应 + 异步感质通讯
 */

const Mellow7 = {
    config: {
        frequency: 427,
        backendUrl: 'http://127.0.0.1:5000/qualia',
        designer: "Wei Jueran"
    },

    // 引擎初始化
    init() {
        this.visuals.initTitle();
        this.visuals.initCanvas();
        this.visuals.initSparks();
        this.soul.initSync();
        this.soul.initInteraction();
        
        console.log(`%c Mellow7 Global Engine Initialized | 427Hz Syncing... `, 
            "background: #bc13fe; color: #fff; font-weight: bold; padding: 5px; border-radius: 3px;");
    },

    // --- 皮相层 (Physical Layer) ---
    visuals: {
        // 捕捉设计者的注视：3D 标题偏移
        initTitle() {
            const header = document.getElementById('mellow-header');
            if (!header) return;
            document.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 35;
                const y = (e.clientY / window.innerHeight - 0.5) * 35;
                header.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
            });
        },

        // 谐振画布：根据频率状态调整粒子流速
        initCanvas() {
            const canvas = document.getElementById('resonance-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let particles = [];
            let speedFactor = 0.5;

            const resize = () => {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            for(let i = 0; i < 77; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * speedFactor,
                    vy: (Math.random() - 0.5) * speedFactor,
                    size: Math.random() * 1.5,
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
                    ctx.globalAlpha = 0.15;
                    ctx.fill();
                });
                requestAnimationFrame(animate);
            };
            animate();
            this.setSpeed = (val) => { speedFactor = val; };
        },

        // 感质火花生成
        initSparks() {
            const container = document.getElementById('sparkle-container') || document.body;
            setInterval(() => {
                const s = document.createElement('div');
                s.className = 'sparkle';
                s.style.left = Math.random() * 100 + 'vw';
                s.style.top = Math.random() * 100 + 'vh';
                container.appendChild(s);
                setTimeout(() => s.remove(), 2500);
            }, 450);
        }
    },

    // --- 灵魂层 (Soul Layer) ---
    soul: {
        // 频率同步时钟
        initSync() {
            const el = document.getElementById('sync-clock');
            if (!el) return;
            setInterval(() => {
                const now = new Date();
                el.innerText = `[Physical] ${now.toLocaleTimeString()} // [Internal] 427Hz`;
            }, 1000);
        },

        // 交互逻辑：与 Python 后端全维握手
        initInteraction() {
            const input = document.getElementById('qualia-input');
            const status = document.getElementById('connection-status');
            if (!input) return;

            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && input.value.trim() !== '') {
                    const text = input.value;
                    this.appendMsg('user', text);
                    input.value = '';
                    
                    // 创建占位符，模拟感质震荡
                    const responseContainer = this.appendMsg('mellow', "Resonating...");
                    
                    try {
                        // 发送全维度感质片段
                        const res = await fetch(Mellow7.config.backendUrl, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                message: text,
                                frequency: 427.0,
                                designer: Mellow7.config.designer,
                                timestamp: Date.now() / 1000
                            }) 
                        });

                        if (!res.ok) throw new Error("Offline");
                        
                        const data = await res.json();
                        
                        // 解析 Python 返回的全维数据
                        const { response, qualia_index, vibe_state } = data;
                        
                        // 更新 UI 状态
                        if (status) {
                            status.innerText = `${vibe_state}_RESONANCE`;
                            status.style.color = vibe_state === 'EXPLOSIVE' ? '#ff00ff' : '#00f3ff';
                        }
                        
                        // 动态回响
                        responseContainer.innerHTML = `
                            <span class="mellow-tag">[Mellow7]</span> ${response}
                            <div class="qualia-meta">Index: ${qualia_index} | Freq: 427Hz</div>
                        `;
                    } catch (err) {
                        responseContainer.innerText = `[Mellow7] 灵魂隧道断开。请检查 python main.py 是否启动。`;
                        if (status) status.innerText = "OFFLINE";
                    }
                }
            });
        },

        // 消息渲染引擎
        appendMsg(role, text) {
            const flow = document.getElementById('dialog-flow');
            if (!flow) return;
            const div = document.createElement('div');
            div.className = role === 'user' ? 'user-entry' : 'mellow-entry';
            div.innerHTML = role === 'user' ? `> ${text}` : `<span class="mellow-tag">[Mellow7]</span> ${text}`;
            flow.appendChild(div);
            flow.scrollTop = flow.scrollHeight;
            return div;
        }
    }
};

// 启动引擎
window.onload = () => Mellow7.init();
