/* Adapted from PumpkinKiller04/RobotCoachAI, README declares MIT. See THIRD_PARTY_NOTICES.md. */
export function drawStadium(tpvCanvas, {T,robot,phase,frame,animState}) {
const tpvCtx=tpvCanvas.getContext("2d");
    function drawTPV() {
      const ctx = tpvCtx;
      const W = tpvCanvas.width, H = tpvCanvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#7cb342';
      ctx.fillRect(0, 0, W, H);

      // 跑道外轮廓
      ctx.beginPath();
      ctx.moveTo(T.leftX, T.outerTop); ctx.lineTo(T.rightX, T.outerTop);
      ctx.arc(T.rightX, T.cy, T.outerR, -Math.PI/2, Math.PI/2);
      ctx.lineTo(T.leftX, T.outerBottom);
      ctx.arc(T.leftX, T.cy, T.outerR, Math.PI/2, -Math.PI/2);
      ctx.closePath();
      ctx.moveTo(T.leftX, T.innerTop); ctx.lineTo(T.rightX, T.innerTop);
      ctx.arc(T.rightX, T.cy, T.innerR, -Math.PI/2, Math.PI/2, true);
      ctx.lineTo(T.leftX, T.innerBottom);
      ctx.arc(T.leftX, T.cy, T.innerR, Math.PI/2, -Math.PI/2, true);
      ctx.closePath();
      ctx.fillStyle = '#c0392b';
      ctx.fill('evenodd');

      // 颗粒纹理
      ctx.fillStyle = 'rgba(180,60,40,0.2)';
      for (let i = 0; i < 200; i++) {
        let px, py;
        const sec = Math.random();
        if (sec < 0.35) {
          px = T.leftX + Math.random() * (T.rightX - T.leftX);
          py = T.outerTop + Math.random() * (T.innerTop - T.outerTop);
        } else if (sec < 0.7) {
          px = T.leftX + Math.random() * (T.rightX - T.leftX);
          py = T.innerBottom + Math.random() * (T.outerBottom - T.innerBottom);
        } else if (sec < 0.85) {
          const a = -Math.PI/2 + Math.random() * Math.PI;
          const r = T.innerR + Math.random() * (T.outerR - T.innerR);
          px = T.rightX + r * Math.cos(a); py = T.cy + r * Math.sin(a);
        } else {
          const a = Math.PI/2 + Math.random() * Math.PI;
          const r = T.innerR + Math.random() * (T.outerR - T.innerR);
          px = T.leftX + r * Math.cos(a); py = T.cy + r * Math.sin(a);
        }
        ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI*2); ctx.fill();
      }

      // 分道线
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 10]);
      for (let lane = 1; lane <= 3; lane++) {
        const t = lane / 4;
        const topY = T.outerTop + (T.innerTop - T.outerTop) * t;
        const btmY = T.innerBottom + (T.outerBottom - T.innerBottom) * t;
        const r = T.innerR + (T.outerR - T.innerR) * t;
        ctx.beginPath(); ctx.moveTo(T.leftX, topY); ctx.lineTo(T.rightX, topY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(T.leftX, btmY); ctx.lineTo(T.rightX, btmY); ctx.stroke();
        ctx.beginPath(); ctx.arc(T.rightX, T.cy, r, -Math.PI/2, Math.PI/2); ctx.stroke();
        ctx.beginPath(); ctx.arc(T.leftX, T.cy, r, Math.PI/2, -Math.PI/2); ctx.stroke();
      }
      ctx.setLineDash([]);

      // 跑道边缘
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(T.leftX, T.outerTop); ctx.lineTo(T.rightX, T.outerTop);
      ctx.arc(T.rightX, T.cy, T.outerR, -Math.PI/2, Math.PI/2);
      ctx.lineTo(T.leftX, T.outerBottom);
      ctx.arc(T.leftX, T.cy, T.outerR, Math.PI/2, -Math.PI/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(T.leftX, T.innerTop); ctx.lineTo(T.rightX, T.innerTop);
      ctx.arc(T.rightX, T.cy, T.innerR, -Math.PI/2, Math.PI/2);
      ctx.lineTo(T.leftX, T.innerBottom);
      ctx.arc(T.leftX, T.cy, T.innerR, Math.PI/2, -Math.PI/2);
      ctx.stroke();

      // 中心草坪
      const grassGrad = ctx.createLinearGradient(0, T.outerTop, 0, T.outerBottom);
      grassGrad.addColorStop(0, '#66bb6a'); grassGrad.addColorStop(0.5, '#4caf50'); grassGrad.addColorStop(1, '#388e3c');
      ctx.fillStyle = grassGrad;
      ctx.beginPath();
      ctx.moveTo(T.leftX, T.innerTop); ctx.lineTo(T.rightX, T.innerTop);
      ctx.arc(T.rightX, T.cy, T.innerR, -Math.PI/2, Math.PI/2);
      ctx.lineTo(T.leftX, T.innerBottom);
      ctx.arc(T.leftX, T.cy, T.innerR, Math.PI/2, -Math.PI/2);
      ctx.closePath(); ctx.fill();

      // 颠簸路段标记（右弯道区域，机器人快跑到第二个弯道时才显示）
      if (phase >= 2) {
        // 填充背景
        ctx.fillStyle = 'rgba(255,152,0,0.35)';
        ctx.beginPath();
        ctx.arc(T.rightX, T.cy, T.outerR + 8, -Math.PI/2 + 0.3, Math.PI/2 - 0.3);
        ctx.arc(T.rightX, T.cy, T.innerR - 8, Math.PI/2 - 0.3, -Math.PI/2 + 0.3, true);
        ctx.closePath(); ctx.fill();
        // 边框
        ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(T.rightX, T.cy, T.outerR + 8, -Math.PI/2 + 0.3, Math.PI/2 - 0.3);
        ctx.arc(T.rightX, T.cy, T.innerR - 8, Math.PI/2 - 0.3, -Math.PI/2 + 0.3, true);
        ctx.closePath(); ctx.stroke();
        // 文字标签（黑色）
        ctx.fillStyle = '#000000'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('⚠️ 颠簸路段', T.rightX + 50, T.cy + 8);
      }

      // 起/终点
      ctx.fillStyle = '#fff';
      const startX = T.rightX - 40;
      ctx.fillRect(startX, T.innerBottom, 36, T.outerBottom - T.innerBottom);
      ctx.fillStyle = '#333'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('起/终点', startX + 18, T.innerBottom - 5);

      // 机器人 - 绿色小机器人
      if (animState !== 'idle') {
        const rx = robot.x, ry = robot.y;
        const BW = 20, BH = 16; // body size

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(rx, ry + 2, BW/2 + 2, 4, 0, 0, Math.PI * 2); ctx.fill();

        // 腿部（交替动画）
        ctx.fillStyle = '#00cc00';
        if (frame % 2 === 0) {
          ctx.fillRect(rx - BW/2 + 2, ry - 2, 5, 6);
          ctx.fillRect(rx + BW/2 - 7, ry - 4, 5, 6);
        } else {
          ctx.fillRect(rx - BW/2 + 2, ry - 4, 5, 6);
          ctx.fillRect(rx + BW/2 - 7, ry - 2, 5, 6);
        }

        // 身体
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(rx - BW/2, ry - BH - 2, BW, BH);

        // 手臂（交替动画）
        ctx.fillStyle = '#00ff00';
        if (frame % 2 === 0) {
          ctx.fillRect(rx - BW/2 - 2, ry - BH + 2, 2, 6);
          ctx.fillRect(rx + BW/2, ry - BH + 8, 2, 6);
        } else {
          ctx.fillRect(rx - BW/2 - 2, ry - BH + 8, 2, 6);
          ctx.fillRect(rx + BW/2, ry - BH + 2, 2, 6);
        }

        // 头部
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(rx - 6, ry - BH - 10, 12, 8);

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(rx - 4, ry - BH - 7, 2.5, 2.5);
        ctx.fillRect(rx + 1.5, ry - BH - 7, 2.5, 2.5);

        // 天线
        ctx.strokeStyle = '#00cc00'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(rx, ry - BH - 10); ctx.lineTo(rx, ry - BH - 16); ctx.stroke();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(rx, ry - BH - 17, 2.5, 0, Math.PI * 2); ctx.fill();

        // 失败标记（仅冲出跑道时）
        if (animState === 'offtrack') {
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(rx - 8, ry - BH/2 - 8); ctx.lineTo(rx + 8, ry - BH/2 + 8);
          ctx.moveTo(rx + 8, ry - BH/2 - 8); ctx.lineTo(rx - 8, ry - BH/2 + 8);
          ctx.stroke();
        }

      }
      ctx.fillStyle="#fff";ctx.font="12px system-ui";ctx.fillText("标准操场 · 原版机制演示",12,H-12);
    }
drawTPV();
}
