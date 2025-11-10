/*
  OnYu SEN Communication Tool
  ----------------------------
  This file contains all data models, UI rendering, and event handlers for the
  MVP experience. Each module is grouped into helper functions so future
  refactors to frameworks or component systems are straightforward.
*/

// ---------------------- Utilities ----------------------
const storageKeys = {
  emotions: 'onu_emotions',
  needs: 'onu_needs',
  schedule: 'onu_schedule',
  scheduleTemplates: 'onu_schedule_templates',
  nowNext: 'onu_now_next_presets',
  stories: 'onu_stories',
  rewards: 'onu_rewards',
  rewardProgress: 'onu_reward_progress',
  rewardCelebrations: 'onu_reward_celebrations',
  pin: 'onu_parent_pin'
};

const defaultData = {
  emotions: [
    { id: 'happy', text: 'Happy', sentence: 'I feel happy.', image: 'assets/placeholder-happy.svg' },
    { id: 'sad', text: 'Sad', sentence: 'I feel sad.', image: 'assets/placeholder-sad.svg' },
    { id: 'angry', text: 'Angry', sentence: 'I feel angry.', image: 'assets/placeholder-angry.svg' },
    { id: 'tired', text: 'Tired', sentence: 'I feel tired.', image: 'assets/placeholder-tired.svg' },
    { id: 'excited', text: 'Excited', sentence: 'I feel excited.', image: 'assets/placeholder-excited.svg' },
    { id: 'worried', text: 'Worried', sentence: 'I feel worried.', image: 'assets/placeholder-worried.svg' },
    { id: 'calm', text: 'Calm', sentence: 'I feel calm.', image: 'assets/placeholder-calm.svg' },
    { id: 'scared', text: 'Scared', sentence: 'I feel scared.', image: 'assets/placeholder-scared.svg' },
    { id: 'frustrated', text: 'Frustrated', sentence: 'I feel frustrated.', image: 'assets/placeholder-frustrated.svg' }
  ],
  needs: [
    { id: 'toilet', text: 'Toilet', sentence: 'I want the toilet.', category: 'Places', image: 'assets/placeholder-toilet.svg' },
    { id: 'eat', text: 'Eat', sentence: 'I want to eat.', category: 'Food', image: 'assets/placeholder-eat.svg' },
    { id: 'drink', text: 'Drink', sentence: 'I want a drink.', category: 'Food', image: 'assets/placeholder-drink.svg' },
    { id: 'break', text: 'Break', sentence: 'I want a break.', category: 'Activities', image: 'assets/placeholder-break.svg' },
    { id: 'help', text: 'Help', sentence: 'I want help.', category: 'Activities', image: 'assets/placeholder-help.svg' },
    { id: 'play', text: 'Play', sentence: 'I want to play.', category: 'Activities', image: 'assets/placeholder-play.svg' },
    { id: 'sleep', text: 'Sleep', sentence: 'I want to sleep.', category: 'Activities', image: 'assets/placeholder-sleep.svg' },
    { id: 'outside', text: 'Go Outside', sentence: 'I want to go outside.', category: 'Places', image: 'assets/placeholder-outside.svg' },
    { id: 'music', text: 'Music', sentence: 'I want music.', category: 'Activities', image: 'assets/placeholder-music.svg' },
    { id: 'quiet', text: 'Quiet Time', sentence: 'I want quiet time.', category: 'Activities', image: 'assets/placeholder-quiet.svg' }
  ],
  schedule: [],
  scheduleTemplates: [],
  nowNext: [],
  stories: [],
  rewards: [],
  rewardProgress: {},
  rewardCelebrations: {}
};

const iconSuggestions = {
  toilet: 'assets/placeholder-toilet.svg',
  wash: 'assets/placeholder-wash.svg',
  food: 'assets/placeholder-eat.svg',
  drink: 'assets/placeholder-drink.svg',
  play: 'assets/placeholder-play.svg',
  help: 'assets/placeholder-help.svg',
  reward: 'assets/placeholder-reward.svg',
  school: 'assets/placeholder-school.svg',
  tidy: 'assets/placeholder-tidy.svg'
};

const clone = (value) => (typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value)));

const noop = () => {};

let updateNowNextLibraryOptions = noop;
let renderScheduleLibrary = noop;

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Storage read failed', key, error);
    return clone(fallback);
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Storage write failed', key, error);
  }
}

function speak(text, { queue = false, lang = 'en-GB' } = {}) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  const hangulRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  const resolvedLang = hangulRegex.test(text) ? 'ko-KR' : lang;
  utter.lang = resolvedLang;
  if (!queue) speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createCard({ text, image, sentence }, onClick) {
  const template = document.getElementById('cardTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  const img = node.querySelector('img');
  const p = node.querySelector('p');
  img.src = image;
  img.alt = text;
  p.textContent = text;
  if (onClick) {
    node.addEventListener('click', () => onClick(node));
    node.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') onClick(node);
    });
  }
  if (sentence) node.dataset.sentence = sentence;
  node.dataset.text = text;
  node.dataset.image = image;
  return node;
}

