/* Adapted from PumpkinKiller04/RobotCoachAI, README declares MIT. See THIRD_PARTY_NOTICES.md. */
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 设置画布尺寸
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
            ctx.scale(2, 2);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 游戏配置
        const gameConfig = {
            speed: 5,
            groundY: 165,
            gravity: 0.7,
            jumpForce: -14
        };

        // 机器人状态
        const robot = {
            x: 80,
            y: gameConfig.groundY,
            baseHeight: 55,
            currentHeight: 55,
            velocityY: 0,
            isJumping: false,
            isDucking: false,
            legPhase: 0,
            armPhase: 0,
            stumbleTimer: 0
        };

        // 障碍物和飞鸟分开管理
        let obstacles = [];      // 地面跨栏
        let birds = [];          // 空中飞鸟
        let obstacleTimer = 0;
        let birdTimer = 0;
        let isBirdMode = false;  // 当前是否为飞鸟模式
        let modeSwitchTimer = 0; // 模式切换计时器

        // 绘制程序绘制机器人
        function drawParkourRobot() {
            ctx.save();
            ctx.translate(robot.x, robot.y);

            const h = robot.currentHeight;
            const stumbleOffset = robot.stumbleTimer > 0 ? Math.sin(robot.stumbleTimer * 0.5) * 3 : 0;

            // 跳跃姿态
            const isJumpPose = robot.isJumping && robot.velocityY < 0;
            const isFallPose = robot.isJumping && robot.velocityY > 0;

            // 脚/鞋
            ctx.fillStyle = '#35516a';
            if (robot.isDucking) {
                ctx.fillRect(-8 + stumbleOffset, -6, 18, 8);
                ctx.fillRect(10 + stumbleOffset, -6, 18, 8);
            } else if (robot.isJumping) {
                // 跳跃时双腿弯曲
                if (isJumpPose) {
                    ctx.fillRect(-15 + stumbleOffset, -8, 16, 8);
                    ctx.fillRect(15 + stumbleOffset, -8, 16, 8);
                } else {
                    ctx.fillRect(-12 + stumbleOffset, -4, 14, 6);
                    ctx.fillRect(14 + stumbleOffset, -4, 14, 6);
                }
            } else {
                const legSwing = Math.sin(robot.legPhase) * 6;
                ctx.fillRect(-10 + legSwing + stumbleOffset, -8, 18, 10);
                ctx.fillRect(12 - legSwing + stumbleOffset, -8, 18, 10);
            }

            // 身体
            const bodyTop = robot.isDucking ? -h + 20 : -h + 5;
            const bodyH = robot.isDucking ? h - 25 : h - 15;

            // 机身外壳
            ctx.fillStyle = '#359282';
            ctx.fillRect(-12 + stumbleOffset, bodyTop, 44, bodyH);

            // 机身边框
            ctx.fillStyle = '#285f65';
            ctx.fillRect(-6 + stumbleOffset, bodyTop, 8, bodyH);
            ctx.fillRect(18 + stumbleOffset, bodyTop, 8, bodyH);

            // 状态指示灯
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0 + stumbleOffset, bodyTop + bodyH * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(24 + stumbleOffset, bodyTop + bodyH * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();

            // 头部
            const headTop = robot.isDucking ? -18 : -h - 10;
            ctx.fillStyle = '#75b8aa';
            ctx.fillRect(-8 + stumbleOffset, headTop, 36, 22);

            // Robot antenna replaces an upstream third-party character hat.
            ctx.strokeStyle='#6fddb0';ctx.lineWidth=3;
            ctx.beginPath();ctx.moveTo(10+stumbleOffset,headTop);ctx.lineTo(10+stumbleOffset,headTop-14);ctx.stroke();
            ctx.fillStyle='#e7b963';ctx.beginPath();ctx.arc(10+stumbleOffset,headTop-16,4,0,Math.PI*2);ctx.fill();
            // 眼睛
            const eyeY = headTop + 8;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-2 + stumbleOffset, eyeY, 10, 8);
            ctx.fillRect(14 + stumbleOffset, eyeY, 10, 8);
            ctx.fillStyle = '#000000';
            ctx.fillRect(2 + stumbleOffset, eyeY + 2, 5, 5);
            ctx.fillRect(18 + stumbleOffset, eyeY + 2, 5, 5);

            // Mechanical mouth panel.
            ctx.fillStyle='#1c514e';ctx.fillRect(3+stumbleOffset,headTop+17,16,3);
            // 手臂
            ctx.strokeStyle = '#75b8aa';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';

            if (robot.isDucking) {
                ctx.beginPath();
                ctx.moveTo(-12 + stumbleOffset, bodyTop + 5);
                ctx.lineTo(-20 + stumbleOffset, bodyTop + 15);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(32 + stumbleOffset, bodyTop + 5);
                ctx.lineTo(40 + stumbleOffset, bodyTop + 15);
                ctx.stroke();
            } else {
                const armSwing = Math.sin(robot.armPhase) * 10;
                ctx.beginPath();
                ctx.moveTo(-12 + stumbleOffset, bodyTop + 8);
                ctx.lineTo(-22 + stumbleOffset, bodyTop + 20 + armSwing);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(32 + stumbleOffset, bodyTop + 8);
                ctx.lineTo(42 + stumbleOffset, bodyTop + 20 - armSwing);
                ctx.stroke();
            }

            // 机械手
            ctx.fillStyle = '#FFFFFF';
            if (robot.isDucking) {
                ctx.beginPath();
                ctx.arc(-20 + stumbleOffset, bodyTop + 15, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(40 + stumbleOffset, bodyTop + 15, 6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const armSwing = Math.sin(robot.armPhase) * 10;
                ctx.beginPath();
                ctx.arc(-22 + stumbleOffset, bodyTop + 20 + armSwing, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(42 + stumbleOffset, bodyTop + 20 - armSwing, 7, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 绘制小跨栏障碍物
        function drawObstacles() {
            obstacles.forEach(obs => {
                const baseY = gameConfig.groundY;

                // 底座
                ctx.fillStyle = '#555555';
                ctx.fillRect(obs.x + 5, baseY - 4, obs.width - 10, 6);

                // 支柱
                ctx.fillStyle = '#888888';
                ctx.fillRect(obs.x + 8, baseY - obs.height, 5, obs.height - 2);
                ctx.fillRect(obs.x + obs.width - 13, baseY - obs.height, 5, obs.height - 2);

                // 横杆 - 红白条纹
                ctx.fillStyle = '#359282';
                ctx.fillRect(obs.x, baseY - obs.height, obs.width, 10);
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < obs.width; i += 12) {
                    ctx.fillRect(obs.x + i, baseY - obs.height, 6, 10);
                }
                // 横杆高光
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(obs.x, baseY - obs.height, obs.width, 3);
            });
        }

        // 绘制飞鸟
        function drawBirds() {
            birds.forEach(bird => {
                ctx.save();
                ctx.translate(bird.x + 18, bird.y);

                const wingY = Math.sin(bird.wingAngle) * 10;

                // 身体
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // 翅膀
                ctx.fillStyle = '#CD853F';
                ctx.beginPath();
                ctx.ellipse(-5, wingY, 15, 8, -0.4, 0, Math.PI * 2);
                ctx.fill();

                // 头
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.arc(18, 0, 10, 0, Math.PI * 2);
                ctx.fill();

                // 眼睛
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(21, -3, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(22, -3, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // 嘴
                ctx.fillStyle = '#FF6347';
                ctx.beginPath();
                ctx.moveTo(28, 0);
                ctx.lineTo(38, 4);
                ctx.lineTo(28, 8);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            });
        }

        // 绘制跑道背景
        function drawBackground() {
            // 深色跑道背景
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            // 跑道纹理线
            ctx.strokeStyle = '#2a2a4e';
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.offsetWidth; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.offsetHeight);
                ctx.stroke();
            }

            // 地面
            ctx.fillStyle = '#3d3d5c';
            ctx.fillRect(0, gameConfig.groundY, canvas.offsetWidth, 10);
        }

        // 检测并处理障碍物跳跃和飞鸟下蹲
        function checkObstacles() {
            const robotRight = robot.x + 35;
            const robotLeft = robot.x - 10;
            const robotTop = robot.y - robot.currentHeight;

            // 检测地面障碍物 - 需要跳跃
            for (let obs of obstacles) {
                const obsRight = obs.x + obs.width;
                const obsLeft = obs.x;

                // 如果障碍物接近机器人，触发跳跃
                if (obsRight > robotLeft && obsLeft < robotRight + 30) {
                    if (!robot.isJumping && !robot.isDucking && robot.y >= gameConfig.groundY) {
                        robot.isJumping = true;
                        robot.velocityY = gameConfig.jumpForce;
                    }
                }

                // 检测跳跃是否成功越过障碍物
                if (robot.isJumping && obsLeft < robot.x - 30) {
                    // 已经成功跳过
                }

                // 检测碰撞（跳跃失败）
                if (!robot.isJumping && obsRight > robotLeft && obsLeft < robotRight) {
                    if (robot.y - robot.currentHeight < gameConfig.groundY - obs.height + 15) {
                        robot.stumbleTimer = 25;
                    }
                }
            }

            // 检测飞鸟 - 需要下蹲（在跳跃时不检测飞鸟）
            if (!robot.isJumping) {
                for (let bird of birds) {
                    const birdX = bird.x + 18;
                    const dist = Math.abs(birdX - robot.x);

                    if (dist < 55) {
                        robot.isDucking = true;
                    }
                }
            }

            // 恢复站立（飞鸟已过）
            let shouldStand = true;
            for (let bird of birds) {
                if (bird.x > robot.x - 40 && bird.x < robot.x + 100) {
                    shouldStand = false;
                    break;
                }
            }
            if (shouldStand) {
                robot.isDucking = false;
            }
        }

        // 游戏主循环
        function gameLoop() {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            drawBackground();

            // 模式切换逻辑 - 障碍物和飞鸟分开出现
            modeSwitchTimer++;

            // 模式切换：每隔180帧（约3秒）切换一次模式
            if (modeSwitchTimer > 180) {
                isBirdMode = !isBirdMode;
                modeSwitchTimer = 0;
                obstacleTimer = 0;
                birdTimer = 0;
            }

            // 只在障碍物模式生成跨栏
            if (!isBirdMode) {
                obstacleTimer++;
                if (obstacleTimer > 80) {
                    obstacles.push({
                        x: canvas.offsetWidth + 50,
                        width: 40 + Math.random() * 15,
                        height: 18 + Math.random() * 10
                    });
                    obstacleTimer = 0;
                }
            }

            // 只在飞鸟模式生成鸟
            if (isBirdMode) {
                birdTimer++;
                if (birdTimer > 70) {
                    birds.push({
                        x: canvas.offsetWidth + 50,
                        y: gameConfig.groundY - 50 - Math.random() * 35,
                        wingAngle: 0
                    });
                    birdTimer = 0;
                }
            }

            // 移动障碍物
            obstacles.forEach(obs => {
                obs.x -= gameConfig.speed;
            });
            obstacles = obstacles.filter(obs => obs.x > -60);

            // 移动飞鸟
            birds.forEach(bird => {
                bird.x -= gameConfig.speed * 1.15;
                bird.wingAngle += 0.2;
            });
            birds = birds.filter(bird => bird.x > -60);

            // 跳跃物理
            if (robot.isJumping) {
                robot.velocityY += gameConfig.gravity;
                robot.y += robot.velocityY;

                if (robot.y >= gameConfig.groundY) {
                    robot.y = gameConfig.groundY;
                    robot.velocityY = 0;
                    robot.isJumping = false;
                }
            }

            if (robot.stumbleTimer > 0) {
                robot.stumbleTimer--;
            }

            if (robot.isDucking) {
                robot.currentHeight = 30;
            } else {
                robot.currentHeight = robot.baseHeight;
            }

            if (!robot.isJumping) {
                robot.legPhase += 0.35;
                robot.armPhase += 0.3;
            }

            // 检测障碍物和飞鸟
            checkObstacles();

            // 绘制所有元素
            drawObstacles();
            drawBirds();
            drawParkourRobot();

            if (!document.hidden) animation = requestAnimationFrame(gameLoop);
        }

        // 启动游戏
        let animation; gameLoop();
        document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(animation);if(!document.hidden) gameLoop();});
        window.addEventListener('pagehide',()=>cancelAnimationFrame(animation));
