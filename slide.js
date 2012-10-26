var rndm = rndm || {version:"0.0.1"};

rndm.isTouchSupported = "ontouchstart" in document.documentElement;

(function() {

	"use strict";

	rndm.Util = {
		addEvent: function(elem, type, eventHandle) {
			//credit http://stackoverflow.com/a/3150139
			if (elem == null || elem == undefined) return;
			if ( elem.addEventListener ) {
				elem.addEventListener( type, eventHandle, false );
			} else if ( elem.attachEvent ) {
				elem.attachEvent( "on" + type, eventHandle );
			} else {
				elem["on"+type]=eventHandle;
			}
		},
		hashChange: function(callback){
			//credit http://stackoverflow.com/a/2162174
			if ("onhashchange" in window) { 
			// event supported?
				window.onhashchange = function () {
					callback(window.location.hash);
				}
			}
			else {
			 // event not supported:
				var storedHash = window.location.hash;
				window.setInterval(function () {
					if (window.location.hash != storedHash) {
						storedHash = window.location.hash;
						callback(storedHash);
					}
				}, 100);
			}
		},
		addClass: function(obj, className){
			if(obj.className.indexOf(className) == -1)
				obj.className += obj.className ? " "+className : className;
		},
		removeClass: function(obj, className){
			if(obj.className.indexOf(className) != -1){
				//class vorhanden
				obj.className = obj.className.replace(className, '');
			}
		},
		rfs: function(obj){
			var rfs = obj.requestFullScreen || obj.webkitRequestFullScreen || obj.mozRequestFullScreen || function(){};
			rfs.call(obj);
		},
		erfs: function(){
			document.exitFullscreen ? document.exitFullscreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitCancelFullScreen ? document.webkitCancelFullScreen() : false;
		}
	}

	rndm.Slide = function(id, cfg){
		this.slides = [];
		this.overview = false;
		this.fullscreen = false;
		this.dim = {
			w: 0,
			h: 0
		};
		this.now = 0;
		this.cfg = cfg ? cfg : {
			timeout: 3000,
			title: 'rndm-Slide'
		}
		this.interval = null;
		this.obj = null;

		if(!id){
			alert("no id");
		}else{
			var that = this;
			this.obj = document.getElementById(id);

			rndm.Util.addEvent(window, 'resize', function(){
				that.resize(document.body.clientWidth, document.body.clientHeight);
			});
			rndm.Util.addEvent(window, 'mousewheel', function(e){
				if(e.detail){
					e.detail > 0 ? that.next() : that.prev();
				}else if(e.wheelDelta){
					e.wheelDelta > 0 ? that.prev() : that.next();
				}
			})

			//TODO: multiple wheel bindings

			rndm.Util.addEvent(window, 'DOMMouseScroll', function(e){
				if(e.detail){
					e.detail > 0 ? that.next() : that.prev();
				}else if(e.wheelDelta){
					e.wheelDelta > 0 ? that.prev() : that.next();
				}
			})


			rndm.Util.hashChange(function(hash){
				var page = +hash.replace('#','');
				that.now = page >= 0 && page < that.slides.length ? page : that.now;
				that._render();
			});
			if (window.location.hash !== "#" || window.location.hash !== "") {
				window.location.hash = window.location.hash;
			}
			if(rndm.isTouchSupported){
				rndm.Util.addEvent(this.obj, 'touchstart', function(ev){
					if(ev.targetTouches.length == 1){
						var pos = ev.targetTouches[0];
						if(pos.pageX > that.dim.w / 2 + that.dim.w / 4){
							//rechts
							that.next();
						}else if(pos.pageX < that.dim.w / 2 - that.dim.w / 4){
							that.prev();
						}
					}
				})
			}
			this.obj.className += this.obj.className ? " rndm-slide" : "rndm-slide";

			this._bindKeys();
			this._genPages();
			this._buildWrapper();
			this._buildControls();
			this._buildHud();
			this.resize(document.body.clientWidth, document.body.clientHeight);
			this._render();
		}
	}
	rndm.Page = function(obj, steps){
		this.obj = obj;
		this.step = 0;
		this.steps = steps;
		if(this.steps){
			for (var i = 0; i < this.steps.length; i++) {
				rndm.Util.addClass(this.steps[i], "rndm-hidden");
			};
		}
		this.title = obj.getAttribute('data-src');
	};
	rndm.Page.prototype = {
		nextStep: function(){
			if(this.step + 1 > this.steps.length)
				return false;
			rndm.Util.removeClass(this.steps[this.step], 'rndm-hidden');
			this.step++;
			return true;
		}
	}
	rndm.HUD = function(obj){
		this.obj = obj;
		this.children = [];
	};
	rndm.Control = function(cfg, onclick){
		this.obj = document.createElement('a');
		this.obj.setAttribute('class', cfg.class);
		this.obj.innerHTML = cfg.text;
		this.obj.onclick = onclick;
	};
	rndm.Display = function(key, cfg, onRender){
		this.key = key;
		this.obj = document.createElement(cfg.element);
		this.obj.setAttribute('class', cfg.class ? cfg.class : "rndm-display");
		this.obj.innerHTML = cfg.text;
		this.onRender = onRender ? onRender : function(){};
	};

	rndm.HUD.prototype = {
		addChild: function(child){
			this.children.push(child);
		},
		addAllChildren: function(children){
			this.children = children;
		},
		render: function(){
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].onRender();
				this.obj.appendChild(this.children[i].obj);
			};
		}
	};
	rndm.Control.prototype = {
		getDOMElement: function(){
			return this.obj;
		}
	};
	rndm.Slide.prototype = {
		_genPages: function(){
			var classSlides = this.obj.children;
			for (var i = 0; i < classSlides.length; i++) {
				this.slides.push(new rndm.Page(classSlides[i], classSlides[i].getElementsByClassName('step')));
			};
		},
		_hashChange: function(hash){
			var page = +hash.replace('#','');
			that.now = page > 0 && page < that.slides.length ? page : that.now;
			that._render();
		},
		_bindKeys: function(){
			var that = this;
			rndm.Util.addEvent(window, 'keydown', function(ev){
				switch(ev.keyCode){
					case 37:
						//left
						that.prev();
						break;
					case 39:
						//right
						that.next();
						break;
					case 38:
						//up
						break;
					case 40:
						//down
						that.toggleOverview();
						break;
					case 32:
						//space
						if(that.interval){
							window.clearInterval(that.interval);
						}
						if(!that.slides[that.now].nextStep()){
							//kein step mehr übrig
							that.next();
						}
						break;
				}
			});
		},
		_buildWrapper: function(){
			var parent = this.obj.parentNode;
			var wrapper = document.createElement('div');
			wrapper.setAttribute('id', 'rndm-wrapper');

			parent.replaceChild(wrapper, this.obj);
			wrapper.appendChild(this.obj);
		},
		_buildHud: function(){
			var that = this;
			var div = document.createElement('div');
			div.setAttribute('id', 'rndm-hud');

			var children = [];

			/*
			children.push(new rndm.Display('dim', {
				element: 'b',
				text: '0x0'
			}, function(){
				this.obj.innerHTML = that.dim.w + " x " + that.dim.h;
			}));

			children.push(new rndm.Display('timer', {
				element: 'b',
				text: 'nein'
			}, function(){
				this.obj.innerHTML = "timer running" + (that.interval ? "" : " ...not");
			}));
			*/

			//this.timerTriggered.push(children[children.length]);

			children.push(new rndm.Display('nav', {
				element: 'ul',
				text: 'Folie',
				class: 'rndm-navigation'
			}, function(){
				var inner = "";
				var from = -(that.now-1<0?0:(that.now+1>=that.slides.length)?2:1);
				var to = (that.now-1<0?2:(that.now+1>=that.slides.length)?0:1);
				for (var i = from; i <= to; i++) {
					inner += '<li><a ' + (that.now == that.now+i ? 'class="active"' : '')+ '  href="#' + (that.now+i) + '">' + that.slides[that.now+i].title + '</a></li>'
				};
				this.obj.innerHTML = inner;
			}));

			children.push(new rndm.Display('progress', {
				element: 'span',
				class: 'progress',
				text: ''
			}, function(){
				//this.obj.innerHTML = "<i>"+(that.now + 1) + "/" + that.slides.length + "</i>";
				this.obj.style.width = that.now*(100/(that.slides.length-1))+"%";
			}));

			this.obj.parentNode.appendChild(div);
			this.hud = new rndm.HUD(document.getElementById('rndm-hud'));
			this.hud.addAllChildren(children);
		},
		_buildControls: function(){
			var that = this;

			var div = document.createElement('div');
			div.setAttribute('id', 'rndm-controls');
			var controls = [
				new rndm.Control({
					class: 'play',
					text: ''
				}, function(){
					that.play();
					if(!that.interval){
						rndm.Util.removeClass(this, 'pause');
						rndm.Util.addClass(this, 'play');
					}else{
						rndm.Util.removeClass(this, 'play');
						rndm.Util.addClass(this, 'pause');						
					}
				}),
				new rndm.Control({
					class: 'zoom',
					text: ''
				}, function(){
					that.toggleOverview();
				}),
				new rndm.Control({
					class: 'fullscreen',
					text: ''
				}, function(){
					that.toggleFullscreen();
				})
			];

			if(rndm.isTouchSupported){
				var controls = [
					new rndm.Control({
						class: 'zoom',
						text: ''
					}, function(){
						that.toggleOverview();
					})
				]
			}
			for (var i = 0; i < controls.length; i++) {
				div.appendChild(controls[i].getDOMElement());
			};

			this.obj.parentNode.appendChild(div);
		},
		_render: function(){
			this.hud.render();
			this.obj.style.width = (this.slides.length * this.dim.w) + "px";
			this.obj.style.marginLeft = -(this.now*this.dim.w);
			this.resetClasses();
			if(!this.overview){
				this.slides[this.now].obj.className = 'rndm-slide-now';
			}
		},
		resetClasses: function(){
			for (var i = 0; i < this.slides.length; i++) {
				this.slides[i].obj.className = '';
			};
		},
		toggleOverview: function(){
			this.overview = !this.overview;
			//this.resize(this.dim.w, this.dim.h);
			this._render();
		},
		toggleFullscreen: function(){
			this.fullscreen = !this.fullscreen;
			//this.resize(this.dim.w, this.dim.h);
			if(this.fullscreen)
				rndm.Util.rfs(this.obj.parentNode);//.requestFullscreen();
			else
				rndm.Util.erfs();//.requestFullscreen();
			this._render();
		},
		resize: function(w, h){
			this.dim.w = w;
			this.dim.h = h;
			for (var i = 0; i < this.slides.length; i++) {
				this.slides[i].obj.style.width = w;
				this.slides[i].obj.style.height = h;
			};
			this.obj.parentNode.style.width = w;
			this.obj.parentNode.style.height = h;
			this._render();
		},
		play: function(){
			if(this.interval){
				window.clearInterval(this.interval);
				this.interval = 0;
			}else{
				var that = this;
				this.interval = window.setInterval(function(){
					if(!that.slides[that.now].nextStep()){
						that.next();
					}
				}, this.cfg.timeout);
			}
		},
		next: function(){
			this.now += (this.now+1<this.slides.length) ? 1 : 0;
			if(this.interval && !(this.now + 1 < this.slides.length)){
				this.play();
			}
			this._render();
		},
		prev: function(){
			this.now -= (this.now-1<0) ? 0 : 1;
			this._render();
		},
		jump: function(page){
			this.now = (page > 0 && page < this.slides.length) ? page : this.now;
		}
	};
})();

window.onload=function(){
	var slide = new rndm.Slide('presentation');
	window.slide = slide;
}