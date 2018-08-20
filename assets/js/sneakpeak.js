let steps = document.getElementById("process").getElementsByClassName("steps")[0];
steps.childNodes.forEach(function(step) {
  step.addEventListener("mouseenter", function() {
    for(let activeStep of steps.getElementsByClassName("active")) {
      activeStep.classList.remove("active");
    }
    this.classList.add("active");
  });
});

