const defaultAction = {
  name: "Skill",
  cast: 2,
  recast: 2.5,
  white: 0,
  black: 0,
  potency: 0,
  comboPotency: 0,
  description: `Does damage.`,
  mana: 0,
  animationLock: 0.8,
  get recastGroup() {
    return this.type == "ability" ? this.id : "global";
  },
  comboActions: [],
  combo(state) {
    if(state.lastActionTime + 8000 > state.currentTime && this.comboActions.includes(state.lastAction)) {
      var action = getAction(state.lastAction);
      return action.comboActions.length > 0 ? state.lastCombo : true;
    }
    return false;
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

const actions = {
  jolt2: {
    name: "Jolt II",
    type: "spell",
    potency: 240,
    mana: 360,
    black: 3,
    white: 3,
    description: `Deals unaspected damage with a potency of 240.
    <span class="green">Additional Effect:</span> Grants Impactful
    <span class="green">Additional Effect:</span> Increases both <span class="yellow">Black Mana</span> and <span class="yellow">White Mana</span> by 3.`,
    execute(state) {
      setStatus('impact', true);
    }
  },
  impact: {
    name: "Impact",
    type: "spell",
    potency: 270,
    mana: 360,
    white: 4,
    black: 4,
    description: `Deals unaspected damage with a potency of 270.
    <span class="green">Additional Effect:</span> Increases both <span class="yellow">Black Mana</span> and <span class="yellow">White Mana</span> by 4.
    Can only be executed while under the effects of <span class="yellow">Impactful</span>.`,
    execute(state) {
      setStatus('impact', false);
    },
    useable(state) {
      return hasStatus("impact");
    },
    highlight(state) {
      return this.useable(state);
    }
  },
  verthunder: {
    name: "Verthunder",
    type: "spell",
    cast: 5,
    potency: 300,
    mana: 600,
    black: 11,
    description: `Deals thunder damage with a potency of 300.
    <span class="green">Additional Effect:</span> 50% chance of becoming <span class="yellow">Verfire Ready</span>.
    <span class="green">Additional Effect:</span> Increases <span class="yellow">Black Mana</span> by 11.`,
    execute(state) {
      if(Math.random() > 0.5 || hasStatus("acceleration"))
        setStatus('verfire', true);
      setStatus('acceleration', false);
    }
  },
  veraero: {
    name: "Veraero",
    type: "spell",
    cast: 5,
    potency: 300,
    mana: 600,
    white: 11,
    description: `Deals wind damage with a potency of 300.
    <span class="green">Additional Effect:</span> 50% chance of becoming <span class="yellow">Verstone Ready</span>.
    <span class="green">Additional Effect:</span> Increases <span class="yellow">White Mana</span> by 11.`,
    execute(state) {
      if(Math.random() > 0.5 || hasStatus("acceleration"))
        setStatus('verstone', true);
      setStatus('acceleration', false);
    }
  },
  verfire: {
    name: "Verfire",
    type: "spell",
    cast: 2,
    potency: 270,
    mana: 360,
    black: 9,
    description: `Deals fire damage with a potency of 270.
    <span class="green">Additional Effect:</span> Increases <span class="yellow">Black Mana</span> by 9.
    Can only be executed while <span class="yellow">Verfire Ready</span>.`,
    execute(state) {
      setStatus('verfire', false);
    },
    useable(state) {
      return hasStatus("verfire");
    },
    highlight(state) {
      return this.useable();
    }
  },
  verstone: {
    name: "Verstone",
    type: "spell",
    cast: 2,
    potency: 270,
    mana: 360,
    white: 9,
    description: `Deals earth damage with a potency of 270.
    <span class="green">Additional Effect:</span> Increases <span class="yellow">White Mana</span> by 9.
    Can only be executed while <span class="yellow">Verstone Ready</span>.`,
    execute(state) {
      setStatus('verstone', false);
    },
    useable(state) {
      return hasStatus("verstone");
    },
    highlight(state) {
      return this.useable();
    }
  },
  vercure: {
    name: "Vercure",
    type: "spell",
    cast: 2,
    mana: 600,
    white: 0,
    description: `Restores target HP.
    <span class="green">Cure potency:</span> 350`,
  },
  verflare: {
    name: "Verflare",
    type: "spell",
    cast: 0,
    comboPotency: 550,
    comboActions: ["enchanted_redoublement"],
    mana: 840,
    black: 21,
    description: `Deals fire damage with a potency of 550.
    <span class="green">Combo Action:</span> <span class="orange">Enchanted Redoublement</span>
    <span class="green">Additional Effect:</span> Increases <span class="yellow">Black Mana</span> by 21
    <span class="green">Additional Effect:</span> 30% chance of becoming <span class="yellow">Verfire Ready</span>.
    Chance to become <span class="yellow">Verfire Ready</span> increases to 100% if <span class="yellow">White Mana</span> is higher than <span class="yellow">Black Mana</span> at time of execution.`,
    execute(state) {
      if(Math.random() < 0.3 || state.gauge.white > state.gauge.black)
        setStatus('verfire', true);
    },
    useable(state) {
      return this.combo(state);
    },
    highlight(state) {
      return this.combo(state);
    }
  },
  verholy: {
    name: "Verholy",
    type: "spell",
    cast: 0,
    comboPotency: 550,
    comboActions: ["enchanted_redoublement"],
    mana: 840,
    white: 21,
    description: `Deals unaspected damage with a potency of 550.
    <span class="green">Combo Action:</span> <span class="orange">Enchanted Redoublement</span>
    <span class="green">Additional Effect:</span> Increases <span class="yellow">White Mana</span> by 21
    <span class="green">Additional Effect:</span> 30% chance of becoming <span class="yellow">Verstone Ready</span>.
    Chance to become <span class="yellow">Verstone Ready</span> increases to 100% if <span class="yellow">Black Mana</span> is higher than <span class="yellow">White Mana</span> at time of execution.`,
    execute(state) {
      if(Math.random() < 0.3 || state.gauge.black > state.gauge.white)
        setStatus('verstone', true);
    },
    useable(state) {
      return this.combo(state);
    },
    highlight(state) {
      return this.combo(state);
    }
  },
  corps_a_corps: {
    name: "Corps-a-corps",
    type: "ability",
    cast: 0,
    recast: 40,
    potency: 130,
    description: `Rushes towards target and deals unaspected damage with a potency of 130.`,
    execute(state) {
      setMelee(true);
    }
  },
  displacement: {
    name: "Displacement",
    type: "ability",
    cast: 0,
    recast: 35,
    potency: 130,
    melee: true,
    description: `Delivers an attack with a potency of 130.
    <span class="green">Additional Effect:</span> 10-yalm backstep`,
    useable(state) {
      return state.melee;
    },
    execute(state) {
      setMelee(false);
    }
  },
  acceleration: {
    name: "Acceleration",
    type: "ability",
    cast: 0,
    recast: 35,
    description: `Ensures that the next <span class="orange">Verthunder</span> or <span class="orange">Veraero</span> spell cast will, for the first hit, trigger <span class="yellow">Verfire Ready</span> or <span class="yellow">Verstone Ready</span> respectively.
    <span class="green">Duration:</span> 10s`,
    execute(state) {
      setStatus("acceleration", true);
    }
  },
  manafication: {
    name: "Manafication",
    type: "ability",
    cast: 0,
    recast: 120,
    description: `Doubles current <span class="orange">Balance Gauge</span> values.
    <span class="green">Additional Effect:</span> Resets <span class="orange">Corps-a-corps</span> and <span class="orange">Displacement</span> recast timers.`,
    execute(state) {
      state.gauge.black = Math.min(100, state.gauge.black * 2);
      state.gauge.white = Math.min(100, state.gauge.white * 2);
      clearRecast("corps_a_corps");
      clearRecast("displacement");
      state.lastAction = "";
    }
  },
  embolden: {
    name: "Embolden",
    type: "ability",
    cast: 0,
    recast: 120,
    description: `Increases own magic damage delt by 20% and physical damage delt by nearby party members by 10%. Both effects are reduced by 20% every 4s.
    <span class="green">Duration:</span> 20s`,
    execute(state) {
      function lower() {
        state.emboldenDamage -= 0.04;
        if(state.emboldenDamage > 0) {
          addTimer(lower, 4000);
        } else {
          state.emboldenDamage = 0;
        }
        $("[data-status=\"embolden\"] img").prop("src", `img/status/embolden${Math.floor(state.emboldenDamage / 0.04) + 1}.png`)
      }

      state.emboldenDamage = 0.24;
      lower();
      setStatus("embolden", true);
    }
  },
  swiftcast: {
    name: "Swiftcast",
    type: "ability",
    cast: 0,
    recast: 60,
    description: `Next spell is cast immediately.`,
    execute(state) {
      setStatus("swiftcast", true);
    }
  },
  lucid_dreaming: {
    name: "Lucid Dreaming",
    type: "ability",
    cast: 0,
    recast: 120,
    description: `Reduces enmity by half.
    <span class="green">Additional Effect:</span> Refresh
    <span class="green">Refresh Potency:</span> 80
    <span class="green">Duration:</span> 21s`,
    execute(state) {
      setStatus("lucid_dreaming", true);
    }
  },
  fleche: {
    name: "Fleche",
    type: "ability",
    cast: 0,
    recast: 25,
    potency: 420,
    description: "Deals unaspected damage with a potency of 420."
  },
  contre_sixte: {
    name: "Contre Sixte",
    type: "ability",
    cast: 0,
    recast: 45,
    potency: 300,
    description: "Deals unaspected damage with a potency of 300 to target and all enemies near it."
  },

  riposte: {
    name: "Riposte",
    type: "weaponskill",
    cast: 0,
    recast: 2.5,
    potency: 130,
    melee: true,
    description: `Delivers an attack with a potency of 130.
    Action upgraded to <span class="orange">Enchanted Riposte</span> if both <span class="orange">Black Mana</span> and <span class="orange">White Mana</span> are 30 or above.`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
    transform(state) {
      return (state.gauge.black >= 30 && state.gauge.white >= 30) ? "enchanted_riposte" : false;
    }
  },
  enchanted_riposte: {
    name: "Enchanted Riposte",
    type: "weaponskill",
    cast: 0,
    recast: 1.5,
    potency: 210,
    white: -30,
    black: -30,
    melee: true,
    description: `Deals unaspected dmage with a potency of 210.
    <span class="green">Balance Gauge Cost:</span> 30 <span class="orange">Black Mana</span>
    <span class="green">Balance Gauge Cost:</span> 30 <span class="orange">White Mana</span>`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
  },
  zwerchhau: {
    name: "Zwerchhau",
    type: "weaponskill",
    cast: 0,
    recast: 2.5,
    potency: 100,
    comboPotency: 150,
    comboActions: ["riposte", "enchanted_riposte"],
    melee: true,
    description: `Delivers an attack with a potency of 100.
    <span class="green">Combo Action:</span> <span class="orange">Riposte</span> or <span class="orange">Enchanted Riposte</span>
    <span class="green">Combo Potency:</span> 150
    Action upgraded to <span class="orange">Enchanted Zwerchhau</span> if both <span class="orange">Black Mana</span> and <span class="orange">White Mana</span> are 25 or above.`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
    transform(state) {
      return (state.gauge.black >= 25 && state.gauge.white >= 25) ? "enchanted_zwerchhau" : false;
    },
    highlight(state) {
      return this.combo(state);
    }
  },
  enchanted_zwerchhau: {
    name: "Enchanted Zwerchhau",
    type: "weaponskill",
    cast: 0,
    recast: 1.5,
    potency: 100,
    comboPotency: 290,
    comboActions: ["riposte", "enchanted_riposte"],
    white: -25,
    black: -25,
    melee: true,
    description: `Deals unaspected damage with a potency of 100.
    <span class="green">Combo Action:</span> <span class="orange">Riposte</span> or <span class="orange">Enchanted Riposte</span>
    <span class="green">Combo Potency:</span> 290
    <span class="green">Balance Gauge Cost:</span> 25 <span class="orange">Black Mana</span>
    <span class="green">Balance Gauge Cost:</span> 25 <span class="orange">White Mana</span>`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
    highlight(state) {
      return this.combo(state);
    }
  },
  redoublement: {
    name: "Redoublement",
    type: "weaponskill",
    cast: 0,
    recast: 2.5,
    potency: 100,
    comboPotency: 230,
    comboActions: ["zwerchhau", "enchanted_zwerchhau"],
    melee: true,
    description: `Delivers an attack with a potency of 100.
    <span class="green">Combo Action:</span> <span class="orange">Zwerchhau</span> or <span class="orange">Enchanted Zwerchhau</span>
    <span class="green">Combo Potency:</span> 230
    Action upgraded to <span class="orange">Enchanted Redoublement</span> if both <span class="orange">Black Mana</span> and <span class="orange">White Mana</span> are 25 or above.`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
    transform(state) {
      return (state.gauge.black >= 25 && state.gauge.white >= 25) ? "enchanted_redoublement" : false;
    },
    highlight(state) {
      return this.combo(state);
    }
  },
  enchanted_redoublement: {
    name: "Enchanted Redoublement",
    type: "weaponskill",
    cast: 0,
    recast: 2.2,
    potency: 100,
    comboPotency: 470,
    comboActions: ["zwerchhau", "enchanted_zwerchhau"],
    white: -25,
    black: -25,
    melee: true,
    description: `Deals unaspected damage with a potency of 100.
    <span class="green">Combo Action:</span> <span class="orange">Zwerchhau</span> or <span class="orange">Enchanted Zwerchhau</span>
    <span class="green">Combo Potency:</span> 470
    <span class="green">Balance Gauge Cost:</span> 25 <span class="orange">Black Mana</span>
    <span class="green">Balance Gauge Cost:</span> 25 <span class="orange">White Mana</span>`,
    execute(state) {
      setMelee(true);
    },
    useable(state) {
      return state.melee || getSetting("rangedmelee");
    },
    highlight(state) {
      return this.combo(state);
    }
  }
};

const statuses = {
  dualcast: {
    name: "Dualcast",
    duration: 15,
    description: "Next spell is cast immediately."
  },
  impact: {
    name: "Impactful",
    duration: 30,
    description: "Impact is usable."
  },
  verfire: {
    name: "Verfire Ready",
    duration: 30,
    description: "Verfire is usable."
  },
  verstone: {
    name: "Verstone Ready",
    duration: 30,
    description: "Verstone is usable."
  },
  swiftcast: {
    name: "Swiftcast",
    duration: 10,
    description: "Next spell is cast immediately."
  },
  embolden: {
    name: "Embolden V",
    duration: 20,
    description: "Magic damage is increased."
  },
  acceleration: {
    name: "Acceleration",
    duration: 10,
    description: "Next Veraero or Verthunder will grant Verstone Ready or Verfire Ready, respectively."
  },
  lucid_dreaming:  {
    name: "Lucid Dreaming",
    duration: 21,
    description: "Gradually restoring MP over time."
  }
};

var keyCodes = {
  3 : "",
  8 : "",
  9 : "TAB",
  12 : '',
  13 : "",
  16 : "",
  17 : "",
  18 : "",
  19 : "P",
  20 : "CAPS",
  27 : "ESC",
  32 : "",
  33 : "PUP",
  34 : "PDN",
  35 : "END",
  36 : "HOME",
  37 : "",
  38 : "",
  39 : "",
  40 : "",
  41 : "",
  42 : "",
  43 : "",
  44 : "",
  45 : "INS",
  46 : "DEL",
  48 : "0",
  49 : "1",
  50 : "2",
  51 : "3",
  52 : "4",
  53 : "5",
  54 : "6",
  55 : "7",
  56 : "8",
  57 : "9",
  58 : ":",
  59 : "",
  60 : "<",
  61 : "",
  63 : "ß",
  64 : "@",
  65 : "A",
  66 : "B",
  67 : "C",
  68 : "D",
  69 : "E",
  70 : "F",
  71 : "G",
  72 : "H",
  73 : "I",
  74 : "J",
  75 : "K",
  76 : "L",
  77 : "M",
  78 : "N",
  79 : "O",
  80 : "P",
  81 : "Q",
  82 : "R",
  83 : "S",
  84 : "T",
  85 : "U",
  86 : "V",
  87 : "W",
  88 : "X",
  89 : "Y",
  90 : "Z",
  91 : "WIN",
  92 : "WIN",
  93 : "WIN",
  96 : "N0",
  97 : "N1",
  98 : "N2",
  99 : "N3",
  100 : "N4",
  101 : "N5",
  102 : "N6",
  103 : "N7",
  104 : "N8",
  105 : "N9",
  106 : "N*",
  107 : "N+",
  108 : "N.",
  109 : "N-",
  110 : "N.",
  111 : "N/",
  112 : "F1",
  113 : "F2",
  114 : "F3",
  115 : "F4",
  116 : "F5",
  117 : "F6",
  118 : "F7",
  119 : "F8",
  120 : "F9",
  121 : "F10",
  122 : "F11",
  123 : "F12",
  124 : "F13",
  125 : "F14",
  126 : "F15",
  127 : "F16",
  128 : "F17",
  129 : "F18",
  130 : "F19",
  131 : "F20",
  132 : "F21",
  133 : "F22",
  134 : "F23",
  135 : "F24",
  144 : "NUM",
  145 : "SCRL",
  160 : "^",
  161: '!',
  163 : "#",
  164: '$',
  165: 'ù',
  166 : "",
  167 : "",
  169 : "",
  170: '*',
  171 : "",
  173 : "",
  174 : "",
  175 : "",
  176 : "",
  177 : "",
  178 : "",
  179 : "",
  180 : "",
  181 : "",
  182 : "",
  183 : "",
  186 : ";",
  187 : "=",
  188 : ",",
  189 : "-",
  190 : ".",
  191 : "/",
  192 : "`",
  193 : "?",
  194 : "N.",
  219 : "[",
  220 : "\\",
  221 : "]",
  222 : "'",
  223 : "`",
  224 : "",
  225 : "altgr",
  226 : "",
  230 : "",
  231 : "ç",
  233 : "",
  234 : "",
  255 : ""
};
