// Major cities in African countries for delivery
export interface AfricanCity {
  name: string;
  region: string;
  countryCode: string;
  isCapital?: boolean;
  deliveryZone: 'urban' | 'suburban' | 'rural';
  estimatedDays: { min: number; max: number };
}

export const africanCities: Record<string, AfricanCity[]> = {
  // Senegal
  SN: [
    { name: 'Dakar', region: 'Dakar', countryCode: 'SN', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Pikine', region: 'Dakar', countryCode: 'SN', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Guédiawaye', region: 'Dakar', countryCode: 'SN', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Thiès', region: 'Thiès', countryCode: 'SN', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Saint-Louis', region: 'Saint-Louis', countryCode: 'SN', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Kaolack', region: 'Kaolack', countryCode: 'SN', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Ziguinchor', region: 'Ziguinchor', countryCode: 'SN', deliveryZone: 'rural', estimatedDays: { min: 3, max: 5 } },
    { name: 'Touba', region: 'Diourbel', countryCode: 'SN', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Mbour', region: 'Thiès', countryCode: 'SN', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Rufisque', region: 'Dakar', countryCode: 'SN', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
  ],

  // Ivory Coast
  CI: [
    { name: 'Abidjan', region: 'Abidjan', countryCode: 'CI', isCapital: false, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Yamoussoukro', region: 'Lacs', countryCode: 'CI', isCapital: true, deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Bouaké', region: 'Vallée du Bandama', countryCode: 'CI', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'San-Pédro', region: 'Bas-Sassandra', countryCode: 'CI', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Korhogo', region: 'Savanes', countryCode: 'CI', deliveryZone: 'rural', estimatedDays: { min: 3, max: 5 } },
    { name: 'Man', region: 'Montagnes', countryCode: 'CI', deliveryZone: 'rural', estimatedDays: { min: 3, max: 5 } },
    { name: 'Daloa', region: 'Haut-Sassandra', countryCode: 'CI', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Gagnoa', region: 'Gôh', countryCode: 'CI', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
  ],

  // Cameroon
  CM: [
    { name: 'Douala', region: 'Littoral', countryCode: 'CM', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Yaoundé', region: 'Centre', countryCode: 'CM', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Garoua', region: 'Nord', countryCode: 'CM', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Bamenda', region: 'Nord-Ouest', countryCode: 'CM', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Maroua', region: 'Extrême-Nord', countryCode: 'CM', deliveryZone: 'rural', estimatedDays: { min: 4, max: 7 } },
    { name: 'Bafoussam', region: 'Ouest', countryCode: 'CM', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Ngaoundéré', region: 'Adamaoua', countryCode: 'CM', deliveryZone: 'rural', estimatedDays: { min: 3, max: 5 } },
    { name: 'Kribi', region: 'Sud', countryCode: 'CM', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
  ],

  // Nigeria
  NG: [
    { name: 'Lagos', region: 'Lagos', countryCode: 'NG', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Abuja', region: 'FCT', countryCode: 'NG', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Kano', region: 'Kano', countryCode: 'NG', deliveryZone: 'urban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Ibadan', region: 'Oyo', countryCode: 'NG', deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Port Harcourt', region: 'Rivers', countryCode: 'NG', deliveryZone: 'urban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Benin City', region: 'Edo', countryCode: 'NG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Kaduna', region: 'Kaduna', countryCode: 'NG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Enugu', region: 'Enugu', countryCode: 'NG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
  ],

  // Ghana
  GH: [
    { name: 'Accra', region: 'Greater Accra', countryCode: 'GH', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Kumasi', region: 'Ashanti', countryCode: 'GH', deliveryZone: 'urban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Tamale', region: 'Northern', countryCode: 'GH', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Tema', region: 'Greater Accra', countryCode: 'GH', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Cape Coast', region: 'Central', countryCode: 'GH', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Sekondi-Takoradi', region: 'Western', countryCode: 'GH', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
  ],

  // Kenya
  KE: [
    { name: 'Nairobi', region: 'Nairobi', countryCode: 'KE', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Mombasa', region: 'Coast', countryCode: 'KE', deliveryZone: 'urban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Kisumu', region: 'Nyanza', countryCode: 'KE', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Nakuru', region: 'Rift Valley', countryCode: 'KE', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Eldoret', region: 'Rift Valley', countryCode: 'KE', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Thika', region: 'Central', countryCode: 'KE', deliveryZone: 'suburban', estimatedDays: { min: 1, max: 3 } },
  ],

  // Morocco
  MA: [
    { name: 'Casablanca', region: 'Casablanca-Settat', countryCode: 'MA', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Rabat', region: 'Rabat-Salé-Kénitra', countryCode: 'MA', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Marrakech', region: 'Marrakech-Safi', countryCode: 'MA', deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Fès', region: 'Fès-Meknès', countryCode: 'MA', deliveryZone: 'urban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma', countryCode: 'MA', deliveryZone: 'urban', estimatedDays: { min: 2, max: 3 } },
    { name: 'Agadir', region: 'Souss-Massa', countryCode: 'MA', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Oujda', region: 'Oriental', countryCode: 'MA', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Meknès', region: 'Fès-Meknès', countryCode: 'MA', deliveryZone: 'urban', estimatedDays: { min: 2, max: 3 } },
  ],

  // South Africa
  ZA: [
    { name: 'Johannesburg', region: 'Gauteng', countryCode: 'ZA', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Cape Town', region: 'Western Cape', countryCode: 'ZA', deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Durban', region: 'KwaZulu-Natal', countryCode: 'ZA', deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Pretoria', region: 'Gauteng', countryCode: 'ZA', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Port Elizabeth', region: 'Eastern Cape', countryCode: 'ZA', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Bloemfontein', region: 'Free State', countryCode: 'ZA', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
  ],

  // Mali
  ML: [
    { name: 'Bamako', region: 'Bamako', countryCode: 'ML', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Sikasso', region: 'Sikasso', countryCode: 'ML', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Ségou', region: 'Ségou', countryCode: 'ML', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Mopti', region: 'Mopti', countryCode: 'ML', deliveryZone: 'rural', estimatedDays: { min: 4, max: 7 } },
    { name: 'Kayes', region: 'Kayes', countryCode: 'ML', deliveryZone: 'rural', estimatedDays: { min: 4, max: 7 } },
  ],

  // Burkina Faso
  BF: [
    { name: 'Ouagadougou', region: 'Centre', countryCode: 'BF', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 3 } },
    { name: 'Bobo-Dioulasso', region: 'Hauts-Bassins', countryCode: 'BF', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Koudougou', region: 'Centre-Ouest', countryCode: 'BF', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Ouahigouya', region: 'Nord', countryCode: 'BF', deliveryZone: 'rural', estimatedDays: { min: 3, max: 5 } },
  ],

  // Benin
  BJ: [
    { name: 'Cotonou', region: 'Littoral', countryCode: 'BJ', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Porto-Novo', region: 'Ouémé', countryCode: 'BJ', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Parakou', region: 'Borgou', countryCode: 'BJ', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Abomey-Calavi', region: 'Atlantique', countryCode: 'BJ', deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
  ],

  // Togo
  TG: [
    { name: 'Lomé', region: 'Maritime', countryCode: 'TG', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 1, max: 2 } },
    { name: 'Sokodé', region: 'Centrale', countryCode: 'TG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Kara', region: 'Kara', countryCode: 'TG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Atakpamé', region: 'Plateaux', countryCode: 'TG', deliveryZone: 'suburban', estimatedDays: { min: 2, max: 3 } },
  ],

  // Niger
  NE: [
    { name: 'Niamey', region: 'Niamey', countryCode: 'NE', isCapital: true, deliveryZone: 'urban', estimatedDays: { min: 2, max: 4 } },
    { name: 'Zinder', region: 'Zinder', countryCode: 'NE', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Maradi', region: 'Maradi', countryCode: 'NE', deliveryZone: 'suburban', estimatedDays: { min: 3, max: 5 } },
    { name: 'Tahoua', region: 'Tahoua', countryCode: 'NE', deliveryZone: 'rural', estimatedDays: { min: 4, max: 7 } },
  ],
};

// Get cities for a country
export function getCitiesForCountry(countryCode: string): AfricanCity[] {
  return africanCities[countryCode] || [];
}

// Get delivery estimate for a city
export function getDeliveryEstimate(city: AfricanCity): string {
  const { min, max } = city.estimatedDays;
  if (min === max) {
    return `${min} jour${min > 1 ? 's' : ''}`;
  }
  return `${min}-${max} jours`;
}

// Get shipping cost multiplier based on zone
export function getZoneMultiplier(zone: AfricanCity['deliveryZone']): number {
  switch (zone) {
    case 'urban':
      return 1;
    case 'suburban':
      return 1.3;
    case 'rural':
      return 1.6;
    default:
      return 1;
  }
}
