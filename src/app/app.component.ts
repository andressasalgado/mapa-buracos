import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  map: any;
  buracos: any[] = []; // Array para armazenar os marcadores

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map = L.map('map').setView([latitude, longitude], 13);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(this.map);

          this.map.on('click', (e: any) => this.onMapClick(e));
        },
        () => this.fallbackMapInitialization()
      );
    } else {
      this.fallbackMapInitialization();
    }
  }

  private fallbackMapInitialization(): void {
    this.map = L.map('map').setView([-23.55052, -46.633308], 13); // São Paulo como fallback
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: any) => this.onMapClick(e));
  }

  private onMapClick(e: any): void {
    const latlng = e.latlng;
    const popupContent = this.createPopupContent(latlng);
    L.popup()
      .setLatLng(latlng)
      .setContent(popupContent)
      .openOn(this.map);
  }

  private createPopupContent(latlng: any): HTMLElement {
    const container = L.DomUtil.create('div');
    container.innerHTML = `
      <h4>Selecione a gravidade do buraco:</h4>
      <button id="low" style="background: yellow; width: 20px; height: 20px; border-radius: 50%;"></button>
      <button id="medium" style="background: orange; width: 20px; height: 20px; border-radius: 50%;"></button>
      <button id="high" style="background: red; width: 20px; height: 20px; border-radius: 50%;"></button>
    `;

    container.querySelector('#low')?.addEventListener('click', () => this.saveMarker(latlng, 'low'));
    container.querySelector('#medium')?.addEventListener('click', () => this.saveMarker(latlng, 'medium'));
    container.querySelector('#high')?.addEventListener('click', () => this.saveMarker(latlng, 'high'));

    return container;
  }

  private saveMarker(latlng: any, gravidade: string): void {
    const newMarker = {
      lat: latlng.lat,
      lng: latlng.lng,
      gravidade,
      status: 'ativo',
      upvote: 0,
      downvote: 0,
      lastInteraction: new Date().toISOString(),
    };

    this.buracos.push(newMarker); // Adiciona ao array
    this.updateMarkers();
    this.map.closePopup(); // Fecha o popup após salvar
  }

  private updateMarkers(): void {
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        this.map.removeLayer(layer);
      }
    });

    this.buracos.forEach((buraco) => this.addMarker(buraco));
  }

  private addMarker(buraco: any): void {
    const color = this.getMarkerColor(buraco.gravidade);
    const marker = L.circleMarker([buraco.lat, buraco.lng], {
      color,
      radius: this.getMarkerSize(buraco.gravidade),
    }).addTo(this.map);

    marker.bindPopup(this.createInteractionPopup(buraco));
  }

  private getMarkerColor(gravidade: string): string {
    switch (gravidade) {
      case 'low': return 'yellow';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'gray';
    }
  }

  private getMarkerSize(gravidade: string): number {
    switch (gravidade) {
      case 'low': return 5;
      case 'medium': return 7;
      case 'high': return 10;
      default: return 5;
    }
  }

  private createInteractionPopup(buraco: any): string {
    return `
      <h4>Buraco</h4>
      <p>Gravidade: ${buraco.gravidade}</p>
      <p>Status: ${buraco.status}</p>
      <button onclick="console.log('Upvote')">Upvote</button>
      <button onclick="console.log('Downvote')">Downvote</button>
    `;
  }
}
