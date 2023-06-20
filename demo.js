const timerHTML = document.getElementById('jomTimer'),
      btnStop = document.getElementById('btnStop'),
      btnCreate =document.getElementById('btnCreateTimer');

let timerNo = 0;
      

runDemo();

function runDemo() {
    timerHTML.run();
    btnStop.addEventListener('click', () => {
        stopTimer(timerHTML, btnStop);
    });
    timerHTML.addEventListener('timeralert', handleAlert);
    btnCreate.addEventListener('click', createTimer);
}

function createTimer() {
    timerNo++;
    if (timerNo >= 10) {
        timerNo = 10;
        btnCreate.style='background-color: buttonface;';
        return;
    }    
    const startTime = document.getElementById('inpStartTime').value,
          timer = new Timer(startTime),
          wrapper = document.createElement('div'),
          btn = document.createElement('button');
    setAttributes(btn, {id: `btn${timerNo}`, class: 'demo-button', title: 'pause timer'});
    btn.appendChild(document.createTextNode('II'));
    btn.addEventListener('click', () => {
        stopTimer(timer, btn);
    });
    setAttributes(wrapper, {"data-control": ''});
    wrapper.append(timer, btn);

    setAttributes(timer, {id: `tmrCreated${timerNo}`, class: 'created-timer'});
    timer.run();
    document.getElementById('divCreated').append(wrapper);
}

function handleAlert(evt) {
    const timer = evt.target;
    timer.style='background-color: red;';
    timer.stop();
}

function stopTimer(timer, button) {    
    if (button.innerHTML == 'II') {
        button.innerHTML = '&#9654';
        button.classList.add('paused');
        setAttributes(button, {title: 'resume timer'});
        timer.stop();
        timer.style.cssText +='background-color: lightgray;';
    } else {
        button.innerHTML = 'II';
        button.classList.remove('paused');
        setAttributes(button, {title: 'pause timer'});
        timer.run();
        timer.style.cssText += 'background-color: lightgreen;'
    }
}


function setAttributes(element, attributes) {
    Object.keys(attributes).forEach(attr => {
        element.setAttribute(attr, attributes[attr]);
    });
}




