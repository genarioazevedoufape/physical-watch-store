const calcularDistancia = (coordenadas1, coordenadas2) => {
    const R = 6371; // Raio da Terra em km
  
    const dLat = toRad(coordenadas2.latitude - coordenadas1.latitude);
    const dLon = toRad(coordenadas2.longitude - coordenadas1.longitude);
  
    const lat1 = toRad(coordenadas1.latitude);
    const lat2 = toRad(coordenadas2.latitude);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distancia = R * c; // Distância em km
    return distancia;
  };
  
  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };
  
  module.exports = { calcularDistancia };
  