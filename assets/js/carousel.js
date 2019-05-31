class Carousel{
    constructor(elem){
        var self = this;
        this.elem = elem;
        this.elem.classList.add("Widget-Carousel");

        this.width = this.elem.offsetWidth;
        this.height = this.elem.offsetHeight;

        this.viewport = document.createElement("div");
        this.viewport.style.left="0px";
        //this.viewport.style.transition= "left 0.5s";
        this.viewport.classList.add("viewport");
        
        this.slides = [];
        this.sleep = true;
        for(var i=0; i<this.elem.children.length; i++){
            self.slides.push(self.elem.children[i]);
        }

        for (var i = this.slides.length - 1; i >= 0; i--) {
            self.elem.removeChild(self.slides[i]);
        }

        for(var i=0; i<this.slides.length; i++){
            self.viewport.appendChild(self.slides[i]);
        }

        for(var i=0; i<this.slides.length; i++){
            var slide = this.slides[i];
            slide.classList.add("slide");
            slide.style.position = "absolute";
            slide.style.height = self.height;
            slide.style.width = self.width;
            slide.style.left = i*self.width+"px";
        }

        window.addEventListener("resize", function(){
            self.resize();
        });

        this.elem.appendChild(this.viewport);

        // buttons
        this.prevBtn = document.createElement("button");
        this.prevBtn.classList.add("prev");
        this.prevBtn.textContent = "<";

        this.prevBtn.addEventListener("click", function(){
            self.prev();
            if(self.sleep)
                self.animate();
        });

        this.elem.appendChild(this.prevBtn);
        this.nextBtn = document.createElement("button");
        this.nextBtn.classList.add("next");
        this.nextBtn.textContent = ">";
        this.nextBtn.addEventListener("click", function(){
            self.next();
            if(self.sleep)
                self.animate();
        });
        this.elem.appendChild(this.nextBtn);

        
        var beginleft = NaN;
        var movement = 0;

        var mousestartpos = NaN;
        var mousepos = NaN;
        var onmousedown = function(e){
            e.stopPropagation(); 
            e.preventDefault();
            mousestartpos = e.pageX;
            beginleft = self.viewport.offsetLeft;
            self.sim.mouseSpring.active=true;
            self.sim.slideSpring.active=false;
            self.sim.mouseSpring.min = beginleft;
            self.sim.mouseSpring.max = beginleft;
            document.addEventListener("mousemove", onmousemove, true);
            document.addEventListener("mouseup", onmouseup, true);
            if(self.sleep)
                self.animate();
        }

        var touchstartpos = NaN;
        var touchpos = NaN;
        var ontouchstart = function(e){
            e.preventDefault();
            touchstartpos = e.touches[0].pageX;
            beginleft = self.viewport.offsetLeft;
            document.addEventListener("touchmove", ontouchmove, true);
            document.addEventListener("touchend", ontouchend, true);
            self.sim.mouseSpring.active=true;
            self.sim.slideSpring.active=false;
            self.sim.mouseSpring.min = beginleft;
            self.sim.mouseSpring.max = beginleft;
            if(self.sleep)
                self.animate();
        }

        var onmousemove = function(e){
            e.stopPropagation();
            mousepos = e.pageX;
            self.sim.mouseSpring.min = mousepos-mousestartpos+beginleft;
            self.sim.mouseSpring.max = mousepos-mousestartpos+beginleft;
            if(self.sleep)
                self.animate();
        }

        var ontouchmove = function(e){
            e.stopPropagation();
            touchpos = e.touches[0].pageX;
            self.sim.mouseSpring.min = touchpos-touchstartpos+beginleft;
            self.sim.mouseSpring.max = touchpos-touchstartpos+beginleft;
            if(self.sleep)
                self.animate();
        }

        var onmouseup = function(e){
            e.stopPropagation();
            self.viewport.focus();
            self.sim.mouseSpring.active=false;
            self.sim.slideSpring.active=true;
            document.removeEventListener("mousemove", onmousemove, true);
            document.removeEventListener("mouseup", onmouseup, true);

            if(self.sim.velocity>3){
                self.prev();
            } else if(self.sim.velocity<-3){
                self.next();
            } else {
                self.goto(self.getCurrentSlide());
            }
        }

        var ontouchend = function(e){
            e.stopPropagation();
            self.viewport.focus();
            self.sim.mouseSpring.active=false;
            self.sim.slideSpring.active=true;
            document.removeEventListener("touchmove", ontouchmove, true);
            document.removeEventListener("touchend", ontouchend, true);

            if(self.sim.velocity>3){
                self.prev();
            } else if(self.sim.velocity<-3){
                self.next();
            } else {
                self.goto(self.getCurrentSlide());
            }
        }

        this.viewport.addEventListener("mousedown", onmousedown, true);
        this.viewport.addEventListener("touchstart", ontouchstart, true);

        this.sim = {
            pos: 0,
            velocity: 0,
            friction: 0.05,
            slideSpring: {min: 0, max: 0, Ck: 0.002, Cd: 0.9, active: true},
            mouseSpring: {min: 0, max: 0, Ck: 0.005, Cd: 0.98, active: false},
            borderSpring: {min: -(self.slides.length-1)*500, max:0, Ck: 0.005, Cd: 0.98, active: true}
        };



        

        this.animate();
    }

    resize(){
        var self = this;

        var lastSlide = self.slides[self.slides.length-1];
        
        var scrollPercent = (-self.viewport.offsetLeft + self.width/2) / (self.width*self.slides.length);

        self.width  =self.elem.offsetWidth;
        self.height = self.elem.offsetHeight;
        for(var i=0; i<self.slides.length; i++){
            var slide = self.slides[i];
            slide.style.height = self.height;
            slide.style.width = self.width;
            slide.style.left = i*self.width+"px";
        }

        // adjust viewport scroll to new dimensions
        self.viewport.style.left = self.width/2 - scrollPercent * (self.width*self.slides.length) + "px";
    }

    animate(){
        var self = this;
        // solve constraints
        var t = 1.0/60;
        var m = 1.0;
        var v = self.sim.velocity;
        var forces = [];
        for(var spring of [self.sim.mouseSpring, self.sim.borderSpring, self.sim.slideSpring]){
            if(spring.active && (spring.min > self.sim.pos || self.sim.pos > spring.max)){
                var x=0;
                if(self.sim.pos>spring.max){
                    x = spring.max-self.sim.pos;
                }
                if(self.sim.pos<spring.min) {
                    x =  spring.min - self.sim.pos;
                }
                var f = m/Math.pow(t, 2) * spring.Ck*x - m/t*spring.Cd*v;
                forces.push(f);
            }
        }

        // step physics
        // stable spring
        // see: https://www.gamedev.net/articles/programming/math-and-physics/towards-a-simpler-stiffer-and-more-stable-spring-r3227/
        // Test it: multiple springs doesn seem to be so stable
        if(forces.length>0 && forces.every((a)=>Math.abs(a)>0)){
            var f = forces.reduce((a, b)=>a+b, 0);
            var a = f/m;
            self.sim.velocity += a*t;
            self.sim.velocity*=1-self.sim.friction;
            self.sim.pos += v;

            //update view
            self.viewport.style.left = self.sim.pos + "px";
            
        }

        if(Math.abs(self.sim.velocity)>0.1 || (forces.length>0 && forces.every((a)=>Math.abs(a)>5))){
            self.sleep = false;
        }else{
            self.sleep = true;
        }

        if(!self.sleep){
            window.requestAnimationFrame(function(){
                self.animate();
            });
        }
    }

    getCurrentSlide(){
        var d = -1;
        var i = -1;
        return Math.round(-this.viewport.offsetLeft / this.width);
    }

    goto(i){
        if(i<0){
            i=0;
        }
        if(i>this.slides.length-1){
            i = this.slides.length-1;
        }
        this.sim.slideSpring.min = - this.slides[i].offsetLeft; 
        this.sim.slideSpring.max = - this.slides[i].offsetLeft;   
    }

    next(){
        var tolerance = 10;
        var self = this;
        var viewportMiddle = -this.viewport.offsetLeft + this.elem.offsetWidth/2;
        for(var i=0; i<this.slides.length; i++){
            var slide = self.slides[i];
            var slideMiddle = slide.offsetLeft+slide.offsetWidth/2;
            if(slideMiddle - tolerance > viewportMiddle){
                break;
            }
        }
        this.goto(i);
    }

    prev(){
        var tolerance = -10;
        var self = this;
        var viewportMiddle = -this.viewport.offsetLeft + this.elem.offsetWidth/2;
        for(var i=this.slides.length-1; i>=0; i--){
            var slide = self.slides[i];
            var slideMiddle = slide.offsetLeft+slide.offsetWidth/2;
            if(slideMiddle - tolerance < viewportMiddle){
                break;
            }
        }
        this.goto(i);
    }
}