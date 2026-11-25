# RobotCoach 素材归档

从这里可以直接找到原画、角色拆件、动画工作文件、预制镜头、声音、真实实验和审阅用成片。按 [PR #14 的交接评论](https://github.com/JmCake/RobotCoach-AI-Lab/pull/14#issuecomment-7163172504) 整理。网页与算法取自本地成品 `9520cf1`，第一关样片取自 `d215a97`，审阅基线为 `8ef8292`。V6 的制作工程另来自同期制作工作树。这些来源在归档时保留独立版本。

| 想查看的内容 | 入口或可编辑来源 |
| --- | --- |
| V1–V6 历版影片及 V6 原始工程 | [影片库](../films/robot-evolution/) · [带章节的播放器](../films/robot-evolution/index.html) · [V6 装备与动作原画](../films/robot-evolution/source/art/) · [原提示词](../films/robot-evolution/source/原画提示词.json) |
| 角色拆件与安装件 | [身体与关节图集](../assets/story/media/runner.webp) · [关节、挂点与切片坐标](../assets/story/media/registration.json) · [四种装备与场景图层](../assets/story/media/) · [角色设定](角色与装备设定.jpg) |
| 初版第一关故事板、后续第一关样片 | [独立 HTML 草稿、两张原画与可编辑源](../production/archive/storyboard/) · [第一关课堂入口](../rescue.html) · [动态漫画取帧与审阅记录](../production/archive/iterations/) |
| 起跑、救援与握手新增素材 | [六张独立 PNG 及实际使用的六条提示词](../production/feature/plates/) · [成片制作脚本](../production/feature/render.py) · [镜头和装备定位](../assets/feature/) |
| 配音、音乐、音效 | [16 段原始配音](../production/feature/voices/) · [对白文本](../production/feature/dialogue.json) · [序幕、栏前、终章分别拆出的配乐／音效环境／对白](../production/archive/audio/stems/) · [V1–V6 母片原始 AAC 混音](../production/archive/audio/embedded/) · [原有工作混音](../production/archive/audio/work-mixes/) |
| 字幕、脚本、镜头时序 | [独立字幕与 V6 画面文字索引](../production/archive/subtitles/) · [V6 镜头起止](../production/archive/timeline/) · [互动全片时间轴](全片制作安排.md) · [导演脚本的公开文字版](../production/archive/导演脚本.md) |
| 整套作品与一次实际课堂顺播 | [完整课堂入口](../film.html) · [完整有声 MP4](全片验收/完整课堂顺播.mp4) · [该场次独立浏览器画流、音流及章节时间码](../production/archive/screening/capture/) · [本场与另一配置的记录](全片验收/) |

## 获取与启动

安装 Git、Git LFS 和 Node.js 18 或以上版本。运行页面所需的模型、推理运行时和插画随仓库提供。以下命令可从新的目录运行。

```sh
git lfs install
git clone --depth 1 --branch codex/story-assets-archive https://github.com/JmCake/RobotCoach-AI-Lab.git
cd RobotCoach-AI-Lab
git lfs pull
git lfs fsck
npm run dev
```

打开 [本机完整课堂](http://127.0.0.1:4180/film.html)。也可双击根目录的「放映《奔跑的意义》.cmd」，它会为这套课堂选择可用端口。依赖声明在 [package.json](../package.json) 和 [锁文件](../package-lock.json) 中。需要运行开发测试时再执行 `npm ci`。在仓库根目录运行 `python production/archive/verify-inventory.py` 可校验逐文件清单。

| 形态 | 本机入口 | 实现 |
| --- | --- | --- |
| 预制漫画影片 | [/films/robot-evolution/index.html](http://127.0.0.1:4180/films/robot-evolution/index.html) | 本地 MP4，可在播放器内定位 V6 章节。历版文件独立命名。 |
| 实时漫画 | [/films/robot-evolution/runner-live.html](http://127.0.0.1:4180/films/robot-evolution/runner-live.html) | Canvas 调度角色与画层；源模板及生成脚本在影片工程的 `source/web/`。 |
| 完整互动课堂 | [/film.html](http://127.0.0.1:4180/film.html) | HTML/JS/CSS 控制节奏；预制影片与挂点图层共同呈现剧情，Canvas 绘制实时动作。 |
| 早期剧情课、第一关样片 | [/story.html](http://127.0.0.1:4180/story.html) · [/rescue.html](http://127.0.0.1:4180/rescue.html) | 保留当时的独立入口、面板、实验调用和素材。 |
| 传感器与运动 | [/experiments/selection.html](http://127.0.0.1:4180/experiments/selection.html) · [/experiments/humanoid-trial.html](http://127.0.0.1:4180/experiments/humanoid-trial.html) | 传感器配置、运动控制和同条件试跑。 |
| 学习与连续赛 | [/experiments/imitation.html](http://127.0.0.1:4180/experiments/imitation.html) · [/experiments/motion-learning.html](http://127.0.0.1:4180/experiments/motion-learning.html) · [/experiments/final-race.html](http://127.0.0.1:4180/experiments/final-race.html) | 规则示范、模仿、Q 表更新与冻结测试、连续比赛与本场记录回放。 |
| 真实照片识别 | [/experiments/road-vision.html](http://127.0.0.1:4180/experiments/road-vision.html) | Web Worker、ONNX、WASM 在浏览器本地推理。摄影者、数据及模型许可见 [第三方声明](../THIRD_PARTY_NOTICES.md)。 |

## 素材形态与缺项

- 六版母片、所有已归档的视频片段、WAV、分轨 FLAC、大型独立播放器及课堂录制画流通过 Git LFS 获取。GitHub 的 ZIP 或直接读取 Git 对象可能得到指针；以上述克隆、`git lfs pull` 和校验命令为准。
- 三组可拆分的音轨保留原合成器的随机种子、淡入淡出、对白压低背景的增益和时点，由原代码分离为无损 FLAC。母片中的 AAC 同时保留。互动期间的现场音和提示音由 [Web Audio 源码](../assets/feature/location-sound.js) 控制。V6 的脚步、落地、碰撞和音调保留在 [声音制作脚本](../films/robot-evolution/source/sound.py)；原始工程中未找到逐个音效的独立采样包或 DAW 工程。顺播录音来自浏览器的媒体音轨与程序音效。
- 三段新版固定影片的对白已按原有 24 fps 字幕逻辑转存 SRT，渐显的终字幕另列。V6 原版字幕与图中文字烧录在画面，另附可检索的原文、函数、行号及镜头起止。课堂停留时长由教师决定，顺播章节时间对应保存的那一次上课录像。
- 可编辑原画以现存 PNG、透明角色图集、挂点 JSON、提示词和 Python／JS 源文件为准。没有发现分层 PSD、AE 工程或独立的 PPTX 母版。制作运行依赖见 [V6 制作说明](../films/robot-evolution/README.md) 和 [全片制作安排](全片制作安排.md)。复用新版制作脚本时，将 `ROBOTCOACH_V6_SOURCE` 指向本克隆的 `films/robot-evolution/source`。早期迭代质检脚本及拼接清单保留当时的中间文件名，部分临时渲染缓存已不在原工程。
- 公开档案采用逐项来源标注。项目生成画稿、合成声音和程序演示依仓库所有者的本次授权公开交接；第三方照片、模型和运行库沿用各自条件。照片署名、原作链接和许可证在 [第三方声明](../THIRD_PARTY_NOTICES.md) 与 [照片目录](../assets/vision/samples.js)。文件在公共仓库中可查看，不代表所有素材使用同一种许可证。
- **仅限本地交接**：课堂原始 MOV、带观众的屏摄、现场索引与摆臂抽样、现场同步对照、上游素材核对图、视觉任务包及未获转载许可的网上参考图。V6 历史播放器和制作笔记中的现场对照链接在公开版不提供媒体。请通过项目所有者申请查阅本机原始资料及已有保护备份。渤海校区照片只保留公开来源说明；本地相册及其截图、录屏不随库分发。
- 历史备份包、浏览器缓存、机器账户路径、日志与凭据不作为素材。外部训练集可按原数据项目的许可获取，仓库提供实际运行的权重、准备脚本、选用样图与出处。另一个世界观的试创稿不属于这部作品。九寨沟真实照片按 CC BY 3.0 署名；结尾的抗震搜救是作品设定的未来应用情境。


## 逐项索引

共 667 个文件；清单自身与 CSV 自身不计入。文本按 LF 统一换行计算校验，二进制对原始字节计算。完整的来源、许可、用途及校验值见 [CSV](ASSET_INVENTORY.csv)。

### 项目源码、依赖与运行

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [.gitattributes](../.gitattributes) | 全项目 · .gitattributes | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../.gitattributes) |
| [.github/workflows/pages.yml](../.github/workflows/pages.yml) | 全项目 · pages | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../.github/workflows/pages.yml) |
| [.github/workflows/v1.yml](../.github/workflows/v1.yml) | 全项目 · v1 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../.github/workflows/v1.yml) |
| [.gitignore](../.gitignore) | 全项目 · .gitignore | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../.gitignore) |
| [assets/challenge-engine.js](../assets/challenge-engine.js) | 全项目 · challenge-engine | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/challenge-engine.js) |
| [assets/challenge.js](../assets/challenge.js) | 全项目 · challenge | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/challenge.js) |
| [assets/course.css](../assets/course.css) | 全项目 · course | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/course.css) |
| [assets/course.js](../assets/course.js) | 全项目 · course | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/course.js) |
| [assets/evaluation.js](../assets/evaluation.js) | 全项目 · evaluation | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/evaluation.js) |
| [assets/experiment.css](../assets/experiment.css) | 全项目 · experiment | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/experiment.css) |
| [assets/fault-original.css](../assets/fault-original.css) | 全项目 · fault-original | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/fault-original.css) |
| [assets/fault.css](../assets/fault.css) | 全项目 · fault | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/fault.css) |
| [assets/fault.js](../assets/fault.js) | 全项目 · fault | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/fault.js) |
| [assets/frame.js](../assets/frame.js) | 全项目 · frame | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/frame.js) |
| [assets/imitation.js](../assets/imitation.js) | 全项目 · imitation | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/imitation.js) |
| [assets/learning.js](../assets/learning.js) | 全项目 · learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/learning.js) |
| [assets/loop-faults.js](../assets/loop-faults.js) | 全项目 · loop-faults | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/loop-faults.js) |
| [assets/loop-original.css](../assets/loop-original.css) | 全项目 · loop-original | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/loop-original.css) |
| [assets/loop.css](../assets/loop.css) | 全项目 · loop | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/loop.css) |
| [assets/loop.js](../assets/loop.js) | 全项目 · loop | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/loop.js) |
| [assets/parkour.js](../assets/parkour.js) | 全项目 · parkour | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/parkour.js) |
| [assets/robot-dom.js](../assets/robot-dom.js) | 全项目 · robot-dom | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/robot-dom.js) |
| [assets/robot.svg](../assets/robot.svg) | 全项目 · robot | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/robot.svg) |
| [assets/runner-render.js](../assets/runner-render.js) | 全项目 · runner-render | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/runner-render.js) |
| [assets/runner.js](../assets/runner.js) | 全项目 · runner | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/runner.js) |
| [assets/selection.js](../assets/selection.js) | 全项目 · selection | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/selection.js) |
| [assets/sensors.js](../assets/sensors.js) | 全项目 · sensors | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/sensors.js) |
| [assets/stadium.js](../assets/stadium.js) | 全项目 · stadium | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/stadium.js) |
| [assets/state.js](../assets/state.js) | 全项目 · state | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../assets/state.js) |
| [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) | 全项目 · DEVELOPMENT_PLAN | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../DEVELOPMENT_PLAN.md) |
| [LICENSE](../LICENSE) | 全项目 · LICENSE | — | 见文件及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../LICENSE) |
| [package-lock.json](../package-lock.json) | 全项目 · package-lock | — | 见文件及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../package-lock.json) |
| [package.json](../package.json) | 全项目 · package | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../package.json) |
| [playwright.config.js](../playwright.config.js) | 全项目 · playwright.config | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../playwright.config.js) |
| [README.md](../README.md) | 全项目 · README | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../README.md) |
| [scripts/build-motion.mjs](../scripts/build-motion.mjs) | 全项目 · build-motion | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/build-motion.mjs) |
| [scripts/build.mjs](../scripts/build.mjs) | 全项目 · build | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/build.mjs) |
| [scripts/capture-final-race.mjs](../scripts/capture-final-race.mjs) | 全项目 · capture-final-race | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/capture-final-race.mjs) |
| [scripts/check.mjs](../scripts/check.mjs) | 全项目 · check | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/check.mjs) |
| [scripts/evaluate-learning.mjs](../scripts/evaluate-learning.mjs) | 全项目 · evaluate-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/evaluate-learning.mjs) |
| [scripts/evaluate-motion-learning.mjs](../scripts/evaluate-motion-learning.mjs) | 全项目 · evaluate-motion-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/evaluate-motion-learning.mjs) |
| [scripts/evaluate-motion.mjs](../scripts/evaluate-motion.mjs) | 全项目 · evaluate-motion | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/evaluate-motion.mjs) |
| [scripts/evaluate-v1.1.mjs](../scripts/evaluate-v1.1.mjs) | 全项目 · evaluate-v1.1 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/evaluate-v1.1.mjs) |
| [scripts/evaluate-v2.mjs](../scripts/evaluate-v2.mjs) | 全项目 · evaluate-v2 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/evaluate-v2.mjs) |
| [scripts/generate-videos.mjs](../scripts/generate-videos.mjs) | 全项目 · generate-videos | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/generate-videos.mjs) |
| [scripts/prepare-road-obstacles.py](../scripts/prepare-road-obstacles.py) | 全项目 · prepare-road-obstacles | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/prepare-road-obstacles.py) |
| [scripts/prepare-scene-review.py](../scripts/prepare-scene-review.py) | 全项目 · prepare-scene-review | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/prepare-scene-review.py) |
| [scripts/serve.mjs](../scripts/serve.mjs) | 全项目 · serve | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/serve.mjs) |
| [scripts/start-road-preview.mjs](../scripts/start-road-preview.mjs) | 全项目 · start-road-preview | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/start-road-preview.mjs) |
| [scripts/train-road-surface.py](../scripts/train-road-surface.py) | 全项目 · train-road-surface | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/train-road-surface.py) |
| [scripts/vision_onnx.py](../scripts/vision_onnx.py) | 全项目 · vision_onnx | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../scripts/vision_onnx.py) |
| [tests/challenge.test.mjs](../tests/challenge.test.mjs) | 全项目 · challenge.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/challenge.test.mjs) |
| [tests/e2e/course.spec.js](../tests/e2e/course.spec.js) | 全项目 · course.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/course.spec.js) |
| [tests/e2e/final-race.spec.js](../tests/e2e/final-race.spec.js) | 全项目 · final-race.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/final-race.spec.js) |
| [tests/e2e/motion-learning.spec.js](../tests/e2e/motion-learning.spec.js) | 全项目 · motion-learning.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/motion-learning.spec.js) |
| [tests/e2e/motion.spec.js](../tests/e2e/motion.spec.js) | 全项目 · motion.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/motion.spec.js) |
| [tests/e2e/review.spec.js](../tests/e2e/review.spec.js) | 全项目 · review.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/review.spec.js) |
| [tests/e2e/road-vision.spec.js](../tests/e2e/road-vision.spec.js) | 全项目 · road-vision.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/road-vision.spec.js) |
| [tests/e2e/story-class.spec.js](../tests/e2e/story-class.spec.js) | 全项目 · story-class.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/story-class.spec.js) |
| [tests/e2e/v1.1.spec.js](../tests/e2e/v1.1.spec.js) | 全项目 · v1.1.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/v1.1.spec.js) |
| [tests/e2e/v2.spec.js](../tests/e2e/v2.spec.js) | 全项目 · v2.spec | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/e2e/v2.spec.js) |
| [tests/final-race.test.mjs](../tests/final-race.test.mjs) | 全项目 · final-race.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/final-race.test.mjs) |
| [tests/learning.test.mjs](../tests/learning.test.mjs) | 全项目 · learning.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/learning.test.mjs) |
| [tests/motion-learning.test.mjs](../tests/motion-learning.test.mjs) | 全项目 · motion-learning.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/motion-learning.test.mjs) |
| [tests/motion.test.mjs](../tests/motion.test.mjs) | 全项目 · motion.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/motion.test.mjs) |
| [tests/vision.test.mjs](../tests/vision.test.mjs) | 全项目 · vision.test | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../tests/vision.test.mjs) |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | 全项目 · THIRD_PARTY_NOTICES | — | 见文件及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../THIRD_PARTY_NOTICES.md) |
| [打开剧情课堂.cmd](../%E6%89%93%E5%BC%80%E5%89%A7%E6%83%85%E8%AF%BE%E5%A0%82.cmd) | 全项目 · 打开剧情课堂 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../%E6%89%93%E5%BC%80%E5%89%A7%E6%83%85%E8%AF%BE%E5%A0%82.cmd) |
| [打开第一关.cmd](../%E6%89%93%E5%BC%80%E7%AC%AC%E4%B8%80%E5%85%B3.cmd) | 全项目 · 打开第一关 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../%E6%89%93%E5%BC%80%E7%AC%AC%E4%B8%80%E5%85%B3.cmd) |
| [打开路面识别.cmd](../%E6%89%93%E5%BC%80%E8%B7%AF%E9%9D%A2%E8%AF%86%E5%88%AB.cmd) | 全项目 · 打开路面识别 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../%E6%89%93%E5%BC%80%E8%B7%AF%E9%9D%A2%E8%AF%86%E5%88%AB.cmd) |
| [放映《奔跑的意义》.cmd](../%E6%94%BE%E6%98%A0%E3%80%8A%E5%A5%94%E8%B7%91%E7%9A%84%E6%84%8F%E4%B9%89%E3%80%8B.cmd) | 全项目 · 放映《奔跑的意义》 | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 源码／配置／说明 · [源](../%E6%94%BE%E6%98%A0%E3%80%8A%E5%A5%94%E8%B7%91%E7%9A%84%E6%84%8F%E4%B9%89%E3%80%8B.cmd) |

