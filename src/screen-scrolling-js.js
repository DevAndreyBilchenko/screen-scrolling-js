const defaultConf = {
    root: '.js-screen-scrolling',
    nav: '.js-screen-scrolling__nav',
    child: '.js-screen-scrolling__screen',
    nav_active_state: 'is-active',
    screen_active_state: 'is-active',
    current_screen: 1,
    scroll_duration: 600,
    disableOn: 768,
    swipeDistance: 90,
    onScreenEnable: function () {
    },
    onScreenDisable: function () {
    },
};

export default class ScreenScrollingJs {
    constructor(conf) {
        this.touch = this.isTouch();
        this.conf = Object.assign({}, defaultConf, conf);
        this.state = {
            sliding: false,
            currentScreen: this.conf.current_screen,
            prevScreen: null,
            slide_from: 0,
            slide_to: 0,
            slide_current: 0,
            time_start: null,
            time_end: null,
        };

        this.queryDom();
        this.setupDom();
        this.setupEvents();
        this.updateNav();
        this.updateSections();
        this.loop();
    }

    queryDom() {
        this.dom = {};
        this.dom.root = document.querySelector(this.conf.root);
        this.dom.rootParent = this.dom.root.parentElement;
        this.dom.nav = document.querySelectorAll(this.conf.nav);

        this.dom.buttons = [];
        this.dom.nav.forEach(node => {
            node.querySelectorAll('button').forEach(node => {
                this.dom.buttons.push(node);
            });
        });

        this.dom.child = this.dom.root.querySelectorAll(this.conf.child);
    }

    setupDom() {
        if (this.dom.root.nodeName === 'BODY') throw new Error('Body cannot by root element');

        this.instantTop();

        window.requestAnimationFrame(() => {
            this.dom.root.style.willChange = 'transform';
            this.dom.root.style.height = (window.innerHeight * this.dom.child.length) + 'px';
            this.dom.root.style.overflow = 'hidden';

            this.dom.child.forEach(node => {
                node.style.height = window.innerHeight + 'px';
            });

            this.dom.rootParent.style.overflow = 'hidden';
            this.dom.rootParent.style.height = window.innerHeight + 'px';
        });
    }

    setupEvents() {
        window.addEventListener('scroll', this.onScroll.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('wheel', this.onWheel.bind(this), false);
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this), false);

        this.dom.buttons.forEach(node => {
            node.addEventListener('click', this.onNavButtonClick.bind(this));
        });
    }

    handleTouchStart(evt) {
        if (this.state.ignoreInput) return;

        const firstTouch = evt.touches[0];
        this.xDown = firstTouch.clientX;
        this.yDown = firstTouch.clientY;

        console.log('touchstart', this.yDown);
    }

    handleTouchMove(evt) {
        if (this.state.ignoreInput) return;

        if (this.yDown === null) {
            this.handleTouchStart(evt);
        }

        let xUp = evt.touches[0].clientX;
        let yUp = evt.touches[0].clientY;

        let xDiff = this.xDown - xUp;
        let yDiff = this.yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
            if (xDiff > 0) {
                /* left swipe */
            } else {
                /* right swipe */
            }
        } else {
            if (yDiff > this.conf.swipeDistance) {
                this.showNextScreen();
                this.updateTouchForward(xUp, yUp);
            } else if (yDiff < -this.conf.swipeDistance) {
                this.showPrevScreen();
                this.updateTouchForward(xUp, yUp);
            }
        }
    }

    handleTouchEnd() {
        /* reset values */
        this.xDown = null;
        this.yDown = null;
    }

    updateTouchForward(x, y) {
        this.xDown = x;
        this.yDown = y;
    }

    showScreen(number) {
        if (this.state.sliding) return;
        if (number === this.state.currentScreen || number < 1 || number > this.dom.child.length) return;

        this.state.sliding = true;
        this.state.prevScreen = this.state.currentScreen;
        this.state.currentScreen = number;
        this.state.slide_to = window.innerHeight * (number - 1);
    }

    showNextScreen() {
        this.showScreen(this.state.currentScreen + 1);
    }

    showPrevScreen() {
        this.showScreen(this.state.currentScreen - 1);
    }

    onScroll(e) {
        this.instantTop();
        e.preventDefault();
    }

    onWindowResize() {
        this.setupDom();
    }

    onWheel(e) {
        if (this.state.ignoreInput) return;

        if (e.deltaY > 0) {
            this.showNextScreen();
        } else {
            this.showPrevScreen();
        }
    }

    onNavButtonClick(e) {
        this.showScreen(parseInt(e.target.dataset.screen));
    }

    isTouch() {
        try {
            document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    ignoreInput() {
        this.state.ignoreInput = true;
        setTimeout(() => {
            this.state.ignoreInput = false;
        }, 300);
    }

    loop() {
        window.requestAnimationFrame(time => {
            (() => {
                if (this.state.slide_current === this.state.slide_to) {
                    if (this.state.sliding) {
                        this.conf.onScreenDisable(this.state.prevScreen);
                        this.conf.onScreenEnable(this.state.currentScreen);
                        this.updateNav();
                        this.updateSections();
                        this.ignoreInput();
                    }
                    this.state.sliding = false;
                    this.state.slide_from = this.state.slide_to;
                    return;
                }

                if (this.state.slide_from === this.state.slide_current) {
                    this.state.time_start = time;
                    this.state.slide_current++;
                    this.state.sliding = true;
                    return;
                }

                const duration = time - this.state.time_start;
                const d = this.conf.scroll_duration / 100;
                let amt = duration / d * 0.01;

                if (amt > 1) amt = 1;

                const transform = this.lerp(this.state.slide_from, this.state.slide_to, amt);

                this.state.slide_current = transform;
                this.dom.root.style.transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,0,-${transform},0,1)`;

            })();

            this.loop();
        });
    }

    instantTop() {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        });
    }

    updateNav() {
        this.dom.buttons.forEach(button => {
            button.classList.remove(this.conf.nav_active_state);
        });

        this.dom.nav.forEach(nav => {
            nav.querySelector(`[data-screen="${this.state.currentScreen}"]`).classList.add(this.conf.nav_active_state);
        });
    }

    updateSections() {
        this.dom.child.forEach((child, n) => {
            child.classList.remove(this.conf.screen_active_state);

            if (n === this.state.currentScreen - 1) {
                child.classList.add(this.conf.screen_active_state);
            }
        });
    }
}
