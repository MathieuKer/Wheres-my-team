import { createRepository } from './base';
import type { Zone } from '../../types';

export const zoneRepo = createRepository<Zone>('zones');