### 配音与声音

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/feature/alone.m4a](../assets/feature/alone.m4a) | 栏前提问 · alone | 5.67 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [assets/feature/bend.m4a](../assets/feature/bend.m4a) | 弯道 · bend | 7.59 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [assets/feature/broadcast.m4a](../assets/feature/broadcast.m4a) | 决赛广播 · broadcast | 6.87 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [assets/feature/camp.m4a](../assets/feature/camp.m4a) | 训练营 · camp | 7.54 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [assets/feature/hurdle.m4a](../assets/feature/hurdle.m4a) | 矮栏 · hurdle | 7.40 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [assets/feature/trail.m4a](../assets/feature/trail.m4a) | 栈道 · trail | 7.94 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 制作混音／配音 · [源](../production/feature/render.py) |
| [production/archive/audio/embedded/robot-evolution-v2.m4a](../production/archive/audio/embedded/robot-evolution-v2.m4a) | 《机器人进化跑》 · robot-evolution-v2 | 82.00 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/embedded/robot-evolution-v3.m4a](../production/archive/audio/embedded/robot-evolution-v3.m4a) | 《机器人进化跑》 · robot-evolution-v3 | 91.00 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/embedded/robot-evolution-v4.m4a](../production/archive/audio/embedded/robot-evolution-v4.m4a) | 《机器人进化跑》 · robot-evolution-v4 | 132.20 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/embedded/robot-evolution-v5.m4a](../production/archive/audio/embedded/robot-evolution-v5.m4a) | 《机器人进化跑》 · robot-evolution-v5 | 132.20 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/embedded/robot-evolution-v6.m4a](../production/archive/audio/embedded/robot-evolution-v6.m4a) | 《机器人进化跑》 · robot-evolution-v6 | 132.20 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/embedded/robot-evolution.m4a](../production/archive/audio/embedded/robot-evolution.m4a) | 《机器人进化跑》 · robot-evolution | 82.00 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 提取的原混音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/audio/stems/bridge/dialogue.flac](../production/archive/audio/stems/bridge/dialogue.flac) | 出弯与前方矮栏 · dialogue | 23.00 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/bridge/effects-ambience.flac](../production/archive/audio/stems/bridge/effects-ambience.flac) | 出弯与前方矮栏 · effects-ambience | 23.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/bridge/music.flac](../production/archive/audio/stems/bridge/music.flac) | 出弯与前方矮栏 · music | 23.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/ending/dialogue.flac](../production/archive/audio/stems/ending/dialogue.flac) | 栈道提问至救援、握手及黑场 · dialogue | 133.00 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/ending/effects-ambience.flac](../production/archive/audio/stems/ending/effects-ambience.flac) | 栈道提问至救援、握手及黑场 · effects-ambience | 133.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/ending/music.flac](../production/archive/audio/stems/ending/music.flac) | 栈道提问至救援、握手及黑场 · music | 133.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/opening/dialogue.flac](../production/archive/audio/stems/opening/dialogue.flac) | 序幕至失衡 · dialogue | 26.00 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/opening/effects-ambience.flac](../production/archive/audio/stems/opening/effects-ambience.flac) | 序幕至失衡 · effects-ambience | 26.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/stems/opening/music.flac](../production/archive/audio/stems/opening/music.flac) | 序幕至失衡 · music | 26.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录 | 可独立编辑分轨 · [源](../production/feature/render.py) |
| [production/archive/audio/work-mixes/ending.wav](../production/archive/audio/work-mixes/ending.wav) | 栈道提问至救援、握手及黑场 · ending | 133.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录；含项目合成配音 | 制作混音／配音 · [源](../production/feature/render.py) |
| [production/archive/audio/work-mixes/opening.wav](../production/archive/audio/work-mixes/opening.wav) | 序幕至失衡 · opening | 26.00 s · 22050 Hz mono | 项目自制，按仓库所有者的本次公开归档授权收录；含项目合成配音 | 制作混音／配音 · [源](../production/feature/render.py) |
| [production/archive/iterations/curve/revised-audio.wav](../production/archive/iterations/curve/revised-audio.wav) | 《机器人进化跑》 · revised-audio | 82.00 s · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 制作混音／配音 · [源](../films/robot-evolution/source/sound.py) |
| [production/archive/screening/capture/class-audio.webm](../production/archive/screening/capture/class-audio.webm) | 《奔跑的意义》 · class-audio | 297.18 s · 48000 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录；含项目合成配音 | 制作混音／配音 · [源](../production/feature/render.py) |
| [production/feature/voices/alone.wav](../production/feature/voices/alone.wav) | 栏前提问 · 对白原始单声道录音 | 5.67 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/before.wav](../production/feature/voices/before.wav) | 撑地闪回 · 对白原始单声道录音 | 5.16 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/bend.wav](../production/feature/voices/bend.wav) | 弯道 · 对白原始单声道录音 | 7.59 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/brief.wav](../production/feature/voices/brief.wav) | 救援简报 · 对白原始单声道录音 | 8.76 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/broadcast.wav](../production/feature/voices/broadcast.wav) | 决赛广播 · 对白原始单声道录音 | 6.87 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/camp.wav](../production/feature/voices/camp.wav) | 训练营 · 对白原始单声道录音 | 7.54 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/dream.wav](../production/feature/voices/dream.wav) | 入场邀请 · 对白原始单声道录音 | 10.80 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/future.wav](../production/feature/voices/future.wav) | 片尾旁白 · 对白原始单声道录音 | 11.00 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/hold.wav](../production/feature/voices/hold.wav) | 等待人工指令 · 对白原始单声道录音 | 6.09 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/hurdle.wav](../production/feature/voices/hurdle.wav) | 矮栏 · 对白原始单声道录音 | 7.40 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/learned.wav](../production/feature/voices/learned.wav) | 结尾旁白 · 对白原始单声道录音 | 6.27 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/news.wav](../production/feature/voices/news.wav) | 《奔跑的意义》 · 对白原始单声道录音 | 9.21 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/receive.wav](../production/feature/voices/receive.wav) | 确认任务 · 对白原始单声道录音 | 4.24 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/trail.wav](../production/feature/voices/trail.wav) | 栈道 · 对白原始单声道录音 | 7.94 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/why.wav](../production/feature/voices/why.wav) | 栈道提问 · 对白原始单声道录音 | 6.32 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |
| [production/feature/voices/world.wav](../production/feature/voices/world.wav) | 离开赛场 · 对白原始单声道录音 | 4.23 s · 22050 Hz mono | 项目文本经 Windows 系统中文合成配音；项目方授权公开录音，未分发语音引擎或音色库 | 原始 WAV · [源](../production/feature/dialogue.json) |

