export const FAULT_NAMES={sense:'感知',decision:'决策',action:'行动',loop:'反馈回路'};
export const FAULT_MESSAGES={
  sense:'感知关闭：没有环境信息，机器人无法发现障碍。',
  decision:'决策关闭：收到了图像，但没有动作判断。',
  action:'行动关闭：已经作出判断，执行器却没有动作。',
  loop:'反馈回路断开：只应对了一次，无法再次观察环境变化。',
};
