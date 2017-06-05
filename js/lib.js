// add an (optionally, repeating) timer
function addTimer(fn, delay, repeating) {
  return state.timers.push({
    fn,
    time: state.currentTime + delay,
    delay,
    repeating: !!repeating
  }) - 1;
}

// remove a once-off timer before it fires
function removeTimer(id) {
  if(typeof state.timers[id] == "object")
    state.timers[id] = null;
}

function setMelee(active) {
  state.melee = active;

  var rdmImg = document.getElementsByClassName('rdm')[0];
  if (state.melee === true) {
    rdmImg.className += ' melee';
  } else {
    rdmImg.className = 'rdm';
  }
}

// sets the current mana and updates UI
function setMana(mana) {
  state.mana = Math.min(mana, state.maxMana);
  $(".progress-mana .progress-bar").css({
    width: `${state.mana/state.maxMana*100}%`
  });
  $(".mana").text(`${state.mana} / ${state.maxMana}`);
}

// gets an action's information by name, handling any transforms
function getAction(name) {
  if(typeof actions[name] === "undefined")
    return false;

  var action = Object.assign({ id: name }, defaultAction, actions[name]);
  var transform = action.transform();
  if(transform != false) {
    return getAction(transform);
  }

  return action;
}

// is a status active?
function hasStatus(name) {
  return state.statuses[name] > 0; // has to handle undefined
}

// sets a status as active/inactive
function setStatus(name, active) {
  var status = statuses[name];

  // add, or remove it?
  if(active) {
    // if we have the status already, just update it
    if(!hasStatus(name)) {
      var el = $(`<div class="status" data-status="${name}" title="${status.description}"><img src="img/status/${name}.png"<br /><small>${status.duration}s</small></span>`);
      el.appendTo('.statuses');
    } else {
      var el = $(`.status[data-status="${name}"]`);
      removeTimer(state.statusTimers[name]);
    }

    // status countdown timer
    state.statuses[name] = status.duration;
    state.statusTimers[name] = addTimer(() => {
      state.statuses[name]--;
      if(state.statuses[name] <= 0) {
         setStatus(name, false);
      } else {
        // update ui
        $("small", el).text(`${state.statuses[name]}s`);
      }
    }, 1000, true);

    updateActions();
  } else {
    // removing an action removes the timer and ui element
    removeTimer(state.statusTimers[name]);
    delete state.statuses[name];
    delete state.statusTimers[name];
    $(`.status[data-status="${name}"]`).remove();
    updateActions();
  }
}

// Checks if an action is usable
function actionUsable(key) {
  const action = getAction(key);

  // trying to use a non-ability during the GCD?
  if(state.currentTime < state.recast.end && action.type != "ability")
    return false;

  // trying to use an ability while it's on cooldown
  if(action.type == "ability") {
    var time = state.cooldowns[action.id];
    if(!isNaN(parseInt(time, 10)) && state.currentTime < time)
      return false;
  }

  // can't use stuff while casting
  if(state.currentTime < state.cast.end)
    return false;

  // can't use anything while animation locked
  if(state.currentTime < state.animationLock)
    return false;

  // not enough mana
  if(action.mana > state.mana)
    return false;

  // check action specific stuff
  return action.useable();
}

// Sets black/white mana gauge and updates UI
function setGauge(black, white) {
  state.gauge.black = Math.max(0, Math.min(100, black));
  state.gauge.white = Math.max(0, Math.min(100, white));

  $(".gauge").text(`White ${state.gauge.white} / Black ${state.gauge.black}`);
  $(".bg-black").css({
    width: `${state.gauge.black}%`
  })
  $(".bg-black").text(state.gauge.black);
  $(".bg-white").css({
    width: `${state.gauge.white}%`
  })
  $(".bg-white").text(state.gauge.white);

  $(".progress-gauge").toggleClass("imbalance-black", state.gauge.black >= state.gauge.white + 30);
  $(".progress-gauge").toggleClass("imbalance-white", state.gauge.white >= state.gauge.black + 30);
  $(".progress-gauge").toggleClass("mana-balance", state.gauge.white >= 30 && state.gauge.black >= 30);
}

// updates all action buttons state to be correct
function updateActions() {
  $(".actions button").each(function() {
    const key = $(this).data("action");
    const action = getAction(key);

    updateTooltip(this, key);
    $("img", this).prop("src", `img/${action.id}.png`);

    if(!state.hotkeyMode) {
      $(this).prop("disabled", !actionUsable(key));
      $(this).toggleClass("highlight", action.highlight());
    } else {
      $(this).toggle(true);
      $(this).prop("disabled", false);
      $(this).removeClass("highlight");
    }
  });
}

// Set an element's tooltip as the correct info for an action
function updateTooltip(el, key) {
  const action = getAction(key);

  if(action.type == "ability") {
    $(el).attr("title",
    `${action.name} (${action.type})
Recast: ${action.recast.toFixed(2)}s

${action.description}`);
  } else {
    $(el).attr("title",
    `${action.name} (${action.type})
Cast: ${action.cast == 0 ? "Instant" : action.cast.toFixed(2) + "s"}  Recast: ${action.recast.toFixed(2)}s

${action.description}`);
  }
}

// saves hotkeys to localStorage
function saveHotkeys() {
  localStorage["rdmhotkeys"] = JSON.stringify(state.hotkeys);
}

// locads hotkeys from localStorage
function loadHotkeys() {
  try {
    state.hotkeys = JSON.parse(localStorage["rdmhotkeys"]);
  } catch(e) {
    state.hotkeys = {};
  }
}
