// Adapted from MIT-declared upstream game.js. See THIRD_PARTY_NOTICES.md.
import {C} from "./learning.js";
function drawFinishLine(ctx, x) {
    if (x > C.WIDTH + 8) return;
    const top = C.GROUND_Y - 146;
    ctx.fillStyle = '#c4f5e3';
    ctx.fillRect(x - 2, top, 4, C.GROUND_Y - top);
    for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 6; column++) {
            ctx.fillStyle = (row + column) % 2 ? '#20352e' : '#f4fff9';
            ctx.fillRect(x + column * 7, top + row * 7, 7, 7);
        }
    }
    ctx.fillStyle = '#164c41';
    ctx.fillRect(x + 2, top + 21, 56, 29);
    ctx.fillStyle = '#f4fff9';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText('终点', x + 9, top + 43);
    for (let row = 0; row < 4; row++) {
        ctx.fillStyle = row % 2 ? '#20352e' : '#f4fff9';
        ctx.fillRect(x - 6, C.GROUND_Y + row * 6, 6, 6);
        ctx.fillStyle = row % 2 ? '#f4fff9' : '#20352e';
        ctx.fillRect(x, C.GROUND_Y + row * 6, 6, 6);
    }
}

export function drawRunner(canvas,world,finishX=null){const ctx=canvas.getContext("2d"),robot=world.robot,GAME_CONSTANTS=C;
function drawBackground() {
    // 绘制天空
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.GROUND_Y);

    // 绘制地面
    ctx.fillStyle = '#333';
    ctx.fillRect(0, GAME_CONSTANTS.GROUND_Y, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT - GAME_CONSTANTS.GROUND_Y);

    // 绘制网格线
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_CONSTANTS.WIDTH; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_CONSTANTS.GROUND_Y);
        ctx.stroke();
    }
    for (let y = 0; y < GAME_CONSTANTS.GROUND_Y; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_CONSTANTS.WIDTH, y);
        ctx.stroke();
    }
}

function drawRobot() {
    const gaitFrame = Math.floor(robot.frame / 6) % 2;
    // 机器人身体
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(robot.x, robot.y - robot.height, robot.width, robot.height);

    // 机器人头部
    ctx.fillStyle = '#00cc00';
    ctx.fillRect(robot.x + 15, robot.y - robot.height - 15, 20, 15);

    // 机器人眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(robot.x + 20, robot.y - robot.height - 10, 5, 5);
    ctx.fillRect(robot.x + 25, robot.y - robot.height - 10, 5, 5);

    // 机器人手臂
    if (robot.isJumping) {
        // 跳跃时的手臂姿势
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(robot.x - 5, robot.y - robot.height + 10, 5, 15);
        ctx.fillRect(robot.x + robot.width, robot.y - robot.height + 10, 5, 15);
    } else {
        // 跑步时的手臂姿势
        ctx.fillStyle = '#00ff00';
        if (gaitFrame === 0) {
            ctx.fillRect(robot.x - 5, robot.y - robot.height + 5, 5, 15);
            ctx.fillRect(robot.x + robot.width, robot.y - robot.height + 15, 5, 15);
        } else {
            ctx.fillRect(robot.x - 5, robot.y - robot.height + 15, 5, 15);
            ctx.fillRect(robot.x + robot.width, robot.y - robot.height + 5, 5, 15);
        }
    }

    // 机器人腿部
    if (!robot.isJumping) {
        if (gaitFrame === 0) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(robot.x + 10, robot.y, 10, 15);
            ctx.fillRect(robot.x + 30, robot.y - 5, 10, 15);
        } else {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(robot.x + 10, robot.y - 5, 10, 15);
            ctx.fillRect(robot.x + 30, robot.y, 10, 15);
        }
    }

    // Animation follows simulation time; rendering must not mutate the world.
}


drawBackground();
if (finishX !== null) drawFinishLine(ctx, finishX);
drawRobot();
for(const o of world.obstacles){if(finishX!==null && o.x>=finishX)continue;ctx.fillStyle=o.type==='beam'?'#b692ed':'#ef6858';ctx.fillRect(o.x,o.y,o.width,o.height);ctx.fillStyle='#171b2b';ctx.fillRect(o.x+5,o.y+5,o.width-10,o.height-10);}
ctx.fillStyle='#b5c5d8';ctx.font='14px system-ui';ctx.fillText('地面障碍：跳跃   横梁：下蹲',380,278);
if(world.done){
    const crossed = finishX !== null && world.success;
    ctx.fillStyle = crossed ? '#164c41' : '#000a';
    if (crossed) ctx.fillRect(313, 82, 174, 48);
    else ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    ctx.fillStyle='#fff';ctx.font='bold 24px system-ui';ctx.textAlign='center';
    ctx.fillText(crossed ? '已冲过终点' : world.reason, 400, crossed ? 115 : 130);
    ctx.textAlign='left';
}
}
