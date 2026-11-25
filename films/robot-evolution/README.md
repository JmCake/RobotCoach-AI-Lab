# 机器人进化跑

2 分 12.2 秒的独立课堂影片。前半段从摄像头看路讲到姿态控制、激光测距和足底力觉。后半段由同一个银白青色机器人在漫画体育场试跑，按项目模拟器记录的动作、时机和结果重绘。雨后栈道巡检是片尾的应用设想。

## 播放

- 双击[本地播放器](index.html)可连续播放或按九个章节跳转。
- 在 PowerPoint 中选择“插入 → 视频 → 此设备”，选取[完整全高清 MP4](robot-evolution-v6.mp4)。影片配有中文字幕、脚步、碰栏和场景音效，方便教师现场讲解。
- [22.5 秒动作对照](study/跨栏与钻梁.mp4)依次播放第 3 轮后腿擦栏、第 7 轮跨栏落地、第 36 轮直立碰梁和第 246 轮屈膝过梁。
- [漫画训练全段](study/漫画训练全段.mp4)截取全片 00:59.9–02:02.6，包括手写规则、真实试错、低梁和冻结测试。
- [37 秒试错训练片段](study/试错训练回放.mp4)截取全片 01:04.9–01:41.9，从撤下手写规则讲到同一栏距下两个动作的不同结果。

| 起点 | 画面 |
| --- | --- |
| 00:00 | 摄像头看见白线改向。机器人转向太晚，一脚踩到碎石，滑开后用手撑地。 |
| 00:22.2 | 胸口装上 IMU。它沿同一条红道过弯，随后分别在白天和弱光中尝试同一道矮栏。 |
| 00:38.4 | 头顶装上激光雷达。先测到栏杆，继续前进，到起跳距离才跨栏。 |
| 00:51.5 | 双脚装上足底力觉。它重新踏上刚才的土坡，收短下一步，稳住重心。 |
| 00:59.9 | 再看一次人写的起跳规则。传感器报告栏距、速度和支撑情况，运动控制器负责站稳和落地。随后撤下越障规则，让动作选择程序从零开始试。 |
| 01:10.0 | 第 3 轮起跳太早，第 6 轮继续前进，两次都碰栏。第 7 轮回到起点，在相近距离随机试跳，越过了第一栏。 |
| 01:34.9 | 第 6、36 轮同场并排回放。后者起跳过栏，仍碰到第二个障碍。第 246 轮在同一根低梁前连续下蹲，终于通过。 |
| 01:51.4 | 训练满 300 轮后冻结策略。机器人凭传感器读数在未见过的赛道先跳再蹲。 |
| 02:02.6 | 雨后栈道巡检。运动控制器接收水痕、足部滑移和身体侧倾的反馈，据此调整步态。 |

硬件分镜的依据见[传感器实验记录](source/observations.json)。训练段沿用[侧跑角色原画](source/art/side.png)、[体育场背景](source/art/stadium.png)和四个传感器画层。跑道布置、决策时的读数、探索、碰撞、越障、奖惩和动作评分取自[逐轮记录](source/training-takes.json)。运动镜头用[每秒 120 帧的位姿](source/training-motion.json)驱动角色，剪辑在决策和接触处慢放、停帧。右上角显示此刻的传感器读数，底部列出选择动作时的读数。[课堂模拟器原始画面](source/art/training-replays.mp4)可用于逐帧核对。

第 6 轮和第 36 轮使用同一条训练赛道。在雷达测得 1.46 米、速度 6.30 米/秒、脚已着地时，前者选了前进，后者按最高分选了起跳。第 6 轮到 0.83 米时仍选前进，随后碰栏，碰撞前该次动作的评分从 0.00 降到 −2.40。第 7 轮在 1.59 米处随机探索起跳，越栏事件奖励 +8。片中评分折线取自同一类观测下真实发生的起跳更新。经过 300 轮训练，动作表经历 13,857 次更新。

使用相同的四件硬件分别测试 20 条预留短道。手写规则跑完 20 条，空白动作表跑完 0 条，冻结的学习策略跑完 20 条。这个比较考察能否从奖惩中学到越障时机，三组沿用相同的运动控制器。

三次硬件复测都保留了上一次装好的部件。使用相同的 20 个种子，急弯加 IMU、弱光加雷达、起伏地面加足底力觉，三组完赛数都从 0/20 变为 20/20。在项目的标准湿滑路面上，加装足底力觉前后都能跑完 20/20。片尾展示水痕预判、鞋底滑移反馈和姿态修正如何配合。

## 参考与制作记录

[现场分析、源码核对与分镜依据](study/制作分析.md) · [现场帧索引](study/现场索引.jpg) · [硬件升级镜头选帧](study/升级过程选帧.jpg)

