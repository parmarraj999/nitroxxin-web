const fields = (items) => items.map(([id, label, type = 'text', unit]) => ({ id, label, type, unit }));

export const EVENT_CATEGORY_CONFIG = [
  ['night-rides', 'Night Rides', fields([['startPoint','Starting Point'],['endingPoint','Ending Point'],['routeDescription','Route Description','textarea'],['totalDistance','Total Distance','number','km'],['rideDuration','Estimated Ride Duration'],['terrain','Terrain Type'],['difficulty','Difficulty']])],
  ['day-rides', 'Day Rides', fields([['startingPoint','Starting Point'],['endingPoint','Ending Point'],['routeDescription','Route Description','textarea'],['breakfastIncluded','Breakfast Included','boolean'],['lunchIncluded','Lunch Included','boolean']])],
  ['group-rides', 'Group Rides / Adventure Tour', fields([['numberOfDays','Number of Days','number','days'],['itinerary','Day-wise Itinerary','array'],['accommodationIncluded','Accommodation Included','boolean'],['supportVehicle','Support Vehicle','boolean'],['mechanicAvailable','Mechanic Available','boolean']])],
  ['workshops', 'Workshops', fields([['sessionStart','Session Start','time'],['sessionEnd','Session End','time'],['topicsCovered','Topics Covered','tags'],['bringOwnBike','Bring Own Bike','boolean'],['certificateProvided','Certificate Provided','boolean']])],
  ['mountain-biking', 'Mountain Biking', fields([['trailDistance','Trail Distance','number','km'],['elevationGain','Elevation Gain','number','m'],['bikeTypeAllowed','Bike Type Allowed'],['waveStarts','Wave Starts','array'],['timingChip','Timing Chip','boolean']])],
  ['offroad-rides', 'Gravel / Offroad Rides', fields([['trailType','Trail Type','tags'],['waterCrossings','Water Crossings','boolean'],['recommendedTyres','Recommended Tyres'],['minimumCC','Minimum Engine Capacity','number','cc']])],
  ['charity-rides', 'Charity Rides', fields([['ngoName','NGO / Charity Partner'],['donationPercentage','Donation Percentage','number','%'],['certificateProvided','Certificate Provided','boolean'],['cause','Cause','textarea']])],
  ['skill-clinics', 'Skill Clinics', fields([['coachNames','Coaches','array'],['theorySessions','Theory Sessions','textarea'],['practicalSessions','Practical Sessions','textarea'],['videoAnalysis','Video Analysis','boolean']])],
  ['bike-festivals', 'Bike Festivals', fields([['festivalZones','Festival Zones','array'],['brandStalls','Brand Stalls','number'],['liveMusic','Live Music','boolean'],['foodCourt','Food Court','boolean'],['parkingAvailable','Parking Available','boolean']])],
  ['meetups', 'Meetups', fields([['freeEntry','Free Entry','boolean'],['rsvpRequired','RSVP Required','boolean'],['meetupTime','Meetup Time']])],
  ['race-stunt', 'Races & Stunt Shows', fields([['raceFormat','Race Format'],['raceClasses','Race Classes','array'],['prizeMoney','Prize Money','array'],['stuntShowTime','Stunt Show Time','time']])],
  ['expeditions', 'Expeditions', fields([['numberOfDays','Number of Days','number','days'],['dayWisePlan','Day-wise Plan','array'],['maximumAltitude','Maximum Altitude','number','m'],['permitsRequired','Permits Required','boolean'],['supportVehicles','Support Vehicles','number']])],
  ['international-rides', 'International Rides', fields([['countriesVisited','Countries Visited','array'],['passportRequired','Passport Required','boolean'],['visaRequired','Visa Required','boolean'],['internationalInsurance','International Insurance','boolean'],['borderCrossingGuide','Border Crossing Guide','boolean']])],
  ['monsoon-rides', 'Monsoon Rides', fields([['weatherPolicy','Weather Policy','textarea'],['waterproofGearRequired','Waterproof Gear Required','boolean'],['rainAlert','Rain Alerts','boolean']])],
  ['breakfast-rides', 'Morning Breakfast Rides', fields([['breakfastVenue','Breakfast Venue'],['breakfastIncluded','Breakfast Included','boolean'],['menuChoice','Menu Choice']])],
].map(([slug, category, categoryFields]) => ({ slug, category, fields: categoryFields }));

const slugify = (value) => String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function getCategoryConfig(event) {
  const candidates = [event?.categorySlug, event?.category?.slug, event?.category, event?.categoryName, event?.eventCategory, event?.categoryId]
    .map((value) => typeof value === 'object' ? value?.name || value?.title || value?.slug : value)
    .filter(Boolean);
  return EVENT_CATEGORY_CONFIG.find((config) => candidates.some((value) => slugify(value) === config.slug || slugify(value) === slugify(config.category)));
}

export function getCategoryValue(event, id) {
  const sources = [event, event?.categoryDetails, event?.categoryData, event?.customFields, event?.details, event?.eventDetails, event?.additionalDetails];
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      const match = source.find((item) => item?.id === id || item?.key === id || item?.fieldId === id);
      if (match && (match.value ?? match.answer) !== undefined) return match.value ?? match.answer;
    } else if (source[id] !== undefined && source[id] !== null && source[id] !== '') return source[id];
  }
  return undefined;
}

export function formatCategoryValue(value, field) {
  if (field.type === 'boolean') return value === true || value === 'true' || value === 1 ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item, index) => {
    if (typeof item !== 'object') return String(item);
    const day = item.day || item.title || item.name || `Day ${index + 1}`;
    const detail = item.description || item.plan || item.activity || item.value || item.amount || '';
    return detail ? `${day}: ${detail}` : day;
  }).join(' • ');
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(' • ');
  return `${value}${field.unit ? ` ${field.unit}` : ''}`;
}

export function getCategoryDetails(event) {
  const config = getCategoryConfig(event);
  if (!config) return { config: null, details: [] };
  return { config, details: config.fields.map((field) => ({ ...field, value: getCategoryValue(event, field.id) })).filter((field) => field.value !== undefined) };
}
