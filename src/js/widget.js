// src/js/widget.js
class SolarQuoteWidget {
    constructor(options = {}) {
      this.options = {
        containerId: 'solar-quote-widget',
        apiKey: null,
        primaryColor: '#4CAF50',
        accentColor: '#FFC107',
        darkColor: '#333',
        fontSize: '16px',
        borderRadius: '8px',
        ...options
      };
      
      this.currentStep = 1;
      this.totalSteps = 8;
      this.data = {};
      this.map = null;
      this.marker = null;
      this.geocoder = null;
      
      // Initialize the widget
      this.init();
    }
    
    init() {
      // Create container if it doesn't exist
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        console.error(`Container with ID "${this.options.containerId}" not found.`);
        return;
      }
      
      // Add widget class to container
      this.container.classList.add('solar-quote-widget');
      
      // Apply custom styles
      this.applyCustomStyles();
      
      // Build the widget HTML
      this.buildWidgetHtml();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load Google Maps API
      this.loadGoogleMapsApi();
    }
    
    applyCustomStyles() {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        #${this.options.containerId} {
          --primary-color: ${this.options.primaryColor};
          --accent-color: ${this.options.accentColor};
          --dark-color: ${this.options.darkColor};
          --font-size: ${this.options.fontSize};
          --border-radius: ${this.options.borderRadius};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    buildWidgetHtml() {
      // Simplified version - in actual implementation, this would be more comprehensive
      this.container.innerHTML = `
        <div class="sq-widget-container">
          <div class="sq-progress-bar">
            <div class="sq-progress-fill" style="width: 12.5%"></div>
          </div>
          
          <div class="sq-form-steps">
            <!-- Step 1: Address -->
            <div class="sq-step sq-step-1 sq-active">
              <h2>Where would you like to install solar panels?</h2>
              <div class="sq-row">
                <div class="sq-col">
                  <label for="sq-address">Enter your full address</label>
                  <input type="text" id="sq-address" placeholder="123 Main St, City, State, Zip">
                  <button id="sq-find-address" class="sq-btn sq-primary-btn">Find My Address</button>
                </div>
                <div class="sq-col">
                  <div id="sq-map"></div>
                </div>
              </div>
              
              <div id="sq-confirm-address" class="sq-confirm-box" style="display: none;">
                <p>Is this your correct address?</p>
                <p id="sq-confirmed-address" class="sq-address-text"></p>
                <div class="sq-btn-group">
                  <button id="sq-confirm-yes" class="sq-btn sq-success-btn">Yes, that's correct</button>
                  <button id="sq-confirm-no" class="sq-btn sq-secondary-btn">No, let me correct it</button>
                </div>
              </div>
              
              <div id="sq-sunroof-data" class="sq-sunroof-box" style="display: none;">
                <!-- Sunroof data content -->
              </div>
            </div>
            
            <!-- Additional steps would be included here -->
          </div>
        </div>
      `;
    }
    
    setupEventListeners() {
      // Find address button
      const findAddressBtn = document.getElementById('sq-find-address');
      if (findAddressBtn) {
        findAddressBtn.addEventListener('click', () => this.findAddress());
      }
      
      // Address confirmation buttons
      const confirmYesBtn = document.getElementById('sq-confirm-yes');
      if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', () => this.confirmAddress());
      }
      
      const confirmNoBtn = document.getElementById('sq-confirm-no');
      if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', () => this.rejectAddress());
      }
    }
    
    loadGoogleMapsApi() {
      if (!this.options.apiKey) {
        console.error('Google Maps API key is required.');
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.options.apiKey}&libraries=places&callback=initSolarWidgetMap`;
      script.async = true;
      script.defer = true;
      
      // Add global callback
      window.initSolarWidgetMap = () => this.initMap();
      
      // Append to document
      document.head.appendChild(script);
    }
    
    initMap() {
      const mapElement = document.getElementById('sq-map');
      if (!mapElement) return;
      
      // Create map instance
      this.map = new google.maps.Map(mapElement, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
      });
      
      // Create geocoder
      this.geocoder = new google.maps.Geocoder();
      
      // Initialize autocomplete
      const addressInput = document.getElementById('sq-address');
      if (addressInput) {
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        });
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            this.handlePlaceSelection(place);
          }
        });
      }
    }
    
    findAddress() {
      const addressInput = document.getElementById('sq-address');
      const address = addressInput ? addressInput.value.trim() : '';
      
      if (!address) {
        alert('Please enter your address.');
        return;
      }
      
      // Use geocoder to find address
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const result = results[0];
          const location = result.geometry.location;
          
          // Store address data
          this.data.address = {
            formatted: result.formatted_address,
            lat: location.lat(),
            lng: location.lng(),
            placeId: result.place_id
          };
          
          // Update map and show confirmation
          this.updateMap(location.lat(), location.lng());
          this.showAddressConfirmation(result.formatted_address);
        } else {
          alert('Could not find that address. Please try again.');
        }
      });
    }
    
    handlePlaceSelection(place) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      // Store address data
      this.data.address = {
        formatted: place.formatted_address,
        lat,
        lng,
        placeId: place.place_id
      };
      
      // Update map and show confirmation
      this.updateMap(lat, lng);
      this.showAddressConfirmation(place.formatted_address);
    }
    
    updateMap(lat, lng) {
      // Clear existing marker
      if (this.marker) {
        this.marker.setMap(null);
      }
      
      // Center map
      this.map.setCenter({ lat, lng });
      this.map.setZoom(18);
      
      // Add marker
      this.marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        animation: google.maps.Animation.DROP
      });
    }
    
    showAddressConfirmation(address) {
      const confirmAddressEl = document.getElementById('sq-confirm-address');
      const confirmedAddressEl = document.getElementById('sq-confirmed-address');
      
      if (confirmAddressEl && confirmedAddressEl) {
        confirmedAddressEl.textContent = address;
        confirmAddressEl.style.display = 'block';
      }
    }
    
    confirmAddress() {
      // Show sunroof data
      const sunroofDataEl = document.getElementById('sq-sunroof-data');
      if (sunroofDataEl) {
        sunroofDataEl.style.display = 'block';
        
        // Get solar potential data
        this.getSolarPotentialData()
          .then(data => {
            // Update UI with solar data
            this.updateSunroofData(data);
            
            // Proceed to next step after delay
            setTimeout(() => this.showStep(2), 2000);
          });
      }
    }
    
    rejectAddress() {
      // Clear address input
      const addressInput = document.getElementById('sq-address');
      if (addressInput) {
        addressInput.value = '';
      }
      
      // Hide confirmation
      const confirmAddressEl = document.getElementById('sq-confirm-address');
      if (confirmAddressEl) {
        confirmAddressEl.style.display = 'none';
      }
      
      // Clear marker
      if (this.marker) {
        this.marker.setMap(null);
        this.marker = null;
      }
    }
    
    getSolarPotentialData() {
      return new Promise(resolve => {
        // Simulate API call
        setTimeout(() => {
          resolve({
            sunlightHours: 1850,
            roofArea: 780,
            systemSize: 6.5,
            viablePercentage: 85,
            savings: '$18,000 - $25,000',
            environmentalImpact: 'Equivalent to planting 150 trees',
            carbonReduction: '9 metric tons yearly'
          });
        }, 1500);
      });
    }
    
    updateSunroofData(data) {
      // Update UI with solar data (simplified)
      const sunroofDataEl = document.getElementById('sq-sunroof-data');
      if (sunroofDataEl) {
        sunroofDataEl.innerHTML = `
          <h3>Solar Potential for Your Roof</h3>
          <div class="sq-sunroof-details">
            <p>Usable sunlight per year: ${data.sunlightHours} hours</p>
            <p>Usable roof area: ${data.roofArea} sq ft</p>
            <p>Recommended system size: ${data.systemSize} kW</p>
            <p>Potential savings: ${data.savings} over 20 years</p>
          </div>
        `;
      }
    }
    
    showStep(stepNumber) {
      // Hide all steps
      const steps = document.querySelectorAll('.sq-step');
      steps.forEach(step => {
        step.classList.remove('sq-active');
      });
      
      // Show requested step
      const nextStep = document.querySelector(`.sq-step-${stepNumber}`);
      if (nextStep) {
        nextStep.classList.add('sq-active');
        this.currentStep = stepNumber;
        this.updateProgressBar();
      }
    }
    
    updateProgressBar() {
      const progressFill = document.querySelector('.sq-progress-fill');
      if (progressFill) {
        const progress = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progress}%`;
      }
    }
  }
  
  // Export the widget
  window.SolarQuoteWidget = SolarQuoteWidget;