'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10)
    clicks = 0;

    constructor (coords, distance, duration){
        // this.date = new Date()
        // this.id = ...
        this.coords = coords;
        this.distance = distance; //Kilometers
        this.duration = duration; //Minutes
        

    }

    _setDescription () {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click() {
        this.clicks ++;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence; // An array of latitude and longitude 
        this.calcPace()
        this._setDescription()

    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this._setDescription()
        this.calcSpeed()
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178)
// const cycle1 = new Cycling([39, -12], 27, 95, 523)
// console.log(run1, cycle1);



// Class Application Architecture


let map, mapEvent;


// Class Application Architecture
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];


    constructor() {
        // Get Users Position
        this._getPosition();

        // Get Data From Local Storage
        this._getLocalStorage();

        // Attach Event Handlers
        form.addEventListener('submit', this._newWorkout.bind(this))
        
        inputType.addEventListener('change', this._toggleElevationField);

        containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
    }

    _getPosition() {


        if(navigator.geolocation)
navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
    alert('Could Not Get Your Current Location');
})


    }

    _loadMap(position) {
        
            const {latitude} = position.coords;
            const {longitude} = position.coords;
        
            console.log(latitude, longitude);
            console.log(`https://www.google.fr/hot/maps/@${latitude},${longitude}`);
        
            const coords = [latitude, longitude];
        
         this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        //  Rendering Map Markers from Storage

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        })
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        // Handling Clicks On Map
        this.#map.on('click', this._showForm.bind(this))
    }



    _showForm(mapE) {

        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    
    }

    _hideForm () {

        // Empty the inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden')
        setTimeout(() => form.style.display = 'grid', 1000);

    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    
    }

    _newWorkout(e) {


        
        const inputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        // Getting Data From
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        if(type === 'running') {
            const cadence = +inputCadence.value;
            if(
                //     !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)
                !inputValid(distance, duration, cadence) || !positiveInputs(distance, duration, cadence)
                ) return alert('inputs need to be positive numbers');

                 workout = new Running([lat, lng], distance, duration, cadence);
                this.#workouts.push(workout);
            }
             
        if(type === 'cycling') {
            const elevation = +inputElevation.value;

            if(!inputValid(distance, duration, elevation) || !positiveInputs(distance, duration, elevation)
            ) return alert('inputs need to be positive numbers');
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        

        // Render workout market

        this._renderWorkoutMarker(workout)

        // Render Workout on List
        this._renderWorkout(workout)
        // mapEvent = mapEE;
        form.classList.remove('hidden');
        inputDistance.focus();

        this.#workouts.push(workout)
        console.log(workout);
    
        this._hideForm()


        // Set Local Storage to All Workouts
        this._setLocalStorage();
      
    

    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
            
        }))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup()
    }

    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if(workout.type === 'running') 
        html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`

    if(workout.type === 'cycling') 
    html += ` <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevation}</span>
    <span class="workout__unit">m</span>
  </div>
</li>`
    
form.insertAdjacentHTML('afterend', html)
    }

    _moveToPopUp (e) {
        const workoutEl = e.target.closest('.workout');
        
        console.log(workoutEl);

        if(!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        })

        // Using the public interface

        // workout.click();
    }

    _setLocalStorage() {

        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
       const data = JSON.parse(localStorage.getItem('workouts'));
       console.log(data);

       if(!data) return;

       this.#workouts = data;

       this.#workouts.forEach(work => {
           this._renderWorkout(work)
       })
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}


const app = new App();



// form.addEventListener('submit', function (mapEE) {
//     mapEE.preventDefault();

//     inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

//     // mapEvent = mapEE;
//     console.log(mapEvent);
//     form.classList.remove('hidden');
//     inputDistance.focus();

//     const {lat, lng} = mapEvent.latlng;
//     console.log(lat, lng);
    
//     L.marker([lat, lng]).addTo(map)
//     .bindPopup(L.popup({
//         maxWidth: 250,
//         minWidth: 100,
//         autoClose: false,
//         closeOnClick: false,
//         className: 'running-popup'
        
//     }))
//     .setPopupContent('Hello World')
//     .openPopup()
    
// })





 
