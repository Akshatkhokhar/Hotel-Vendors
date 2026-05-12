const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hv_token') : null;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hv_token');
      }
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out' };
    }
    return { success: false, message: err.message || 'Network error' };
  }
};

export const getVendors = (params: Record<string, any> = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  const query = new URLSearchParams(cleanParams).toString();
  return apiFetch(`/api/vendors?${query}`);
};

export const getVendorBySlug = (slug: string) => {
  return apiFetch(`/api/vendors/${slug}`);
};

export const getCategories = () => {
  return apiFetch('/api/categories');
};

export const sendInquiry = (data: any) => {
  return apiFetch('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getDeals = (params: Record<string, any> = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/deals?${query}`);
};

export const createDeal = (data: any) => {
  return apiFetch('/api/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteDeal = (id: string) => {
  return apiFetch(`/api/deals/${id}`, {
    method: 'DELETE',
  });
};