function showElement(el) {
  if (el) el.hidden = false;
}

function hideElement(el) {
  if (el) el.hidden = true;
}

function toggleClass(element, className, condition) {
  element.classList.toggle(className, condition);
}

function ensureDefaultCards(key, defaults, { type } = {}) {
  let items = readStorage(key, defaults);
  let changed = false;
  if (!Array.isArray(items) || items.length === 0) {
    items = clone(defaults);
    changed = true;
  } else {
    items = items.map((item) => {
      const normalized = { ...item };
      if (!normalized.id && normalized.text) {
        normalized.id = `${normalized.text.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        changed = true;
      }
      if (!normalized.sentence && normalized.text) {
        const base = normalized.text.toLowerCase();
        normalized.sentence = type === 'emotion' ? `I feel ${base}.` : `I want ${base}.`;
        changed = true;
      }
      if (!normalized.image) {
        normalized.image = 'assets/placeholder-generic.svg';
        changed = true;
      }
      return normalized;
    });
  }
  if (changed) {
    writeStorage(key, items);
  }
  return items;
}

function ensurePin() {
  try {
    const saved = localStorage.getItem(storageKeys.pin);
    if (!saved) {
      localStorage.setItem(storageKeys.pin, '1234');
    }
  } catch (error) {
    console.warn('PIN storage unavailable', error);
  }
}

function initialize() {
  ensurePin();

  // ---------------------- Parent Mode ----------------------
  let parentMode = false;
  const parentToggleBtn = document.getElementById('parentToggle');
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const pinSubmit = document.getElementById('pinSubmit');
  const pinCancel = document.getElementById('pinCancel');
  const modeNotice = document.getElementById('modeNotice');

  if (!parentToggleBtn || !pinModal || !pinInput || !pinSubmit || !pinCancel || !modeNotice) {
    console.error('Missing core UI elements, unable to initialise app.');
    return;
  }

  const requireElements = (entries, context) => {
    const missing = entries.filter(([, el]) => !el).map(([name]) => name);
    if (missing.length) {
      console.error(`Missing ${context} elements: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  let nowLibrarySelect;
  let nextLibrarySelect;
  let applyNowNextLibrary;

  function setParentMode(enabled) {
    parentMode = enabled;
    document.querySelectorAll('.parent-only').forEach((el) => {
      el.hidden = !enabled;
    });
    document.querySelectorAll('.child-only').forEach((el) => {
      el.hidden = enabled;
    });
    modeNotice.textContent = enabled ? 'Parent Mode Active' : 'Child Mode Active';
    parentToggleBtn.textContent = enabled ? 'Exit Parent Mode' : 'Parent Mode';
    pinInput.value = '';
    hideElement(pinModal);
  }

parentToggleBtn.addEventListener('click', () => {
  if (parentMode) {
    setParentMode(false);
    return;
  }
  pinInput.value = '';
  showElement(pinModal);
  pinInput.focus();
});

pinSubmit.addEventListener('click', () => {
  const storedPin = localStorage.getItem(storageKeys.pin);
  if (pinInput.value === storedPin) {
    setParentMode(true);
  } else if (!storedPin && pinInput.value) {
    localStorage.setItem(storageKeys.pin, pinInput.value);
    setParentMode(true);
  } else {
    pinInput.classList.add('error');
    setTimeout(() => pinInput.classList.remove('error'), 600);
    speak('Incorrect PIN');
  }
});

pinInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    pinSubmit.click();
  }
});

pinCancel.addEventListener('click', () => {
  hideElement(pinModal);
  pinInput.value = '';
});

pinModal.addEventListener('click', (event) => {
  if (event.target === pinModal) {
    hideElement(pinModal);
    pinInput.value = '';
  }
});

// ---------------------- Emotion Board ----------------------
  let emotions = ensureDefaultCards(storageKeys.emotions, defaultData.emotions, { type: 'emotion' });
  const emotionBoard = document.getElementById('emotionBoard');
  const emotionForm = document.getElementById('emotionForm');
  const emotionTextInput = document.getElementById('emotionText');
  const emotionImageInput = document.getElementById('emotionImage');

  if (requireElements([
    ['emotionBoard', emotionBoard],
    ['emotionForm', emotionForm],
    ['emotionTextInput', emotionTextInput],
    ['emotionImageInput', emotionImageInput],
  ], 'Emotion board')) {
    const renderEmotions = () => {
      emotionBoard.innerHTML = '';
      emotions.forEach((emotion) => {
        const card = createCard(emotion, (cardNode) => {
          emotionBoard.querySelectorAll('.card').forEach((c) => c.classList.remove('active'));
          cardNode.classList.add('active');
          speak(emotion.sentence || `I feel ${emotion.text}.`);
        });
        emotionBoard.appendChild(card);
      });
      updateNowNextLibraryOptions();
    };

    renderEmotions();

    emotionForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = emotionTextInput.value.trim();
      if (!text) return;
      let imageSrc = 'assets/placeholder-generic.svg';
      if (emotionImageInput.files[0]) {
        imageSrc = await readFileAsDataURL(emotionImageInput.files[0]);
      }
      const newEmotion = {
        id: `${text.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        text,
        sentence: `I feel ${text.toLowerCase()}.`,
        image: imageSrc
      };
      emotions.push(newEmotion);
      writeStorage(storageKeys.emotions, emotions);
      renderEmotions();
      renderScheduleLibrary();
      emotionForm.reset();
      hideElement(emotionForm);
    });
  } else {
    console.warn('Emotion board markup missing; skipping emotion UI render.');
  }

// ---------------------- Needs Board ----------------------
  let needs = ensureDefaultCards(storageKeys.needs, defaultData.needs, { type: 'need' });
  const needsBoard = document.getElementById('needsBoard');
  const needsForm = document.getElementById('needsForm');
  const needTextInput = document.getElementById('needText');
  const needCategorySelect = document.getElementById('needCategory');
  const needImageInput = document.getElementById('needImage');
  const needsCategoryFilter = document.getElementById('needsCategory');
  const needsSentence = document.getElementById('needsSentence');

  if (requireElements([
    ['needsBoard', needsBoard],
    ['needsForm', needsForm],
    ['needTextInput', needTextInput],
    ['needCategorySelect', needCategorySelect],
    ['needImageInput', needImageInput],
  ], 'Needs board')) {
    const populateNeedCategories = () => {
      if (!needsCategoryFilter) return;
      const categories = Array.from(new Set(needs.map((n) => n.category)));
      needsCategoryFilter.innerHTML = '<option value="all">All</option>' + categories.map((c) => `<option value="${c}">${c}</option>`).join('');
    };

    const renderNeeds = (filter = 'all') => {
      needsBoard.innerHTML = '';
      if (needsSentence) needsSentence.textContent = '';
      const filtered = filter === 'all' ? needs : needs.filter((item) => item.category === filter);
      filtered.forEach((need) => {
        const card = createCard(need, (cardNode) => {
          needsBoard.querySelectorAll('.card').forEach((c) => c.classList.remove('active'));
          cardNode.classList.add('active');
          const sentence = need.sentence || `I want ${need.text.toLowerCase()}.`;
          speak(sentence);
          if (needsSentence) {
            needsSentence.textContent = sentence;
          }
        });
        needsBoard.appendChild(card);
      });
      updateNowNextLibraryOptions();
    };

    populateNeedCategories();
    renderNeeds();

    needsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = needTextInput.value.trim();
      const category = needCategorySelect.value;
      if (!text) return;
      let imageSrc = 'assets/placeholder-generic.svg';
      if (needImageInput.files[0]) {
        imageSrc = await readFileAsDataURL(needImageInput.files[0]);
      }
      const newNeed = {
        id: `${text.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        text,
        sentence: `I want ${text.toLowerCase()}.`,
        category,
        image: imageSrc
      };
      needs.push(newNeed);
      writeStorage(storageKeys.needs, needs);
      populateNeedCategories();
      if (needsCategoryFilter) {
        renderNeeds(needsCategoryFilter.value);
      } else {
        renderNeeds();
      }
      renderScheduleLibrary();
      needsForm.reset();
      hideElement(needsForm);
    });

    if (needsCategoryFilter) {
      needsCategoryFilter.addEventListener('change', () => {
        renderNeeds(needsCategoryFilter.value);
      });
    }
  } else {
    console.warn('Needs board markup missing; skipping needs UI render.');
  }

// ---------------------- Schedule Module ----------------------
  const scheduleChildView = document.getElementById('scheduleChildView');
  const scheduleParentView = document.getElementById('scheduleParentView');
  const scheduleDrop = document.getElementById('scheduleDrop');
  const scheduleLibrary = document.getElementById('scheduleLibrary');
  const scheduleLibraryToggle = document.getElementById('scheduleLibraryToggle');
  const scheduleTemplateSave = document.getElementById('scheduleTemplateSave');
  const scheduleTemplateLoad = document.getElementById('scheduleTemplateLoad');
  if (requireElements([
    ['scheduleChildView', scheduleChildView],
    ['scheduleParentView', scheduleParentView],
    ['scheduleDrop', scheduleDrop],
    ['scheduleLibrary', scheduleLibrary],
  ], 'Schedule module')) {
let schedule = readStorage(storageKeys.schedule, defaultData.schedule);
let scheduleTemplates = readStorage(storageKeys.scheduleTemplates, defaultData.scheduleTemplates);

    const updateScheduleViews = () => {
  scheduleChildView.innerHTML = '';
  scheduleDrop.innerHTML = '';
  schedule.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'schedule-slide';
    slide.innerHTML = `<img src="${item.image}" alt="${item.text}"><p>${item.text}</p><button class="secondary child-only" data-index="${index}">Mark done</button>`;
    scheduleChildView.appendChild(slide);

    const dropItem = document.createElement('div');
    dropItem.className = 'schedule-item';
    dropItem.draggable = true;
    dropItem.dataset.index = index;
    dropItem.innerHTML = `<img src="${item.image}" alt="${item.text}"><span>${item.text}</span><div class="schedule-controls parent-only"><button type="button" class="secondary move-up">⬆</button><button type="button" class="secondary move-down">⬇</button><button type="button" class="secondary remove">✕</button></div>`;
    scheduleDrop.appendChild(dropItem);
  });
    };

    renderScheduleLibrary = () => {
  scheduleLibrary.innerHTML = '';
  const library = [...emotions, ...needs];
  library.forEach((item) => {
    const card = createCard(item);
    card.draggable = true;
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('application/json', JSON.stringify(item));
    });
    card.addEventListener('click', () => {
      schedule.push({ text: item.text, image: item.image });
      writeStorage(storageKeys.schedule, schedule);
      updateScheduleViews();
    });
    scheduleLibrary.appendChild(card);
  });
    };

    renderScheduleLibrary();
    updateScheduleViews();

    scheduleDrop.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

