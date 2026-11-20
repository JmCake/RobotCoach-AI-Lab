# 来源、许可与素材处理

本网站改编自 [PumpkinKiller04/RobotCoachAI](https://github.com/PumpkinKiller04/RobotCoachAI)。原作者的公开 README 在“许可证”一节明确声明 **MIT License**。2026-11-18 已通过 GitHub 读取并与本机源码核对。上游未提供独立 LICENSE 文件，原声明亦未填写作者真实姓名；本项目以 GitHub 用户名保留署名，不补造身份信息。

复用范围：`index.html` 的 CSS 程序绘制倒立城市、红色跑道与机器人自动跑酷；`course.html` 的书本配色与教学页序；`selection/profile.html` 的双视角诊断 Canvas；`discovery.html` 的机器人 SVG；`workshop.html` 的操场 Canvas 与传感器教学逻辑；`robot/game.js` 的跑酷绘制、跳跃、碰撞与 Q-learning 结构；`xunhuan/index.html` 和 `triangle/index.html` 的闭环节点、机器人及深色面板。对应原始文件的 SHA-256 记录在 `docs/upstream-sources.json`。

修改包括：去除账号、作业、服务调用与答题；单页课程导航；可恢复本地状态；传感器点击/拖拽安装；统一手动/训练/冻结展示；修正 Q 表持久化、终止状态更新和展示探索；增加触屏与键盘替代操作；清理离页循环。Q 表没有导入上游“常识”初始化或任何专家策略。

未复制上游 PNG、勋章、第三方案例图片、视频和音轨。这些文件缺少逐项来源与再发布许可说明。开场程序角色中原有第三方游戏人物的帽子标识、胡须和服饰特征已替换为机械外壳、天线和机器人面板，保留跑酷动作与场景；章节实验仍保留原版绿色机器人与灰色机器人形象。故障页所需四段视频由本项目以 Canvas 程序图形重新录制，无第三方图像、音轨、字体或视频片段；生成脚本为 `scripts/generate-videos.mjs`，输出为 `assets/videos/*.webm`，与新增代码一同采用 MIT。演示视频用于说明故障机制，不作为学习效果证据。

未引入 Google Fonts、远端 CDN、AI API、QuickForm 或其他云数据库依赖。字体使用操作系统字体。Playwright 仅为开发测试依赖，其 Apache-2.0 许可随 npm 包提供，不属于生产站点资源。

V2.0 继续复用以上机器人绘制、Runner 基础与 Q-learning 更新；新增的观测融合、复杂环境、决策树模仿、独立策略状态、评估及综合挑战界面为本项目扩展，采用同一 MIT 许可。未新增第三方图像、字体、视频或运行依赖。

独立 `demo-motion.html` 延续 `assets/robot.svg` 的灰色外壳、蓝色眼睛、天线与胸部指示灯，以及原版红色跑道的色彩；查阅 `robot-dom.js`、`runner-render.js` 后，将原有整块肢体/两帧绘制扩展为独立的 Canvas 关节骨架。直接复用 `assets/learning.js` 的种子随机生成器；新运动控制、逆运动学、六场景绘制与 UI 为本项目扩展，采用同一 MIT 许可。不含新第三方素材或生产依赖。

## 上游代码适用的 MIT 条款

Copyright (c) PumpkinKiller04 (RobotCoachAI contributors)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