[上一版漫画训练影片](robot-evolution-v5.mp4)保留了早期的训练动作。[模拟器画面版](robot-evolution-v4.mp4)在训练段使用课堂模拟器画面。更早的版本有[91 秒硬件升级版](robot-evolution-v3.mp4)和[82 秒弯道修订版](robot-evolution-v2.mp4)。[12.8 秒弯道片段](study/弯道修订片段.mp4)和[修订版选帧](study/修订版选帧.jpg)可单独查看。[初版影片](robot-evolution.mp4)和[现场与初版的同步对照](study/镜头对照.mp4)记录了最早的双分格镜头。

这个目录可以整体复制。播放仅使用本地 MP4、封面和浏览器原生控件。若嵌入其他网页，可将下例的相对地址换成该网页对应的文件位置。

```html
<video controls playsinline preload="metadata" poster="films/robot-evolution/poster.jpg">
  <source src="films/robot-evolution/robot-evolution-v6.mp4" type="video/mp4">
</video>
```

## 修改和重绘

制作文件放在 [source](source) 下。[原画](source/art) 由内置 imagegen 依据录像与统一角色设定绘制。[提示词全集](source/原画提示词.json) 记录每项画稿的生成要求。正面与侧面跑步采用拆分画层，背面步态按绘制关键姿势和关节位置补间。横向失衡、跨栏和低梁收身各自有独立的动作原画。

[主时间线](source/classroom.py)控制真实训练素材的剪辑、读数、慢动作、奖惩和同场对照。[硬件分镜](source/evolution.py)与[传感器画层](source/hardware.py)沿用原实验页面的四个部件。[弯道侧拍与撑地动作](source/bend.py)沿用[弯道外景](source/art/turn-shoulder.png)和[撑地关键姿势](source/art/catch.png)。两次土坡试跑共用内置 imagegen 补绘的[起伏路面](source/art/uneven.png)。[音轨](source/sound.py)把训练中的脚步、起跳、碰撞和成功提示对齐到对应的物理帧。

[训练镜头](source/comic_training.py)按每次试跑的位移、起跳高度、步态、脚踝和收身幅度调动原画。第 6 轮的[小腿碰栏](source/art/shin-contact.png)和第 246 轮的[头顶过梁](source/art/beam-clearance.png)是内置 imagegen 依照同一机器人设定补绘的漫画特写，和全身动作并排呈现。

这版依据侧跑原画补绘了[六个跨栏姿势](source/art/hurdle-stride.png)、[四个钻梁姿势](source/art/low-stride.png)和[同一机器人的关节画稿](source/art/trackside-joints.png)。前脚落地时踩住跑道，身体继续向前并屈膝接住重量。后脚接着迈出，镜头才切走。低梁镜头用同一个机位，分别看到直立时面罩碰梁、屈膝后头顶留出空隙。动作的选择、发生时刻和奖惩来自训练记录，具体摆臂、伸腿和收腿由动画绘制。

下列命令从本目录执行。重绘需要 Python 3、NumPy、Pillow、OpenCV 与带 libx264 的 FFmpeg。若 FFmpeg 未加入 PATH，可用 `FFMPEG` 指向可执行文件，或安装 imageio-ffmpeg。Windows 默认查找微软雅黑粗体，也可通过 `ROBOTCOACH_FONT` 指定支持中文的字体文件。

```sh
python -m pip install numpy Pillow opencv-python imageio-ffmpeg
python source/export.py rebuilt.mp4
python source/export.py sample.mp4 --shot pilot --width 1280
python source/export.py previous-cut.mp4 --shot film-v2
python source/export.py hardware-cut.mp4 --shot film-v3
```

在完整项目中，从本影片目录执行 `node source/record.mjs` 可重算硬件实验。`node source/record-training.mjs` 从空表训练并复演选取的轮次，逐次核对读数、动作、奖励和完赛结果。`node source/trace-training.mjs` 根据保存的决策重建漫画使用的 1,937 帧位姿，其中包括第 7 轮越栏后落地续跑的过程。`node source/capture-training.mjs` 用项目已有的 Playwright、Edge 和 FFmpeg 调用课堂的 MotionRenderer，逐个物理帧重新拍摄原始对照。可用 `ROBOTCOACH_BROWSER` 指定其他已安装的 Chromium 通道。单独复制影片目录时，使用随片的记录和画稿即可重绘。

若持有现场 MOV，可重新生成同步对照。将命令中的路径换成实际录像位置。

```sh
python source/compare.py "2026-07-30 083638.mov" sample.mp4 "comparison-v2.mp4"
```
