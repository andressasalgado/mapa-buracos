import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

declare global {
  interface Window {
    upvote: (index: number) => void;
    downvote: (index: number) => void;
    app: AppComponent;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  map: any;
  buracos: any[] = [];

  ngOnInit(): void {
    window.app = this; // Disponibiliza o componente globalmente para os métodos upvote e downvote
    this.loadBuracos();
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
          this.updateMarkers();
        },
        () => this.fallbackMapInitialization()
      );
    } else {
      this.fallbackMapInitialization();
    }
  }

  private fallbackMapInitialization(): void {
    this.map = L.map('map').setView([-23.55052, -46.633308], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: any) => this.onMapClick(e));
    this.updateMarkers();
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

    this.buracos.push(newMarker);
    this.saveBuracos();
    this.updateMarkers();
    this.map.closePopup();
  }

  public updateMarkers(): void {
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        this.map.removeLayer(layer);
      }
    });

    this.buracos.forEach((buraco) => this.addMarker(buraco));
  }

  private addMarker(buraco: any): void {
    const color = this.getMarkerColor(buraco);
    const marker = L.circleMarker([buraco.lat, buraco.lng], {
      color,
      radius: this.getMarkerSize(buraco.gravidade),
    }).addTo(this.map);

    marker.bindPopup(this.createInteractionPopup(buraco));
  }

  private getMarkerColor(buraco: any): string {
    if (buraco.status === 'consertado') {
      return 'green';
    }

    switch (buraco.gravidade) {
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
      <p>Qtd upvote: ${buraco.upvote}</p>
      <button onclick="window.upvote(${this.buracos.indexOf(buraco)})">Upvote</button>
      <button onclick="window.downvote(${this.buracos.indexOf(buraco)})">Downvote</button>
    `;
  }

  public saveBuracos(): void {
    localStorage.setItem('buracos', JSON.stringify(this.buracos));
  }

  private loadBuracos(): void {
    const saved = localStorage.getItem('buracos');
    if (saved) {
      this.buracos = JSON.parse(saved);
    }
  }
}

window.upvote = function (index: number) {
  const buraco = window.app.buracos[index];
  buraco.upvote++;
  buraco.lastInteraction = new Date().toISOString();
  window.app.saveBuracos();
  window.app.updateMarkers();
};

window.downvote = function (index: number) {
  const buraco = window.app.buracos[index];
  buraco.downvote++;
  buraco.lastInteraction = new Date().toISOString();
  if (buraco.downvote >= 2) {
    buraco.status = 'consertado';
  }
  window.app.saveBuracos();
  window.app.updateMarkers();
};
