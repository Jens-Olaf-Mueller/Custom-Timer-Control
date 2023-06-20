const TMP_STYLE = document.createElement('template');
TMP_STYLE.innerHTML = `
    <style>
        :host {
            display: inline-block;
            min-height: 1rem;
            width: auto;
            padding: 0.125rem 0.5rem;
            border: 3px solid #eee;
            border-style: inset;
        }

        #divTimer {
            height: 100%;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font: inherit;
        }

        :host[hidden], [hidden] {
            display: none;
        }
    </style>`;

class Timer extends HTMLElement {
    #timerID;
    #countDownID;
    #sec = 0;
    #min = 0;
    #hrs = 0;
    #secondsRemaining = 0;
    #alarm = null;
    #autostart = false;

    get time() {
        return `${('0' + this.#hrs).slice(-2)}:${('0' + this.#min).slice(-2)}:${('0' + this.#sec).slice(-2)}`;
    }
    set time(newTime) {
        if (this.timeIsValid(newTime)) {
            const time = this.#parseTimeString(newTime);
            this.#hrs = time.hours;
            this.#min = time.minutes;
            this.#sec = time.seconds;            
        }
    }


    get countDownRemaining() { return this.#secondsRemaining; }


    get alarmTime() { return this.getAttribute('alarm') || this.#alarm; }
    set alarmTime(newAlarm) {
        if (this.timeIsValid(newAlarm)) {
            const t = this.#parseTimeString(newAlarm);
            this.#alarm = `${('0' + t.hours).slice(-2)}:${('0' + t.minutes).slice(-2)}:${('0' + t.seconds).slice(-2)}`;
            if (!this.hasAttribute('alarm') || this.getAttribute('alarm') !== this.#alarm) {
                this.setAttribute('alarm', this.#alarm);
            }
        } 
    }


    get id() { return this.#timerID; }

    /**
     * Exposes all writable (and readable) properties of this component.
     * If those wanted who are readonly, the code must be changed from: <br>
     * ...=> typeof descriptor.set  TO: ...=> typeof descriptor.GET... <br>
     * See for further information: <br>
     * https://stackoverflow.com/questions/39310890/get-all-static-getters-in-a-class
     */
    get properties() {
        const props = Object.entries(Object.getOwnPropertyDescriptors(Timer.prototype))
        .filter(([key, descriptor]) => typeof descriptor.set === 'function').map(([key]) => key);
        return props;
    }

    static get observedAttributes() {
        return ['disabled', 'time','alarm'];
    }

    static formAssociated = true;


    constructor(time, run) {
        super();
        this.attachShadow({mode: 'open', delegatesFocus: true});
        this.time = time;     
        this.#autostart = (run == true) ? true : false;
    }


    /**
     * Method will be called once each time the web component is attached to the DOM.
     */
    connectedCallback() {
        this.#createChildren();
        this.importStyleSheet('link[data-timer]'); 
        this.#updateProperties();
        this.shadowRoot.getElementById('divTimer').innerText = this.time;
        if (this.#autostart) this.run();
    }


    /**
     * Method will be called when the web component is removed from the DOM. <br>
     * Right moment to clean up...
     */
    disconnectedCallback() {
        // remove event listeners...
        console.log('component disconnected from DOM...');
    }


    /**
     * Method is triggered each time an observed attribute on the element is updated.
     * It's NOT recommended to use this method to set the initial values of passed
     * HTML attributes since this may lead to infinite loops!
     * So it's better to use the connectedCallback()-method to achieve this!
     * There the private method #updateProperties() does this job.
     */
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (oldVal === newVal) return; // leave immediately if there are no changes!
        if (attrName == 'time') this.time = newVal;
    }


    /**
     * Imports a CSS stylesheet with the specific attribute: 'data-control'. <br>
     * @param {string} selector An attribute given in the stylesheet link
     * to recognize it for this component.
     */
    importStyleSheet(selector = 'link[data-control]') {
        const link = document.querySelector(selector);
        if (link) this.shadowRoot.innerHTML += link.outerHTML;
    }


    run() {
        this.#timerID = setInterval(() => {
            this.#sec++;
            if (this.#sec == 60) {
                this.#sec = 0;
                this.#min++;
                if (this.#min == 60) {
                    this.#min = 0;
                    this.#hrs++;
                    if (this.#hrs == 24) this.#hrs = 0;
                }
            }
            this.shadowRoot.getElementById('divTimer').innerText = this.time;
            if (this.time == this.alarmTime) {   
                this.dispatchEvent(new CustomEvent('timeralert', {
                    bubbles: true,
                    cancelable: true,
                    composed: true, // MUST be 'true' in custom web components!
                    detail: {target: this, time: this.alarmTime}
                }));
            }
        }, 1000);
    }

    stop() {
        this.#timerID = clearInterval(this.#timerID);        
    }

    countDown(time) {
        if (typeof time == 'string' && time !== 'stop') {
            if (time.includes(':')) {
                const t = this.#parseTimeString(time);
                this.#secondsRemaining = t.hours * 3600 + t.minutes * 60 + t.seconds * 1;
            } else {
                this.#secondsRemaining = Number(time);
            }
        } else if (time === false || time == 'stop') {
            this.#countDownID = clearInterval(this.#countDownID);
            return;
        }
        if (this.#secondsRemaining) this.#countDownID = this.#startCountDown();
    }

    #startCountDown() {
        const seconds = this.#secondsRemaining, dt = new Date(),
              time = `${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds}`;
        return setInterval(() => {
            this.#secondsRemaining--;
            if (this.#secondsRemaining == 0) {
                this.#countDownID = clearInterval(this.#countDownID);
                this.dispatchEvent(new CustomEvent('timeout', {
                    bubbles: true,
                    cancelable: true,
                    composed: true, // MUST be 'true' in custom web components!
                    detail: {target: this, startedAt: time, secondsExpired: seconds}
                }));
            }
        }, 1000);
    }

    #parseTimeString(timeString) {
        const parts = timeString.split(':', 3).map(Number);
        while (parts.length < 3) {
            parts.push(0);
        }; 
        return {hours: parts[0], minutes: parts[1], seconds: parts[2]};
    }


    timeIsValid(...time) {
        let hrs, min, sec;
        if (time.length == 1) {
            if (typeof time[0] == 'string') {
                const t = this.#parseTimeString(time[0]);
                hrs = t.hours;
                min = t.minutes;
                sec = t.seconds;
            } else if (time[0] instanceof Array) {
                hrs = time[0][0];
                min = time[0][1];
                sec = time[0][2];
            }  
        } else {
            hrs = time[0];
            min = time[1];
            sec = time[2];
        }
        return (hrs >= 0 && hrs < 24) && (min >= 0 && min < 60) && (sec >= 0 && sec < 60);
    }


    /**
     * Private helper function in order to create the web component's children inside the shadowRoot.
     */
    #createChildren() {
        const div = document.createElement('div');
        div.setAttribute('id', 'divTimer');
        div.setAttribute('class', 'jom-timer');
        this.shadowRoot.append(div, TMP_STYLE.content.cloneNode(true));
    }
    

    /**
     * Private helper function to update all HTML-given attributes after connectedCallback!
     */
    #updateProperties() {
        Object.values(this.properties).forEach((prop) => {
            if (Timer.prototype.hasOwnProperty(prop)) {
                let value = this[prop];
                delete this[prop];
                this[prop] = value;
            }
        });
    }


    /**
     * Helper function to set one ore more attributes to a single element.
     * @param {HTMLElement} element Element the attributes to be set on.
     * @param {object} attributes Object of attributes and values: {id: 'divID', class: 'active'} etc.
     */
    setAttributes(element, attributes) {
        Object.keys(attributes).forEach(attr => {
            element.setAttribute(attr, attributes[attr]);
        });
    }
}

customElements.define('jom-timer', Timer);