scheduleDrop.addEventListener('drop', (event) => {
  event.preventDefault();
  const data = event.dataTransfer.getData('application/json');
  if (!data) return;
  const item = JSON.parse(data);
  schedule.push({ text: item.text, image: item.image });
  writeStorage(storageKeys.schedule, schedule);
  updateScheduleViews();
});

scheduleDrop.addEventListener('click', (event) => {
  const item = event.target.closest('.schedule-item');
  if (!item) return;
  const index = Number(item.dataset.index);
  if (event.target.classList.contains('move-up') && index > 0) {
    [schedule[index - 1], schedule[index]] = [schedule[index], schedule[index - 1]];
  }
  if (event.target.classList.contains('move-down') && index < schedule.length - 1) {
    [schedule[index + 1], schedule[index]] = [schedule[index], schedule[index + 1]];
  }
  if (event.target.classList.contains('remove')) {
    schedule.splice(index, 1);
  }
  writeStorage(storageKeys.schedule, schedule);
  updateScheduleViews();
});

scheduleChildView.addEventListener('click', (event) => {
  if (event.target.matches('[data-index]')) {
    const index = Number(event.target.dataset.index);
    const slide = scheduleChildView.children[index];
    slide.classList.add('done');
    speak(`Finished ${schedule[index].text}`);
  }
});

