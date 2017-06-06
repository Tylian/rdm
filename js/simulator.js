var state = {
  recast: { start: 0, end: 0 },
  cast: { action: "", start: 0, end: 0 },
  lastAction: "",
  lastCombo: false,
  gauge: { black: 0, white: 0 },
  statuses: {},
  statusTimers: {},
  melee: false,
  cooldowns: {},
  potency: 0,
  damage: 0,
  damageStart: -1,
  emboldenDamage: 0,
  animStart: 0,
  hotkeyMode: false,
  hotkeySkill: "",
  hotkeys: {},
  mana: 14400,
  maxMana: 14400,
  currentTime: 0,
  targetTime: 0,
  timers: [],
  realtimeMode: true,
  statusStack: 0,
};

function preCache(src) {
  var img = new Image();
  img.src = src;
}

preCache("img/visualisation/Red_mage1.png");
preCache("img/visualisation/Red_mage2.png");

// Attempts to use an action by id
function action(name) {
  if(!actionUsable(name))
    return;

  const action = getAction(name);
  const castTime = (hasStatus("dualcast") || hasStatus("swiftcast")) ? 0 : action.cast; // insta-cast?

  // are we casting a spell or using an ability
  if(action.type != "ability") {
    // remove dualcast/swiftcast status, priority being swiftcast
    if(hasStatus("swiftcast")) {
      setStatus("swiftcast", false);
    } else {
      setStatus("dualcast", false);
    }

    // Set the cast/resast state for both error checking and UI
    state.recast.start = state.currentTime;
    state.recast.end = state.recast.start + action.recast * 1000;
    state.cast.action = action.id;
    state.cast.start = state.currentTime;
    state.cast.end = state.cast.start + castTime * 1000;

    // last non-ability action used, for combos
    state.lastActionTime = state.currentTime;
    state.lastCombo = action.combo();
    state.lastAction = action.id;

    // set the target time, the timer will only advance time to this point
    // it's set to what ever the longest lock is, cast, recast or anim lock (or the old target time)
    var delay = Math.max(castTime, action.recast, 0.8) * 1000;
    state.targetTime = state.currentTime + Math.max(delay + 10, state.targetTime - state.currentTime);
  } else {
    // using an ability is a lot simpler, put it on cooldown and advance target time by animation lock
    state.targetTime = state.currentTime + Math.max(810, state.targetTime - state.currentTime);
    state.cooldowns[name] = state.currentTime + action.recast * 1000;
  }

  state.animationLock = state.currentTime + 800;

  // Update UI
  updateActions(); // now
  addTimer(updateActions, action.recast * 1000); // when GCD finishes
  addTimer(updateActions, 800); // when animation lock finishes
  addTimer(updateActions, 8000); // when combo breaks

  // when the cast finishes, resolve the action
  addTimer(() => {
    action.execute(); // execute action-specific stuff

    // get how much black and white mana to add to gauge
    var white = action.white > 0 && state.gauge.black >= state.gauge.white + 30 ? Math.floor(action.white / 2) : action.white;
    var black = action.black > 0 && state.gauge.white >= state.gauge.black + 30 ? Math.floor(action.black / 2) : action.black;

    // start DPS timer if we did damage
    if(state.damageStart == -1 && action.getPotency() > 0) {
      state.damageStart = state.currentTime;
    }

    // update DPS
    var potency = action.getPotency(state.lastCombo);
    let damage = potency * 18.17 * (Math.random() * 0.05 + 0.975) * (1 + state.emboldenDamage);

    state.potency += potency * (1 + state.emboldenDamage);
    state.damage += damage;

    if(damage > 0) {
      var damageNode = $(`<span class="damage-text">${Math.floor(damage)}</span>`);
      damageNode.css({
        left: Math.floor(Math.random() * 100) + 120,
      });
      damageNode.appendTo(".visualisation");
      setTimeout(() => {
        damageNode.remove();
      }, 1300);
    }

    // give dualcast if we casted a thing
    if(action.type == "spell" && castTime > 0) {
      setStatus('dualcast', true);
    }

    // update UI
    $(".rdm").prop("src", "img/visualisation/Red_mage.png");
    setMana(state.mana - action.mana);
    setGauge(state.gauge.black + black, state.gauge.white + white);
    updateActions();
  }, castTime * 1000);
}

