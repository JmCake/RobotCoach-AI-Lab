// Adapted from upstream closed-loop robot markup. MIT; see notices.
export function makeRobot(){
    const c=document.createElement('div');c.className='rb-ct';
    c.innerHTML=`
        <div class="rb">
            <div class="rb-head"><div class="rb-eye"></div></div>
            <div class="rb-body">
                <div class="rb-body-inner"></div>
                <div class="rb-arm l"></div>
                <div class="rb-arm r"></div>
            </div>
            <div class="rb-legs">
                <div class="rb-leg l"></div>
                <div class="rb-leg r"></div>
            </div>
        </div>
        <div class="rb-shadow"></div>`;
    return c;
}
