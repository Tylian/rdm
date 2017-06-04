const defaultAction = {
  name: "Skill",
  cast: 2,
  recast: 2.5,
  white: 0,
  black: 0,
  potency: 0,
  description: "Does damage.",
  mana: 0,
  execute() {
    // no-op
  },
  useable() {
    return true;
  },
  highlight() {
    return false;
  },
  transform() {
    return false;
  },
  getPotency() {
    return this.potency;
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
    description: "Deals unaspected damage with a potency of 240.\nAdditional Affect: Grants Impactful\nAdditional Effect: Increases both Black Mana and White Mana by 3.",
    execute() {
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
    description: "Deals unaspected damage with a potency of 270.\nRequires Impactful.\nAdditional Affect: Increases both Black Mana and White Mana by 4.",
    execute() {
      setStatus('impact', false);
    },
    useable() {
      return hasStatus("impact");
    },
    highlight() {
      return this.useable();
    }
  },
  verthunder: {
    name: "Verthunder",
    type: "spell",
    cast: 5,
    potency: 300,
    mana: 600,
    black: 11,
    description: "Deals thunder damage with a potency of 300.\nAdditional Effect: 50% chance of becoming Verfire Ready.\nAdditional Effect: Increases Black Mana by 11.",
    execute() {
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
    description: "Deals wind damage with a potency of 300.\nAdditional Effect: 50% chance of becoming Verstone Ready.\nAdditional Effect: Increases White Mana by 11.",
    execute() {
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
    description: "Deals fire damage with a potency of 270.\Can only be executed while Verfire Ready is active.\nAdditional Effect: Increases Black Mana by 9.",
    execute() {
      setStatus('verfire', false);
    },
    useable() {
      return hasStatus("verfire");
    },
    highlight() {
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
    description: "Deals earth damage with a potency of 270.\nCan only be executed while Verstone Ready is active.\nAdditional Effect: Increases White Mana by 9.",
    execute() {
      setStatus('verstone', false);
    },
    useable() {
      return hasStatus("verstone");
    },
    highlight() {
      return this.useable();
    }
  },
  vercure: {
    name: "Vercure",
    type: "spell",
    cast: 2,
    mana: 600,
    white: 0,
    description: "Restores target HP.\nCure potency: 350",
  },
  verflare: {
    name: "Verflare",
    type: "spell",
    cast: 0,
    potency: 550,
    mana: 840,
    black: 21,
    description: "Deals fire damage with a potency of 550.\nCombo Action: Enchanted Redoublement\nAdditional Effect: Increases Black Mana by 21\nAdditional Effect: 30% chance of becoming Verfire Ready.\nChance to become Verfire Ready increases to 100% if White Mana is higher than Black Mana at time of execution.",
    execute() {
      if(Math.random() < 0.3 || state.gauge.white > state.gauge.black)
        setStatus('verfire', true);
    },
    useable() {
      return state.lastAction == "enchanted_redoublement";
    },
    highlight() {
      return this.useable();
    }
  },
  verholy: {
    name: "Verholy",
    type: "spell",
    cast: 0,
    potency: 550,
    mana: 840,
    white: 21,
    description: "Deals unaspected damage with a potency of 550.\nCombo Action: Enchanted Redoublement\nAdditional Effect: Increases White Mana by 21\nAdditional Effect: 30% chance of becoming Verstone Ready.\nChance to become Verstone Ready increases to 100% if Black Mana is higher than White Mana at time of execution.",
    execute() {
      if(Math.random() < 0.3 || state.gauge.black > state.gauge.white)
        setStatus('verstone', true);
    },
    useable() {
      return state.lastAction == "enchanted_redoublement";
    },
    highlight() {
      return this.useable();
    }
  },
  corps_a_corps: {
    name: "Corps-a-corps",
    type: "ability",
    cast: 0,
    recast: 40,
    potency: 130,
    description: "Rushes towards target and deals unaspected damage with a potency of 130.",
    execute() {
      // setMelee(true);
    }
  },
  displacement: {
    name: "Displacement",
    type: "ability",
    cast: 0,
    recast: 35,
    potency: 130,
    melee: true,
    description: "Delivers an attack with a potency of 130.\nAdditional Effect: 10-yalm backstep",
    execute() {
      // setMelee(false);
    }
  },
  acceleration: {
    name: "Acceleration",
    type: "ability",
    cast: 0,
    recast: 35,
    description: "Ensures that the next Verthunder or Veraero spell cast will, for the first hit, trigger Verfire Ready or Verstone Ready respectively.",
    execute() {
      setStatus("acceleration", true);
    }
  },
  manafication: {
    name: "Manafication",
    type: "ability",
    cast: 0,
    recast: 120,
    description: "Doubles current Balance Gauge values.\nAdditional Effect: Resets Corps-a-corps and Displacement recast timers.",
    execute() {
      state.gauge.black = Math.min(100, state.gauge.black * 2);
      state.gauge.white = Math.min(100, state.gauge.white * 2);
      state.cooldowns["corps_a_corps"] = 0;
      state.cooldowns["displacement"] = 0;
      state.lastAction = "";
    }
  },
  embolden: {
    name: "Embolden",
    type: "ability",
    cast: 0,
    recast: 120,
    description: "Increases own magic damage delt by 20% and physical damage delt by nearby party members by 10%. Both effects are reduced by 20% every 4s.",
    execute() {
      function lower() {
        state.emboldenDamage -= 0.04;
        if(state.emboldenDamage > 0) {
          addTimer(lower, 4000);
        } else {
          state.emboldenDamage = 0;
        }
        var roman = ["I", "II", "III", "IV", "V"];
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
    description: "Next spell is cast immediately.",
    execute() {
      setStatus("swiftcast", true);
    }
  },
  lucid_dreaming: {
    name: "Lucid Dreaming",
    type: "ability",
    cast: 0,
    recast: 120,
    description: "Reduces enmity by half.\nAdditional Effect: Refresh\nRefresh Potency: 80\nDuration: 21s",
    execute() {
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
    description: "Deals an attack with a potency of 130.\nAction upgraded to Enchanted Riposte if both Black and White mana are 30 or above.",
    transform() {
      if(state.gauge.black >= 30 && state.gauge.white >= 30) {
        return 'enchanted_riposte';
      }
      return false;
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
    description: "Deals an attack with a potency of 210.Balance Gauge Cost: 30 Black Mana\nBalace Gauge Cost: 30 White Mana"
  },
  zwerchhau: {
    name: "Zwerchhau",
    type: "weaponskill",
    cast: 0,
    recast: 2.5,
    potency: 100,
    comboPotency: 150,
    melee: true,
    description: "Deals an attack with a potency of 100.\nCombo Action: Riposte or Enchanted Riposte\nCombo  Potency: 150\nAction upgraded to Enchanted Zwerchhau if both Black and White mana are 25 or above.",
    transform() {
      if(state.gauge.black >= 25 && state.gauge.white >= 25) {
        return 'enchanted_zwerchhau';
      }
      return false;
    },
    getPotency() {
      return this.highlight() ? this.comboPotency : this.potency;
    },
    highlight() {
      return state.lastAction == "riposte" || state.lastAction == "enchanted_riposte";
    }
  },
  enchanted_zwerchhau: {
    name: "Enchanted Zwerchhau",
    type: "weaponskill",
    cast: 0,
    recast: 1.5,
    potency: 100,
    comboPotency: 290,
    white: -25,
    black: -25,
    melee: true,
    description: "Deals an attack with a potency of 100.\nCombo Action: Riposte or Enchanted Riposte\nCombo Potency: 290\nBalance Gauge Cost: 25 Black Mana\nBalace Gauge Cost: 25 White Mana",
    getPotency() {
      return this.highlight() ? this.comboPotency : this.potency;
    },
    highlight() {
      return state.lastAction == "riposte" || state.lastAction == "enchanted_riposte";
    }
  },
  redoublement: {
    name: "Redoublement",
    type: "weaponskill",
    cast: 0,
    recast: 2.5,
    potency: 100,
    comboPotency: 230,
    melee: true,
    description: "Deals an attack with a potency of 100.\nCombo Action: Zwerchhau or Enchanted Zwerchhau\nCombo  Potency: 230\nAction upgraded to Enchanted Redoublement if both Black and White mana are 25 or above.",
    transform() {
      if(state.gauge.black >= 25 && state.gauge.white >= 25) {
        return 'enchanted_redoublement';
      }
      return false;
    },
    getPotency() {
      return this.highlight() ? this.comboPotency : this.potency;
    },
    highlight() {
      return state.lastAction == "zwerchhau" || state.lastAction == "enchanted_zwerchhau";
    }
  },
  enchanted_redoublement: {
    name: "Enchanted Redoublement",
    type: "weaponskill",
    cast: 0,
    recast: 2.2,
    potency: 470,
    comboPotency: 470,
    white: -25,
    black: -25,
    melee: true,
    description: "Deals an attack with a potency of 100.Combo Action: Zwerchhau or Enchanted Zwerchhau\nCombo Potency: 470\nBalance Gauge Cost: 25 Black Mana\nBalace Gauge Cost: 25 White Mana",
    getPotency() {
      return this.highlight() ? this.comboPotency : this.potency;
    },
    highlight() {
      return state.lastAction == "zwerchhau" || state.lastAction == "enchanted_zwerchhau";
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