if (scheduleLibraryToggle) {
  scheduleLibraryToggle.addEventListener('click', () => {
    const container = scheduleLibrary.parentElement;
    container.hidden = !container.hidden;
  });
}

if (scheduleTemplateSave) {
  scheduleTemplateSave.addEventListener('click', () => {
    const name = prompt('Template name');
    if (!name) return;
    scheduleTemplates.push({ name, items: clone(schedule) });
    writeStorage(storageKeys.scheduleTemplates, scheduleTemplates);
    alert('Template saved');
  });
}

if (scheduleTemplateLoad) {
  scheduleTemplateLoad.addEventListener('click', () => {
    if (!scheduleTemplates.length) {
      alert('No templates yet');
      return;
    }
    const options = scheduleTemplates.map((t, index) => `${index + 1}. ${t.name}`).join('\n');
    const chosen = prompt(`Choose template by number:\n${options}`);
    const idx = Number(chosen) - 1;
    if (!Number.isInteger(idx) || !scheduleTemplates[idx]) return;
    schedule = clone(scheduleTemplates[idx].items);
    writeStorage(storageKeys.schedule, schedule);
    updateScheduleViews();
  });
}

  } else {
    console.warn('Schedule markup missing; skipping schedule UI render.');
  }

// ---------------------- Now & Next ----------------------
  const nowCard = document.getElementById('nowCard');
  const nextCard = document.getElementById('nextCard');
  const nowDoneBtn = document.getElementById('nowDone');
  const nowNextForm = document.getElementById('nowNextForm');
  const nowNextPresets = document.getElementById('nowNextPresets');
  const nowNextLibrary = document.getElementById('nowNextLibrary');
  nowLibrarySelect = document.getElementById('nowLibrarySelect');
  nextLibrarySelect = document.getElementById('nextLibrarySelect');
  applyNowNextLibrary = document.getElementById('applyNowNextLibrary');
  const nowTextInput = document.getElementById('nowText');
  const nextTextInput = document.getElementById('nextText');
  const nowImageInput = document.getElementById('nowImage');
  const nextImageInput = document.getElementById('nextImage');
  if (!requireElements([
    ['nowCard', nowCard],
    ['nextCard', nextCard],
    ['nowNextForm', nowNextForm],
    ['nowNextPresets', nowNextPresets],
    ['nowLibrarySelect', nowLibrarySelect],
    ['nextLibrarySelect', nextLibrarySelect],
    ['applyNowNextLibrary', applyNowNextLibrary],
    ['nowTextInput', nowTextInput],
    ['nextTextInput', nextTextInput],
  ], 'Now & Next module')) {
    return;
  }
let nowNextPresetsData = readStorage(storageKeys.nowNext, defaultData.nowNext);
let currentNowNext = nowNextPresetsData[0] || null;

