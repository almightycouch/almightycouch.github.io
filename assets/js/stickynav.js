var nav = document.querySelector("nav");
var sticky = { element: nav,
  offset: nav.offsetTop,
  init: function() {
    this.navmenu = this.element.querySelector("ul[role=navigation]");
    this.parent = nav.parentElement;
    this.scroll();
    this.listen();
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
    }
    this.navmenu.querySelectorAll("li").forEach(function(menuItem) {
      var href = menuItem.querySelector("a").getAttribute("href");
      var innerPos = href.indexOf("#");
      if(innerPos != -1) {
        console.log(href.substring(innerPos));
        var target = document.querySelector(href.substring(innerPos));
        if(target != null) {
          var offset = window.scrollY + window.innerHeight;
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
