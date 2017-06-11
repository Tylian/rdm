(function(global) {
  function function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return mergeDeep(target, ...sources);
  }

  class Action() {
    constructor(id, sim, props) {
      this.id = id;
      this.simulator = sim;
      this.props = props;
      mergeDeep(this, props);
    }
    getRecastGroup(state) {
      return this.type == "ability" ? this.id : "global";
    },
    isCombo(state) {
      if(state.lastActionTime + 8000 > state.currentTime && this.comboActions.includes(state.lastAction)) {
        var action = getAction(state.lastAction);
        return action.comboActions.length > 0 ? state.lastCombo : true;
      }
      return false;
    },
    execute(state) {
      // no-op
    },
    transform(state) {
      return false;
    },
    calculatePotency(state) {
      if(this.comboActions.length == 0)
        return this.potency;
      return this.combo(state) ? this.comboPotency : this.potency;
    },
    isUsable(state) {
      return true;
    },
    isHighlighted(state) {
      return false;
    }
    clone() {
      return new Action(this.id, this.simulator, this.simulator.actions[id]);
    }
  }

  class Simulator {
    constructor() {
      this.state = {};
      this.resource = {};
      this.events = {};
      this.actions = {};
      this.timers = [];
      this.defaultAction = {
        name: "Skill",
        cast: 2,
        recast: 2.5,
        potency: 0,
        comboPotency: 0,
        description: `Does damage.`,
        costs: {},
        gauge: {},
        animationLock: 0.8,
        recastGroup() {

        },
        comboActions: [],
        combo(state) {

        },
        execute(state) {
          // no-op
        },
        useable(state) {
          return true;
        },
        highlight(state) {
          return false;
        },
        transform(state) {
          return false;
        },
        calculatePotency(state) {
          if(this.comboActions.length == 0)
            return this.potency;
          return this.combo(state) ? this.comboPotency : this.potency;
        }
      };
    }

    // EventEmitter
    on(name, fn) {
      Array.isArray(this.events[name]) ? this.events[name].push(fn) : this.events[name] = [];
    }

    off(name, fn) {
      if(!Array.isArray(this.events[name])) return;
      if(typeof fn != "function") delete this.events[name];
      var index = this.events[name].indexOf(name);
      this.events[name].splice(index, 1);
    }

    emit(name, ...args) {
      if(!Array.isArray(this.events[name])) return;
      for(var i = 0; i < this.events[name].length; i++) {
        this.events[name][i].apply(this, args);
      }
    }

    // Timers
    addTimer(fn, delay, repeating) {
      return this.timers.push({
        fn,
        time: state.currentTime + delay,
        delay,
        repeating: !!repeating
      }) - 1;
    }

    // remove a once-off timer before it fires
    removeTimer(id) {
      if(typeof this.timers[id] == "object")
        this.timers[id] = null;
    }

    // Resources
    initResource(name, max) {
      this.resource[name] = {
        current: max,
        max: max
      };
    }

    getResource(name) {
      if(this.resource[name] == undefined) return 0
      return this.resource[name].current;
    }

    setResource(name) {
      if(this.resource[name] == undefined) return;
      this.resource[name].current = Math.min(Math.max(0, value), this.resource[name].max);
    }

    // Actions
    addDefaultAction(obj) {
      Object.assign(this.defaultAction, obj);
    },

    addAction(name, obj) {
      this.actions[name] = obj;
    },

    getAction(name) {
      if(typeof this.actions[name] === "undefined")
        return false;

      var action = new Action(this, this.actions[name]);
      var transform = action.transform(this.state);
      if(transform != false) {
        return this.getAction(transform);
      }

      return action;
    },

    actionUsable(name) {
      const action = this.getAction(key);
      if(!action)
        return false;

      // trying to use an action while it's on cooldown
      if(!!this.getRecast(action.recastGroup()))
        return false;

      // can't use stuff while casting
      if(this.state.currentTime < this.state.cast.end)
        return false;

      // can't use anything while animation locked
      if(this.state.currentTime < this.state.animationLock)
        return false;

      // not enough resources (mp/tp etc)
      for(var key in action.cost) {
        if(this.getResource(key) < action.cost[key])
          return false;
      }

      // check action specific stuff
      return action.useable(this.state);
    },

    useAction(name) {
      if(!this.actionUsable(name)) {
        this.state.queueAction = name;
        this.state.queueTime = state.currentTime;
        return;
      }

      const action = this.getAction(name);
      if(!action) return;

      this.emit("beforeAction", action);

      // are we casting a spell or using an ability
      if(action.type != "ability") {
        // Set the cast/resast state for both error checking and UI
        state.cast.action = action.id;
        state.cast.start = state.currentTime;
        state.cast.end = state.cast.start + action.castTime * 1000;

        // set the target time, the timer will only advance time to this point
        // it's set to what ever the longest lock is, cast, recast or anim lock (or the old target time)
        var delay = Math.max(action.castTime, action.recast, action.animationLock) * 1000;
        state.targetTime = state.currentTime + Math.max(delay + 10, state.targetTime - state.currentTime);
      } else {
        // using an ability is a lot simpler, advance target time by animation lock
        state.targetTime = state.currentTime + Math.max(action.animationLock * 1000 + 10, state.targetTime - state.currentTime);
      }

      // put the action on cooldown
      addRecast(action.recastGroup(), action.recast * 1000);

      this.state.animationLock = state.currentTime + action.animationLock * 1000;

      // Update UI
      this.updateActions(); // now
      this.addTimer(() => this.updateActions, action.recast * 1000); // when GCD finishes
      this.addTimer(() => this.updateActions, action.animationLock * 1000); // when animation lock finishes
      this.addTimer(() => this.updateActions, 8000); // when combo breaks

      // when the cast finishes, resolve the action
      addTimer(() => {
        action.execute(state); // execute action-specific stuff

        // get how much black and white mana to add to gauge
        var white = action.white > 0 && state.gauge.black >= state.gauge.white + 30 ? Math.floor(action.white / 2) : action.white;
        var black = action.black > 0 && state.gauge.white >= state.gauge.black + 30 ? Math.floor(action.black / 2) : action.black;

        // start DPS timer if we did damage
        var potency = action.calculatePotency(state);
        if(state.damageStart == -1 && potency > 0) {
          state.damageStart = state.currentTime;
        }

        // update DPS
        let damage = Math.floor(potency / 100 * 1817);
        damage = Math.floor(damage * (1 + state.emboldenDamage));
        damage = Math.floor(damage * (Math.random() * 0.1 + 0.95));

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

        // last non-ability action used, for combos
        if(action.type != "ability") {
          state.lastActionTime = state.currentTime;
          state.lastCombo = action.combo(state);
          state.lastAction = action.id;
        }

        // update UI
        $(".rdm").prop("src", "img/visualisation/Red_mage.png");
        setMana(state.mana - action.mana);
        setGauge(state.gauge.black + black, state.gauge.white + white);
        updateActions();
      }, castTime * 1000);
    }

    // Bootstrap
    run() {
      this.addTimer(() => {
        this.emit("serverTick");
        this.emit
      }, 3000, true);
    }
  }

  global["Simulator"] = Simulator;
})(this);
