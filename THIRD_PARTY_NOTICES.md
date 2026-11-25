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

## 课堂看台插画

赛道远景使用本项目通过内置 ImageGen 生成的[看台插画](assets/motion/grandstand.webp)。机器人、跑道、动作、成绩和回放由现有程序绘制。

<details><summary>插画生成提示</summary>

横向全景，机器人田径赛的侧视看台插画。黄昏的杏橙色天空渐变到靛蓝，远处现代开放式体育场、几何屋盖、两侧亮起的高杆灯、用小色点表现的观众，电影感运动海报的丝网印刷质感。水平构图，镜头正对远侧看台，整排观众席横贯全幅，底边为深色水平挡墙。供二维游戏叠加真实跑道和角色使用。画面只画远景，不画地面跑道、运动员、机器人、文字、数字、标志或界面。

</details>

## 机器人看路

场景分割采用 Fraunhofer IOSB、德国联邦国防军大学慕尼黑分校及科布伦茨大学 GOOSE 项目的 PP-LiteSeg，保留官方 64 类顺序。Hugging Face 用户 anand-bala 发布的 ONNX 格式转换是本项目的输入，原文件 SHA-256 为 `627e56912e6cf2518159b138db13b0de8f8f466ef28543d0d0eb110190a056dc`。本项目逐输出通道压缩卷积权重，并在模型内部取最大分类分数以传回像素类别。上游代码和预训练权重采用 MIT。[GOOSE 权重](https://goose-dataset.de/docs/setup/) · [ONNX 转换](https://huggingface.co/anand-bala/goose-ppliteseg-class-512-onnx) · [上游许可](assets/vision/goose-license.txt)

场景复核使用 PaddleSeg 发布的 PP-MobileSeg-Base，在 ADE20K 的 150 个类别上预训练。官方静态导出包的 SHA-256 为 `ff2f6ea3dde9b8596a796fb061530c08da8bfe176ff2b6bc0443c140f6296142`。本项目用 Paddle2ONNX 1.3.1 转换权重，将输入归一化嵌入模型，并把解码器的分类分数缩放到 128 × 128。浏览器读取每个位置的类别和最高分。本地副本保留 Apache License 2.0。[官方模型与作者](https://github.com/PaddlePaddle/PaddleSeg/tree/release/2.8/configs/pp_mobileseg) · [ADE20K](https://ade20k.csail.mit.edu/) · [上游许可](assets/vision/paddleseg-license.txt)

GOOSE 验证集的三张场景照片已缩小并转换为 WebP。人工类别图由各帧的 `labelids.png` 以最近邻采样为 512 × 512 的灰度 PNG，保留原类别编号。页面根据人工类别叠加障碍轮廓，并按与模型相同的连通规则生成绿色区域。衍生照片、类别图与轮廓依照 CC BY-SA 4.0 发布。以下编号对应原始 `windshield_vis.png` 的帧号及时间戳。[GOOSE 数据集和作者](https://github.com/FraunhoferIOSB/goose_dataset) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

| 课堂照片 | GOOSE 拍摄序列 | 帧 |
| --- | --- | --- |
| 林荫车道 | 2023-05-15_neubiberg_rain | 0637_1684157902269729104 |
| 街口转角 | 2023-05-17_neubiberg_sunny | 0454_1684329997759205306 |
| 林间小径 | 2022-09-21_garching_uebungsplatz_2 | 0059_1663755578975613308 |

「渤海校区」的六张本机学习样图选自校方公开报道。求是街、树荫路缘、生活区直路和斑马线四张截取了原图中路面所在的区域。校方原文未标明开放转载许可，常规公开构建提供原文链接。

| 本机样图 | 来源 |
| --- | --- |
| 务实街路缘、求是街停车区 | [河北农业大学校园号《小中兄妹走进河北农业大学渤海校区》](https://xyh.univs.cn/a/xyh_xyh_hbnydx/240411/1882256.shtml) |
| 树荫下的路缘 | [河北农业大学渤海学院《校园风景》](https://bohai.hebau.edu.cn/info/1054/4456.htm) |
| 生活区楼旁直路 | [河北农业大学渤海学院《学生生活区》](https://bohai.hebau.edu.cn/info/1054/2087.htm) |
| 广场前斑马线 | 黄园摄影，[河北农业大学校园号 2024 级迎新报道](https://xyh.univs.cn/a/xyh_xyh_hbnydx/240909/1971719.shtml) |
| 校门前通道 | [河北农业大学渤海学院 2012 年迎新报道](https://bohai.hebau.edu.cn/info/1050/1326.htm) |

「黄骅道路」的两张照片均由 N509FZ 拍摄。本项目将完整画幅缩小并转为 WebP，照片与缩略图沿用 CC BY-SA 4.0。[黄石高速黄骅段原作](https://commons.wikimedia.org/wiki/File:G1811_Huangshi_Expwy_near_Huanghua-Dajiawa_Railway_(20250204160321).jpg) · [黄骅服务区西行侧加油站原作](https://commons.wikimedia.org/wiki/File:Sinopec_petrol_station_at_G1811_Huanghua_Service_Area,_westbound_(20250204161200).jpg) · [许可全文](https://creativecommons.org/licenses/by-sa/4.0/)

「景区实拍」收录以下六位摄影者的作品，采用维基共享资源的预览图，保留完整画幅并转为 WebP。本站的照片副本沿用表中许可。点击「开始识别」后，浏览器运行模型，生成绿色和橙色图层。

| 课堂照片 | 摄影署名 | 原作与许可 |
| --- | --- | --- |
| 九寨沟木栈道 | rheins | [栈道 – Boardwalk](https://commons.wikimedia.org/wiki/File:栈道_-_Boardwalk_-_2011.10_-_panoramio.jpg) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| 黄山登山石阶 | Politizer at en.wikipedia | [Huangshan steps](https://commons.wikimedia.org/wiki/File:Huangshan_steps.jpg) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| 虎跳峡山径 | © BrokenSphere / Wikimedia Commons | [Tiger Leaping Gorge trail 22](https://commons.wikimedia.org/wiki/File:Tiger_Leaping_Gorge_trail_22.JPG) · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 太鲁阁峡谷公路 | Neeson Hsu | [Highway No.8 passing through Taroko](https://commons.wikimedia.org/wiki/File:Highway_No.8_passing_through_Taroko.jpg) · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 熊野古道石铺路 | Indiana jo | [Kiiji Cobblestones 01](https://commons.wikimedia.org/wiki/File:Kiiji_Cobblestones_01.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 新森林泥泞车辙 | Lewis Clarke / Geograph | [New Forest: Muddy Track](https://commons.wikimedia.org/wiki/File:New_Forest_,_Muddy_Track_-_geograph.org.uk_-_5733734.jpg) · [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |

路况分类器由本项目在 Tong Zhao 与 Yintao Wei 的 *Road Surface Image Dataset with Detailed Annotations* 上训练，使用 Mendeley Data 2022 年 8 月 15 日发布的第 3 版，DOI 为 10.17632/w86hvkrzc5.3。该具体版本标注 CC BY 4.0。两张近照从留出部分转换为 WebP，沿用同一许可。原图分别为 `20220311141834143-dry-asphalt-severe.jpg` 与 `202202091937321-water-asphalt-severe.jpg`。[数据发布与许可](https://data.mendeley.com/datasets/w86hvkrzc5/3) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

浏览器推理采用 Microsoft ONNX Runtime Web 1.22.0 的 WebAssembly 版本，随静态页面本地提供。[运行库许可](assets/vision/runtime/LICENSE.txt) · [第三方声明](assets/vision/runtime/ThirdPartyNotices.txt)
