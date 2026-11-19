// First-person clues describe the failure, never prescribe a sensor or change the controller.
export function explainFall({cause='',sensors,scene,observation={},control={}}){
  if(/撞上|碰到/.test(cause)){
    if(!sensors.camera&&!sensors.lidar)return cause.includes('头部')?'我没看清头顶，身体就被挡住了。':'我没看清前面，脚步就被挡住了。';
    if(scene==='night'&&sensors.camera&&!sensors.lidar)return '太暗了，等我看清前面的东西，已经来不及躲开了。';
    if(cause.includes('头部'))return control.duck?'我发现上面有东西，可身体还没蹲低，就碰到了。':'我没留意头顶的空间，这一下碰得我站不稳了。';
    if(control.jump)return '我发现障碍了，可这一步抬得还不够高。';
    return observation.obstacle?'我知道前面有东西，可这次没来得及调整脚步。':'等我发现前面被挡住时，已经来不及收住脚步了。';
  }
  if(cause.includes('滑移')){
    if(!sensors.force)return '脚底悄悄滑走了，我还以为自己踩得很稳。';
    if(!sensors.imu)return '我感觉脚底在滑，可身体歪了多少，我有点拿不准。';
    if(!sensors.camera)return '脚下突然变滑，我没提前看出路面的变化，跑得太急了。';
    return '我察觉脚底在滑，也试着站稳，可这次还是没收住。';
  }
  if(cause.includes('高度差')){
    if(!sensors.force)return '这一步踩得忽高忽低，我没摸准脚下的落点。';
    if(!sensors.imu)return '脚下的颠簸我感觉到了，可身体越晃越难站稳。';
    return '脚下高低变化太快，这一步没缓冲好。';
  }
  if(/转弯|转向/.test(cause)){
    if(!sensors.camera)return '跑道已经拐弯了，我还在往前冲。';
    if(!sensors.imu)return '我看见弯道了，可身体越歪，越拿不准自己有没有站稳。';
    return '这个弯转得太急，我的脚撑不住身体了。';
  }
  return sensors.imu?'我察觉身体在歪，也试着调整，可这次还是没稳住。':'身体慢慢歪了，我却没及时察觉，等想站稳时已经晚了。';
}
