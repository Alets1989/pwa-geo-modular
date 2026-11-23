const attachButton = document.querySelector('#attach-location');
const confirmButton = document.querySelector('#confirm-location');
const explanationCard = document.querySelector('#permission-explanation');
const manualCard = document.querySelector('#manual-location');
const permissionHelp = document.querySelector('#permission-help');
const browserHelp = document.querySelector('#browser-help');
const statusMessage = document.querySelector('#status-message');
const resultCard = document.querySelector('#location-result');
const resultDetails = document.querySelector('#result-details');
const accuracyLabel = document.querySelector('#accuracy-label');
const zoneSelect = document.querySelector('#zone-select');
const saveZoneButton = document.querySelector('#save-zone');

function mostrarSelectorManual(motivo, permisoDenegado) {
  explanationCard.hidden = true;
  manualCard.hidden = false;
  permissionHelp.textContent = motivo || 'Puedes continuar sin compartir las coordenadas de tu dispositivo.';
  browserHelp.hidden = !permisoDenegado;
}

function adjuntarUbicacion() {
  statusMessage.textContent = 'Solicitando tu ubicación…';
  resultCard.hidden = true;

  obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000 })
    .then((ubicacion) => {
      manualCard.hidden = true;
      explanationCard.hidden = true;
      statusMessage.textContent = '';
      resultDetails.textContent =
        `Latitud ${ubicacion.latitud.toFixed(5)}, longitud ${ubicacion.longitud.toFixed(5)} · ±${ubicacion.precisionMetros} m`;
      accuracyLabel.textContent = ubicacion.precisionMetros < 30
        ? 'Precisión GPS Alta'
        : 'Ubicación Aproximada (Wi-Fi / IP)';
      accuracyLabel.classList.toggle('accuracy-high', ubicacion.precisionMetros < 30);
      resultCard.hidden = false;
    })
    .catch((error) => {
      statusMessage.textContent = error.message;
      mostrarSelectorManual(
        'No pudimos obtener tus coordenadas. Puedes elegir una zona para continuar.',
        error.message.toLowerCase().includes('permiso')
      );
    });
}

attachButton.addEventListener('click', () => {
  statusMessage.textContent = '';
  explanationCard.hidden = true;
  manualCard.hidden = true;
  resultCard.hidden = true;

  consultarEstadoPermisoGeo().then((estado) => {
    if (estado === 'granted') {
      adjuntarUbicacion();
    } else if (estado === 'prompt') {
      explanationCard.hidden = false;
    } else if (estado === 'denied') {
      mostrarSelectorManual(
        'El permiso de ubicación está bloqueado. Puedes continuar eligiendo tu zona.',
        true
      );
    }
  }).catch((error) => {
    statusMessage.textContent = `No pudimos consultar el permiso de ubicación: ${error.message}`;
    mostrarSelectorManual();
  });
});

confirmButton.addEventListener('click', () => {
  explanationCard.hidden = true;
  adjuntarUbicacion();
});

saveZoneButton.addEventListener('click', () => {
  if (!zoneSelect.value) {
    statusMessage.textContent = 'Selecciona una zona para continuar.';
    zoneSelect.focus();
    return;
  }

  resultDetails.textContent = `Zona seleccionada: ${zoneSelect.options[zoneSelect.selectedIndex].text}.`;
  accuracyLabel.textContent = 'Ubicación seleccionada manualmente';
  accuracyLabel.classList.remove('accuracy-high');
  resultCard.hidden = false;
  statusMessage.textContent = '';
  manualCard.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('No se pudo registrar el service worker:', error);
    });
  });
}
