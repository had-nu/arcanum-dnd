export interface ClassFeatureEntry {
  classId: string;
  name: string;
  level: number;
  source?: string;
  entries: unknown[];
}

export interface FeaturesResponse {
  classId: string;
  className: string;
  subclassId?: string;
  subclassName?: string;
  features: ClassFeatureEntry[];
  subclassFeatures?: ClassFeatureEntry[];
}

export interface MetamagicOption {
  id: string;
  name: string;
  source: string;
  description: unknown[];
  level: number;
}

export interface MetamagicOptionsResponse {
  metamagicOptions: MetamagicOption[];
}

export interface FeatEntry {
  id: string;
  name: string;
  description?: string;
  prerequisites?: unknown;
}

export interface FeatsResponse {
  feats: FeatEntry[];
}
