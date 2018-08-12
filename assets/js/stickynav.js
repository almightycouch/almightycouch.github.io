let nav = document.querySelector("nav");
let sticky = {
  element: nav,
  offset: nav.offsetTop,
  init: function() {
    if(!this.element.classList.contains("sticky")) {
      this.navmenu = this.element.querySelector("ul[role=navigation]");
      this.parent = nav.parentElement;
      this.figure = this.parent.querySelector("figure");
      this.scroll();
      this.listen();
    }
  },

  scroll: function() {
    if(window.scrollY >= this.offset + this.element.offsetHeight) {
      this.element.classList.add("sticky");
      this.element.classList.remove("opaque");
      this.parent.style["marginBottom"] = this.element.offsetHeight + "px";
    } else if(window.scrollY >= this.offset) {
      this.element.classList.add("sticky");
      this.element.classList.add("opaque");
      this.parent.style["marginBottom"] = this.element.offsetHeight + "px";
    } else {
      this.element.classList.remove("sticky");
      this.element.classList.remove("opaque");
      this.parent.style["marginBottom"] = "0";
      //this.figure.style.backgroundPosition = "center -" + window.scrollY * 1.25 + "px";
    }
    this.navmenu.querySelectorAll("li").forEach(function(menuItem) {
      let href = menuItem.querySelector("a").getAttribute("href");
      let innerPos = href.indexOf("#");
      if(innerPos != -1) {
        let target = document.querySelector(href.substring(innerPos));
        if(target != null) {
          let offset = window.scrollY + window.innerHeight;
          if(target.offsetTop < offset && target.offsetTop + target.offsetHeight >= offset) {
            menuItem.classList.add("active");
          } else {
            menuItem.classList.remove("active");
          }
        }
      }
    })
  },

  listen: function() {
    window.addEventListener("scroll", this.scroll.bind(this));
  }
};

document.addEventListener("DOMContentLoaded", sticky.init.bind(sticky));

let steps = document.getElementById("process").getElementsByClassName("steps")[0];
steps.childNodes.forEach(function(step) {
  step.addEventListener("mouseenter", function() {
    for(let activeStep of steps.getElementsByClassName("active")) {
      activeStep.classList.remove("active");
    }
    this.classList.add("active");
  });
});