function renderNowNext() {
  nowCard.classList.remove('completed');
  if (!currentNowNext) {
    nowCard.innerHTML = '<p>Select a preset</p>';
    nextCard.innerHTML = '<p>Select a preset</p>';
    nowDoneBtn.hidden = true;
    return;
  }
  nowCard.innerHTML = `<img src="${currentNowNext.now.image}" alt="${currentNowNext.now.text}"><p>${currentNowNext.now.text}</p>`;
  nextCard.innerHTML = `<img src="${currentNowNext.next.image}" alt="${currentNowNext.next.text}"><p>${currentNowNext.next.text}</p>`;
  nowDoneBtn.hidden = false;
}

function renderNowNextPresets() {
  nowNextPresets.innerHTML = '';
  nowNextPresetsData.forEach((preset, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'story-card';
    wrapper.innerHTML = `<strong>${preset.name || 'Preset'}</strong><div class="button-row"><button class="primary" data-index="${index}">Use</button><button class="secondary" data-remove="${index}">Remove</button></div>`;
    nowNextPresets.appendChild(wrapper);
  });
  nowNextPresets.hidden = !parentMode;
}

function getLibraryCards() {
  return [...emotions, ...needs];
}

  updateNowNextLibraryOptions = () => {
  if (!nowLibrarySelect || !nextLibrarySelect) {
    nowLibrarySelect = document.getElementById('nowLibrarySelect');
    nextLibrarySelect = document.getElementById('nextLibrarySelect');
    applyNowNextLibrary = document.getElementById('applyNowNextLibrary');
  }
  if (!nowLibrarySelect || !nextLibrarySelect) return;
  const library = getLibraryCards();
  if (!library.length) {
    const empty = '<option value="">No cards yet</option>';
    nowLibrarySelect.innerHTML = empty;
    nextLibrarySelect.innerHTML = empty;
    if (applyNowNextLibrary) applyNowNextLibrary.disabled = true;
    return;
  }
  const options = library.map((item) => `<option value="${item.id}">${item.text}</option>`).join('');
  nowLibrarySelect.innerHTML = options;
  nextLibrarySelect.innerHTML = options;
  if (applyNowNextLibrary) applyNowNextLibrary.disabled = false;
  };

updateNowNextLibraryOptions();

renderNowNext();
renderNowNextPresets();

nowNextForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nowText = nowTextInput.value.trim();
  const nextText = nextTextInput.value.trim();
  if (!nowText || !nextText) return;
  let nowImage = 'assets/placeholder-now.svg';
  let nextImage = 'assets/placeholder-next.svg';
  if (nowImageInput.files[0]) nowImage = await readFileAsDataURL(nowImageInput.files[0]);
  if (nextImageInput.files[0]) nextImage = await readFileAsDataURL(nextImageInput.files[0]);
  const preset = {
    name: `${nowText} → ${nextText}`,
    now: { text: nowText, image: nowImage },
    next: { text: nextText, image: nextImage }
  };
  nowNextPresetsData.push(preset);
  writeStorage(storageKeys.nowNext, nowNextPresetsData);
  renderNowNextPresets();
  nowNextForm.reset();
  hideElement(nowNextForm);
});

nowNextPresets.addEventListener('click', (event) => {
  const useIdx = event.target.dataset.index;
  const removeIdx = event.target.dataset.remove;
  if (useIdx !== undefined) {
    currentNowNext = nowNextPresetsData[Number(useIdx)];
    renderNowNext();
  }
  if (removeIdx !== undefined) {
    nowNextPresetsData.splice(Number(removeIdx), 1);
    writeStorage(storageKeys.nowNext, nowNextPresetsData);
    renderNowNextPresets();
    if (currentNowNext && !nowNextPresetsData.includes(currentNowNext)) {
      currentNowNext = nowNextPresetsData[0] || null;
      renderNowNext();
    }
  }
});

if (applyNowNextLibrary) {
  applyNowNextLibrary.addEventListener('click', () => {
    const library = getLibraryCards();
    const nowChoice = library.find((item) => item.id === nowLibrarySelect.value);
    const nextChoice = library.find((item) => item.id === nextLibrarySelect.value);
    if (!nowChoice || !nextChoice) return;
    currentNowNext = {
      name: `${nowChoice.text} → ${nextChoice.text}`,
      now: { text: nowChoice.text, image: nowChoice.image },
      next: { text: nextChoice.text, image: nextChoice.image }
    };
    renderNowNext();
  });
}

nowDoneBtn.addEventListener('click', () => {
  if (!currentNowNext) return;
  speak(`All done with ${currentNowNext.now.text}`);
  nowCard.classList.add('completed');
  setTimeout(() => {
    nowCard.classList.remove('completed');
    speak(`Next is ${currentNowNext.next.text}`, { queue: true });
  }, 800);
});

nowCard.addEventListener('click', () => {
  if (!currentNowNext) return;
  speak(`Now: ${currentNowNext.now.text}`);
});

nextCard.addEventListener('click', () => {
  if (!currentNowNext) return;
  speak(`Next: ${currentNowNext.next.text}`);
});

nowCard.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') nowCard.click();
});

