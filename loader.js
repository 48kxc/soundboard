const audioElements = {};
const playbackTimers = {};
const spinnerElement = document.querySelector('.spinner');
const containerElement = document.querySelector('.flex-container');
const delayControl = document.getElementById('delay-control');
const delayDisplay = document.getElementById('delay-display');
const delayValue = document.getElementById('delay-value');
const delayInput = document.getElementById('delay-input');
const MAX_DELAY = 20000;
let playbackDelay = Number(delayControl?.value ?? delayInput?.value ?? 0);
let hasLoaded = false;

function formatDelay(ms) {
  const seconds = ms / 1000;
  return seconds >= 10 ? `${seconds.toFixed(1)}s` : `${seconds.toFixed(2)}s`;
}

function clampDelay(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return 0;
  return Math.max(0, Math.min(MAX_DELAY, numericValue));
}

function updateDelayDisplay(value, source) {
  playbackDelay = clampDelay(value);
  if (delayDisplay) {
    delayDisplay.textContent = formatDelay(playbackDelay);
  }
  if (delayValue) {
    delayValue.textContent = `${playbackDelay}ms`;
  }
  if (delayControl && source !== 'slider') {
    delayControl.value = playbackDelay;
  }
  if (delayInput && source !== 'input') {
    delayInput.value = playbackDelay;
  }
}

if (delayControl) {
  delayControl.addEventListener('input', (event) => {
    updateDelayDisplay(event.target.value, 'slider');
  });
  updateDelayDisplay(delayControl.value, 'slider');
}

if (delayInput) {
  delayInput.addEventListener('input', (event) => {
    updateDelayDisplay(event.target.value, 'input');
  });
}

const playSound = (name) => {
  const audio = audioElements[name];
  if (!audio) return;

  if (playbackTimers[name]) {
    clearTimeout(playbackTimers[name]);
  }

  const startPlayback = () => {
    audio.pause();
    audio.currentTime = 0;
    audio
      .play()
      .catch((err) => console.error('Playback failed', name, err));
  };

  if (playbackDelay > 0) {
    playbackTimers[name] = setTimeout(() => {
      startPlayback();
      delete playbackTimers[name];
    }, playbackDelay);
    return;
  }

  startPlayback();
};

const stopSound = (name) => {
  if (playbackTimers[name]) {
    clearTimeout(playbackTimers[name]);
    delete playbackTimers[name];
  }

  const audio = audioElements[name];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

const cacheBuster = Date.now();
fetch(`sounds.json?t=${cacheBuster}`)
  .then((response) => response.json())
  .then((data) => {
    data.sounds.forEach((sound) => {
      const soundElement = document.createElement('div');
      soundElement.classList.add('sound');

      const buttonElement = document.createElement('button');
      buttonElement.classList.add('small-button');
      buttonElement.type = 'button';
      buttonElement.innerText = 'Play';
      buttonElement.addEventListener('click', (event) => {
        event.stopPropagation();
        playSound(sound.name);
      });
      soundElement.appendChild(buttonElement);

      soundElement.addEventListener('click', () => playSound(sound.name));

      const nameElement = document.createElement('p');
      nameElement.classList.add('name');
      nameElement.innerText = sound.name;
      soundElement.appendChild(nameElement);

      const audioElement = document.createElement('audio');
      audioElement.src = `${sound.mp3}?t=${cacheBuster}`;
      audioElement.preload = 'auto';
      audioElements[sound.name] = audioElement;
      document.body.appendChild(audioElement);

      containerElement.appendChild(soundElement);
    });

    spinnerElement?.remove();
    hasLoaded = true;
    console.log(`${data.sounds.length} sounds loaded!`);
  })
  .catch((error) => {
    const errorMessageElement = document.createElement('h3');
    errorMessageElement.style.color = 'red';
    errorMessageElement.innerText = `Error loading soundboard: ${error}`;

    containerElement.appendChild(errorMessageElement);
    spinnerElement?.remove();
  });

setTimeout(() => {
  if (!hasLoaded) {
    const errorMessageElement = document.createElement('h3');
    errorMessageElement.style.color = 'red';
    errorMessageElement.innerText = 'An unknown error occurred while trying to load the soundboard.';

    containerElement.appendChild(errorMessageElement);
    spinnerElement?.remove();
  }
}, 7000);

function playAll() {
  Object.keys(audioElements).forEach((name) => {
    playSound(name);
  });
}

function stopAll() {
  Object.keys(audioElements).forEach((name) => {
    stopSound(name);
  });
}