### 课堂交互源码

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/feature/bridge-mounts.json](../assets/feature/bridge-mounts.json) | 出弯与前方矮栏 · 装备坐标／字幕数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/bridge-mounts.json) |
| [assets/feature/ending-mounts.json](../assets/feature/ending-mounts.json) | 栈道提问至救援、握手及黑场 · 装备坐标／字幕数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/ending-mounts.json) |
| [assets/feature/field.js](../assets/feature/field.js) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/field.js) |
| [assets/feature/lines.json](../assets/feature/lines.json) | 《奔跑的意义》 · 装备坐标／字幕数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/lines.json) |
| [assets/feature/location-sound.js](../assets/feature/location-sound.js) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/location-sound.js) |
| [assets/feature/opening-mounts.json](../assets/feature/opening-mounts.json) | 序幕至失衡 · 装备坐标／字幕数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/opening-mounts.json) |
| [assets/feature/screen.css](../assets/feature/screen.css) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/screen.css) |
| [assets/feature/show.js](../assets/feature/show.js) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/feature/show.js) |
| [assets/rescue/rescue.css](../assets/rescue/rescue.css) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/rescue/rescue.css) |
| [assets/rescue/rescue.js](../assets/rescue/rescue.js) | 《奔跑的意义》 · 课堂控制与交互 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/rescue/rescue.js) |
| [assets/story/media/registration.json](../assets/story/media/registration.json) | 《奔跑的意义》 · 装备坐标／字幕数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../assets/story/media/registration.json) |

### 课堂播放与装配素材

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/feature/bridge.mp4](../assets/feature/bridge.mp4) | 出弯与前方矮栏 · bridge | 23.00 s · 1280×720 · 22050 Hz mono | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 预制影片 · [源](../production/feature/render.py) |
| [assets/feature/ending.mp4](../assets/feature/ending.mp4) | 栈道提问至救援、握手及黑场 · ending | 133.00 s · 1280×720 · 22050 Hz mono | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 预制影片 · [源](../production/feature/render.py) |
| [assets/feature/hurdle-pov.webp](../assets/feature/hurdle-pov.webp) | 矮栏 · hurdle-pov | 600×334 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../production/feature/render.py) |
| [assets/feature/impact.webp](../assets/feature/impact.webp) | 《奔跑的意义》 · impact | 1280×720 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../production/feature/render.py) |
| [assets/feature/opening.mp4](../assets/feature/opening.mp4) | 序幕至失衡 · opening | 26.00 s · 1280×720 · 22050 Hz mono | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 预制影片 · [源](../production/feature/render.py) |
| [assets/feature/sample-coach.webp](../assets/feature/sample-coach.webp) | 《奔跑的意义》 · sample-coach | 1280×720 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../production/feature/render.py) |
| [assets/feature/sample-trial.webp](../assets/feature/sample-trial.webp) | 《奔跑的意义》 · sample-trial | 1137×989 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../production/feature/render.py) |
| [assets/feature/start.webp](../assets/feature/start.webp) | 《奔跑的意义》 · start | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../production/feature/render.py) |
| [assets/rescue/body.webp](../assets/rescue/body.webp) | 身体线索 · body | 999×734 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../assets/rescue/rescue.js) |
| [assets/rescue/eye.webp](../assets/rescue/eye.webp) | 视觉线索 · eye | 774×840 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../assets/rescue/rescue.js) |
| [assets/rescue/foot.webp](../assets/rescue/foot.webp) | 脚底线索 · foot | 1060×840 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../assets/rescue/rescue.js) |
| [assets/rescue/opening-v6.mp4](../assets/rescue/opening-v6.mp4) | 序幕至失衡 · opening-v6 | 17.77 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 预制影片 · [源](../assets/rescue/rescue.js) |
| [assets/rescue/prediction.webp](../assets/rescue/prediction.webp) | 第一关 · prediction | 1280×720 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../assets/rescue/rescue.js) |
| [assets/story/media/bay.webp](../assets/story/media/bay.webp) | 维修舱 · bay | 1280×720 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/bend.mp4](../assets/story/media/bend.mp4) | 弯道 · bend | 9.50 s · 1280×720 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 预制影片 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/camera.webp](../assets/story/media/camera.webp) | 头侧视觉 · camera | 200×112 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/catch.webp](../assets/story/media/catch.webp) | 撑地失衡 · catch | 1120×630 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/force.webp](../assets/story/media/force.webp) | 靴底力觉 · force | 200×112 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/grid.webp](../assets/story/media/grid.webp) | 起跑线 · grid | 1120×630 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/hurdle.webp](../assets/story/media/hurdle.webp) | 矮栏 · hurdle | 1120×630 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/imu.webp](../assets/story/media/imu.webp) | 胸前姿态 · imu | 200×112 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/lidar.webp](../assets/story/media/lidar.webp) | 头顶测距 · lidar | 200×112 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/runner.webp](../assets/story/media/runner.webp) | 角色全身／关节 · runner | 768×501 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/stadium.webp](../assets/story/media/stadium.webp) | 体育场 · stadium | 1100×396 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/through.mp4](../assets/story/media/through.mp4) | 过弯 · through | 5.30 s · 1280×720 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 预制影片 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/story/media/trail.webp](../assets/story/media/trail.webp) | 栈道 · trail | 1100×619 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 分镜／装配图层 · [源](../films/robot-evolution/source/story_media.py) |
| [assets/videos/action.webm](../assets/videos/action.webm) | 原课堂 · 闭环诊断 · action | 3.03 s · 640×300 | 项目 Canvas 录制 · MIT | 预制短片 · [源](../scripts/generate-videos.mjs) |
| [assets/videos/decision.webm](../assets/videos/decision.webm) | 原课堂 · 闭环诊断 · decision | 3.02 s · 640×300 | 项目 Canvas 录制 · MIT | 预制短片 · [源](../scripts/generate-videos.mjs) |
| [assets/videos/loop.webm](../assets/videos/loop.webm) | 原课堂 · 闭环诊断 · loop | 3.03 s · 640×300 | 项目 Canvas 录制 · MIT | 预制短片 · [源](../scripts/generate-videos.mjs) |
| [assets/videos/sense.webm](../assets/videos/sense.webm) | 原课堂 · 闭环诊断 · sense | 5.76 s · 640×300 | 项目 Canvas 录制 · MIT | 预制短片 · [源](../scripts/generate-videos.mjs) |

### 课堂与实验源码

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/motion/course-learning.css](../assets/motion/course-learning.css) | 运动、感知、训练与决赛 · course-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/course-learning.css) |
| [assets/motion/course-learning.js](../assets/motion/course-learning.js) | 运动、感知、训练与决赛 · course-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/course-learning.js) |
| [assets/motion/course-race.js](../assets/motion/course-race.js) | 运动、感知、训练与决赛 · course-race | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/course-race.js) |
| [assets/motion/course-trial.css](../assets/motion/course-trial.css) | 运动、感知、训练与决赛 · course-trial | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/course-trial.css) |
| [assets/motion/course-trial.js](../assets/motion/course-trial.js) | 运动、感知、训练与决赛 · course-trial | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/course-trial.js) |
| [assets/motion/curve-trial.js](../assets/motion/curve-trial.js) | 运动、感知、训练与决赛 · curve-trial | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/curve-trial.js) |
| [assets/motion/demo.css](../assets/motion/demo.css) | 运动、感知、训练与决赛 · demo | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/demo.css) |
| [assets/motion/demo.js](../assets/motion/demo.js) | 运动、感知、训练与决赛 · demo | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/demo.js) |
| [assets/motion/fall-feedback.js](../assets/motion/fall-feedback.js) | 运动、感知、训练与决赛 · fall-feedback | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/fall-feedback.js) |
| [assets/motion/final-race.css](../assets/motion/final-race.css) | 运动、感知、训练与决赛 · final-race | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/final-race.css) |
| [assets/motion/final-race.js](../assets/motion/final-race.js) | 运动、感知、训练与决赛 · final-race | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/final-race.js) |
| [assets/motion/final-track.js](../assets/motion/final-track.js) | 运动、感知、训练与决赛 · final-track | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/final-track.js) |
| [assets/motion/grandstand.webp](../assets/motion/grandstand.webp) | 运动、感知、训练与决赛 · grandstand | 2172×724 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画 · [源](../assets/motion/grandstand.webp) |
| [assets/motion/imitation-lesson.js](../assets/motion/imitation-lesson.js) | 运动、感知、训练与决赛 · imitation-lesson | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/imitation-lesson.js) |
| [assets/motion/playback.js](../assets/motion/playback.js) | 运动、感知、训练与决赛 · playback | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/playback.js) |
| [assets/motion/race-call.js](../assets/motion/race-call.js) | 运动、感知、训练与决赛 · race-call | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/race-call.js) |
| [assets/motion/race-record.js](../assets/motion/race-record.js) | 运动、感知、训练与决赛 · race-record | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/race-record.js) |
| [assets/motion/race-replay.js](../assets/motion/race-replay.js) | 运动、感知、训练与决赛 · race-replay | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/race-replay.js) |
| [assets/motion/render.js](../assets/motion/render.js) | 运动、感知、训练与决赛 · render | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/render.js) |
| [assets/motion/rig.js](../assets/motion/rig.js) | 运动、感知、训练与决赛 · rig | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/rig.js) |
| [assets/motion/short-course.js](../assets/motion/short-course.js) | 运动、感知、训练与决赛 · short-course | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/short-course.js) |
| [assets/motion/short-learning.js](../assets/motion/short-learning.js) | 运动、感知、训练与决赛 · short-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/short-learning.js) |
| [assets/motion/track-arc.js](../assets/motion/track-arc.js) | 运动、感知、训练与决赛 · track-arc | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/track-arc.js) |
| [assets/motion/world.js](../assets/motion/world.js) | 运动、感知、训练与决赛 · world | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/motion/world.js) |
| [assets/story/story.css](../assets/story/story.css) | 运动、感知、训练与决赛 · story | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/story/story.css) |
| [assets/story/story.js](../assets/story/story.js) | 运动、感知、训练与决赛 · story | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/story/story.js) |
| [assets/story/track.js](../assets/story/track.js) | 运动、感知、训练与决赛 · track | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../assets/story/track.js) |
| [assets/vision/corrections.js](../assets/vision/corrections.js) | 第三关 · 真实视觉实验 · corrections | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/corrections.js) |
| [assets/vision/goose-license.txt](../assets/vision/goose-license.txt) | 第三关 · 真实视觉实验 · goose-license | — | 见 THIRD_PARTY_NOTICES.md 与随附许可证 | 许可／可编辑源码 · [源](../assets/vision/goose-license.txt) |
| [assets/vision/lab.css](../assets/vision/lab.css) | 第三关 · 真实视觉实验 · lab | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/lab.css) |
| [assets/vision/lab.js](../assets/vision/lab.js) | 第三关 · 真实视觉实验 · lab | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/lab.js) |
| [assets/vision/model.worker.js](../assets/vision/model.worker.js) | 第三关 · 真实视觉实验 · model.worker | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/model.worker.js) |
| [assets/vision/observations.js](../assets/vision/observations.js) | 第三关 · 真实视觉实验 · observations | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/observations.js) |
| [assets/vision/paddleseg-license.txt](../assets/vision/paddleseg-license.txt) | 第三关 · 真实视觉实验 · paddleseg-license | — | 见 THIRD_PARTY_NOTICES.md 与随附许可证 | 许可／可编辑源码 · [源](../assets/vision/paddleseg-license.txt) |
| [assets/vision/samples.js](../assets/vision/samples.js) | 第三关 · 真实视觉实验 · samples | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/samples.js) |
| [assets/vision/scene-review.js](../assets/vision/scene-review.js) | 第三关 · 真实视觉实验 · scene-review | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 许可／可编辑源码 · [源](../assets/vision/scene-review.js) |
| [experiments/design.html](../experiments/design.html) | 运动、感知、训练与决赛 · design | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/design.html) |
| [experiments/diagnosis.html](../experiments/diagnosis.html) | 运动、感知、训练与决赛 · diagnosis | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/diagnosis.html) |
| [experiments/discovery.html](../experiments/discovery.html) | 运动、感知、训练与决赛 · discovery | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/discovery.html) |
| [experiments/fault.html](../experiments/fault.html) | 运动、感知、训练与决赛 · fault | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/fault.html) |
| [experiments/final-race.html](../experiments/final-race.html) | 运动、感知、训练与决赛 · final-race | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/final-race.html) |
| [experiments/humanoid-trial.html](../experiments/humanoid-trial.html) | 运动、感知、训练与决赛 · humanoid-trial | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/humanoid-trial.html) |
| [experiments/imitation.html](../experiments/imitation.html) | 运动、感知、训练与决赛 · imitation | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/imitation.html) |
| [experiments/loop.html](../experiments/loop.html) | 运动、感知、训练与决赛 · loop | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/loop.html) |
| [experiments/motion-learning.html](../experiments/motion-learning.html) | 运动、感知、训练与决赛 · motion-learning | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/motion-learning.html) |
| [experiments/parkour.html](../experiments/parkour.html) | 运动、感知、训练与决赛 · parkour | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/parkour.html) |
| [experiments/road-vision.html](../experiments/road-vision.html) | 运动、感知、训练与决赛 · road-vision | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/road-vision.html) |
| [experiments/runner.html](../experiments/runner.html) | 运动、感知、训练与决赛 · runner | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/runner.html) |
| [experiments/selection.html](../experiments/selection.html) | 运动、感知、训练与决赛 · selection | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可编辑源码 · [源](../experiments/selection.html) |