// The global animation timer
// Handles the advancing of time, any animations, and firing timer events
var lastFrame = Date.now();
function timer() {
  // advance time from last frame
  state.currentTime += Date.now() - lastFrame;
  lastFrame = Date.now();

  // cap time to the target if not realtime
  if(!state.realtimeMode) {
    state.currentTime = Math.min(state.targetTime, state.currentTime);
  }

  // are we casting/on gcd consts
  const casting = state.currentTime < state.cast.end;
  const globalCooldown = state.currentTime < state.recast.end;

  // show/hide cast bar
  $('.casting').toggle(casting);

  // update casting ui
  if(casting) {
    var castPercent = (state.currentTime - state.cast.start) / (state.cast.end - state.cast.start);
    var action = getAction(state.cast.action);
    $(".cast").text(`${((state.cast.end - state.currentTime) / 1000).toFixed(2)}s`);
    $(".casting .icon").prop("src", `img/${action.id}.png`);
    $(".casting .name").text(action.name);
    $(".casting .progress-bar").css({
      width: `${castPercent * 100}%`
    });

    var frame = Math.floor((state.currentTime - state.cast.start) / 300) % 2;
    $(".rdm").prop("src", `img/visualisation/Red_mage${frame + 1}.png`);
  }

  // handle timers
  state.timers.forEach((obj, i) => {
    if(obj == null) return;
    if(state.currentTime >= obj.time) {
      obj.fn();
      if(obj.repeating) {
        obj.time = state.currentTime + obj.delay;
      } else {
        removeTimer(i);
      }
    }
  });

  return requestAnimationFrame(timer);
}

// Update DPS/PPS every 0.5s
setInterval(() => {
  if(state.damageStart > 0) {
    $(".dps").text((state.damage / ((state.currentTime - state.damageStart) / 1000)).toFixed(2));
    $(".pps").text((state.potency / ((state.currentTime - state.damageStart) / 1000)).toFixed(2));
  }
}, 500);

// Update action cooldown numbers every 0.1s
setInterval(() => {
  var now = state.currentTime;
  var gcd = state.recast.end - state.currentTime;

  $(".actions button").each(function() {
    const key = $(this).data("action");
    const action = getAction(key);
    var label = $("small", this)

    var value = parseInt(state.cooldowns[action.id], 10) || 0;
    if(value < gcd && action.type != "ability") {
      label.text(`${(gcd / 1000).toFixed(1)}s`)
    } else if(value > now) {
      if((value - now) > 10) {
        label.text(`${Math.floor((value - now) / 1000)}s`);
      } else {
        label.text(`${(Math.max(0, value - now) / 1000).toFixed(1)}s`);
      }
    } else {
      label.text(``);
    }
  });

  if(state.damageStart != -1) {
    $(".time").text(`${((state.currentTime - state.damageStart) / 1000).toFixed(1)}s`)
  }
}, 100);

// 3s server tick timer
addTimer(() => {
  setMana(state.mana + Math.floor(state.maxMana * 0.02));
  if(hasStatus("lucid_dreaming")) {
    setMana(state.mana + (80 * 12));
  }
  updateActions();
}, 3000, true);


state.realtimeMode = localStorage["rdmrealtime"] != "off";
$("#realtime").prop("checked", state.realtimeMode);

loadHotkeys(); // load hotkeys
setGauge(0, 0); // reset state
setMana(14400)
updateActions();
requestAnimationFrame(timer); // start the animation-handling timer

// Clicking on action buttons uses them (or sets them as the active skill in hotkey mode)
$(".actions button").click(function(e) {
  var name = $(this).data("action");
  if(state.hotkeyMode) {
    $(".hotkey").removeClass("hotkey");
    $(this).addClass("hotkey");
    state.hotkeySkill = name;
    return true;
  }

  if(actionUsable(name)) {
    action(name);
  }
});

// Reset button reloads page because resetting state is hard
$("#potreset").click(function(e) {
  window.history.go(0);
});

// Hotkey mode button
$("#hotkey").click(function(e) {
  state.hotkeyMode = $(this).is(":checked");
  $(".container").toggleClass("hotkey-mode", state.hotkeyMode);
  $(".hotkey").removeClass("hotkey");
  state.hotkeySkill = "";
  updateActions();
});

// Realtime toggle
$("#realtime").click(function(e) {
  state.realtimeMode = $(this).is(":checked");
  localStorage["rdmrealtime"] = state.realtimeMode ? "on" : "off";
});

// Hotkey handler
$(document).keydown(function(e) {
  // block shift, alt and ctrl
  if([16, 17, 18].includes(e.which))
    return true;

  // esc - cancel cast
  if(which == 27) {
    // todo
  }

  var which = e.which.toString() + (e.altKey ? "a" : "") + (e.shiftKey ? "s" : "") + (e.ctrlKey ? "c" : "");
  if(state.hotkeyMode && state.hotkeySkill != "") {
    state.hotkeys[which] = state.hotkeySkill;
    saveHotkeys();
    e.preventDefault();
  } else {
    var name = state.hotkeys[which];
    if(name && actionUsable(name)) {
      action(name);
      e.preventDefault();
    }
  }
});
