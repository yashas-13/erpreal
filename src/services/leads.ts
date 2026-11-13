

import { apiRequest } from './api';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: string;
  status: string;
  owner: string;
  project: string;
}

interface BackendLead {
  id: string;
  title: string;
  contact_name: string;
  contact_phone: string;
  source: string | null;
  budget_display: string | null;
  stage: string;
  owner_name: string | null;
  project_name: string | null;
}

interface LeadsResponse {
  count: number;
  leads: BackendLead[];
}

const stageToUI: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const stageToAPI: Record<string, string> = {
  'New': 'NEW',
  'Contacted': 'CONTACTED',
  'Qualified': 'QUALIFIED',
  'Site Visit': 'SITE_VISIT',
  'Negotiation': 'NEGOTIATION',
  'Won': 'WON',
  'Lost': 'LOST',
};

function mapLead(lead: BackendLead): Lead {
  return {
    id: lead.id,
    name: lead.contact_name,
    phone: lead.contact_phone,
    source: lead.source || 'Not specified',
    budget: lead.budget_display || 'Not specified',
    status: stageToUI[lead.stage] || lead.stage,
    owner: lead.owner_name || 'Unassigned',
    project: lead.project_name || lead.title,
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  const response = await apiRequest<LeadsResponse>('/leads');
  return response.leads.map(mapLead);
}

export async function createLead(data: {
  name: string;
  phone: string;
  source: string;
  budget: string;
  project: string;
}) {
  return apiRequest('/leads', {
    method: 'POST',
    body: JSON.stringify({
      title: data.project || data.name,
      contact_name: data.name,
      contact_phone: data.phone,
      source: data.source,
      project_name: data.project,
      budget_display: data.budget,
    }),
  });
}

export async function updateLeadStage(id: string, status: string) {
  return apiRequest(`/leads/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({
      stage: stageToAPI[status],
    }),
  });
}

export async function deleteLead(id: string) {
  return apiRequest(`/leads/${id}`, {
    method: 'DELETE',
  });
}
