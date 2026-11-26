const phone = document.querySelector('.check-in-phone');
const disc = phone.querySelector('.check-in-disc');
const caption = phone.querySelector('.check-in-caption');
const ring = phone.querySelector('.check-in-ring');
const orbit = phone.querySelector('.check-in-choices');
const choices = Array.from(orbit.querySelectorAll('.check-in-choice'));
const composer = phone.querySelector('.check-in-note');
const note = composer.querySelector('textarea');
const status = phone.querySelector('.check-in-status');

let selected;
let turns = 0;

function showPhase(phase) {
    phone.dataset.phase = phase;
    orbit.inert = phase !== 'choose' && phase !== 'entry';
    composer.inert = phase !== 'entry';

    for (const choice of choices) {
        choice.inert = phase === 'entry' && choice !== selected;
        choice.setAttribute('aria-pressed', String(choice === selected));
    }

    const action = selected ? 'Save check-in' : 'Add mood';
    disc.setAttribute('aria-label', action);
    caption.textContent = action;
    if (selected) {
        disc.removeAttribute('aria-expanded');
    } else {
        disc.setAttribute('aria-expanded', String(phase === 'choose'));
    }
}

orbit.addEventListener('click', event => {
    const choice = event.target.closest('.check-in-choice');
    if (!choice) return;

    selected = selected === choice ? undefined : choice;
    showPhase(selected ? 'entry' : 'choose');
});

phone.addEventListener('submit', async event => {
    event.preventDefault();

    switch (phone.dataset.phase) {
        case 'idle':
            status.textContent = '';
            turns += 1;
            disc.style.setProperty('--check-in-turn', `${turns}turn`);
            showPhase('choose');
            choices[0].focus({ preventScroll: true });
            return;
        case 'choose':
            showPhase('idle');
            return;
        case 'confirm':
            return;
    }

    disc.focus({ preventScroll: true });
    showPhase('confirm');
    await Promise.allSettled(ring.getAnimations().map(animation => animation.finished));

    note.value = '';
    selected = undefined;
    showPhase('idle');
    status.textContent = 'Check-in complete.';
});

phone.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;

    if (phone.dataset.phase === 'entry') {
        const choice = selected;
        selected = undefined;
        showPhase('choose');
        choice.focus({ preventScroll: true });
        event.preventDefault();
    } else if (phone.dataset.phase === 'choose') {
        showPhase('idle');
        disc.focus({ preventScroll: true });
        event.preventDefault();
    }
});

document.querySelector('.check-in-demo-fallback').hidden = true;
document.querySelector('.check-in-interactive').hidden = false;