nextCard.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') nextCard.click();
});

// ---------------------- Story + Reward System ----------------------
  const storyList = document.getElementById('storyList');
  const storyForm = document.getElementById('storyForm');
  const rewardForm = document.getElementById('rewardForm');
  const storyTitleInput = document.getElementById('storyTitle');
  const storyTextInput = document.getElementById('storyText');
  const storyStepsContainer = document.getElementById('storySteps');
  const storyGenerateBtn = document.getElementById('storyGenerate');
  const storyMicBtn = document.getElementById('storyMic');
  const rewardStorySelect = document.getElementById('rewardStory');
  const rewardNameInput = document.getElementById('rewardName');
  const rewardTargetSelect = document.getElementById('rewardTarget');
  const rewardImageInput = document.getElementById('rewardImage');
  const rewardPopup = document.getElementById('rewardPopup');
  const rewardPopupImage = document.getElementById('rewardPopupImage');
  const rewardPopupText = document.getElementById('rewardPopupText');
  const rewardClose = document.getElementById('rewardClose');
  if (!requireElements([
    ['storyList', storyList],
    ['storyForm', storyForm],
    ['storyTitleInput', storyTitleInput],
    ['storyTextInput', storyTextInput],
    ['storyStepsContainer', storyStepsContainer],
    ['storyGenerateBtn', storyGenerateBtn],
    ['storyMicBtn', storyMicBtn],
    ['rewardForm', rewardForm],
    ['rewardStorySelect', rewardStorySelect],
    ['rewardNameInput', rewardNameInput],
    ['rewardTargetSelect', rewardTargetSelect],
    ['rewardPopup', rewardPopup],
    ['rewardPopupImage', rewardPopupImage],
    ['rewardPopupText', rewardPopupText],
    ['rewardClose', rewardClose],
  ], 'Story and reward module')) {
    return;
  }
let stories = readStorage(storageKeys.stories, defaultData.stories);
let rewards = readStorage(storageKeys.rewards, defaultData.rewards);
let rewardProgress = readStorage(storageKeys.rewardProgress, defaultData.rewardProgress);
let rewardCelebrations = readStorage(storageKeys.rewardCelebrations, defaultData.rewardCelebrations);
let editingStoryId = null;
let editingRewardId = null;

hideElement(rewardPopup);

function renderStoryList() {
  storyList.innerHTML = '';
  stories.forEach((story, index) => {
    const storyCard = document.createElement('article');
    storyCard.className = 'story-card';
    storyCard.innerHTML = `<header><h3>${story.title}</h3></header>`;
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'story-steps';
    story.steps.forEach((step, stepIndex) => {
      const stepCard = document.createElement('div');
      stepCard.className = 'schedule-slide';
      stepCard.innerHTML = `<img src="${step.image}" alt="${step.text}"><p>${step.text}</p>`;
      const isLast = stepIndex === story.steps.length - 1;
      stepCard.addEventListener('click', () => {
        speak(step.text);
        if (isLast) {
          stepCard.classList.add('celebrate');
          setTimeout(() => stepCard.classList.remove('celebrate'), 900);
          setTimeout(() => speak('Great job!', { queue: true }), 500);
        }
      });
      stepCard.dataset.stepIndex = stepIndex;
      stepsContainer.appendChild(stepCard);
    });
    storyCard.appendChild(stepsContainer);

    const reward = rewards.find((r) => r.storyId === story.id);
    if (reward) {
      const rewardSection = document.createElement('section');
      rewardSection.innerHTML = `<h4>Reward: ${reward.name}</h4>`;
      const progress = rewardProgress[reward.id] || 0;
      const progressRow = document.createElement('div');
      progressRow.className = 'reward-progress';
      for (let i = 0; i < reward.target; i += 1) {
        const bubble = document.createElement('span');
        bubble.textContent = progress > i ? '⭐' : '☆';
        if (progress > i) bubble.classList.add('filled');
        bubble.dataset.index = i;
        bubble.dataset.rewardId = reward.id;
        progressRow.appendChild(bubble);
      }
      rewardSection.appendChild(progressRow);
      const buttonRow = document.createElement('div');
      buttonRow.className = 'button-row child-only';
      const stickerBtn = document.createElement('button');
      stickerBtn.className = 'primary';
      stickerBtn.textContent = 'Add sticker';
      stickerBtn.addEventListener('click', () => {
        addSticker(reward);
      });
      buttonRow.appendChild(stickerBtn);
      rewardSection.appendChild(buttonRow);
      const resetRow = document.createElement('div');
      resetRow.className = 'button-row parent-only';
      const resetBtn = document.createElement('button');
      resetBtn.className = 'secondary';
      resetBtn.textContent = 'Reset stickers';
      resetBtn.addEventListener('click', () => resetReward(reward));
      resetRow.appendChild(resetBtn);
      rewardSection.appendChild(resetRow);
      storyCard.appendChild(rewardSection);
    }

    const footer = document.createElement('footer');
    footer.className = 'button-row parent-only';
    footer.innerHTML = `<button class="secondary" data-story="${index}">Edit</button><button class="secondary" data-reward="${index}">Reward</button>`;
    storyCard.appendChild(footer);

    storyList.appendChild(storyCard);
  });
  updateRewardSelect();
}

