window.TJP = window.TJP || {};
(function (T) {
  const down = new Set(), pressed = new Set();
  const BIND = {
    up:['KeyW','ArrowUp'], down:['KeyS','ArrowDown'], left:['KeyA','ArrowLeft'], right:['KeyD','ArrowRight'],
    sprint:['ShiftLeft','ShiftRight'], crouch:['KeyC','ControlLeft'], dodge:['Space'],
    m1:['KeyJ','Digit1'], m2:['KeyK','Digit2'], m3:['KeyL','Digit3'], m4:['Semicolon','KeyU','Digit4'],
    interact:['KeyE'], pause:['Escape','KeyP'], map:['KeyM','Tab'], cancel:['KeyX','Backspace'], call:['KeyQ']
  };
  addEventListener('keydown', e => {
    if (['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  T.Input = {
    held: a => BIND[a].some(k => down.has(k)),
    hit: a => BIND[a].some(k => pressed.has(k)),
    key: code => pressed.has(code),
    endFrame: () => pressed.clear(),
    // Used by automated tests.
    _press: code => { pressed.add(code); down.add(code); },
    _release: code => down.delete(code)
  };
})(window.TJP);
