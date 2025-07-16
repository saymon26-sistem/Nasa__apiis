// Configuración de la API
const NASA_API_KEY = 'YccK7v28gOsZAZE2LzSjdtFZu5nbY0XRSdQXCcd5';
const API_BASE_URL = 'https://api.nasa.gov/';
// Mapeo de endpoints de la NASA
const NASA_ENDPOINTS = {
    apod: {
        url: 'planetary/apod',
        description: 'Astronomy Picture of the Day',
        icon: '🖼️'
    },
    neows: {
        url: 'neo/rest/v1/feed',
        description: 'Near Earth Objects',
        icon: '☄️',
        params: { start_date: getFormattedDate(-7), end_date: getFormattedDate() }
    },
    epic: {
        url: 'EPIC/api/natural/images',
        description: 'Earth Polychromatic Imaging Camera',
        icon: '🌎'
    },
    rover: {
        url: 'mars-photos/api/v1/rovers/curiosity/photos',
        description: 'Mars Rover Photos',
        icon: '🧭',
        params: { sol: 1000, page: 1 }
    },
    donki: {
        url: 'DONKI/notifications',
        description: 'Space Weather Alerts',
        icon: '🌌',
        params: { startDate: getFormattedDate(-30), endDate: getFormattedDate() }
    }
};