### 依赖与模型

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/vision/obstacles.onnx](../assets/vision/obstacles.onnx) | 第三关 · 真实识别 · 推理权重 | — | GOOSE · MIT | 运行模型 · [源](../scripts/prepare-road-obstacles.py) |
| [assets/vision/runtime/LICENSE.txt](../assets/vision/runtime/LICENSE.txt) | 真实视觉实验 · 本地 ONNX Runtime Web 及许可 | — | Microsoft · MIT 与随附第三方声明 | 上游运行依赖 · [源](../assets/vision/runtime/ThirdPartyNotices.txt) |
| [assets/vision/runtime/ort-wasm-simd-threaded.mjs](../assets/vision/runtime/ort-wasm-simd-threaded.mjs) | 真实视觉实验 · 本地 ONNX Runtime Web 及许可 | — | Microsoft · MIT 与随附第三方声明 | 上游运行依赖 · [源](../assets/vision/runtime/ThirdPartyNotices.txt) |
| [assets/vision/runtime/ort-wasm-simd-threaded.wasm](../assets/vision/runtime/ort-wasm-simd-threaded.wasm) | 真实视觉实验 · 本地 ONNX Runtime Web 及许可 | — | Microsoft · MIT 与随附第三方声明 | 上游运行依赖 · [源](../assets/vision/runtime/ThirdPartyNotices.txt) |
| [assets/vision/runtime/ort.wasm.min.mjs](../assets/vision/runtime/ort.wasm.min.mjs) | 真实视觉实验 · 本地 ONNX Runtime Web 及许可 | — | Microsoft · MIT 与随附第三方声明 | 上游运行依赖 · [源](../assets/vision/runtime/ThirdPartyNotices.txt) |
| [assets/vision/runtime/ThirdPartyNotices.txt](../assets/vision/runtime/ThirdPartyNotices.txt) | 真实视觉实验 · 本地 ONNX Runtime Web 及许可 | — | Microsoft · MIT 与随附第三方声明 | 上游运行依赖 · [源](../assets/vision/runtime/ThirdPartyNotices.txt) |
| [assets/vision/scene-review.onnx](../assets/vision/scene-review.onnx) | 第三关 · 真实识别 · 推理权重 | — | PaddleSeg · Apache-2.0 | 运行模型 · [源](../scripts/prepare-scene-review.py) |
| [assets/vision/surface.onnx](../assets/vision/surface.onnx) | 第三关 · 真实识别 · 推理权重 | — | 本项目训练；训练样本 RSCD · CC BY 4.0 | 运行模型 · [源](../scripts/train-road-surface.py) |

### 真实场景识别

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [assets/vision/samples/asphalt.webp](../assets/vision/samples/asphalt.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 240×360 · RGB | RSCD，Tong Zhao、Yintao Wei · CC BY 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/avenue-classes.png](../assets/vision/samples/avenue-classes.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 512×512 · L | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/avenue-label.png](../assets/vision/samples/avenue-label.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGBA | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/avenue.webp](../assets/vision/samples/avenue.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGB | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/huanghua-highway.webp](../assets/vision/samples/huanghua-highway.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×640 · RGB | N509FZ · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/huanghua-service.webp](../assets/vision/samples/huanghua-service.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×640 · RGB | N509FZ · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/huangshan.webp](../assets/vision/samples/huangshan.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 642×1100 · RGB | Politizer · CC BY 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/jiuzhaigou.webp](../assets/vision/samples/jiuzhaigou.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | rheins · CC BY 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/kumano.webp](../assets/vision/samples/kumano.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | Indiana jo · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/new-forest.webp](../assets/vision/samples/new-forest.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×640 · RGB | Lewis Clarke / Geograph · CC BY-SA 2.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/ruts.webp](../assets/vision/samples/ruts.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 240×360 · RGB | RSCD，Tong Zhao、Yintao Wei · CC BY 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/street-classes.png](../assets/vision/samples/street-classes.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 512×512 · L | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/street-label.png](../assets/vision/samples/street-label.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGBA | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/street.webp](../assets/vision/samples/street.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGB | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/taroko.webp](../assets/vision/samples/taroko.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | Neeson Hsu · CC BY 2.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/huanghua-highway.webp](../assets/vision/samples/thumbs/huanghua-highway.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 264×176 · RGB | N509FZ · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/huanghua-service.webp](../assets/vision/samples/thumbs/huanghua-service.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 264×176 · RGB | N509FZ · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/huangshan.webp](../assets/vision/samples/thumbs/huangshan.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 274×470 · RGB | Politizer · CC BY 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/jiuzhaigou.webp](../assets/vision/samples/thumbs/jiuzhaigou.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 320×240 · RGB | rheins · CC BY 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/kumano.webp](../assets/vision/samples/thumbs/kumano.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 320×240 · RGB | Indiana jo · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/new-forest.webp](../assets/vision/samples/thumbs/new-forest.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 320×213 · RGB | Lewis Clarke / Geograph · CC BY-SA 2.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/taroko.webp](../assets/vision/samples/thumbs/taroko.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 320×240 · RGB | Neeson Hsu · CC BY 2.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/thumbs/tiger-gorge.webp](../assets/vision/samples/thumbs/tiger-gorge.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 320×240 · RGB | BrokenSphere · CC BY-SA 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/tiger-gorge.webp](../assets/vision/samples/tiger-gorge.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | BrokenSphere · CC BY-SA 3.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/trail-classes.png](../assets/vision/samples/trail-classes.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 512×512 · L | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/trail-label.png](../assets/vision/samples/trail-label.png) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGBA | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [assets/vision/samples/trail.webp](../assets/vision/samples/trail.webp) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 1000×488 · RGB | GOOSE 数据集项目 · CC BY-SA 4.0 | 课堂显示用衍生图 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/huangshan-steps.jpg](../production/archive/vision-source/huangshan-steps.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×1646 · RGB | Politizer · CC BY 3.0 | 原始来源预览 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/jiuzhaigou-boardwalk.jpg](../production/archive/vision-source/jiuzhaigou-boardwalk.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | rheins · CC BY 3.0 | 原始来源预览 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/kumano.jpg](../production/archive/vision-source/kumano.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | Indiana jo · CC BY-SA 4.0 | 原始来源预览 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/new-forest.jpg](../production/archive/vision-source/new-forest.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×640 · RGB | Lewis Clarke / Geograph · CC BY-SA 2.0 | 原始来源预览 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/taroko.jpg](../production/archive/vision-source/taroko.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | Neeson Hsu · CC BY 2.0 | 原始来源预览 · [源](../assets/vision/samples.js) |
| [production/archive/vision-source/tiger-gorge-22.jpg](../production/archive/vision-source/tiger-gorge-22.jpg) | 第三关 · 栈道与路面 · 照片、标注或缩略图 | 960×720 · RGB | BrokenSphere · CC BY-SA 3.0 | 原始来源预览 · [源](../assets/vision/samples.js) |

### 课堂与独立入口

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [demo-motion.html](../demo-motion.html) | 运动实验 · demo-motion | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可运行 HTML · [源](../demo-motion.html) |
| [film.html](../film.html) | 《奔跑的意义》 · film | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可运行 HTML · [源](../film.html) |
| [films/robot-evolution/runner-live.html](../films/robot-evolution/runner-live.html) | 《机器人进化跑》 · 独立 Canvas 漫画，内嵌画稿 | — | 项目代码与自制 V6 美术 | 离线 HTML 成品 · [源](../films/robot-evolution/source/web) |
| [index.html](../index.html) | 《奔跑的意义》 · index | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可运行 HTML · [源](../index.html) |
| [rescue.html](../rescue.html) | 第一关 · rescue | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可运行 HTML · [源](../rescue.html) |
| [story.html](../story.html) | 第一关 · story | — | 项目源码／上游 PumpkinKiller04；MIT，详见 LICENSE 及 THIRD_PARTY_NOTICES.md | 可运行 HTML · [源](../story.html) |

### 教学与验证记录

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [docs/final-race-evidence.json](../docs/final-race-evidence.json) | 历史课堂与真实实验 · final-race-evidence | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/final-race-evidence.json) |
| [docs/HANDOFF_MOTION_DEMO.md](../docs/HANDOFF_MOTION_DEMO.md) | 历史课堂与真实实验 · HANDOFF_MOTION_DEMO | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/HANDOFF_MOTION_DEMO.md) |
| [docs/HUMANOID_MOTION_DEMO_PLAN.md](../docs/HUMANOID_MOTION_DEMO_PLAN.md) | 历史课堂与真实实验 · HUMANOID_MOTION_DEMO_PLAN | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/HUMANOID_MOTION_DEMO_PLAN.md) |
| [docs/motion-learning-rounds.csv](../docs/motion-learning-rounds.csv) | 历史课堂与真实实验 · motion-learning-rounds | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/motion-learning-rounds.csv) |
| [docs/road-vision-results.json](../docs/road-vision-results.json) | 历史课堂与真实实验 · road-vision-results | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/road-vision-results.json) |
| [docs/story-review.md](../docs/story-review.md) | 历史课堂与真实实验 · story-review | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/story-review.md) |
| [docs/upstream-sources.json](../docs/upstream-sources.json) | 历史课堂与真实实验 · upstream-sources | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/upstream-sources.json) |
| [docs/v1-training-results.json](../docs/v1-training-results.json) | 历史课堂与真实实验 · v1-training-results | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/v1-training-results.json) |
| [docs/V1_REVIEW.md](../docs/V1_REVIEW.md) | 历史课堂与真实实验 · V1_REVIEW | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/V1_REVIEW.md) |
| [docs/V1_VALIDATION.md](../docs/V1_VALIDATION.md) | 历史课堂与真实实验 · V1_VALIDATION | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/V1_VALIDATION.md) |
| [docs/剧情课程故事线.md](../docs/%E5%89%A7%E6%83%85%E8%AF%BE%E7%A8%8B%E6%95%85%E4%BA%8B%E7%BA%BF.md) | 历史课堂与真实实验 · 剧情课程故事线 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 文档／实测数据 · [源](../docs/%E5%89%A7%E6%83%85%E8%AF%BE%E7%A8%8B%E6%95%85%E4%BA%8B%E7%BA%BF.md) |