function updateRewardSelect() {
  rewardStorySelect.innerHTML = stories.map((story) => `<option value="${story.id}">${story.title}</option>`).join('');
}

renderStoryList();

function startNewStory() {
  editingStoryId = null;
  editingRewardId = null;
  storyForm.reset();
  storyTextInput.value = '';
  storyStepsContainer.innerHTML = '';
  hideElement(rewardForm);
  showElement(storyForm);
  storyForm.scrollIntoView({ behavior: 'smooth' });
}

function createStoryStep(text, image) {
  const template = document.getElementById('storyStepTemplate');
  const stepNode = template.content.firstElementChild.cloneNode(true);
  stepNode.querySelector('textarea').value = text;
  stepNode.querySelector('img').src = image;
  stepNode.querySelector('img').alt = text;
  stepNode.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', 'dragging');
    stepNode.classList.add('dragging');
  });
  stepNode.addEventListener('dragend', () => stepNode.classList.remove('dragging'));
  stepNode.addEventListener('dragover', (event) => {
    event.preventDefault();
    const dragging = storyStepsContainer.querySelector('.dragging');
    if (dragging && dragging !== stepNode) {
      storyStepsContainer.insertBefore(dragging, stepNode);
    }
  });
  stepNode.querySelector('.step-up').addEventListener('click', () => {
    const prev = stepNode.previousElementSibling;
    if (prev) storyStepsContainer.insertBefore(stepNode, prev);
  });
  stepNode.querySelector('.step-down').addEventListener('click', () => {
    const next = stepNode.nextElementSibling;
    if (next) storyStepsContainer.insertBefore(next, stepNode);
  });
  stepNode.querySelector('input[type="file"]').addEventListener('change', async (event) => {
    if (event.target.files[0]) {
      const src = await readFileAsDataURL(event.target.files[0]);
      stepNode.querySelector('img').src = src;
    }
  });
  return stepNode;
}

function guessIcon(text) {
  const lowered = text.toLowerCase();
  if (lowered.includes('toilet') || lowered.includes('bathroom')) return iconSuggestions.toilet;
  if (lowered.includes('wash')) return iconSuggestions.wash;
  if (lowered.includes('eat') || lowered.includes('food')) return iconSuggestions.food;
  if (lowered.includes('drink') || lowered.includes('water')) return iconSuggestions.drink;
  if (lowered.includes('play')) return iconSuggestions.play;
  if (lowered.includes('help')) return iconSuggestions.help;
  if (lowered.includes('school')) return iconSuggestions.school;
  return 'assets/placeholder-generic.svg';
}

storyGenerateBtn.addEventListener('click', () => {
  const text = storyTextInput.value.trim();
  if (!text) return;
  storyStepsContainer.innerHTML = '';
  const steps = text.split(/[.!?\n]/).map((line) => line.trim()).filter(Boolean).slice(0, 6);
  if (steps.length < 3) {
    alert('Please provide at least 3 short sentences.');
    return;
  }
  steps.forEach((sentence) => {
    const icon = guessIcon(sentence);
    storyStepsContainer.appendChild(createStoryStep(sentence, icon));
  });
});

storyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = storyTitleInput.value.trim();
  if (!title) return;
  const steps = Array.from(storyStepsContainer.children).map((stepNode) => ({
    text: stepNode.querySelector('textarea').value.trim(),
    image: stepNode.querySelector('img').src
  })).filter((step) => step.text);
  if (!steps.length) {
    alert('Please add steps.');
    return;
  }
  if (editingStoryId) {
    const idx = stories.findIndex((s) => s.id === editingStoryId);
    if (idx !== -1) {
      stories[idx] = { id: editingStoryId, title, steps };
    }
  } else {
    stories.push({ id: `story-${Date.now()}`, title, steps });
  }
  writeStorage(storageKeys.stories, stories);
  renderStoryList();
  editingStoryId = null;
  storyForm.reset();
  storyStepsContainer.innerHTML = '';
  hideElement(storyForm);
});

rewardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const storyId = rewardStorySelect.value;
  const name = rewardNameInput.value.trim();
  const target = Number(rewardTargetSelect.value);
  if (!storyId || !name) return;
  let image = 'assets/placeholder-reward.svg';
  if (rewardImageInput.files[0]) image = await readFileAsDataURL(rewardImageInput.files[0]);
  if (editingRewardId) {
    const idx = rewards.findIndex((r) => r.id === editingRewardId);
    if (idx !== -1) {
      rewards[idx] = { id: editingRewardId, storyId, name, target, image };
      rewardProgress[editingRewardId] = Math.min(rewardProgress[editingRewardId] || 0, target);
      rewardCelebrations[editingRewardId] = Math.min(rewardCelebrations[editingRewardId] || 0, target);
    }
  } else {
    // Ensure only one reward per story
    const removedRewards = rewards.filter((r) => r.storyId === storyId);
    rewards = rewards.filter((r) => r.storyId !== storyId);
    removedRewards.forEach((existing) => {
      delete rewardProgress[existing.id];
      delete rewardCelebrations[existing.id];
    });
    const newReward = { id: `reward-${Date.now()}`, storyId, name, target, image };
    rewards.push(newReward);
    rewardProgress[newReward.id] = 0;
    rewardCelebrations[newReward.id] = 0;
  }
  writeStorage(storageKeys.rewards, rewards);
  writeStorage(storageKeys.rewardProgress, rewardProgress);
  writeStorage(storageKeys.rewardCelebrations, rewardCelebrations);
  renderStoryList();
  editingRewardId = null;
  rewardForm.reset();
  hideElement(rewardForm);
});

