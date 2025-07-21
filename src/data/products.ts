import { Product } from '../types';

export const products: Product[] = [
  {
    id: 'hbo-max',
    name: 'HBO Max 30 Días',
    category: 'STREAMING',
    price: 6000,
    originalPrice: 7000,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=300&fit=crop',
    description: 'Acceso completo a HBO Max por 30 días',
    duration: '30 días'
  },
  {
    id: 'paramount',
    name: 'Paramount Premium',
    category: 'STREAMING',
    price: 3000,
    originalPrice: 4000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1489599511331-c7d8b2b3c7a2?w=400&h=300&fit=crop',
    description: 'Paramount+ Premium por 30 días',
    duration: '30 días'
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll 30 Días',
    category: 'ANIME',
    price: 3000,
    originalPrice: 4000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    description: 'Acceso premium a Crunchyroll',
    duration: '30 días'
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium 1 Mes',
    category: 'STREAMING',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop',
    description: 'YouTube Premium sin anuncios',
    duration: '1 mes'
  },
  {
    id: 'disney-plus',
    name: 'Disney Plus 30 Días',
    category: 'STREAMING',
    price: 4000,
    originalPrice: 6000,
    discount: 33,
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=300&fit=crop',
    description: 'Disney+ Standard por 30 días',
    duration: '30 días'
  },
  {
    id: 'vix-plus',
    name: 'ViX+ Premium',
    category: 'STREAMING',
    price: 2500,
    originalPrice: 3500,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop',
    description: 'ViX+ acceso premium',
    duration: '30 días'
  },
  {
    id: 'plex',
    name: 'Plex Premium',
    category: 'STREAMING',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop',
    description: 'Plex Premium Pass',
    duration: '30 días'
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    category: 'MÚSICA',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    description: 'Spotify Premium sin anuncios',
    duration: '30 días'
  },
  {
    id: 'iptv',
    name: 'IPTV Premium',
    category: 'TV',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
    description: 'IPTV con canales premium',
    duration: '30 días'
  }
];