### 历史审阅与验收

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [docs/story-review/baseline-question.jpg](../docs/story-review/baseline-question.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/bay-question.jpg](../docs/story-review/bay-question.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×904 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/failed.jpg](../docs/story-review/failed.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/hurdle.jpg](../docs/story-review/hurdle.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/retry.jpg](../docs/story-review/retry.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×904 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/success-film.jpg](../docs/story-review/success-film.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/story-review/success-review.jpg](../docs/story-review/success-review.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×914 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/剧情课堂第一关预览.jpg](../docs/%E5%89%A7%E6%83%85%E8%AF%BE%E5%A0%82%E7%AC%AC%E4%B8%80%E5%85%B3%E9%A2%84%E8%A7%88.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1365×978 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../story.html) |
| [docs/第一关样片/01-比赛开始.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/01-%E6%AF%94%E8%B5%9B%E5%BC%80%E5%A7%8B.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/02-预测定格.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/02-%E9%A2%84%E6%B5%8B%E5%AE%9A%E6%A0%BC.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/03-事故现场.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/03-%E4%BA%8B%E6%95%85%E7%8E%B0%E5%9C%BA.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/04-三格线索.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/04-%E4%B8%89%E6%A0%BC%E7%BA%BF%E7%B4%A2.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/05-改装选择.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/05-%E6%94%B9%E8%A3%85%E9%80%89%E6%8B%A9.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/06-真实失败.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/06-%E7%9C%9F%E5%AE%9E%E5%A4%B1%E8%B4%A5.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/07-实际完赛.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/07-%E5%AE%9E%E9%99%85%E5%AE%8C%E8%B5%9B.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/08-成功过弯.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/08-%E6%88%90%E5%8A%9F%E8%BF%87%E5%BC%AF.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/09-栏前收束.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/09-%E6%A0%8F%E5%89%8D%E6%94%B6%E6%9D%9F.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 1440×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/10-手机栏前.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/10-%E6%89%8B%E6%9C%BA%E6%A0%8F%E5%89%8D.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 390×844 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |
| [docs/第一关样片/11-手机线索.jpg](../docs/%E7%AC%AC%E4%B8%80%E5%85%B3%E6%A0%B7%E7%89%87/11-%E6%89%8B%E6%9C%BA%E7%BA%BF%E7%B4%A2.jpg) | 第一关／剧情课堂 · 实际页面的审阅截图 | 390×844 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 验收画面 · [源](../rescue.html) |

### 导演脚本、时间轴与制作源

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [docs/全片制作安排.md](../docs/%E5%85%A8%E7%89%87%E5%88%B6%E4%BD%9C%E5%AE%89%E6%8E%92.md) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../docs/%E5%85%A8%E7%89%87%E5%88%B6%E4%BD%9C%E5%AE%89%E6%8E%92.md) |
| [docs/角色与装备设定.jpg](../docs/%E8%A7%92%E8%89%B2%E4%B8%8E%E8%A3%85%E5%A4%87%E8%AE%BE%E5%AE%9A.jpg) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | 1400×854 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 角色设定图 · [源](../docs/%E8%A7%92%E8%89%B2%E4%B8%8E%E8%A3%85%E5%A4%87%E8%AE%BE%E5%AE%9A.jpg) |
| [production/archive/export-audio-captions.py](../production/archive/export-audio-captions.py) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/export-audio-captions.py) |
| [production/archive/subtitles/bridge.srt](../production/archive/subtitles/bridge.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/bridge.srt) |
| [production/archive/subtitles/ending-titles.srt](../production/archive/subtitles/ending-titles.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/ending-titles.srt) |
| [production/archive/subtitles/ending.srt](../production/archive/subtitles/ending.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/ending.srt) |
| [production/archive/subtitles/line-alone.srt](../production/archive/subtitles/line-alone.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-alone.srt) |
| [production/archive/subtitles/line-bend.srt](../production/archive/subtitles/line-bend.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-bend.srt) |
| [production/archive/subtitles/line-broadcast.srt](../production/archive/subtitles/line-broadcast.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-broadcast.srt) |
| [production/archive/subtitles/line-camp.srt](../production/archive/subtitles/line-camp.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-camp.srt) |
| [production/archive/subtitles/line-hurdle.srt](../production/archive/subtitles/line-hurdle.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-hurdle.srt) |
| [production/archive/subtitles/line-trail.srt](../production/archive/subtitles/line-trail.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/line-trail.srt) |
| [production/archive/subtitles/opening.srt](../production/archive/subtitles/opening.srt) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/opening.srt) |
| [production/archive/subtitles/V6画面文字来源.csv](../production/archive/subtitles/V6%E7%94%BB%E9%9D%A2%E6%96%87%E5%AD%97%E6%9D%A5%E6%BA%90.csv) | 《机器人进化跑》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/subtitles/V6%E7%94%BB%E9%9D%A2%E6%96%87%E5%AD%97%E6%9D%A5%E6%BA%90.csv) |
| [production/archive/timeline/V6镜头时间轴.csv](../production/archive/timeline/V6%E9%95%9C%E5%A4%B4%E6%97%B6%E9%97%B4%E8%BD%B4.csv) | 《机器人进化跑》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/timeline/V6%E9%95%9C%E5%A4%B4%E6%97%B6%E9%97%B4%E8%BD%B4.csv) |
| [production/archive/verify-inventory.py](../production/archive/verify-inventory.py) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/verify-inventory.py) |
| [production/archive/workprint/cut.py](../production/archive/workprint/cut.py) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/workprint/cut.py) |
| [production/archive/导演脚本.md](../production/archive/%E5%AF%BC%E6%BC%94%E8%84%9A%E6%9C%AC.md) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/%E5%AF%BC%E6%BC%94%E8%84%9A%E6%9C%AC.md) |
| [production/feature/dialogue.json](../production/feature/dialogue.json) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/feature/dialogue.json) |
| [production/feature/render.py](../production/feature/render.py) | 《奔跑的意义》 · 对白、字幕、时间轴、设定或制作脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/feature/render.py) |

### 顺播与验收实录

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [docs/全片验收/01-起跑线的邀请.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/01-%E8%B5%B7%E8%B7%91%E7%BA%BF%E7%9A%84%E9%82%80%E8%AF%B7.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/02-事故定格与证据.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/02-%E4%BA%8B%E6%95%85%E5%AE%9A%E6%A0%BC%E4%B8%8E%E8%AF%81%E6%8D%AE.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/03-原机改装.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/03-%E5%8E%9F%E6%9C%BA%E6%94%B9%E8%A3%85.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/04-两种学习方式.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/04-%E4%B8%A4%E7%A7%8D%E5%AD%A6%E4%B9%A0%E6%96%B9%E5%BC%8F.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/05-冻结测试.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/05-%E5%86%BB%E7%BB%93%E6%B5%8B%E8%AF%95.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/06-连续总决赛.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/06-%E8%BF%9E%E7%BB%AD%E6%80%BB%E5%86%B3%E8%B5%9B.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/07-九寨沟原图核对.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/07-%E4%B9%9D%E5%AF%A8%E6%B2%9F%E5%8E%9F%E5%9B%BE%E6%A0%B8%E5%AF%B9.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/08-救援现场.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/08-%E6%95%91%E6%8F%B4%E7%8E%B0%E5%9C%BA.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/09-废墟探查.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/09-%E5%BA%9F%E5%A2%9F%E6%8E%A2%E6%9F%A5.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/10-回传等待.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/10-%E5%9B%9E%E4%BC%A0%E7%AD%89%E5%BE%85.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/11-手与手.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/11-%E6%89%8B%E4%B8%8E%E6%89%8B.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/12-终字幕.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/12-%E7%BB%88%E5%AD%97%E5%B9%95.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/13-黑场.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/13-%E9%BB%91%E5%9C%BA.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1440×900 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/复验-另一配置.json](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E5%A4%8D%E9%AA%8C-%E5%8F%A6%E4%B8%80%E9%85%8D%E7%BD%AE.json) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E5%A4%8D%E9%AA%8C-%E5%8F%A6%E4%B8%80%E9%85%8D%E7%BD%AE.json) |
| [docs/全片验收/完整课堂顺播.mp4](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E5%AE%8C%E6%95%B4%E8%AF%BE%E5%A0%82%E9%A1%BA%E6%92%AD.mp4) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 297.46 s · 1280×800 · 48000 Hz stereo | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 顺播成品 · [源](../production/archive/screening) |
| [docs/全片验收/手机-训练讨论.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E6%89%8B%E6%9C%BA-%E8%AE%AD%E7%BB%83%E8%AE%A8%E8%AE%BA.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 390×844 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/顺播六帧.jpg](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E9%A1%BA%E6%92%AD%E5%85%AD%E5%B8%A7.jpg) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 1256×1138 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 实拍屏幕截图 · [源](../production/archive/screening) |
| [docs/全片验收/顺播实测.json](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E9%A1%BA%E6%92%AD%E5%AE%9E%E6%B5%8B.json) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../docs/%E5%85%A8%E7%89%87%E9%AA%8C%E6%94%B6/%E9%A1%BA%E6%92%AD%E5%AE%9E%E6%B5%8B.json) |
| [production/archive/screening/capture/chapters.ffmeta](../production/archive/screening/capture/chapters.ffmeta) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/capture/chapters.ffmeta) |
| [production/archive/screening/capture/projector.mp4](../production/archive/screening/capture/projector.mp4) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | 297.46 s · 1280×800 | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 分离画流 · [源](../production/archive/screening) |
| [production/archive/screening/capture/sources.json](../production/archive/screening/capture/sources.json) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/capture/sources.json) |
| [production/archive/screening/capture.cjs](../production/archive/screening/capture.cjs) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/capture.cjs) |
| [production/archive/screening/check-controls.cjs](../production/archive/screening/check-controls.cjs) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/check-controls.cjs) |
| [production/archive/screening/mux.py](../production/archive/screening/mux.py) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/mux.py) |
| [production/archive/screening/screening.cjs](../production/archive/screening/screening.cjs) | 《奔跑的意义》 · 实际浏览器画面／本场数据／验收脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑记录 · [源](../production/archive/screening/screening.cjs) |

### V6 制作工程

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [films/robot-evolution/index.html](../films/robot-evolution/index.html) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/index.html) |
| [films/robot-evolution/README.md](../films/robot-evolution/README.md) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/README.md) |
| [films/robot-evolution/source/athletic_cels.py](../films/robot-evolution/source/athletic_cels.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/athletic_cels.py) |
| [films/robot-evolution/source/athletic_keys.py](../films/robot-evolution/source/athletic_keys.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/athletic_keys.py) |
| [films/robot-evolution/source/athletic_motion.py](../films/robot-evolution/source/athletic_motion.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/athletic_motion.py) |
| [films/robot-evolution/source/bend.py](../films/robot-evolution/source/bend.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/bend.py) |
| [films/robot-evolution/source/capture-training.mjs](../films/robot-evolution/source/capture-training.mjs) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/capture-training.mjs) |
| [films/robot-evolution/source/classroom.py](../films/robot-evolution/source/classroom.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/classroom.py) |
| [films/robot-evolution/source/comic_training.py](../films/robot-evolution/source/comic_training.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/comic_training.py) |
| [films/robot-evolution/source/compare.py](../films/robot-evolution/source/compare.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/compare.py) |
| [films/robot-evolution/source/cycles.py](../films/robot-evolution/source/cycles.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/cycles.py) |
| [films/robot-evolution/source/evolution.py](../films/robot-evolution/source/evolution.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/evolution.py) |
| [films/robot-evolution/source/export.py](../films/robot-evolution/source/export.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/source/film.py](../films/robot-evolution/source/film.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/film.py) |
| [films/robot-evolution/source/hardware.py](../films/robot-evolution/source/hardware.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/hardware.py) |
| [films/robot-evolution/source/observations.json](../films/robot-evolution/source/observations.json) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/observations.json) |
| [films/robot-evolution/source/paint.py](../films/robot-evolution/source/paint.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/paint.py) |
| [films/robot-evolution/source/pilot.py](../films/robot-evolution/source/pilot.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/pilot.py) |
| [films/robot-evolution/source/record-training.mjs](../films/robot-evolution/source/record-training.mjs) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/record-training.mjs) |
| [films/robot-evolution/source/record.mjs](../films/robot-evolution/source/record.mjs) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/record.mjs) |
| [films/robot-evolution/source/runner.py](../films/robot-evolution/source/runner.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/runner.py) |
| [films/robot-evolution/source/side_runner.py](../films/robot-evolution/source/side_runner.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/side_runner.py) |
| [films/robot-evolution/source/sound.py](../films/robot-evolution/source/sound.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/sound.py) |
| [films/robot-evolution/source/story_media.py](../films/robot-evolution/source/story_media.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/story_media.py) |
| [films/robot-evolution/source/trace-training.mjs](../films/robot-evolution/source/trace-training.mjs) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/trace-training.mjs) |
| [films/robot-evolution/source/training-motion.json](../films/robot-evolution/source/training-motion.json) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/training-motion.json) |
| [films/robot-evolution/source/training-takes.json](../films/robot-evolution/source/training-takes.json) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/training-takes.json) |
| [films/robot-evolution/source/web/build.py](../films/robot-evolution/source/web/build.py) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/web/build.py) |
| [films/robot-evolution/source/web/motion.js](../films/robot-evolution/source/web/motion.js) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/web/motion.js) |
| [films/robot-evolution/source/web/page.html](../films/robot-evolution/source/web/page.html) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/web/page.html) |
| [films/robot-evolution/source/原画提示词.json](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/study/V6网页端进度报告.txt](../films/robot-evolution/study/V6%E7%BD%91%E9%A1%B5%E7%AB%AF%E8%BF%9B%E5%BA%A6%E6%8A%A5%E5%91%8A.txt) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/study/V6%E7%BD%91%E9%A1%B5%E7%AB%AF%E8%BF%9B%E5%BA%A6%E6%8A%A5%E5%91%8A.txt) |
| [films/robot-evolution/study/制作分析.md](../films/robot-evolution/study/%E5%88%B6%E4%BD%9C%E5%88%86%E6%9E%90.md) | 《机器人进化跑》 · 播放、场景、制作说明或动作数据 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../films/robot-evolution/study/%E5%88%B6%E4%BD%9C%E5%88%86%E6%9E%90.md) |

