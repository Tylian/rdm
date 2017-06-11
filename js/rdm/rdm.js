class RDMSimulator extends Simulator {
  run() {
    this.on("actionUse", action => {
      if(this.hasStatus("dualcast") && action.type == "spell" && action.castTime > 0) {
        this.removeStatus("dualcast");
        action.castTime = 0;
      }
    });

    super.run();
  }
}

var sim = new RDMSimulator();
sim.run();
