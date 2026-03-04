// Static list of politicians to track
export interface Politician {
  lastName: string;
  fullName: string;
  party: 'D' | 'R';
  state: string;
  chamber: 'house' | 'senate';
}

export const TRACKED_POLITICIANS: Politician[] = [
  // House members
  { lastName: 'Pelosi', fullName: 'Nancy Pelosi', party: 'D', state: 'CA', chamber: 'house' },
  { lastName: 'Davidson', fullName: 'Warren Davidson', party: 'R', state: 'OH', chamber: 'house' },
  { lastName: 'Norcross', fullName: 'Donald Norcross', party: 'D', state: 'NJ', chamber: 'house' },
  { lastName: 'Sewell', fullName: 'Terri Sewell', party: 'D', state: 'AL', chamber: 'house' },
  { lastName: 'Steil', fullName: 'Bryan Steil', party: 'R', state: 'WI', chamber: 'house' },
  { lastName: 'LaLota', fullName: 'Nick LaLota', party: 'R', state: 'NY', chamber: 'house' },
  { lastName: 'Guest', fullName: 'Michael Guest', party: 'R', state: 'MS', chamber: 'house' },
  { lastName: 'McClintock', fullName: 'Tom McClintock', party: 'R', state: 'CA', chamber: 'house' },
  { lastName: 'Evans', fullName: 'Dwight Evans', party: 'D', state: 'PA', chamber: 'house' },
  
  // Senate members
  { lastName: 'Padilla', fullName: 'Alex Padilla', party: 'D', state: 'CA', chamber: 'senate' },
  { lastName: 'Scott', fullName: 'Rick Scott', party: 'R', state: 'FL', chamber: 'senate' },
];

export function getPoliticianByLastName(lastName: string): Politician | undefined {
  return TRACKED_POLITICIANS.find(
    p => p.lastName.toLowerCase() === lastName.toLowerCase()
  );
}
