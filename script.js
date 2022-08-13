'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDecription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${
      this.type[0].toUpperCase() + this.type.substring(1)
    } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDecription();
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDecription();
    }

    calcSpeed() {
        // km/hr
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run = new Running([39, -12], 5.2, 24, 170);
// const cycle = new Cycling([39, -12], 27, 95, 523);
// console.log(run, cycle);

////////////////////////////////////////////////
// Application Architecture
class App {
    _map;
    _mapEvent;
    _workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
                alert('Could not get your position');
            });
    }

    _loadMap(pos) {
        const { latitude } = pos.coords;
        const { longitude } = pos.coords;
        console.log(latitude, longitude);

        const coords = [latitude, longitude];

        this._map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this._map);

        // Handling clicks on map
        this._map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        this._mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const isValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this._mapEvent.latlng;
        let workout;

        // If workout is running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Check if data is valid
            if (!isValid(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be postive numbers');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // If workout is cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!isValid(distance, duration, elevation) ||
                !allPositive(distance, duration)
            )
                return alert('Inputs have to be postive numbers');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add new object to workout array
        this._workouts.push(workout);
        console.log(workout);

        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide formm + Clear input fields
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
            '';
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this._map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent('workout')
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}s">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

        if (workout.type === 'running')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(
                      1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`;

        if (workout.type === 'cycling')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                      1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`;

        form.insertAdjacentHTML('afterend', html);
    }
}

const app = new App();