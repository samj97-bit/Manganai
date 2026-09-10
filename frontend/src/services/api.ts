import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

// ── Types ──────────────────────────────────────────────────────
export interface Target {
  target_id: string;
  name: string;
  priority: 'HIGH' | 'MODERATE' | 'LOW';
  prospectivity: number;
  confidence: number;
  risk: string;
  lat: number;
  lng: number;
  area_km2: number;
  depth_min: number;
  depth_max: number;
  geology: string;
  state: string;
  evidence: string[];
  feature_contributions: Record<string, number>;
  model_version: string;
  recommended_action?: string;
  depth_estimate_note?: string;
}

export interface Layer {
  id: string;
  name: string;
  description: string;
  source: string;
  type: string;
  status: string;
  default_visible: boolean;
  opacity: number;
}

export interface ValidationRecord {
  id: number;
  target_id: string;
  latitude: number;
  longitude: number;
  sample_id: string;
  mn_grade: number | null;
  depth: number | null;
  lithology: string | null;
  result: 'confirmed' | 'not_found' | 'inconclusive';
  notes: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface ModelVersion {
  version: string;
  algorithm: string;
  training_samples: number;
  validated_samples: number;
  f1_score: number;
  recall: number;
  precision: number;
  accuracy: number;
  is_active: boolean;
  created_at: string;
}

export interface ModelStatus extends ModelVersion {
  feature_count: number;
  features: string[];
  feature_importance: Record<string, number>;
  status: string;
}

// ── API Calls ──────────────────────────────────────────────────
export const getLayers = () => api.get<{ layers: Layer[] }>('/api/layers').then(r => r.data);

export const getTargets = () => api.get<{ targets: Target[]; count: number; study_area: any }>('/api/targets').then(r => r.data);

export const getTarget = (id: string) => api.get<Target>(`/api/targets/${id}`).then(r => r.data);

export const runPrediction = () => api.post('/api/predict').then(r => r.data);

export const getProspectivityGrid = () => api.get('/api/predict/grid').then(r => r.data);

export const submitValidation = (data: {
  target_id: string;
  latitude: number;
  longitude: number;
  sample_id: string;
  mn_grade?: number;
  depth?: number;
  lithology?: string;
  result: string;
  notes?: string;
}) => api.post('/api/validation', data).then(r => r.data);

export const getValidations = () => api.get<{ validations: ValidationRecord[]; count: number }>('/api/validation').then(r => r.data);

export const getModelStatus = () => api.get<ModelStatus>('/api/model/status').then(r => r.data);

export const getModelVersions = () => api.get<{ versions: ModelVersion[] }>('/api/model/versions').then(r => r.data);

export const trainModel = () => api.post('/api/model/train').then(r => r.data);

export const getSupply = () => api.get('/api/supply').then(r => r.data);

export const getSupplyScenarios = () => api.get('/api/supply/scenarios').then(r => r.data);

export const getHealth = () => api.get('/api/health').then(r => r.data);