### V6 关键帧与审片

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [films/robot-evolution/poster.jpg](../films/robot-evolution/poster.jpg) | 《机器人进化跑》 · 选帧／封面／动作对照 | 1440×810 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 合成选帧 · [源](../films/robot-evolution/source) |
| [films/robot-evolution/study/V6训练动作对照.jpg](../films/robot-evolution/study/V6%E8%AE%AD%E7%BB%83%E5%8A%A8%E4%BD%9C%E5%AF%B9%E7%85%A7.jpg) | 《机器人进化跑》 · 选帧／封面／动作对照 | 1384×1646 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 合成选帧 · [源](../films/robot-evolution/source) |
| [films/robot-evolution/study/修订版选帧.jpg](../films/robot-evolution/study/%E4%BF%AE%E8%AE%A2%E7%89%88%E9%80%89%E5%B8%A7.jpg) | 《机器人进化跑》 · 选帧／封面／动作对照 | 1440×480 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 合成选帧 · [源](../films/robot-evolution/source) |
| [films/robot-evolution/study/升级过程选帧.jpg](../films/robot-evolution/study/%E5%8D%87%E7%BA%A7%E8%BF%87%E7%A8%8B%E9%80%89%E5%B8%A7.jpg) | 《机器人进化跑》 · 选帧／封面／动作对照 | 1470×1565 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 合成选帧 · [源](../films/robot-evolution/source) |
| [films/robot-evolution/study/成片选帧.jpg](../films/robot-evolution/study/%E6%88%90%E7%89%87%E9%80%89%E5%B8%A7.jpg) | 《机器人进化跑》 · 选帧／封面／动作对照 | 1440×480 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 合成选帧 · [源](../films/robot-evolution/source) |

### 历版母片与独立片段

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [films/robot-evolution/robot-evolution-v2.mp4](../films/robot-evolution/robot-evolution-v2.mp4) | 《机器人进化跑》 · 版本母片 | 82.00 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/robot-evolution-v3.mp4](../films/robot-evolution/robot-evolution-v3.mp4) | 《机器人进化跑》 · 版本母片 | 91.00 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/robot-evolution-v4.mp4](../films/robot-evolution/robot-evolution-v4.mp4) | 《机器人进化跑》 · 版本母片 | 132.20 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/robot-evolution-v5.mp4](../films/robot-evolution/robot-evolution-v5.mp4) | 《机器人进化跑》 · 版本母片 | 132.20 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/robot-evolution-v6.mp4](../films/robot-evolution/robot-evolution-v6.mp4) | 《机器人进化跑》 · 版本母片 | 132.20 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/robot-evolution.mp4](../films/robot-evolution/robot-evolution.mp4) | 《机器人进化跑》 · 版本母片 | 82.00 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/study/弯道修订片段.mp4](../films/robot-evolution/study/%E5%BC%AF%E9%81%93%E4%BF%AE%E8%AE%A2%E7%89%87%E6%AE%B5.mp4) | 《机器人进化跑》 · 弯道修订片段 · 独立节选 | 12.80 s · 1280×720 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/study/漫画训练全段.mp4](../films/robot-evolution/study/%E6%BC%AB%E7%94%BB%E8%AE%AD%E7%BB%83%E5%85%A8%E6%AE%B5.mp4) | 《机器人进化跑》 · 漫画训练全段 · 独立节选 | 62.70 s · 1920×1080 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/study/试错训练回放.mp4](../films/robot-evolution/study/%E8%AF%95%E9%94%99%E8%AE%AD%E7%BB%83%E5%9B%9E%E6%94%BE.mp4) | 《机器人进化跑》 · 试错训练回放 · 独立节选 | 37.00 s · 1280×720 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |
| [films/robot-evolution/study/跨栏与钻梁.mp4](../films/robot-evolution/study/%E8%B7%A8%E6%A0%8F%E4%B8%8E%E9%92%BB%E6%A2%81.mp4) | 《机器人进化跑》 · 跨栏与钻梁 · 独立节选 | 22.50 s · 1280×720 · 44100 Hz stereo | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档；原创程序音效 | 已合成影片 · [源](../films/robot-evolution/source/export.py) |

### V6 美术与动作

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [films/robot-evolution/source/art/bank.png](../films/robot-evolution/source/art/bank.png) | 《机器人进化跑》 · bank | 1774×887 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/bay.png](../films/robot-evolution/source/art/bay.png) | 维修舱 · bay | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/beam-clearance.png](../films/robot-evolution/source/art/beam-clearance.png) | 《机器人进化跑》 · beam-clearance | 1536×1024 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/catch.png](../films/robot-evolution/source/art/catch.png) | 撑地失衡 · catch | 2172×724 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/curve.png](../films/robot-evolution/source/art/curve.png) | 《机器人进化跑》 · curve | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/duck.png](../films/robot-evolution/source/art/duck.png) | 《机器人进化跑》 · duck | 1254×1254 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/hurdle-stride.png](../films/robot-evolution/source/art/hurdle-stride.png) | 矮栏 · hurdle-stride | 1536×1024 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/leap.png](../films/robot-evolution/source/art/leap.png) | 《机器人进化跑》 · leap | 1774×887 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/low-stride.png](../films/robot-evolution/source/art/low-stride.png) | 《机器人进化跑》 · low-stride | 1263×1246 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/rear.png](../films/robot-evolution/source/art/rear.png) | 《机器人进化跑》 · rear | 1254×1254 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/runner.png](../films/robot-evolution/source/art/runner.png) | 角色全身／关节 · runner | 1086×1448 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/shin-contact.png](../films/robot-evolution/source/art/shin-contact.png) | 《机器人进化跑》 · shin-contact | 1536×1024 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/side.png](../films/robot-evolution/source/art/side.png) | 《机器人进化跑》 · side | 1536×1024 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/split.png](../films/robot-evolution/source/art/split.png) | 《机器人进化跑》 · split | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/stadium.png](../films/robot-evolution/source/art/stadium.png) | 体育场 · stadium | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/trackside-joints.png](../films/robot-evolution/source/art/trackside-joints.png) | 《机器人进化跑》 · trackside-joints | 1774×887 · RGBA | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/trail.png](../films/robot-evolution/source/art/trail.png) | 栈道 · trail | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/training-replays.mp4](../films/robot-evolution/source/art/training-replays.mp4) | 《机器人进化跑》 · training-replays | 15.42 s · 1536×864 | 项目自制，按仓库所有者的本次公开归档授权收录 | 实时训练画面源 · [源](../films/robot-evolution/source/capture-training.mjs) |
| [films/robot-evolution/source/art/turn-shoulder.png](../films/robot-evolution/source/art/turn-shoulder.png) | 《机器人进化跑》 · turn-shoulder | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/uneven.png](../films/robot-evolution/source/art/uneven.png) | 《机器人进化跑》 · uneven | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |
| [films/robot-evolution/source/art/verge.png](../films/robot-evolution/source/art/verge.png) | 《机器人进化跑》 · verge | 1671×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画／动作图集 · [源](../films/robot-evolution/source/%E5%8E%9F%E7%94%BB%E6%8F%90%E7%A4%BA%E8%AF%8D.json) |

