// API კლიენტი (calendar.learn.net.ge -> api.learn.net.ge)

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('calendar.learn.net.ge')) {
      return 'https://api.learn.net.ge';
    }
  }
  // ადგილობრივ დეველოპმენტში ვიყენებთ proxy-ს ან პირდაპირ პორტ 8000-ს
  return '';
};

const BASE_URL = getBaseUrl();

const formatErrorDetail = (detail) => {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('; ');
  }
  if (typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }
  return String(detail);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // თუ FormData არ არის, ავტომატურად ვამატებთ JSON Header-ს
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // სესიის ამოწურვისას ვასუფთავებთ ტოკენს
    setAuthToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatErrorDetail(errorData.detail) || 'ავტორიზაცია არასწორია ან ვადაგასულია');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatErrorDetail(errorData.detail) || errorData.message || `მოთხოვნა ვერ შესრულდა (${response.status})`);
  }

  return response.json();
};

export const api = {
  // ავტორიზაცია
  login: async (username, password) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getMe: async () => {
    return request('/api/auth/me', {
      method: 'GET',
    });
  },

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  // ფაილების მართვა და ატვირთვა (Multiple files)
  uploadFiles: async (files, overwrite = false) => {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : Array.from(files);
    fileList.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('overwrite', overwrite ? 'true' : 'false');

    const response = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 409) {
      return { conflict: true, ...data };
    }

    if (response.status === 401) {
      setAuthToken(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error(formatErrorDetail(data.detail) || 'ავტორიზაცია არასწორია ან ვადაგასულია');
    }

    if (!response.ok) {
      throw new Error(formatErrorDetail(data.detail) || data.message || `მოთხოვნა ვერ შესრულდა (${response.status})`);
    }

    return data;
  },

  getFiles: async () => {
    return request('/api/files', {
      method: 'GET',
    });
  },

  downloadFile: async (fileId, fileName) => {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/api/files/${fileId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error('ფაილის ჩამოტვირთვა ვერ მოხერხდა');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  deleteFile: async (fileId) => {
    return request(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  getFileModule: async (fileId) => {
    return request(`/api/files/${fileId}/module`, {
      method: 'GET',
    });
  },
};