function addSticker(reward) {
  const current = rewardProgress[reward.id] || 0;
  if (current >= reward.target) return;
  rewardProgress[reward.id] = current + 1;
  writeStorage(storageKeys.rewardProgress, rewardProgress);
  renderStoryList();
  speak('Great job!');
  const total = rewardProgress[reward.id];
  if (total >= reward.target && rewardCelebrations[reward.id] !== total) {
    showElement(rewardPopup);
    rewardPopupImage.src = reward.image;
    rewardPopupText.textContent = reward.name;
    setTimeout(() => speak('You earned your reward!', { queue: true }), 600);
    rewardCelebrations[reward.id] = total;
    writeStorage(storageKeys.rewardCelebrations, rewardCelebrations);
  }
}

function resetReward(reward) {
  if (!parentMode) return;
  if (!confirm('Reset stickers for this reward?')) return;
  rewardProgress[reward.id] = 0;
  writeStorage(storageKeys.rewardProgress, rewardProgress);
  rewardCelebrations[reward.id] = 0;
  writeStorage(storageKeys.rewardCelebrations, rewardCelebrations);
  renderStoryList();
}

storyList.addEventListener('click', (event) => {
  if (event.target.dataset.story !== undefined) {
    const story = stories[Number(event.target.dataset.story)];
    if (!story) return;
    editingStoryId = story.id;
    storyTitleInput.value = story.title;
    storyTextInput.value = story.steps.map((step) => step.text).join('. ');
    storyStepsContainer.innerHTML = '';
    story.steps.forEach((step) => storyStepsContainer.appendChild(createStoryStep(step.text, step.image)));
    showElement(storyForm);
    storyForm.scrollIntoView({ behavior: 'smooth' });
    hideElement(rewardForm);
    editingRewardId = null;
  }
  if (event.target.dataset.reward !== undefined) {
    const story = stories[Number(event.target.dataset.reward)];
    if (!story) return;
    const reward = rewards.find((r) => r.storyId === story.id);
    rewardStorySelect.value = story.id;
    if (reward) {
      editingRewardId = reward.id;
      rewardNameInput.value = reward.name;
      rewardTargetSelect.value = reward.target;
    } else {
      editingRewardId = null;
      rewardForm.reset();
      rewardStorySelect.value = story.id;
    }
    showElement(rewardForm);
    rewardForm.scrollIntoView({ behavior: 'smooth' });
  }
});

rewardClose.addEventListener('click', () => hideElement(rewardPopup));
rewardPopup.addEventListener('click', (event) => {
  if (event.target === rewardPopup) hideElement(rewardPopup);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideElement(rewardPopup);
});

// ---------------------- Microphone for Story input ----------------------
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  recognition.interimResults = false;
  storyMicBtn.addEventListener('click', () => {
    recognition.start();
  });
  recognition.addEventListener('result', (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ');
    storyTextInput.value = transcript;
  });
} else {
  storyMicBtn.disabled = true;
  storyMicBtn.textContent = 'Mic not supported';
}

// ---------------------- Global Form toggles ----------------------
document.querySelectorAll('[data-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    switch (target) {
      case 'emotion':
        showElement(emotionForm);
        break;
      case 'need':
        showElement(needsForm);
        break;
      case 'nownext':
        showElement(nowNextForm);
        break;
      case 'story':
        startNewStory();
        break;
      default:
        break;
    }
  });
});

document.querySelectorAll('[data-close]').forEach((button) => {
  const targetId = button.dataset.close;
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    button.addEventListener('click', () => {
      hideElement(targetEl);
      if (targetId === 'storyForm') {
        editingStoryId = null;
        storyForm.reset();
        storyStepsContainer.innerHTML = '';
      }
      if (targetId === 'rewardForm') {
        editingRewardId = null;
        rewardForm.reset();
      }
    });
  }
});

  // Initially ensure forms hidden in child mode
  setParentMode(false);

  // Accessibility: speak card text on keyboard focus
  document.body.addEventListener('focusin', (event) => {
    if (event.target.classList.contains('card')) {
      const sentence = event.target.dataset.sentence || event.target.dataset.text;
      if (sentence) speak(sentence);
    }
  });

  // Provide instructions for extension in console
  console.info('OnYu SEN Communication Tool loaded. Use Parent Mode PIN 1234 to add custom cards.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