### 历史制作与关键帧

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [production/archive/feature-keys/art-check.jpg](../production/archive/feature-keys/art-check.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · art-check | 800×400 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/coords.jpg](../production/archive/feature-keys/coords.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · coords | 960×810 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/exit-film.jpg](../production/archive/feature-keys/exit-film.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · exit-film | 700×480 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/keyframes.jpg](../production/archive/feature-keys/keyframes.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · keyframes | 640×540 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/latest-check.jpg](../production/archive/feature-keys/latest-check.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · latest-check | 720×450 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/plates.jpg](../production/archive/feature-keys/plates.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · plates | 960×600 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/recording-check.jpg](../production/archive/feature-keys/recording-check.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · recording-check | 720×405 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/reel-check.jpg](../production/archive/feature-keys/reel-check.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · reel-check | 800×750 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/rescue-check.jpg](../production/archive/feature-keys/rescue-check.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · rescue-check | 840×654 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/review-small.jpg](../production/archive/feature-keys/review-small.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · review-small | 640×630 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/feature-keys/split.jpg](../production/archive/feature-keys/split.jpg) | 《奔跑的意义》 · 镜头核对／拆分片段 · split | 640×200 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 工作素材／已渲染 · [源](../production/feature/render.py) |
| [production/archive/iterations/curve/bend-excerpt.mp4](../production/archive/iterations/curve/bend-excerpt.mp4) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · bend-excerpt | 12.80 s · 1280×720 · 44100 Hz stereo | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/new-sequence.jpg](../production/archive/iterations/curve/new-sequence.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · new-sequence | 1280×808 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/picture.ffconcat](../production/archive/iterations/curve/picture.ffconcat) | 《机器人进化跑》 · curve · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/curve/picture.ffconcat) |
| [production/archive/iterations/curve/pose-grid.jpg](../production/archive/iterations/curve/pose-grid.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · pose-grid | 1110×386 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/revised-chapter.mp4](../production/archive/iterations/curve/revised-chapter.mp4) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · revised-chapter | 17.20 s · 1920×1080 | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/revised-stills.jpg](../production/archive/iterations/curve/revised-stills.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · revised-stills | 1440×480 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/shot-10.64.jpg](../production/archive/iterations/curve/shot-10.64.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · shot-10.64 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/shot-10.71.jpg](../production/archive/iterations/curve/shot-10.71.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · shot-10.71 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/shot-12.48.jpg](../production/archive/iterations/curve/shot-12.48.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · shot-12.48 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/shot-16.2.jpg](../production/archive/iterations/curve/shot-16.2.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · shot-16.2 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/shot-9.8.jpg](../production/archive/iterations/curve/shot-9.8.jpg) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · shot-9.8 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/v1-bridge.mp4](../production/archive/iterations/curve/v1-bridge.mp4) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · v1-bridge | 7.80 s · 1920×1080 | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/v1-head.mp4](../production/archive/iterations/curve/v1-head.mp4) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · v1-head | 5.00 s · 1920×1080 | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/v1-tail.mp4](../production/archive/iterations/curve/v1-tail.mp4) | 《机器人进化跑》 · curve · 镜头核对／拆分片段 · v1-tail | 52.00 s · 1920×1080 | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/curve/validate-player.cjs](../production/archive/iterations/curve/validate-player.cjs) | 《机器人进化跑》 · curve · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/curve/validate-player.cjs) |
| [production/archive/iterations/v3/art.jpg](../production/archive/iterations/v3/art.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · art | 1200×800 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-14.95.jpg](../production/archive/iterations/v3/frame-14.95.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-14.95 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-18.30.jpg](../production/archive/iterations/v3/frame-18.30.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-18.30 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-2.95.jpg](../production/archive/iterations/v3/frame-2.95.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-2.95 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-23.00.jpg](../production/archive/iterations/v3/frame-23.00.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-23.00 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-24.70.jpg](../production/archive/iterations/v3/frame-24.70.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-24.70 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-26.05.jpg](../production/archive/iterations/v3/frame-26.05.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-26.05 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-29.43.jpg](../production/archive/iterations/v3/frame-29.43.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-29.43 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-30.95.jpg](../production/archive/iterations/v3/frame-30.95.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-30.95 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-32.57.jpg](../production/archive/iterations/v3/frame-32.57.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-32.57 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-34.91.jpg](../production/archive/iterations/v3/frame-34.91.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-34.91 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-37.40.jpg](../production/archive/iterations/v3/frame-37.40.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-37.40 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-39.58.jpg](../production/archive/iterations/v3/frame-39.58.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-39.58 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-42.59.jpg](../production/archive/iterations/v3/frame-42.59.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-42.59 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-44.03.jpg](../production/archive/iterations/v3/frame-44.03.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-44.03 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-45.80.jpg](../production/archive/iterations/v3/frame-45.80.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-45.80 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-47.55.jpg](../production/archive/iterations/v3/frame-47.55.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-47.55 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-48.64.jpg](../production/archive/iterations/v3/frame-48.64.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-48.64 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-50.70.jpg](../production/archive/iterations/v3/frame-50.70.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-50.70 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-53.70.jpg](../production/archive/iterations/v3/frame-53.70.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-53.70 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-54.66.jpg](../production/archive/iterations/v3/frame-54.66.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-54.66 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-56.85.jpg](../production/archive/iterations/v3/frame-56.85.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-56.85 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-58.30.jpg](../production/archive/iterations/v3/frame-58.30.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-58.30 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-6.80.jpg](../production/archive/iterations/v3/frame-6.80.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-6.80 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-61.55.jpg](../production/archive/iterations/v3/frame-61.55.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-61.55 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-64.40.jpg](../production/archive/iterations/v3/frame-64.40.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-64.40 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-67.85.jpg](../production/archive/iterations/v3/frame-67.85.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-67.85 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-69.80.jpg](../production/archive/iterations/v3/frame-69.80.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-69.80 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-72.52.jpg](../production/archive/iterations/v3/frame-72.52.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-72.52 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-75.36.jpg](../production/archive/iterations/v3/frame-75.36.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-75.36 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-77.80.jpg](../production/archive/iterations/v3/frame-77.80.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-77.80 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-80.70.jpg](../production/archive/iterations/v3/frame-80.70.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-80.70 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-83.06.jpg](../production/archive/iterations/v3/frame-83.06.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-83.06 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/frame-86.40.jpg](../production/archive/iterations/v3/frame-86.40.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · frame-86.40 | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/old-poster.jpg](../production/archive/iterations/v3/old-poster.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · old-poster | 500×281 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/pose-grid.jpg](../production/archive/iterations/v3/pose-grid.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · pose-grid | 1000×500 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-32.50.jpg](../production/archive/iterations/v3/review-32.50.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-32.50 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-36.92.jpg](../production/archive/iterations/v3/review-36.92.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-36.92 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-37.53.jpg](../production/archive/iterations/v3/review-37.53.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-37.53 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-48.50.jpg](../production/archive/iterations/v3/review-48.50.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-48.50 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-49.25.jpg](../production/archive/iterations/v3/review-49.25.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-49.25 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-50.30.jpg](../production/archive/iterations/v3/review-50.30.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-50.30 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-56.65.jpg](../production/archive/iterations/v3/review-56.65.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-56.65 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-57.68.jpg](../production/archive/iterations/v3/review-57.68.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-57.68 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-59.49.jpg](../production/archive/iterations/v3/review-59.49.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-59.49 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-63.22.jpg](../production/archive/iterations/v3/review-63.22.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-63.22 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-85.90.jpg](../production/archive/iterations/v3/review-85.90.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-85.90 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/review-89.55.jpg](../production/archive/iterations/v3/review-89.55.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · review-89.55 | 960×540 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/revised-scenes.jpg](../production/archive/iterations/v3/revised-scenes.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · revised-scenes | 1440×1160 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/rough-0.jpg](../production/archive/iterations/v3/rough-0.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · rough-0 | 1230×996 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/rough-1.jpg](../production/archive/iterations/v3/rough-1.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · rough-1 | 1230×996 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/rough-2.jpg](../production/archive/iterations/v3/rough-2.jpg) | 《机器人进化跑》 · v3 · 镜头核对／拆分片段 · rough-2 | 1230×747 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v3/verify-film.py](../production/archive/iterations/v3/verify-film.py) | 《机器人进化跑》 · v3 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v3/verify-film.py) |
| [production/archive/iterations/v3/verify-player.cjs](../production/archive/iterations/v3/verify-player.cjs) | 《机器人进化跑》 · v3 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v3/verify-player.cjs) |
| [production/archive/iterations/v4/duck.jpg](../production/archive/iterations/v4/duck.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · duck | 1152×648 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/final-frames.jpg](../production/archive/iterations/v4/final-frames.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · final-frames | 1350×1084 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/flight.jpg](../production/archive/iterations/v4/flight.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · flight | 1152×648 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/frozen.jpg](../production/archive/iterations/v4/frozen.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · frozen | 1152×648 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/native.jpg](../production/archive/iterations/v4/native.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · native | 768×432 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/negative.jpg](../production/archive/iterations/v4/negative.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · negative | 1152×648 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/paired.jpg](../production/archive/iterations/v4/paired.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · paired | 1152×648 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-100.65.jpg](../production/archive/iterations/v4/pass-100.65.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-100.65 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-104.95.jpg](../production/archive/iterations/v4/pass-104.95.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-104.95 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-109.40.jpg](../production/archive/iterations/v4/pass-109.40.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-109.40 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-110.70.jpg](../production/archive/iterations/v4/pass-110.70.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-110.70 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-116.70.jpg](../production/archive/iterations/v4/pass-116.70.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-116.70 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-120.20.jpg](../production/archive/iterations/v4/pass-120.20.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-120.20 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-128.20.jpg](../production/archive/iterations/v4/pass-128.20.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-128.20 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-3.40.jpg](../production/archive/iterations/v4/pass-3.40.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-3.40 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-32.50.jpg](../production/archive/iterations/v4/pass-32.50.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-32.50 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-61.60.jpg](../production/archive/iterations/v4/pass-61.60.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-61.60 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-67.40.jpg](../production/archive/iterations/v4/pass-67.40.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-67.40 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-72.00.jpg](../production/archive/iterations/v4/pass-72.00.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-72.00 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-73.70.jpg](../production/archive/iterations/v4/pass-73.70.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-73.70 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-75.10.jpg](../production/archive/iterations/v4/pass-75.10.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-75.10 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-76.12.jpg](../production/archive/iterations/v4/pass-76.12.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-76.12 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-78.98.jpg](../production/archive/iterations/v4/pass-78.98.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-78.98 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-81.70.jpg](../production/archive/iterations/v4/pass-81.70.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-81.70 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-83.25.jpg](../production/archive/iterations/v4/pass-83.25.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-83.25 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-86.38.jpg](../production/archive/iterations/v4/pass-86.38.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-86.38 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-88.92.jpg](../production/archive/iterations/v4/pass-88.92.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-88.92 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-93.81.jpg](../production/archive/iterations/v4/pass-93.81.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-93.81 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/pass-96.85.jpg](../production/archive/iterations/v4/pass-96.85.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · pass-96.85 | 896×504 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/replay-raw.jpg](../production/archive/iterations/v4/replay-raw.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · replay-raw | 960×580 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/shots-0.jpg](../production/archive/iterations/v4/shots-0.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · shots-0 | 1314×789 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/shots-1.jpg](../production/archive/iterations/v4/shots-1.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · shots-1 | 1314×789 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/shots-2.jpg](../production/archive/iterations/v4/shots-2.jpg) | 《机器人进化跑》 · v4 · 镜头核对／拆分片段 · shots-2 | 1314×526 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v4/verify-media.py](../production/archive/iterations/v4/verify-media.py) | 《机器人进化跑》 · v4 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v4/verify-media.py) |
| [production/archive/iterations/v4/verify-player.cjs](../production/archive/iterations/v4/verify-player.cjs) | 《机器人进化跑》 · v4 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v4/verify-player.cjs) |
| [production/archive/iterations/v5/cut.ffconcat](../production/archive/iterations/v5/cut.ffconcat) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/cut.ffconcat) |
| [production/archive/iterations/v5/film-105.30.jpg](../production/archive/iterations/v5/film-105.30.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-105.30 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-109.85.jpg](../production/archive/iterations/v5/film-109.85.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-109.85 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-110.70.jpg](../production/archive/iterations/v5/film-110.70.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-110.70 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-117.30.jpg](../production/archive/iterations/v5/film-117.30.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-117.30 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-61.90.jpg](../production/archive/iterations/v5/film-61.90.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-61.90 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-67.40.jpg](../production/archive/iterations/v5/film-67.40.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-67.40 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-72.10.jpg](../production/archive/iterations/v5/film-72.10.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-72.10 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-74.10.jpg](../production/archive/iterations/v5/film-74.10.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-74.10 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-75.40.jpg](../production/archive/iterations/v5/film-75.40.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-75.40 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-79.20.jpg](../production/archive/iterations/v5/film-79.20.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-79.20 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-81.35.jpg](../production/archive/iterations/v5/film-81.35.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-81.35 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-86.39.jpg](../production/archive/iterations/v5/film-86.39.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-86.39 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-89.10.jpg](../production/archive/iterations/v5/film-89.10.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-89.10 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-94.35.jpg](../production/archive/iterations/v5/film-94.35.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-94.35 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-97.23.jpg](../production/archive/iterations/v5/film-97.23.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-97.23 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/film-99.55.jpg](../production/archive/iterations/v5/film-99.55.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · film-99.55 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/player.cjs](../production/archive/iterations/v5/player.cjs) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/player.cjs) |
| [production/archive/iterations/v5/preview.py](../production/archive/iterations/v5/preview.py) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/preview.py) |
| [production/archive/iterations/v5/render_change.py](../production/archive/iterations/v5/render_change.py) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/render_change.py) |
| [production/archive/iterations/v5/review.jpg](../production/archive/iterations/v5/review.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · review | 1792×1096 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r246-525.jpg](../production/archive/iterations/v5/stage-r246-525.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r246-525 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r246-540.jpg](../production/archive/iterations/v5/stage-r246-540.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r246-540 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r3-340.jpg](../production/archive/iterations/v5/stage-r3-340.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r3-340 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r3-373.jpg](../production/archive/iterations/v5/stage-r3-373.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r3-373 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r36-352.jpg](../production/archive/iterations/v5/stage-r36-352.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r36-352 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r36-388.jpg](../production/archive/iterations/v5/stage-r36-388.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r36-388 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r36-532.jpg](../production/archive/iterations/v5/stage-r36-532.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r36-532 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r6-348.jpg](../production/archive/iterations/v5/stage-r6-348.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r6-348 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r6-371.jpg](../production/archive/iterations/v5/stage-r6-371.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r6-371 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r7-365.jpg](../production/archive/iterations/v5/stage-r7-365.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r7-365 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-r7-390.jpg](../production/archive/iterations/v5/stage-r7-390.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-r7-390 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage-test-548.jpg](../production/archive/iterations/v5/stage-test-548.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage-test-548 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage.jpg](../production/archive/iterations/v5/stage.jpg) | 《机器人进化跑》 · v5 · 镜头核对／拆分片段 · stage | 1344×1096 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v5/stage.py](../production/archive/iterations/v5/stage.py) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/stage.py) |
| [production/archive/iterations/v5/verify.py](../production/archive/iterations/v5/verify.py) | 《机器人进化跑》 · v5 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v5/verify.py) |
| [production/archive/iterations/v6/build.py](../production/archive/iterations/v6/build.py) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/build.py) |
| [production/archive/iterations/v6/check_art.py](../production/archive/iterations/v6/check_art.py) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/check_art.py) |
| [production/archive/iterations/v6/cut.ffconcat](../production/archive/iterations/v6/cut.ffconcat) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/cut.ffconcat) |
| [production/archive/iterations/v6/full-contact.jpg](../production/archive/iterations/v6/full-contact.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · full-contact | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/grid.py](../production/archive/iterations/v6/grid.py) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/grid.py) |
| [production/archive/iterations/v6/hurdle-stride-grid.jpg](../production/archive/iterations/v6/hurdle-stride-grid.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · hurdle-stride-grid | 1536×1024 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/inspect_previous.py](../production/archive/iterations/v6/inspect_previous.py) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/inspect_previous.py) |
| [production/archive/iterations/v6/low-stride-grid.jpg](../production/archive/iterations/v6/low-stride-grid.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · low-stride-grid | 1024×1024 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/movie-check.jpg](../production/archive/iterations/v6/movie-check.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · movie-check | 1112×594 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/new-motion.jpg](../production/archive/iterations/v6/new-motion.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · new-motion | 1617×1190 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/occlusion-r246.jpg](../production/archive/iterations/v6/occlusion-r246.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · occlusion-r246 | 383×389 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/occlusion-r36.jpg](../production/archive/iterations/v6/occlusion-r36.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · occlusion-r36 | 383×389 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/player.cjs](../production/archive/iterations/v6/player.cjs) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/player.cjs) |
| [production/archive/iterations/v6/previous-motion.jpg](../production/archive/iterations/v6/previous-motion.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · previous-motion | 1764×795 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r246-532.jpg](../production/archive/iterations/v6/r246-532.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r246-532 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r246-540.jpg](../production/archive/iterations/v6/r246-540.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r246-540 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r3-323.jpg](../production/archive/iterations/v6/r3-323.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r3-323 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r3-373.jpg](../production/archive/iterations/v6/r3-373.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r3-373 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-323.jpg](../production/archive/iterations/v6/r7-323.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-323 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-349.jpg](../production/archive/iterations/v6/r7-349.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-349 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-376.jpg](../production/archive/iterations/v6/r7-376.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-376 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-393.jpg](../production/archive/iterations/v6/r7-393.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-393 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-426.jpg](../production/archive/iterations/v6/r7-426.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-426 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-444.jpg](../production/archive/iterations/v6/r7-444.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-444 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/r7-448.jpg](../production/archive/iterations/v6/r7-448.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · r7-448 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/scene-sequence.jpg](../production/archive/iterations/v6/scene-sequence.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · scene-sequence | 960×792 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/side-grid.jpg](../production/archive/iterations/v6/side-grid.jpg) | 《机器人进化跑》 · v6 · 镜头核对／拆分片段 · side-grid | 1536×1024 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../films/robot-evolution/source) |
| [production/archive/iterations/v6/verify.py](../production/archive/iterations/v6/verify.py) | 《机器人进化跑》 · v6 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/iterations/v6/verify.py) |
| [production/archive/pilot/ch1-cues.jpg](../production/archive/pilot/ch1-cues.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · ch1-cues | 1000×450 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/ch1-verify.cjs](../production/archive/pilot/ch1-verify.cjs) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/ch1-verify.cjs) |
| [production/archive/pilot/chapter2-narrow-frozen.png](../production/archive/pilot/chapter2-narrow-frozen.png) | 第一关与早期实验 · 镜头核对／拆分片段 · chapter2-narrow-frozen | 320×1058 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-bay-imu.jpg](../production/archive/pilot/desktop-bay-imu.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-bay-imu | 1365×978 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-bay.jpg](../production/archive/pilot/desktop-bay.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-bay | 1365×904 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-failure.jpg](../production/archive/pilot/desktop-failure.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-failure | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-live.jpg](../production/archive/pilot/desktop-live.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-live | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-monitor.jpg](../production/archive/pilot/desktop-monitor.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-monitor | 1365×900 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-opening.jpg](../production/archive/pilot/desktop-opening.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-opening | 1365×850 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/desktop-success.jpg](../production/archive/pilot/desktop-success.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · desktop-success | 1365×914 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/final-race-desktop-curve.png](../production/archive/pilot/final-race-desktop-curve.png) | 第一关与早期实验 · 镜头核对／拆分片段 · final-race-desktop-curve | 1366×768 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/final-race-desktop-finish.png](../production/archive/pilot/final-race-desktop-finish.png) | 第一关与早期实验 · 镜头核对／拆分片段 · final-race-desktop-finish | 1366×768 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/final-replay-desktop.png](../production/archive/pilot/final-replay-desktop.png) | 第一关与早期实验 · 镜头核对／拆分片段 · final-replay-desktop | 1207×501 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/mobile-bay.jpg](../production/archive/pilot/mobile-bay.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · mobile-bay | 390×1055 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/mobile-think.jpg](../production/archive/pilot/mobile-think.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · mobile-think | 390×920 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/qa.cjs](../production/archive/pilot/qa.cjs) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/qa.cjs) |
| [production/archive/pilot/results.json](../production/archive/pilot/results.json) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/results.json) |
| [production/archive/pilot/review-export-results.json](../production/archive/pilot/review-export-results.json) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/review-export-results.json) |
| [production/archive/pilot/review-export.cjs](../production/archive/pilot/review-export.cjs) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/review-export.cjs) |
| [production/archive/pilot/source.jpg](../production/archive/pilot/source.jpg) | 第一关与早期实验 · 镜头核对／拆分片段 · source | 1200×752 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/track-bend.png](../production/archive/pilot/track-bend.png) | 第一关与早期实验 · 镜头核对／拆分片段 · track-bend | 916×402 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 工作素材／已渲染 · [源](../assets/story/track.js) |
| [production/archive/pilot/verify-builds.py](../production/archive/pilot/verify-builds.py) | 第一关与早期实验 · 剪辑清单、校验记录或历史脚本 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/pilot/verify-builds.py) |