// Función auxiliar para obtener fechas formateadas
function getFormattedDate(daysOffset = 0) {
    const date = new Date();
    if (daysOffset) date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

// Cargar contenido inicial
document.addEventListener('DOMContentLoaded', function() {
    // Cargar banner con APOD aleatorio
    loadRandomAPOD();
    
    // Cargar APOD por defecto
    loadNASAContent('apod');
    
    // Configurar event listeners para los botones de navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const apiId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            loadNASAContent(apiId);
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});

// Función para cargar contenido de la NASA
async function loadNASAContent(apiId) {
    const loader = document.getElementById('loader');
    const contentDiv = document.getElementById('nasa-content');
    
    // Mostrar loader y ocultar contenido
    loader.style.display = 'block';
    contentDiv.style.display = 'none';
    
    try {
        const endpoint = NASA_ENDPOINTS[apiId];
        const params = new URLSearchParams(endpoint.params || {});
        params.append('api_key', NASA_API_KEY);
        
        const response = await fetch(`${API_BASE_URL}${endpoint.url}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mostrar el contenido
        loader.style.display = 'none';
        contentDiv.style.display = 'block';
        displayNASAData(apiId, data);
        
    } catch (error) {
        console.error(`Error al cargar ${apiId}:`, error);
        loader.innerHTML = `
            <div style="color: var(--nasa-red);">
                <p>Error al cargar los datos</p>
                <p>${error.message}</p>
                <button onclick="loadNASAContent('${apiId}')" 
                        style="margin-top: 15px; padding: 8px 15px; 
                               background-color: var(--nasa-blue); 
                               color: white; border: none; 
                               border-radius: 4px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// Función para mostrar los datos de la NASA
function displayNASAData(apiId, data) {
    const contentDiv = document.getElementById('nasa-content');
    const endpoint = NASA_ENDPOINTS[apiId];
    
    // Crear título
    contentDiv.innerHTML = `
        <h1 class="nasa-data-title">
            ${endpoint.icon} ${endpoint.description}
        </h1>
    `;
    
    // Mostrar contenido según el tipo de API
    switch(apiId) {
        case 'apod':
            displayAPOD(data);
            break;
        case 'neows':
            displayAsteroids(data);
            break;
        case 'epic':
            displayEPIC(data);
            break;
        case 'rover':
            displayRoverPhotos(data);
            break;
        case 'donki':
            displaySpaceWeather(data);
            break;
        default:
            displayRawData(data);
    }
}

// Función para mostrar APOD
function displayAPOD(data) {
    const apod = Array.isArray(data) ? data[0] : data;
    const contentDiv = document.getElementById('nasa-content');
    
    let mediaContent = '';
    if (apod.media_type === 'image') {
        mediaContent = `<img src="${apod.url}" alt="${apod.title}" class="apod-image">`;
    } else {
        mediaContent = `<iframe src="${apod.url}" class="apod-video" allowfullscreen></iframe>`;
    }
    
    contentDiv.innerHTML += `
        <div class="apod-container">
            ${mediaContent}
            <p class="apod-date">Fecha: ${apod.date}</p>
            ${apod.copyright ? `<p class="apod-copyright">© ${apod.copyright}</p>` : ''}
            <h2>${apod.title}</h2>
            <p class="apod-explanation">${apod.explanation}</p>
        </div>
    `;
}

// Función para mostrar asteroides (NEOWS)
function displayAsteroids(data) {
    const contentDiv = document.getElementById('nasa-content');
    const dates = Object.keys(data.near_earth_objects);
    const mostRecentDate = dates[dates.length - 1];
    const asteroids = data.near_earth_objects[mostRecentDate];
    
    contentDiv.innerHTML += `
        <p>Mostrando ${asteroids.length} asteroides cercanos para ${mostRecentDate}</p>
        <div class="asteroids-list" id="asteroids-container"></div>
    `;
    
    const container = document.getElementById('asteroids-container');
    asteroids.slice(0, 20).forEach(asteroid => {
        const approach = asteroid.close_approach_data[0];
        const isHazardous = asteroid.is_potentially_hazardous_asteroid;
        
        container.innerHTML += `
            <div class="asteroid-card">
                <h3>${asteroid.name}</h3>
                <p><strong>Diámetro:</strong> 
                   ${Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min)} - 
                   ${Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max)} metros</p>
                <p><strong>Distancia:</strong> 
                   ${Math.round(approach.miss_distance.kilometers)} km</p>
                <p><strong>Velocidad:</strong> 
                   ${Math.round(approach.relative_velocity.kilometers_per_second)} km/s</p>
                <p><strong>Peligroso:</strong> 
                   <span class="${isHazardous ? 'hazardous' : 'safe'}">
                       ${isHazardous ? 'Sí ⚠️' : 'No ✓'}
                   </span></p>
            </div>
        `;
    });
}

// Función para mostrar imágenes EPIC de la Tierra
function displayEPIC(data) {
    const contentDiv = document.getElementById('nasa-content');
    
    contentDiv.innerHTML += `
        <p>Mostrando ${data.length} imágenes recientes de la Tierra</p>
        <div class="epic-grid" id="epic-container"></div>
    `;
    
    const container = document.getElementById('epic-container');
    data.slice(0, 12).forEach(image => {
        const date = new Date(image.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${image.image}.jpg`;
        
        container.innerHTML += `
            <div class="epic-card">
                <img src="${imageUrl}" alt="EPIC ${image.image}" class="epic-image">
                <div class="epic-info">
                    <p><strong>Fecha:</strong> ${date.toLocaleDateString()}</p>
                    <p><strong>Coordenadas:</strong> 
                       Lat: ${image.centroid_coordinates.lat.toFixed(2)}°, 
                       Lon: ${image.centroid_coordinates.lon.toFixed(2)}°</p>
                </div>
            </div>
        `;
    });
}

// Función para mostrar fotos del Rover Marciano
function displayRoverPhotos(data) {
    const contentDiv = document.getElementById('nasa-content');
    const photos = data.photos;
    
    contentDiv.innerHTML += `
        <p>Mostrando ${photos.length} fotos del Mars Rover Curiosity</p>
        <div class="rover-grid" id="rover-container"></div>
    `;
    
    const container = document.getElementById('rover-container');
    photos.slice(0, 12).forEach(photo => {
        container.innerHTML += `
            <div class="rover-card">
                <img src="${photo.img_src}" alt="Mars photo" class="rover-image">
                <div class="rover-info">
                    <p class="camera-name">${photo.camera.full_name}</p>
                    <p><strong>Sol:</strong> ${photo.sol}</p>
                    <p><strong>Fecha terrestre:</strong> ${photo.earth_date}</p>
                </div>
            </div>
        `;
    });
}

// Función para mostrar alertas de clima espacial (DONKI)
function displaySpaceWeather(data) {
    const contentDiv = document.getElementById('nasa-content');
    
    if (data.length === 0) {
        contentDiv.innerHTML += `<p>No hay alertas de clima espacial recientes.</p>`;
        return;
    }
    
    contentDiv.innerHTML += `
        <p>Mostrando ${data.length} alertas recientes de clima espacial</p>
        <div class="donki-list" id="donki-container"></div>
    `;
    
    const container = document.getElementById('donki-container');
    data.slice(0, 10).forEach(alert => {
        const date = new Date(alert.messageIssueTime);
        
        container.innerHTML += `
            <div class="donki-card">
                <h3>${alert.messageType}</h3>
                <p><strong>Fecha:</strong> ${date.toLocaleString()}</p>
                <p>${alert.messageBody.substring(0, 200)}...</p>
                <a href="${alert.messageURL}" target="_blank" style="color: var(--nasa-blue);">Leer más</a>
            </div>
        `;
    });
}

// Función para mostrar datos en bruto (para desarrollo)
function displayRawData(data) {
    const contentDiv = document.getElementById('nasa-content');
    contentDiv.innerHTML += `
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
            ${JSON.stringify(data, null, 2)}
        </pre>
    `;
}

// Función para cargar un APOD aleatorio para el banner
async function loadRandomAPOD() {
    try {
        const response = await fetch(`${API_BASE_URL}planetary/apod?api_key=${NASA_API_KEY}&count=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const apod = data[0];
            const banner = document.getElementById('nasa-banner');
            const dateElement = document.getElementById('nasa-banner-date');
            
            banner.style.backgroundImage = `url('${apod.hdurl || apod.url}')`;
            dateElement.textContent = `${apod.title} - ${apod.date}`;
            
            if (apod.copyright) {
                dateElement.textContent += ` © ${apod.copyright}`;
            }
        }
    } catch (error) {
        console.error('Error al cargar APOD para el banner:', error);
    }
}