### 早期故事板

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [production/archive/storyboard/art/bend-panels.png](../production/archive/storyboard/art/bend-panels.png) | 第一关 · 早期草图 · bend-panels | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画 · [源](../production/archive/storyboard/art/prompts.json) |
| [production/archive/storyboard/art/prompts.json](../production/archive/storyboard/art/prompts.json) | 第一关 · 早期草图 · prompts | — | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原提示词 · [源](../production/archive/storyboard/art/prompts.json) |
| [production/archive/storyboard/art/starting-line.png](../production/archive/storyboard/art/starting-line.png) | 第一关 · 早期草图 · starting-line | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原画 · [源](../production/archive/storyboard/art/prompts.json) |
| [production/archive/storyboard/source/art.jpg](../production/archive/storyboard/source/art.jpg) | 早期三关与第一关样片 · art | 1200×1015 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/base.png](../production/archive/storyboard/source/base.png) | 早期三关与第一关样片 · base | 1132×533 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-0.8.jpg](../production/archive/storyboard/source/bend-0.8.jpg) | 早期三关与第一关样片 · bend-0.8 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-0.jpg](../production/archive/storyboard/source/bend-0.jpg) | 早期三关与第一关样片 · bend-0 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-2.jpg](../production/archive/storyboard/source/bend-2.jpg) | 早期三关与第一关样片 · bend-2 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-3.jpg](../production/archive/storyboard/source/bend-3.jpg) | 早期三关与第一关样片 · bend-3 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-4.6.jpg](../production/archive/storyboard/source/bend-4.6.jpg) | 早期三关与第一关样片 · bend-4.6 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-6.jpg](../production/archive/storyboard/source/bend-6.jpg) | 早期三关与第一关样片 · bend-6 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-7.jpg](../production/archive/storyboard/source/bend-7.jpg) | 早期三关与第一关样片 · bend-7 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend-8.jpg](../production/archive/storyboard/source/bend-8.jpg) | 早期三关与第一关样片 · bend-8 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/bend.jpg](../production/archive/storyboard/source/bend.jpg) | 早期三关与第一关样片 · bend | 1280×426 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/build_sample.py](../production/archive/storyboard/source/build_sample.py) | 早期三关与第一关样片 · build_sample | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/capture.cjs](../production/archive/storyboard/source/capture.cjs) | 早期三关与第一关样片 · capture | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/captures.jpg](../production/archive/storyboard/source/captures.jpg) | 早期三关与第一关样片 · captures | 980×690 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/imitation.png](../production/archive/storyboard/source/imitation.png) | 早期三关与第一关样片 · imitation | 1348×373 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/measure.png](../production/archive/storyboard/source/measure.png) | 早期三关与第一关样片 · measure | 1132×533 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/old.jpg](../production/archive/storyboard/source/old.jpg) | 早期三关与第一关样片 · old | 1200×426 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/onnx.json](../production/archive/storyboard/source/onnx.json) | 早期三关与第一关样片 · onnx | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/onnx.png](../production/archive/storyboard/source/onnx.png) | 早期三关与第一关样片 · onnx | 634×476 · RGB | 含九寨沟实拍时适用 rheins · CC BY 3.0；其余为项目生成画面、程序演示与合成声 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/race.json](../production/archive/storyboard/source/race.json) | 早期三关与第一关样片 · race | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/race.png](../production/archive/storyboard/source/race.png) | 早期三关与第一关样片 · race | 971×385 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/replay.png](../production/archive/storyboard/source/replay.png) | 早期三关与第一关样片 · replay | 971×385 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/sample-desktop.png](../production/archive/storyboard/source/sample-desktop.png) | 早期三关与第一关样片 · sample-desktop | 1366×880 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/sample-mobile.png](../production/archive/storyboard/source/sample-mobile.png) | 早期三关与第一关样片 · sample-mobile | 390×844 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/sample-results.json](../production/archive/storyboard/source/sample-results.json) | 早期三关与第一关样片 · sample-results | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/sample.html](../production/archive/storyboard/source/sample.html) | 早期三关与第一关样片 · sample | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/sample_qa.cjs](../production/archive/storyboard/source/sample_qa.cjs) | 早期三关与第一关样片 · sample_qa | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/scenes.py](../production/archive/storyboard/source/scenes.py) | 早期三关与第一关样片 · scenes | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/shared.py](../production/archive/storyboard/source/shared.py) | 早期三关与第一关样片 · shared | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 可编辑源文件 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/story.jpg](../production/archive/storyboard/source/story.jpg) | 早期三关与第一关样片 · story | 1200×609 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-0.jpg](../production/archive/storyboard/source/through-0.jpg) | 早期三关与第一关样片 · through-0 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-1.jpg](../production/archive/storyboard/source/through-1.jpg) | 早期三关与第一关样片 · through-1 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-2.jpg](../production/archive/storyboard/source/through-2.jpg) | 早期三关与第一关样片 · through-2 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-3.jpg](../production/archive/storyboard/source/through-3.jpg) | 早期三关与第一关样片 · through-3 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-4.jpg](../production/archive/storyboard/source/through-4.jpg) | 早期三关与第一关样片 · through-4 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through-5.jpg](../production/archive/storyboard/source/through-5.jpg) | 早期三关与第一关样片 · through-5 | 1280×720 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/through.jpg](../production/archive/storyboard/source/through.jpg) | 早期三关与第一关样片 · through | 1280×426 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-102.jpg](../production/archive/storyboard/source/v6-102.jpg) | 早期三关与第一关样片 · v6-102 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-108.jpg](../production/archive/storyboard/source/v6-108.jpg) | 早期三关与第一关样片 · v6-108 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-11.jpg](../production/archive/storyboard/source/v6-11.jpg) | 早期三关与第一关样片 · v6-11 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-114.jpg](../production/archive/storyboard/source/v6-114.jpg) | 早期三关与第一关样片 · v6-114 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-123.jpg](../production/archive/storyboard/source/v6-123.jpg) | 早期三关与第一关样片 · v6-123 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-126.jpg](../production/archive/storyboard/source/v6-126.jpg) | 早期三关与第一关样片 · v6-126 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-129.jpg](../production/archive/storyboard/source/v6-129.jpg) | 早期三关与第一关样片 · v6-129 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-15.jpg](../production/archive/storyboard/source/v6-15.jpg) | 早期三关与第一关样片 · v6-15 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-17.4.jpg](../production/archive/storyboard/source/v6-17.4.jpg) | 早期三关与第一关样片 · v6-17.4 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-2.jpg](../production/archive/storyboard/source/v6-2.jpg) | 早期三关与第一关样片 · v6-2 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-23.jpg](../production/archive/storyboard/source/v6-23.jpg) | 早期三关与第一关样片 · v6-23 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-30.jpg](../production/archive/storyboard/source/v6-30.jpg) | 早期三关与第一关样片 · v6-30 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-35.jpg](../production/archive/storyboard/source/v6-35.jpg) | 早期三关与第一关样片 · v6-35 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-38.jpg](../production/archive/storyboard/source/v6-38.jpg) | 早期三关与第一关样片 · v6-38 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-44.jpg](../production/archive/storyboard/source/v6-44.jpg) | 早期三关与第一关样片 · v6-44 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-53.jpg](../production/archive/storyboard/source/v6-53.jpg) | 早期三关与第一关样片 · v6-53 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-62.jpg](../production/archive/storyboard/source/v6-62.jpg) | 早期三关与第一关样片 · v6-62 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-7.jpg](../production/archive/storyboard/source/v6-7.jpg) | 早期三关与第一关样片 · v6-7 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-72.jpg](../production/archive/storyboard/source/v6-72.jpg) | 早期三关与第一关样片 · v6-72 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-79.jpg](../production/archive/storyboard/source/v6-79.jpg) | 早期三关与第一关样片 · v6-79 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-86.jpg](../production/archive/storyboard/source/v6-86.jpg) | 早期三关与第一关样片 · v6-86 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-91.jpg](../production/archive/storyboard/source/v6-91.jpg) | 早期三关与第一关样片 · v6-91 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6-97.jpg](../production/archive/storyboard/source/v6-97.jpg) | 早期三关与第一关样片 · v6-97 | 1440×810 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/v6.jpg](../production/archive/storyboard/source/v6.jpg) | 早期三关与第一关样片 · v6 | 1280×1278 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/source/wire.png](../production/archive/storyboard/source/wire.png) | 早期三关与第一关样片 · wire | 1132×533 · RGB | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |
| [production/archive/storyboard/第一关互动样片.html](../production/archive/storyboard/%E7%AC%AC%E4%B8%80%E5%85%B3%E4%BA%92%E5%8A%A8%E6%A0%B7%E7%89%87.html) | 早期三关与第一关样片 · 第一关互动样片 | — | 项目自制，按仓库所有者的本次公开归档授权收录 | 合成稿／选帧 · [源](../production/archive/storyboard/source) |

### 新增分镜原画

| 文件 | 所属剧情与用途 | 时长／尺寸 | 来源与许可 | 形态及可编辑源 |
| --- | --- | --- | --- | --- |
| [production/feature/plates/arrival.png](../production/feature/plates/arrival.png) | 救援简报 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/arrival.png) |
| [production/feature/plates/corridor.png](../production/feature/plates/corridor.png) | 废墟探查 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/corridor.png) |
| [production/feature/plates/hands.png](../production/feature/plates/hands.png) | 救援握手 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/hands.png) |
| [production/feature/plates/line.png](../production/feature/plates/line.png) | 起跑线 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/line.png) |
| [production/feature/plates/prompts.json](../production/feature/plates/prompts.json) | 《奔跑的意义》 · 角色、场景与镜头创作记录 | — | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原提示词 · [源](../production/feature/plates/) |
| [production/feature/plates/radio.png](../production/feature/plates/radio.png) | 现场回传 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/radio.png) |
| [production/feature/plates/return.png](../production/feature/plates/return.png) | 返回队伍、片尾 · 分镜底图 | 1672×941 · RGB | 本项目生成的 ImageGen 原画或衍生画面；项目方授权公开归档 | 原始栅格原画 · [源](../production/feature/plates/return.png) |
